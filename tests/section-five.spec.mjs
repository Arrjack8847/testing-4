import {test,expect} from '@playwright/test';

async function reachGallery(page){
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  const gallery=page.locator('#gallery');
  await expect(gallery).toHaveAttribute('data-section','6');
  await expect(gallery).toHaveAttribute('aria-hidden','true');
  await expect(gallery).toHaveJSProperty('inert',true);
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(gallery).toHaveAttribute('aria-hidden','false');
  await expect(gallery).toHaveJSProperty('inert',false);
  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    document.getElementById('gallery').scrollIntoView({block:'start',behavior:'instant'});
  });
  await expect(gallery).toBeInViewport();
  return {gallery,errors};
}

test('Section 5 shows five honest empty photograph placeholders',async({page})=>{
  const {gallery,errors}=await reachGallery(page);
  await expect(gallery).toHaveClass(/is-visible/);
  await expect(page.getByRole('heading',{name:'Our Memories',level:2})).toBeVisible();
  const slots=gallery.locator('[data-gallery-slot]');
  await expect(slots).toHaveCount(5);
  for(let i=0;i<5;i++){
    await expect(slots.nth(i)).toBeDisabled();
    await expect(slots.nth(i).locator('.gallery-photo-placeholder')).toBeVisible();
  }
  await expect(gallery.locator('.gallery-disclaimer')).toContainText('have not been provided');
  await expect(page.locator('#galleryDialog')).not.toBeVisible();
  expect(errors).toEqual([]);
});

test('Gallery fits mobile viewports and preserves Dress Code transition',async({page},testInfo)=>{
  const {gallery}=await reachGallery(page);
  const bounds=await gallery.evaluate(el=>{
    const previous=document.getElementById('dressCode');
    const boxes=[...el.querySelectorAll('.gallery-photo')].map(node=>node.getBoundingClientRect());
    const boundary =el.getBoundingClientRect().top - previous.getBoundingClientRect().bottom;
    return {adjacent:previous.nextElementSibling===el,boundary,overflow:document.documentElement.scrollWidth-innerWidth,
      width:innerWidth,boxes:boxes.map(b=>({left:b.left,right:b.right,width:b.width}))};
  });
  expect(bounds.adjacent).toBe(true);
  expect(Math.abs(bounds.boundary)).toBeLessThanOrEqual(1);
  expect(bounds.overflow).toBeLessThanOrEqual(1);
  for(const b of bounds.boxes){
    expect(b.left).toBeGreaterThanOrEqual(-1);
    expect(b.right).toBeLessThanOrEqual(bounds.width+1);
    expect(b.width).toBeGreaterThan(70);
  }
  await gallery.screenshot({path:testInfo.outputPath('section-five-empty-gallery.png'),animations:'disabled'});
});

test('Section 5 honors reduced-motion without hiding the gallery',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const {gallery}=await reachGallery(page);
  const title=gallery.locator('.gallery-heading');
  await expect(title).toBeVisible();
  const style=await title.evaluate(el=>({
    opacity:getComputedStyle(el).opacity,
    translate:getComputedStyle(el).translate,
    transition:getComputedStyle(el).transitionDuration
  }));
  expect(style.opacity).toBe('1');
  expect(['none','0px','0px 0px']).toContain(style.translate);
  await expect(gallery.locator('.gallery-photo')).toHaveCount(5);
});

// Valid original test fixture: a tiny WebP generated for automated UI QA.
// It is never used as a real wedding photograph or shipped to guests.
const testImage = Buffer.from('UklGRiwAAABXRUJQVlA4ICAAAABwAQCdASoKABAAAgA0JZQCdAGIQAD+7e02x7gwm7AwAA==','base64');

test('Uploaded local gallery files enable image viewer, keyboard arrows and Escape',async({page})=>{
  await page.route('**/assets/gallery/*.webp',route=>{
    if(/photo-0[12]\.webp$/.test(route.request().url())){
      return route.fulfill({status:200,contentType:'image/webp',body:testImage});
    }
    return route.fulfill({status:404,body:'Missing test photograph'});
  });
  const {gallery,errors}=await reachGallery(page);
  const first=gallery.locator('[data-gallery-slot="0"]');
  const second=gallery.locator('[data-gallery-slot="1"]');
  await expect(first).toBeEnabled({timeout:12000});
  await expect(second).toBeEnabled();
  await expect(gallery.locator('[data-gallery-slot="2"]')).toBeDisabled();
  await expect(gallery.locator('.gallery-disclaimer')).toContainText('Tap an available');
  await first.click();
  const dialog=page.getByRole('dialog',{name:'Wedding photo viewer'});
  await expect(dialog).toBeVisible();
  await expect(page.locator('#galleryPosition')).toHaveText('1 / 2');
  await expect(page.locator('#galleryViewCaption')).toHaveText('Photo 01');
  await expect(page.getByRole('button',{name:'Close photo viewer'})).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#galleryViewCaption')).toHaveText('Photo 02');
  await expect(page.locator('#galleryPosition')).toHaveText('2 / 2');
  await page.getByRole('button',{name:'Next photo'}).click();
  await expect(page.locator('#galleryViewCaption')).toHaveText('Photo 01');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(first).toBeFocused();
  expect(errors).toEqual([]);
});
