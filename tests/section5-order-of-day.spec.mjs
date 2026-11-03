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
