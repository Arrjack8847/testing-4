import {test,expect} from '@playwright/test';

test('distant scrolling does not measure Couple or keep changing hero root styles',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Open Invitation',exact:true}).click();
  await expect.poll(()=>page.locator('#viewport').evaluate(el=>
    el.style.getPropertyValue('--palace-scroll-scale'))).not.toBe('');
  expect(await page.evaluate(()=>document.documentElement.style
    .getPropertyValue('--palace-scroll-scale'))).toBe('');
  const closing=page.locator('#closingMessage');
  await closing.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await page.evaluate(()=>{
    const section=document.getElementById('couple');
    window.__coupleReads=0;
    const rect=section.getBoundingClientRect.bind(section);
    section.getBoundingClientRect=()=>{window.__coupleReads++;return rect();};
    window.__rootBefore=document.documentElement.getAttribute('style');
  });
  for(const offset of [0,-90,-180,-90,0]){
    await page.evaluate(offset=>{
      const el=document.getElementById('closingMessage');
      scrollTo({top:el.offsetTop+offset,behavior:'instant'});
    },offset);
    await page.waitForTimeout(60);
  }
  expect(await page.evaluate(()=>window.__coupleReads)).toBe(0);
  expect(await page.evaluate(()=>document.documentElement.getAttribute('style')))
    .toBe(await page.evaluate(()=>window.__rootBefore));
  await page.evaluate(()=>{const el=document.getElementById('couple');scrollTo({top:el.offsetTop+120,behavior:'instant'});});
  await expect(page.locator('#couple')).toHaveAttribute('data-camera-near','true');
  const camera=await page.locator('#couple').evaluate(el=>{
    const rect=el.getBoundingClientRect();
    const expected=Math.min(20,Math.max(-44.8,-44.8+(-rect.top+.653*innerHeight)*.0427));
    return {actual:Number(el.dataset.referenceCameraOffset),expected};
  });
  expect(Math.abs(camera.actual-camera.expected)).toBeLessThan(.02);
});
