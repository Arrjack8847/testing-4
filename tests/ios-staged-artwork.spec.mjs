import {test,expect} from '@playwright/test';

// Safari/iOS startup memory protection: the same full-resolution artwork must
// arrive without a 25-image decode/request burst at first navigation.
// This network test is deterministic: it introduces a short delay in the
// first-scene assets and observes the number of concurrent requests.
test('first scene streams artwork in small batches while preserving every layer',async({page})=>{
  const sceneFiles=new Set([
    'scene.webp','sky.webp','palace.webp','reeds.webp','arch.webp',
    'tree_l.webp','tree_r.webp','drape.webp','peacock.webp',
    'hang_1.webp','hang_2.webp','hang_3.webp','hang_4.webp',
    'spike_3.webp','spike_4.webp','spike_5.webp',
    'stem_1.webp','stem_2.webp','leaf_4.webp','leaf_5.webp','leaf_6.webp',
    'bloom_1.webp','bloom_2.webp','bloom_5.webp','bloom_6.webp'
  ]);
  let active=0,peak=0,observed=0;
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/assets/*.webp',async route=>{
    const path=new URL(route.request().url()).pathname;
    const match=/^\/assets\/([^/]+\.webp)$/.exec(path);
    if(!match||!sceneFiles.has(match[1])){
      await route.continue();
      return;
    }
    active++;
    observed++;
    peak=Math.max(peak,active);
    try{
      await new Promise(resolve=>setTimeout(resolve,90));
      await route.continue();
    }finally{
      active--;
    }
  });
  await page.goto('/');
  await expect(page.locator('#invitation')).toHaveAttribute('data-layers','ready',{timeout:35000});
  expect(observed).toBeGreaterThanOrEqual(20);
  expect(peak).toBeLessThanOrEqual(4);
  await expect(page.locator('#masterArt')).toHaveJSProperty('naturalWidth',1080);
  const emptyLayers=await page.locator('#animatedScene img').evaluateAll(images=>
    images.filter(img=>!img.src||!img.complete||!img.naturalWidth).length);
  expect(emptyLayers).toBe(0);
  await page.getByRole('button',{name:'Open Invitation',exact:true}).click();
  await expect(page.locator('#invitation')).toHaveAttribute('data-state','opened');
  expect(errors).toEqual([]);
});
