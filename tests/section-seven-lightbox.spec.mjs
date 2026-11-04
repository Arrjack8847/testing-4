import { test, expect } from '@playwright/test';

// Source measurement: Section 7 lightbox is a full-screen dark layer with
// 28px horizontal inset, a centered 3:4 image frame, white 6px border,
// 16px corners and a 42px circular close button at top:22px/right:22px.
// Tiny WebP is a test fixture, not third-party wedding photography.
const webp = Buffer.from(
  'UklGRiwAAABXRUJQVlA4ICAAAABwAQCdASoKABAAAgA0JZQCdAGIQAD+7e02x7gwm7AwAA==',
  'base64'
);
const devices=[
  [320,568],[360,740],[390,844],[430,932]
];

for (const [width,height] of devices) {
  test(`Section 7 source-measured lightbox at ${width}x${height}`, async ({page}) => {
    await page.setViewportSize({width,height});
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.route('**/assets/gallery/reference/*.webp',route=>
      route.fulfill({status:200,contentType:'image/webp',body:webp}));
    await page.goto('/?galleryReference=1');
    await page.getByRole('button',{name:'Open Invitation'}).click();
    await page.evaluate(()=>{
      document.documentElement.style.scrollBehavior='auto';
      document.querySelector('#gallery').scrollIntoView({block:'start',behavior:'instant'});
    });
    const first=page.locator('#gallery [data-gallery-slot="0"]');
    await expect(first).toBeEnabled({timeout:15000});
    await first.click();
    const dialog=page.locator('#galleryDialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByRole('button',{name:'Close photo viewer'})).toBeFocused();
    await expect(page.locator('#galleryViewCaption')).toHaveText('Together');
    await expect(page.locator('.gallery-viewer-navigation')).toBeHidden();
    const m=await page.evaluate(()=>{
      const measure=selector=>{
        const el=document.querySelector(selector),r=el.getBoundingClientRect();
        return {x:r.x,y:r.y,w:r.width,h:r.height};
      };
      const dlg=document.querySelector('#galleryDialog');
      const frame=document.querySelector('.gallery-viewer-figure');
      const close=document.querySelector('#galleryClose');
      const image=document.querySelector('#galleryViewImage');
      return {
        window:[innerWidth,innerHeight],
        dialog:measure('#galleryDialog'),
        frame:measure('.gallery-viewer-figure'),
        image:measure('#galleryViewImage'),
        close:measure('#galleryClose'),
        dialogBg:getComputedStyle(dlg).backgroundColor,
        dialogRadius:getComputedStyle(dlg).borderRadius,
        frameBorder:getComputedStyle(frame).borderTopWidth,
        frameBorderColor:getComputedStyle(frame).borderTopColor,
        frameRadius:getComputedStyle(frame).borderRadius,
        imageFit:getComputedStyle(image).objectFit,
        closeBackground:getComputedStyle(close).backgroundColor
      };
    });
    const near=(value,wanted,why)=>expect(Math.abs(value-wanted),why).toBeLessThanOrEqual(1);
    expect(m.window).toEqual([width,height]);
    near(m.dialog.x,0,'overlay left');
    near(m.dialog.y,0,'overlay top');
    near(m.dialog.w,width,'overlay width');
    near(m.dialog.h,height,'overlay height');
    expect(m.dialogBg).toBe('rgba(50, 42, 34, 0.9)');
    expect(m.dialogRadius).toBe('0px');
    near(m.frame.x,28,'frame left');
    near(m.frame.w,width-56,'frame width');
    near(m.frame.h,(width-56)*4/3,'frame height');
    near(m.frame.y,(height-m.frame.h)/2,'frame centered vertically');
    expect(m.frameBorder).toBe('6px');
    expect(m.frameBorderColor).toBe('rgb(255, 255, 255)');
    expect(m.frameRadius).toBe('16px');
    near(m.image.x,m.frame.x+6,'image x');
    near(m.image.y,m.frame.y+6,'image y');
    near(m.image.w,m.frame.w-12,'image width');
    near(m.image.h,m.frame.h-12,'image height');
    expect(m.imageFit).toBe('cover');
    near(m.close.x,width-64,'close x');
    near(m.close.y,22,'close y');
    near(m.close.w,42,'close width');
    near(m.close.h,42,'close height');
    expect(m.closeBackground).toBe('rgba(255, 255, 255, 0.15)');
    // Maintain more usable keyboard behavior than the observed source:
    // Escape closes and returns focus to the selected photo.
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(first).toBeFocused();

    // Landscape frames must preserve the same centered viewer geometry
    // and source-style cover crop; do not leak a caption or arrow toolbar.
    for(const [slot,caption] of [[3,'The Garden'],[4,'The Lake']]){
      const frame=page.locator(`#gallery [data-gallery-slot="${slot}"]`);
      await frame.scrollIntoViewIfNeeded();
      await expect(frame).toBeEnabled();
      await frame.click();
      await expect(dialog).toBeVisible();
      await expect(page.locator('#galleryViewCaption')).toHaveText(caption);
      await expect(page.locator('#galleryViewImage')).toHaveCSS('object-fit','cover');
      await expect(page.locator('.gallery-viewer-navigation')).toBeHidden();
      const size=await page.locator('.gallery-viewer-figure').boundingBox();
      near(size.width,width-56,'landscape viewer width');
      near(size.height,(width-56)*4/3,'landscape viewer height');
      await page.getByRole('button',{name:'Close photo viewer'}).click();
      await expect(dialog).not.toBeVisible();
      await expect(frame).toBeFocused();
    }
  });
}
