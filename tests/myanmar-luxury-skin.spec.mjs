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
  await expect.poll(()=>ground.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
  const button=page.getByRole('button',{name:'Open Invitation'});
  await expect(button).toBeVisible();
  const coverReadability=await page.locator('.cover-copy').evaluate(el=>{
    const style=getComputedStyle(el),name=getComputedStyle(el.querySelector('h1'));
    return {background:style.backgroundImage,fontSize:parseFloat(name.fontSize),color:name.color};
  });
  expect(coverReadability.background).toContain('radial-gradient');
  expect(coverReadability.fontSize).toBeGreaterThanOrEqual(23);
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
