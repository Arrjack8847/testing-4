import {test,expect} from '@playwright/test';

// Opt-in Myanmar Royal Romantic Luxury. This must not alter the default scene.
test('Myanmar skin loads locally, keeps a permanent path, and preserves opening',async({page},testInfo)=>{
  const errors=[];
  const broken=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{
    if(response.status()>=400&&response.url().includes('/assets/skins/myanmar-luxury/'))broken.push(response.url());
  });
  await page.goto('/?skin=myanmar-luxury');
  const invite=page.locator('#invitation');
  await expect(invite).toHaveAttribute('data-skin','myanmar-luxury');
  await expect(invite).toHaveAttribute('data-layers','ready',{timeout:30000});
  await expect(page.locator('.depth.palace .waterfalls')).toHaveCount(0);
  await expect(page.locator('.myanmar-stone-path img')).toHaveCount(1);
  const sources=await page.locator('.animated-scene img').evaluateAll(imgs=>imgs.map(i=>i.currentSrc));
  expect(sources.length).toBeGreaterThanOrEqual(25);
  expect(sources.every(src=>src.includes('/assets/skins/myanmar-luxury/'))).toBe(true);
  const ground=page.locator('.myanmar-stone-path img');
  await expect.poll(()=>ground.evaluate(el=>new URL(el.currentSrc).pathname))
    .toBe('/assets/skins/myanmar-luxury/path.webp');
  await expect.poll(()=>ground.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
  expect(await ground.evaluate(el=>[el.naturalWidth,el.naturalHeight])).toEqual([1080,855]);
  const button=page.getByRole('button',{name:'Open Invitation'});
  await expect(button).toBeVisible();
  const coverReadability=await page.locator('.cover-copy').evaluate(el=>{
    const style=getComputedStyle(el),name=getComputedStyle(el.querySelector('h1'));
    return {background:style.backgroundImage,fontSize:parseFloat(name.fontSize),color:name.color};
  });
  expect(coverReadability.background).toContain('radial-gradient');
  expect(coverReadability.fontSize).toBeGreaterThanOrEqual(22);
  // Photo-review regression: the hero architecture must not disappear behind
  // a giant monogram, broad name banner, or center-blocking button.
  const coverLayout=await page.evaluate(()=>{
    const rect=sel=>{
      const r=document.querySelector(sel).getBoundingClientRect();
      return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width};
    };
    return {height:innerHeight,width:innerWidth,mark:rect('.cover .monogram'),
      names:rect('.cover .cover-copy'),button:rect('.cover .open-button')};
  });
  expect(coverLayout.mark.bottom).toBeLessThan(coverLayout.names.top+12);
  expect(coverLayout.names.width).toBeLessThanOrEqual(coverLayout.width*.85);
  expect(coverLayout.names.bottom).toBeLessThan(coverLayout.button.top-15);
  expect(coverLayout.button.top).toBeGreaterThanOrEqual(coverLayout.height*.60);
  expect(coverLayout.button.bottom).toBeLessThan(coverLayout.height*.79);
  await page.screenshot({path:testInfo.outputPath('myanmar-cover.png')});
  await button.click();
  await expect(invite).toHaveAttribute('data-state','opened');
  await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo({top:innerHeight*1.5,behavior:'instant'});});
  await expect.poll(()=>page.evaluate(()=>scrollY/innerHeight)).toBeGreaterThan(1.4);
  await expect(page.locator('.myanmar-stone-path')).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('myanmar-ceremony-1_50H.png')});
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
  expect(broken).toEqual([]);
  expect(errors).toEqual([]);
});
