import { test, expect } from '@playwright/test';

// Runs in 320 / 360 / 390 / 430px phone projects. The release thresholds
// differ from approach thresholds to avoid flicker during fast reverse-scroll.
test('offscreen mobile sections defer heavyweight art until approached', async ({page}) => {
  const errors=[];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#invitation')).toHaveAttribute('data-state','cover');
  await expect(page.locator('#couple')).toHaveAttribute('data-asset-lifecycle','deferred');
  await expect(page.locator('#eventDetails')).toHaveAttribute('data-asset-lifecycle','deferred');
  await expect(page.locator('#weddingGift')).toHaveAttribute('data-asset-lifecycle','deferred');
  await expect(page.locator('#closingMessage')).toHaveAttribute('data-asset-lifecycle','deferred');
  expect(await page.locator('#eventSourcePaper').getAttribute('src')).toBeNull();
  expect(await page.locator('#dressSourceScene').getAttribute('src')).toBeNull();
  expect(await page.locator('.closing10-source-scene').getAttribute('src')).toBeNull();

  await page.getByRole('button',{name:'Open Invitation',exact:true}).click();
  await page.evaluate(() => {
    const section=document.querySelector('#couple');
    window.scrollTo({top:section.offsetTop,behavior:'instant'});
  });
  await expect(page.locator('#couple')).toHaveAttribute('data-asset-lifecycle','near');
  await expect(page.locator('#groomPortrait')).toHaveAttribute(
    'src',/\/couples\/moody-groom\.webp/
  );
  await page.evaluate(() => {
    const section=document.querySelector('#closingMessage');
    window.scrollTo({top:section.getBoundingClientRect().top+scrollY,behavior:'instant'});
  });
  await expect(page.locator('#couple')).toHaveAttribute('data-asset-lifecycle','released');
  await expect(page.locator('#closingMessage')).toHaveAttribute('data-asset-lifecycle','near');
  expect(await page.locator('#groomPortrait').getAttribute('src'))
    .toMatch(/^data:image\/gif/);
  await expect(page.locator('.closing10-source-scene')).toHaveAttribute(
    'src',/\/section10\/scene\.webp/
  );
  await page.evaluate(() => window.scrollTo({top:0,behavior:'instant'}));
  await expect(page.locator('#couple')).toHaveAttribute('data-asset-lifecycle','released');
  expect(errors).toEqual([]);
});

test('full-resolution Section 1 layers detach far away and restore ahead of return', async ({page}) => {
  const errors=[];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#invitation')).toHaveAttribute('data-layers','ready',{timeout:40000});
  const original=await page.locator('#animatedScene img').evaluateAll(images=>
    images.filter(img=>img.hasAttribute('src')).length);
  expect(original).toBeGreaterThan(15);
  await page.getByRole('button',{name:'Open Invitation',exact:true}).click();
  await page.evaluate(()=>{
    const closing=document.getElementById('closingMessage');
    window.scrollTo({top:closing.getBoundingClientRect().top+scrollY,behavior:'instant'});
  });
  await expect(page.locator('#invitation')).toHaveAttribute('data-hero-rehydrating','true');
  await expect.poll(()=>page.locator('#animatedScene img').evaluateAll(images=>
    images.filter(img=>img.hasAttribute('src')).length)).toBe(0);
  expect(await page.locator('#masterArt').getAttribute('src')).toBeTruthy();
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await expect(page.locator('#invitation')).toHaveAttribute('data-hero-rehydrating','false',{timeout:40000});
  await expect.poll(()=>page.locator('#animatedScene img').evaluateAll(images=>
    images.filter(img=>img.hasAttribute('src')&&img.complete&&img.naturalWidth>0).length))
    .toBe(original);
  await expect(page.locator('#invitation')).toHaveAttribute('data-state','opened');
  expect(errors).toEqual([]);
});
