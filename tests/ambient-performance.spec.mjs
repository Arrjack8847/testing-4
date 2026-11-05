import {test,expect} from '@playwright/test';

// Performance lifecycle regressions. No timing, keyframes or artwork are
// changed to pass these checks; tests exercise regular guest mode.
async function waitForGarden(page){
  await page.goto('/');
  await expect(page.locator('#invitation')).toHaveAttribute('data-layers','ready',{timeout:35000});
}

test('global petals suppress invisible duplicate Section 1 raster paints while hero motion remains running',async({page})=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
    window.__hiddenLocalPetalPaints=0;
    const original=CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect=function(...args){
      if(this.canvas?.id==='petalCanvas')window.__hiddenLocalPetalPaints++;
      return original.apply(this,args);
    };
  });
  await waitForGarden(page);
  await expect(page.locator('html')).toHaveClass(/global-petals-active/);
  await expect(page.locator('#petalCanvas')).toBeHidden();
  await expect(page.locator('#invitation')).toHaveAttribute('data-ambient','running');
  const before=await page.evaluate(()=>window.__hiddenLocalPetalPaints);
  await page.waitForTimeout(230);
  expect(await page.evaluate(()=>window.__hiddenLocalPetalPaints)).toBe(before);
  // Simulate global canvas becoming unavailable: the original local fallback
  // must still paint, without pausing all other hero ambient animations.
  await page.evaluate(()=>document.documentElement.classList.remove('global-petals-active'));
  await expect.poll(()=>page.evaluate(()=>window.__hiddenLocalPetalPaints),{timeout:2000})
    .toBeGreaterThan(before);
  await expect(page.locator('#invitation')).toHaveAttribute('data-ambient','running');
  expect(errors).toEqual([]);
});

test('hidden decorative petal CSS clocks pause under the visually continuous global field',async({page})=>{
  await waitForGarden(page);
  await expect(page.locator('html')).toHaveClass(/global-petals-active/);
  const petals=page.locator('.gift-eight .gift-eight-petals i');
  await expect(petals.first()).toHaveCount(1);
  await expect(petals.first()).toHaveCSS('animation-play-state','paused');
  await expect(page.locator('.global-petal-canvas')).toBeVisible();
});

test('Gift garden and butterfly resume before visibility without changing their keyframes or imagery',async({page})=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await waitForGarden(page);
  const gift=page.locator('#weddingGift');
  const art=gift.locator('.gift-eight-art');
  const butterfly=gift.locator('.gift-eight-butterfly');
  await expect(gift).toHaveAttribute('data-gift-ambient','paused');
  const baseline=await art.evaluate(el=>{
    const css=getComputedStyle(el);
    return {image:css.backgroundImage,name:css.animationName,duration:css.animationDuration};
  });
  expect(baseline.name).toMatch(/gift-eight-garden-(reference-)?breathe/);
  expect(baseline.duration).toContain('12s');
  await page.getByRole('button',{name:'Open Invitation',exact:true}).click();
  await page.evaluate(()=>{
    const gift=document.getElementById('weddingGift');
    document.documentElement.style.scrollBehavior='auto';
    scrollTo({top:gift.getBoundingClientRect().top+scrollY,behavior:'instant'});
  });
  await expect(gift).toHaveAttribute('data-gift-ambient','running');
  await expect(art).toHaveCSS('animation-play-state','running');
  await expect(butterfly).toHaveCSS('animation-play-state','running');
  const visible=await art.evaluate(el=>{
    const css=getComputedStyle(el);
    return {image:css.backgroundImage,name:css.animationName,duration:css.animationDuration};
  });
  expect(visible).toEqual(baseline);
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  await expect(gift).toHaveAttribute('data-gift-ambient','paused');
  await expect(art).toHaveCSS('animation-play-state','paused');
  expect(errors).toEqual([]);
});
