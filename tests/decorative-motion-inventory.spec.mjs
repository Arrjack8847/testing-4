import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';

// Diagnostic-only: records decorative motion without changing production animation.
const selectors={
  coverButterflies:'.butterfly-cover .butterfly',
  heroButterflies:'.butterfly-hero .butterfly',
  flowers:'.sprite.flower .flower-sway',
  eventButterfly:'.event-reference-butterfly',
  eventFlowers:'.event-flower'
};
const snapshot=async page=>page.evaluate(selectors=>{
  const result={};
  for(const [name,selector] of Object.entries(selectors)){
    result[name]=[...document.querySelectorAll(selector)].map(el=>{
      const r=el.getBoundingClientRect(),s=getComputedStyle(el);
      return {x:+r.x.toFixed(2),y:+r.y.toFixed(2),
        width:+r.width.toFixed(2),height:+r.height.toFixed(2),
        display:s.display,visibility:s.visibility,opacity:s.opacity,
        animationName:s.animationName,animationDuration:s.animationDuration,
        animationPlayState:s.animationPlayState,transform:s.transform};
    });
  }
  return result;
},selectors);
test('butterfly and flower motion inventory at normal and reduced motion',async({page},testInfo)=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/');
  await expect(page.locator('#invitation')).toHaveAttribute('data-layers','ready',{timeout:35000});
  const before=await snapshot(page);
  await page.waitForTimeout(600);
  const later=await snapshot(page);
  await page.emulateMedia({reducedMotion:'reduce'});
  const reduced=await snapshot(page);
  await writeFile(testInfo.outputPath('decorative-motion-inventory.json'),
    JSON.stringify({viewport:testInfo.project.name,before,later,reduced,errors},null,2));
  expect(before.coverButterflies.length).toBeGreaterThan(0);
  expect(before.flowers.length).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
