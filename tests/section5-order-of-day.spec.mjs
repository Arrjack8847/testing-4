import {test,expect} from '@playwright/test';

async function toOrder(page,url='/'){
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);
  const section=page.locator('#runningOrder');
  await expect(section).toHaveAttribute('data-section','5');
  await expect(section).toHaveAttribute('aria-hidden','true');
  await expect(section).toHaveJSProperty('inert',true);
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(section).toHaveAttribute('aria-hidden','false');
  await expect(section).toHaveJSProperty('inert',false);
  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    document.getElementById('runningOrder').scrollIntoView({block:'start',behavior:'instant'});
  });
  await expect(section).toBeInViewport();
  return {section,errors};
}

test('Section 5 reproduces the six verified reference schedule rows and their exact order',async({page})=>{
  const {section,errors}=await toOrder(page);
  await expect(section.getByRole('heading',{name:'Order of the Day'})).toBeVisible();
  await expect(section.locator('.order-eyebrow')).toHaveText('Running order');
  const rows=section.locator('.order-entry');
  await expect(rows).toHaveCount(6);
  const expected=[
    ['11:00 am','Guests arrive','Lunch service opens'],
    ['12:00 pm','The couple arrive',''],
    ['12:30 pm','Wedding procession','Led by kompang from the main entrance'],
    ['1:00 pm','Bersanding & photographs',''],
    ['2:00 pm','Lunch is served',''],
    ['4:00 pm','Celebration ends','']
  ];
  for(let i=0;i<expected.length;i++){
    await expect(rows.nth(i).locator('time')).toHaveText(expected[i][0]);
    await expect(rows.nth(i).locator('strong')).toHaveText(expected[i][1]);
    if(expected[i][2]) await expect(rows.nth(i).locator('small')).toHaveText(expected[i][2]);
    else await expect(rows.nth(i).locator('small')).toHaveCount(0);
  }
  await expect(page.locator('#saveTheDate')).toBeHidden();
  await expect(page.locator('#eventDetails')).toContainText('Wedding Reception');
  expect(errors).toEqual([]);
});

test('Events flows directly to a gapless running order at all four reference widths',async({page},testInfo)=>{
  const {section,errors}=await toOrder(page);
  const stats=await section.evaluate(el=>{
    const prior=document.getElementById('eventDetails');
    const current=el.getBoundingClientRect(),previous=prior.getBoundingClientRect();
    const box=el.querySelector('.order-inner').getBoundingClientRect();
    return {
      adjacent:prior.nextElementSibling===el,
      gap:current.top-previous.bottom,
      height:current.height,width:innerWidth,
      overflow:document.documentElement.scrollWidth-innerWidth,
      contentLeft:box.left,contentRight:box.right,
      backgroundTop:getComputedStyle(el).backgroundImage
    };
  });
  expect(stats.adjacent).toBe(true);
  expect(Math.abs(stats.gap)).toBeLessThanOrEqual(1);
  expect(stats.height).toBeGreaterThanOrEqual(651);
  expect(stats.contentLeft).toBeGreaterThanOrEqual(-1);
  expect(stats.contentRight).toBeLessThanOrEqual(stats.width+1);
  expect(stats.overflow).toBeLessThanOrEqual(1);
  expect(stats.backgroundTop).toContain('linear-gradient');
  if(testInfo.project.name==='iphone-390'){
    await section.screenshot({path:testInfo.outputPath('section5-running-order-390.png'),animations:'disabled'});
    await page.evaluate(()=>scrollTo({top:document.getElementById('runningOrder').offsetTop-innerHeight/2,behavior:'instant'}));
    await page.screenshot({path:testInfo.outputPath('section4-to-5-order-seam-390.png'),animations:'disabled'});
  }
  expect(errors).toEqual([]);
});

test('scroll camera moves forward and restores on backward scrolling',async({page})=>{
  const {section}=await toOrder(page);
  const top=await section.evaluate(el=>el.getBoundingClientRect().top+scrollY);
  const travel=async delta=>{
    await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),top+delta);
    await page.waitForTimeout(80);
    return section.evaluate(el=>parseFloat(el.dataset.orderCamera||'0'));
  };
  const first=await travel(0);
  const mid=await travel(240);
  const again=await travel(0);
  expect(Math.abs(mid-first)).toBeGreaterThan(3);
  expect(Math.abs(again-first)).toBeLessThan(.2);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
});

test('reduced-motion preserves legible timeline without animation or camera movement',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const {section}=await toOrder(page);
  await expect(section).not.toHaveAttribute('data-reveal-ready');
  await expect(section.locator('.order-heading')).toHaveCSS('opacity','1');
  await expect(section.locator('.order-leaf').first()).toHaveCSS('animation-name','none');
  await expect(section.locator('.order-entry')).toHaveCount(6);
  const cam=await section.evaluate(el=>el.dataset.orderCamera||'0');
  expect(Math.abs(Number(cam))).toBeLessThan(.01);
});

test('reference comparison requests only locally staged WebPs and degrades safely if missing',async({page})=>{
  const {section}=await toOrder(page);
  await expect(section).not.toHaveAttribute('data-art','reference');
  expect(await section.locator('#orderSourceBand').getAttribute('src')).toBeNull();
  await page.route('**/assets/reference-dev/*.webp',route=>route.fulfill({status:404,body:'Developer image not supplied'}));
  await page.goto('/?orderReference=1');
  await expect(section).toHaveAttribute('data-art','reference');
  await expect(section).toHaveAttribute('data-asset-source','local-webp');
  const source=await section.locator('#orderSourceBand').getAttribute('src');
  expect(source).toBe('./assets/reference-dev/band_plum.webp');
  await expect(section).toHaveAttribute('data-band-status','failed');
  await expect(section.locator('.order-heading')).toBeAttached();
  expect(await section.evaluate(el=>getComputedStyle(el).backgroundImage)).not.toContain('undangankahwin.com');
});

test('valid local WebPs use section-level background-size cover with zero vendor hotlinks',async({page})=>{
  // Synthetic fixture from existing image QA; never distributed as a wedding asset.
  const fixture=Buffer.from('UklGRiwAAABXRUJQVlA4ICAAAABwAQCdASoKABAAAgA0JZQCdAGIQAD+7e02x7gwm7AwAA==','base64');
  await page.route('**/assets/reference-dev/*.webp',route=>
    route.fulfill({status:200,contentType:'image/webp',body:fixture}));
  const {section,errors}=await toOrder(page,'/?orderReference=1');
  await expect(section).toHaveAttribute('data-band-status','loaded');
  await expect(section).toHaveAttribute('data-butterfly-status','loaded');
  const result=await section.evaluate(el=>{
    const style=getComputedStyle(el);
    return {background:style.backgroundImage,position:style.backgroundPosition,size:style.backgroundSize,
      image:el.querySelector('#orderSourceBand')?.getAttribute('src')};
  });
  expect(result.background).toContain('/assets/reference-dev/band_plum.webp');
  expect(result.background).not.toContain('undangankahwin.com');
  expect(result.size).toContain('cover');
  expect(result.position).toContain('50% 50%');
  expect(result.image).toBe('./assets/reference-dev/band_plum.webp');
  expect(errors).toEqual([]);
});

test('old standalone date-only demo remains available via an explicit legacy URL',async({page})=>{
  await toOrder(page,'/?legacySaveDate=1');
  const demo=page.locator('#saveTheDate');
  await expect(demo).toBeVisible();
  await expect(demo.locator('#saveDateButton')).toBeDisabled();
  await expect(demo).toHaveAttribute('data-section','legacy-save-date');
});


test('source-like fixed canvas paints rose petals only while timeline is visible',async({page},testInfo)=>{
  const {section,errors}=await toOrder(page);
  await expect(section).toHaveAttribute('data-petal-renderer','canvas');
  await expect(section).toHaveAttribute('data-petal-motion','running');
  const canvas=section.locator('#orderPetalCanvas');
  await expect(canvas).toBeAttached();
  await page.waitForTimeout(180);
  const stats=await canvas.evaluate(el=>{
    const r=el.getBoundingClientRect();
    const bytes=el.getContext('2d').getImageData(0,0,el.width,el.height).data;
    let alphaPixels=0;
    for(let i=3;i<bytes.length;i+=4)if(bytes[i]>0)alphaPixels++;
    return {x:r.x,y:r.y,width:r.width,height:r.height,
      pixels:alphaPixels,position:getComputedStyle(el).position};
  });
  expect(stats.x).toBe(0);
  expect(stats.y).toBe(0);
  expect(stats.width).toBe(300);
  expect(stats.height).toBe(page.viewportSize().height);
  expect(stats.position).toBe('fixed');
  expect(stats.pixels).toBeGreaterThan(30);
  if(testInfo.project.name==='iphone-390'){
    await page.screenshot({path:testInfo.outputPath('section5-live-canvas-petals-390.png'),animations:'disabled'});
  }
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  await expect(section).toHaveAttribute('data-petal-motion','paused');
  expect(errors).toEqual([]);
});

test('sprite butterfly traverses right-to-left along lower panel with mirrored 3D wing flaps',async({page})=>{
  const fixture=Buffer.from('UklGRiwAAABXRUJQVlA4ICAAAABwAQCdASoKABAAAgA0JZQCdAGIQAD+7e02x7gwm7AwAA==','base64');
  await page.route('**/assets/reference-dev/*.webp',route=>
    route.fulfill({status:200,contentType:'image/webp',body:fixture}));
  const {section,errors}=await toOrder(page,'/?orderReference=1');
  await expect(section).toHaveAttribute('data-butterfly-status','loaded');
  await expect(section).toHaveAttribute('data-butterfly-motion','running');
  const sprite=section.locator('#orderButterflyFlight');
  await expect(sprite).toBeVisible();
  await expect(sprite.locator('.order-bf-wing')).toHaveCount(2);
  const getState=()=>sprite.evaluate(el=>{
    const wing=[...el.querySelectorAll('i')].map(x=>{
      const css=getComputedStyle(x);
      return {width:css.width,height:css.height,bg:css.backgroundSize,
        position:css.backgroundPosition,transform:css.transform};
    });
    return {x:Number(el.dataset.x),y:Number(el.dataset.y),direction:el.dataset.direction,
      width:getComputedStyle(el).width,height:getComputedStyle(el).height,wing};
  });
  const before=await getState();
  await page.waitForTimeout(1150);
  const after=await getState();
  expect(before.direction).toBe('left');
  expect(after.direction).toBe('left');
  expect(after.x-before.x).toBeLessThan(-28);
  expect(after.x-before.x).toBeGreaterThan(-65);
  expect(before.y).toBeGreaterThan(540);
  expect(before.y).toBeLessThan(625);
  expect(after.y).toBeGreaterThan(540);
  expect(after.y).toBeLessThan(625);
  expect(after.width).toBe('46px');
  expect(after.height).toBe('35px');
  expect(after.wing[0].width).toBe('23px');
  expect(after.wing[1].width).toBe('23px');
  expect(after.wing[0].bg).toBe('200% 100%');
  expect(after.wing[1].bg).toBe('200% 100%');
  expect(after.wing[0].position).not.toBe(after.wing[1].position);
  expect(after.wing[0].transform).not.toBe(after.wing[1].transform);
  expect(errors).toEqual([]);
});

test('canvas and butterfly stop when invitation closes or reduced motion is enabled',async({page})=>{
  const fixture=Buffer.from('UklGRiwAAABXRUJQVlA4ICAAAABwAQCdASoKABAAAgA0JZQCdAGIQAD+7e02x7gwm7AwAA==','base64');
  await page.route('**/assets/reference-dev/*.webp',route=>
    route.fulfill({status:200,contentType:'image/webp',body:fixture}));
  const {section}=await toOrder(page,'/?orderReference=1');
  await expect(section).toHaveAttribute('data-petal-motion','running');
  await expect(section).toHaveAttribute('data-butterfly-motion','running');
  await page.evaluate(()=>document.getElementById('invitation').dataset.state='cover');
  await expect(section).toHaveAttribute('data-petal-motion','paused');
  await expect(section).toHaveAttribute('data-butterfly-motion','paused');
  await expect(section).toHaveJSProperty('inert',true);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(()=>document.getElementById('invitation').dataset.state='opened');
  await expect(section).toHaveAttribute('data-petal-motion','still');
  await expect(section).toHaveAttribute('data-butterfly-motion','paused');
  await expect(section.locator('#orderButterflyFlight')).toBeHidden();
  await expect(section).not.toHaveAttribute('data-reveal-ready');
});


test('390px timeline text and six row baselines match measured source geometry',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='iphone-390','Source baseline measured at 390 x 844');
  // Compare the settled layout, not a 52px entrance translation in flight.
  // The live reference geometry audit uses the same reduced-motion setting.
  await page.emulateMedia({reducedMotion:'reduce'});
  const {section,errors}=await toOrder(page);
  await page.evaluate(()=>document.fonts.ready);
  await expect(section).toBeInViewport();
  const m=await section.evaluate(el=>{
    const a=el.getBoundingClientRect();
    const pos=e=>{
      const r=e.getBoundingClientRect();
      return {x:r.x-a.x,y:r.y-a.y,w:r.width,h:r.height};
    };
    const heading=el.querySelector('.order-heading');
    const eyebrow=el.querySelector('.order-eyebrow');
    const rows=[...el.querySelectorAll('.order-entry')];
    const first=rows[0];
    const time=first.querySelector('.order-time');
    const title=first.querySelector('strong');
    const sub=first.querySelector('small');
    const style=e=>{
      const s=getComputedStyle(e);
      return {font:s.fontFamily,size:s.fontSize,lineHeight:s.lineHeight,color:s.color,
        letterSpacing:s.letterSpacing,textAlign:s.textAlign};
    };
    return {heading:pos(heading),eyebrow:pos(eyebrow),time:pos(time),
      title:pos(title),sub:pos(sub),rows:rows.map(pos),titleStyle:style(title),
      timeStyle:style(time),eyebrowStyle:style(eyebrow)};
  });
  const near=(actual,target,limit=1)=>expect(Math.abs(actual-target)).toBeLessThanOrEqual(limit);
  near(m.eyebrow.x,28);
  near(m.eyebrow.y,96);
  near(m.eyebrow.w,334);
  near(m.eyebrow.h,18.14);
  near(m.heading.y,126.14);
  near(m.heading.x,28);
  near(m.heading.w,334);
  const baseline=[213.03,280.16,332.16,399.28,451.28,503.28];
  m.rows.forEach((r,i)=>{near(r.x,28);near(r.y,baseline[i]);near(r.w,334);});
  near(m.time.x,28);
  near(m.time.w,74);
  near(m.title.x,136);
  near(m.title.y,213.03);
  near(m.sub.y,238.97);
  expect(m.timeStyle.font).toContain('EB Garamond');
  expect(m.timeStyle.size).toBe('12px');
  expect(m.timeStyle.textAlign).toBe('right');
  expect(m.titleStyle.size).toBe('17px');
  expect(m.eyebrowStyle.size).toBe('11px');
  expect(errors).toEqual([]);
});

test('fallback butterfly remains visible and follows one-way source motion without a vendor image',async({page})=>{
  const {section,errors}=await toOrder(page);
  const flight=section.locator('#orderButterflyFlight');
  await expect(flight).toBeVisible();
  await expect(section).toHaveAttribute('data-butterfly-motion','running');
  const before=await flight.evaluate(el=>({
    x:Number(el.dataset.x),y:Number(el.dataset.y),
    bg:getComputedStyle(el.querySelector('.order-bf-left')).backgroundImage
  }));
  await page.waitForTimeout(950);
  const after=await flight.evaluate(el=>({
    x:Number(el.dataset.x),y:Number(el.dataset.y),
    bg:getComputedStyle(el.querySelector('.order-bf-left')).backgroundImage
  }));
  expect(before.bg).toContain('gradient');
  expect(before.bg).not.toContain('undangankahwin.com');
  expect(after.x).toBeLessThan(before.x-22);
  expect(after.x).toBeGreaterThan(before.x-60);
  for(const y of [before.y,after.y]){
    expect(y).toBeGreaterThan(540);
    expect(y).toBeLessThan(625);
  }
  expect(errors).toEqual([]);
});

test('reference-density petal canvas paints original transparent particles',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='iphone-390','Measured 390x844 source coverage');
  const {section,errors}=await toOrder(page);
  await expect(section).toHaveAttribute('data-petal-motion','running');
  await page.waitForTimeout(220);
  const coverage=await section.locator('#orderPetalCanvas').evaluate(el=>{
    const d=el.getContext('2d').getImageData(0,0,el.width,el.height).data;
    let visible=0,sum=0;
    for(let i=3;i<d.length;i+=4){
      if(d[i]>0){visible++;sum+=d[i];}
    }
    return {visible,averageAlpha:visible?sum/visible:0};
  });
  // The source's observed 390px canvas had ~1000 nontransparent pixels and
  // mean alpha ~118. These generous bands avoid timer-phase flakiness.
  expect(coverage.visible).toBeGreaterThan(650);
  expect(coverage.visible).toBeLessThan(1900);
  expect(coverage.averageAlpha).toBeGreaterThan(70);
  expect(coverage.averageAlpha).toBeLessThan(185);
  expect(errors).toEqual([]);
});
