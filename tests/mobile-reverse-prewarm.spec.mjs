import {test,expect} from '@playwright/test';

// Regression for real iPhone reverse-scroll flicker.
// Upward prewarm must activate released sections BEFORE the normal near band,
// with the same full-resolution original artwork and no layout change.
test('reverse-direction prewarm restores Section 3 well before it enters view',async({page})=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  const couple=page.locator('#couple');
  await expect(couple).toHaveAttribute('data-asset-lifecycle','deferred');
  await page.getByRole('button',{name:'Open Invitation',exact:true}).click();
  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    const closing=document.getElementById('closingMessage');
    scrollTo({top:closing.getBoundingClientRect().top+scrollY,behavior:'instant'});
  });
  await expect(couple).toHaveAttribute('data-asset-lifecycle','released');
  // Return upward but remain outside the standard near band and inside
  // the larger upward-only band, adapting to the four phone viewport heights.
  const {y,gap}=await page.evaluate(()=>{
    const el=document.getElementById('couple');
    const h=innerHeight;
    const near=Math.max(1000,Math.min(1700,Math.round(h*1.5)));
    const reverse=Math.max(1700,Math.min(2900,Math.round(h*3.25)));
    const gap=Math.round((near+reverse)/2);
    const y=el.getBoundingClientRect().bottom+scrollY+gap;
    scrollTo({top:y,behavior:'instant'});
    return {y,gap};
  });
  expect(y).toBeGreaterThan(1000);
  await expect.poll(()=>couple.evaluate(el=>el.getBoundingClientRect().bottom))
    .toBeLessThan(-gap+2);
  await expect(couple).toHaveAttribute('data-asset-lifecycle','near');
  await expect(couple.locator('#groomPortrait')).toHaveAttribute(
    'src',/couples\/moody-groom\.webp/);
  expect(errors).toEqual([]);
});

test('released Section 3 keeps its exact source garden image as still fallback',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Open Invitation',exact:true}).click();
  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    document.getElementById('couple').scrollIntoView({block:'start',behavior:'instant'});
  });
  const couple=page.locator('#couple');
  await expect(couple).toHaveAttribute('data-asset-lifecycle','near');
  await expect.poll(()=>couple.getAttribute('data-reference-scene-source'))
    .toMatch(/^(local|remote)$/);
  await page.evaluate(()=>{
    const closing=document.getElementById('closingMessage');
    scrollTo({top:closing.getBoundingClientRect().top+scrollY,behavior:'instant'});
  });
  await expect(couple).toHaveAttribute('data-asset-lifecycle','released');
  const result=await couple.evaluate(el=>({
    image:getComputedStyle(el.querySelector('.couple-reference-scene'),'::before').backgroundImage,
    source:el.style.getPropertyValue('--couple-reference-image'),
    portrait:el.querySelector('#groomPortrait').getAttribute('src')
  }));
  expect(result.image).toContain('scene.webp');
  expect(result.source).toContain('scene.webp');
  expect(result.portrait).toMatch(/^data:image\/gif/);
});

test('opt-in phone QA loads exactly one diagnostic sampler',async({page})=>{
  await page.goto('/?phoneqa=1');
  await expect(page.locator('#phoneQaLaunch')).toHaveCount(1);
  await expect(page.locator('#phoneQaPanel')).toHaveCount(1);
});
