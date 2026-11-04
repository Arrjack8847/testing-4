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

test('root URL shows independently drawn plum relief when reference WebPs are unavailable',async({page})=>{
  await page.route('**/assets/reference-dev/*.webp',route=>
    route.fulfill({status:404,body:'Permission-cleared file not installed'}));
  const {section}=await toOrder(page);
  await expect(section).toHaveAttribute('data-art','reference');
  await expect(section).toHaveAttribute('data-asset-source','local-webp');
  await expect(section.locator('#orderSourceBand')).toHaveAttribute('src','./assets/reference-dev/band_plum.webp');
  await expect(section).toHaveAttribute('data-band-status','failed');
  await expect(section).toHaveAttribute('data-butterfly-status','failed');
  await expect(section).toHaveAttribute('data-artwork-status','missing');
  await expect(section).toHaveAttribute('data-background-renderer','original-svg');
  await expect(section.locator('#orderArtworkNotice')).toContainText('original illustrated botanical relief');
  await expect(section.locator('#orderArtworkNotice')).toBeVisible();
  await expect(section.locator('#orderArtworkNotice')).toContainText('band_plum.webp, bfly_blush.webp');
  const state=await section.evaluate(el=>({
    background:getComputedStyle(el).backgroundImage,
    notice:getComputedStyle(el.querySelector('#orderArtworkNotice')).display,
    sourceUrl:el.querySelector('#orderSourceBand').src
  }));
  expect(state.background).toContain('order-plum-emboss-original.svg');
  expect(state.background).not.toContain('undangankahwin.com');
  expect(state.notice).not.toBe('none');
  expect(state.sourceUrl).toContain('/assets/reference-dev/band_plum.webp');
  await expect(section.locator('.order-entry')).toHaveCount(6);
});

test('plain root uses exact local WebPs with cover geometry and no vendor hotlinks',async({page})=>{
  // Synthetic fixture from existing image QA; never distributed as a wedding asset.
  const fixture=Buffer.from('UklGRiwAAABXRUJQVlA4ICAAAABwAQCdASoKABAAAgA0JZQCdAGIQAD+7e02x7gwm7AwAA==','base64');
  await page.route('**/assets/reference-dev/*.webp',route=>
    route.fulfill({status:200,contentType:'image/webp',body:fixture}));
  const {section,errors}=await toOrder(page);
  await expect(section).toHaveAttribute('data-band-status','loaded');
  await expect(section).toHaveAttribute('data-butterfly-status','loaded');
  await expect(section).toHaveAttribute('data-artwork-status','ready');
  await expect(section).toHaveAttribute('data-background-renderer','reference-webp');
  await expect(section.locator('#orderArtworkNotice')).toBeHidden();
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

test('missing butterfly is reported while a valid local background remains active',async({page})=>{
  const fixture=Buffer.from('UklGRiwAAABXRUJQVlA4ICAAAABwAQCdASoKABAAAgA0JZQCdAGIQAD+7e02x7gwm7AwAA==','base64');
  await page.route('**/assets/reference-dev/*.webp',route=>
    route.request().url().endsWith('band_plum.webp')
      ?route.fulfill({status:200,contentType:'image/webp',body:fixture})
      :route.fulfill({status:404,body:'Butterfly not installed'}));
  const {section}=await toOrder(page);
  await expect(section).toHaveAttribute('data-band-status','loaded');
  await expect(section).toHaveAttribute('data-butterfly-status','failed');
  await expect(section).toHaveAttribute('data-artwork-status','partial');
  await expect(section).toHaveAttribute('data-background-renderer','reference-webp');
  const msg=section.locator('#orderArtworkNotice');
  await expect(msg).toBeVisible();
  await expect(msg).toContainText('bfly_blush.webp');
  await expect(msg).not.toContainText('band_plum.webp');
  const art=await section.evaluate(el=>getComputedStyle(el).backgroundImage);
  expect(art).toContain('band_plum.webp');
  expect(art).not.toContain('order-plum-emboss-original.svg');
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

test('sprite butterfly traverses lower panel right-to-left with mirrored 3D wing flaps',async({page})=>{
  const fixture=Buffer.from('UklGRiwAAABXRUJQVlA4ICAAAABwAQCdASoKABAAAgA0JZQCdAGIQAD+7e02x7gwm7AwAA==','base64');
  await page.route('**/assets/reference-dev/*.webp',route=>
    route.fulfill({status:200,contentType:'image/webp',body:fixture}));
  const {section,errors}=await toOrder(page);
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
  for (const y of [before.y,after.y]) {
    expect(y).toBeGreaterThan(540);
    expect(y).toBeLessThan(625);
  }
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
  const {section}=await toOrder(page);
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

test('Section 5 animated effects stop at Section 6 viewport without changing Dress Code',async({page})=>{
  const fixture=Buffer.from('UklGRiwAAABXRUJQVlA4ICAAAABwAQCdASoKABAAAgA0JZQCdAGIQAD+7e02x7gwm7AwAA==','base64');
  await page.route('**/assets/reference-dev/*.webp',route=>
    route.fulfill({status:200,contentType:'image/webp',body:fixture}));
  const {section,errors}=await toOrder(page);
  await expect(section).toHaveAttribute('data-butterfly-motion','running');
  await expect(section).toHaveAttribute('data-petal-motion','running');
  const dress=page.locator('#dressCode');
  await expect(dress).toBeAttached();
  await page.evaluate(()=>{
    document.getElementById('dressCode').scrollIntoView({block:'start',behavior:'instant'});
  });
  await expect(dress).toBeInViewport();
  await expect(section).toHaveAttribute('data-petal-motion','paused');
  await expect(section).toHaveAttribute('data-butterfly-motion','paused');
  const both=await section.evaluate(el=>{
    const r=el.getBoundingClientRect();
    const d=document.getElementById('dressCode').getBoundingClientRect();
    return {gap:d.top-r.bottom,overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(Math.abs(both.gap)).toBeLessThanOrEqual(1);
  expect(both.overflow).toBeLessThanOrEqual(1);
  await page.evaluate(()=>{
    document.getElementById('runningOrder').scrollIntoView({block:'start',behavior:'instant'});
  });
  await expect(section).toHaveAttribute('data-petal-motion','running');
  await expect(section).toHaveAttribute('data-butterfly-motion','running');
  expect(errors).toEqual([]);
});

test('390px particle canvas opacity and CSS pixel coverage remain source-calibrated',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='iphone-390','390 × 844 source baseline');
  const {section,errors}=await toOrder(page);
  await expect(section).toHaveAttribute('data-petal-motion','running');
  await page.waitForTimeout(260);
  const metrics=await section.locator('#orderPetalCanvas').evaluate(el=>{
    const d=el.getContext('2d').getImageData(0,0,el.width,el.height).data;
    let count=0,alpha=0;
    for(let i=3;i<d.length;i+=4) if(d[i]) { count++;alpha+=d[i]; }
    const r=el.getBoundingClientRect();
    const scale=(el.width/r.width)*(el.height/r.height);
    return {pixels:count/scale,alpha:count?alpha/count:0};
  });
  expect(metrics.pixels).toBeGreaterThan(450);
  expect(metrics.pixels).toBeLessThan(2300);
  expect(metrics.alpha).toBeGreaterThan(65);
  expect(metrics.alpha).toBeLessThan(180);
  expect(errors).toEqual([]);
});

test('320px reference wraps the script heading and expands the timeline section to 739px',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='small-phone','Measured source at 320 × 568');
  await page.emulateMedia({reducedMotion:'reduce'});
  const {section,errors}=await toOrder(page);
  await page.evaluate(()=>document.fonts.ready);
  const m=await section.evaluate(el=>{
    const base=el.getBoundingClientRect();
    const box=n=>{const r=n.getBoundingClientRect();return {
      x:r.left-base.left,y:r.top-base.top,width:r.width,height:r.height
    }};
    return {
      section:box(el),
      eyebrow:box(el.querySelector('.order-eyebrow')),
      heading:box(el.querySelector('.order-heading')),
      rows:[...el.querySelectorAll('.order-entry')].map(box),
      border:getComputedStyle(el.querySelector('.order-inner'),'::before').inset
    };
  });
  const near=(actual,expected,tolerance=1.5)=>
    expect(Math.abs(actual-expected)).toBeLessThanOrEqual(tolerance);
  near(m.section.height,739.23);
  near(m.eyebrow.x,28);
  near(m.eyebrow.y,96);
  near(m.heading.x,28);
  near(m.heading.y,126.14);
  near(m.heading.height,105.78);
  const rowY=[265.92,333.05,385.05,471.36,539.23,591.23];
  const rowH=[67.13,52,86.31,67.88,52,52];
  m.rows.forEach((r,i)=>{
    near(r.x,28);
    near(r.width,264);
    near(r.y,rowY[i]);
    near(r.height,rowH[i]);
  });
  expect(errors).toEqual([]);
});

test('430px reference uses the full 374px timeline instead of a capped 334px column',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='large-phone','Measured source at 430 × 932');
  await page.emulateMedia({reducedMotion:'reduce'});
  const {section,errors}=await toOrder(page);
  await page.evaluate(()=>document.fonts.ready);
  const m=await section.evaluate(el=>{
    const root=el.getBoundingClientRect();
    const box=n=>{const r=n.getBoundingClientRect();return{
      x:r.left-root.left,y:r.top-root.top,width:r.width,height:r.height}};
    return {height:root.height,
      eyebrow:box(el.querySelector('.order-eyebrow')),
      heading:box(el.querySelector('.order-heading')),
      rows:[...el.querySelectorAll('.order-entry')].map(box)};
  });
  expect(Math.abs(m.height-651.28)).toBeLessThan(1.5);
  expect(m.eyebrow.x).toBe(28);
  expect(m.eyebrow.width).toBe(374);
  expect(m.heading.x).toBe(28);
  expect(m.heading.width).toBe(374);
  m.rows.forEach((r,i)=>{
    expect(r.x).toBe(28);
    expect(r.width).toBe(374);
    expect(Math.abs(r.y-[213.03,280.16,332.16,399.28,451.28,503.28][i])).toBeLessThan(1.5);
  });
  expect(errors).toEqual([]);
});
