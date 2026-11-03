import {test,expect} from '@playwright/test';

async function reachGallery(page,query=''){
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/'+query);
  const gallery=page.locator('#gallery');
  await expect(gallery).toHaveAttribute('data-section','7');
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

test('Section 7 shows five honest empty photograph placeholders',async({page})=>{
  const {gallery,errors}=await reachGallery(page);
  await expect(gallery).toHaveClass(/is-visible/);
  await expect(page.getByRole('heading',{name:'Our Gallery',level:2})).toBeVisible();
  const slots=gallery.locator('[data-gallery-slot]');
  await expect(slots).toHaveCount(5);
  for(let i=0;i<5;i++){
    await expect(slots.nth(i)).toBeDisabled();
    await expect(slots.nth(i).locator('.gallery-photo-placeholder')).toBeVisible();
  }
  await expect(gallery.locator('.gallery-disclaimer')).toContainText('have not been provided');
  await expect(gallery.locator('.gallery-slot-label')).toHaveText(['Together','The Bride','The Groom','The Garden','The Lake']);
  await expect(gallery.locator('.gallery-intro')).toHaveText('Tap a frame to view');
  await expect(gallery.locator('.gallery-reference-note')).toBeHidden();
  const sourceOrder = await gallery.evaluate(el => {
    const frames=el.querySelector('.gallery-photos');
    const hint=el.querySelector('.gallery-intro');
    return Boolean(frames.compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  expect(sourceOrder).toBe(true);
  await expect(page.locator('#galleryDialog')).not.toBeVisible();
  expect(errors).toEqual([]);
});

test('Section 7 fits mobile viewports and preserves Dress Code transition',async({page},testInfo)=>{
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

test('Section 7 matches measured 320px and 390px source grid geometry',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const {gallery}=await reachGallery(page);
  const width=await page.evaluate(()=>innerWidth);
  const frames=await gallery.locator('[data-gallery-slot]').evaluateAll(nodes=>nodes.map(el=>{
    const b=el.getBoundingClientRect();
    return {x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom};
  }));
  expect(frames).toHaveLength(5);
  const inset=28;
  const total=width-2*inset;
  const small=(total-12)/2;
  const near=(actual,want,why,tolerance=1.2)=>{
    expect(Math.abs(actual-want),why+': '+actual+' vs '+want).toBeLessThanOrEqual(tolerance);
  };
  near(frames[0].x,inset,'Together left');
  near(frames[1].x,inset+small+12,'Bride left');
  near(frames[0].width,small,'Together width');
  near(frames[1].width,small,'Bride width');
  near(frames[0].height,small*(246.9/161),'Together height');
  near(frames[1].height,small*(214.7/161),'Bride height');
  near(frames[0].y,frames[1].y,'Top row alignment');
  near(frames[2].width,small-1,'Groom centered width');
  near(frames[2].x,(width-(small-1))/2,'Groom centered x');
  near(frames[2].y,frames[0].bottom+12,'Groom row gap');
  near(frames[2].height,(small-1)*(213.3/160),'Groom height');
  for(const frame of frames.slice(3)){
    near(frame.x,inset,'Full-width frame left');
    near(frame.width,total,'Full-width frame width');
    near(frame.height,total*(249.4/334),'Full-width frame height');
  }
  near(frames[3].y,frames[2].bottom+12,'Garden row gap');
  near(frames[4].y,frames[3].bottom+12,'Lake row gap');
  const title=gallery.locator('h2.gallery-heading');
  const font=await title.evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
  near(font,52,'Our Gallery font size');
});

test('Section 7 matches source background, heading placement and small hint type',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const {gallery}=await reachGallery(page);
  const metrics=await gallery.evaluate(el=>{
    const cs=getComputedStyle(el);
    const heading=el.querySelector('h2.gallery-heading');
    const h=getComputedStyle(heading);
    const r=el.getBoundingClientRect(),hr=heading.getBoundingClientRect();
    const note=getComputedStyle(el.querySelector('.gallery-intro'));
    return {
      background:cs.backgroundColor,
      image:cs.backgroundImage,
      topPadding:cs.paddingTop,bottomPadding:cs.paddingBottom,
      sidePadding:cs.paddingLeft,
      titleTop:hr.top-r.top,
      titleColor:h.color,titleShadow:h.textShadow,
      titleFont:h.fontSize,titleLineHeight:h.lineHeight,
      hintSize:note.fontSize,hintLineHeight:note.lineHeight,
      hintWeight:note.fontWeight,hintColor:note.color,
      eyebrow:(()=>{
        const x=getComputedStyle(el.querySelector('.gallery-eyebrow'));
        return {family:x.fontFamily,size:x.fontSize,lineHeight:x.lineHeight,
          weight:x.fontWeight,color:x.color,tracking:x.letterSpacing,
          bottomMargin:x.marginBottom};
      })()
    };
  });
  expect(metrics.background).toBe('rgb(250, 247, 251)');
  expect(metrics.image).toBe('none');
  expect(metrics.topPadding).toBe('96px');
  expect(metrics.bottomPadding).toBe('96px');
  expect(metrics.sidePadding).toBe('28px');
  expect(Math.abs(metrics.titleTop-126.1)).toBeLessThanOrEqual(1.5);
  expect(metrics.titleColor).toBe('rgb(123, 61, 110)');
  expect(metrics.titleShadow).toBe('none');
  expect(metrics.titleFont).toBe('52px');
  expect(metrics.titleLineHeight).toBe('59.8px');
  expect(metrics.hintSize).toBe('12px');
  expect(metrics.hintLineHeight).toBe('19.8px');
  expect(metrics.hintWeight).toBe('300');
  expect(metrics.hintColor).toBe('rgb(111, 90, 108)');
  expect(metrics.eyebrow.size).toBe('11px');
  expect(metrics.eyebrow.lineHeight).toBe('18.15px');
  expect(metrics.eyebrow.weight).toBe('400');
  expect(metrics.eyebrow.color).toBe('rgb(126, 100, 121)');
  expect(metrics.eyebrow.tracking).toBe('4.95px');
  expect(metrics.eyebrow.bottomMargin).toBe('12px');
  expect(metrics.eyebrow.family).toContain('EB Garamond');
});

test('Five downloaded local WebPs remove placeholder footer and preserve reference section height',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.route('**/assets/gallery/photo-*.webp',route=>
    route.fulfill({status:200,contentType:'image/webp',body:testImage}));
  const {gallery,errors}=await reachGallery(page);
  await expect(gallery.locator('.gallery-photo.has-image')).toHaveCount(5,{timeout:15000});
  await expect(gallery.locator('.gallery-disclaimer')).toBeHidden();
  await expect(gallery.locator('.gallery-reference-note')).toBeHidden();
  const observed=await gallery.evaluate(el=>el.getBoundingClientRect().height);
  const width=await page.evaluate(()=>innerWidth);
  const full=width-56;
  const small=(full-12)/2;
  const grid=small*(246.9/161)+(small-1)*(213.3/160)
    +2*full*(249.4/334)+3*12;
  const target=96+16.5+13.5+59.8+40+grid+22+19.8+96;
  expect(Math.abs(observed-target),`Section 7 height ${observed} vs ${target}`)
    .toBeLessThanOrEqual(2);
  expect(errors).toEqual([]);
});

test('Section 7 honors reduced-motion without hiding the gallery',async({page})=>{
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
  // The original reference has a 4px white border with image pixels
  // starting exactly 4px from each outside edge.
  const frameMetrics=await first.evaluate(el=>{
    const frame=el.getBoundingClientRect();
    const photo=el.querySelector('.gallery-image').getBoundingClientRect();
    const st=getComputedStyle(el);
    return {
      insetLeft:photo.left-frame.left,
      insetTop:photo.top-frame.top,
      insetRight:frame.right-photo.right,
      insetBottom:frame.bottom-photo.bottom,
      border:st.borderTopWidth,borderColor:st.borderTopColor,
      radius:st.borderTopLeftRadius,
      shadow:st.boxShadow
    };
  });
  for(const key of ['insetLeft','insetTop','insetRight','insetBottom']){
    expect(Math.abs(frameMetrics[key]-4),key).toBeLessThanOrEqual(0.5);
  }
  expect(frameMetrics.border).toBe('4px');
  expect(frameMetrics.borderColor).toBe('rgb(255, 255, 255)');
  expect(frameMetrics.radius).toBe('14px');
  expect(frameMetrics.shadow).toContain('14px 36px');
  const caption=await first.locator('.gallery-frame-caption').evaluate(el=>{
    const frame=el.closest('.gallery-photo').getBoundingClientRect();
    const r=el.getBoundingClientRect(),s=getComputedStyle(el);
    return {left:r.left-frame.left,bottom:frame.bottom-r.bottom,
      size:s.fontSize,height:s.lineHeight,weight:s.fontWeight,
      color:s.color,tracking:s.letterSpacing,transform:s.textTransform,
      textShadow:s.textShadow,background:s.backgroundImage};
  });
  expect(Math.abs(caption.left-16)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(caption.bottom-14)).toBeLessThanOrEqual(0.5);
  expect(caption.size).toBe('10px');
  expect(caption.height).toBe('16.5px');
  expect(caption.weight).toBe('400');
  expect(caption.color).toBe('rgb(255, 255, 255)');
  expect(caption.tracking).toBe('2.8px');
  expect(caption.transform).toBe('uppercase');
  expect(caption.textShadow).toContain('1px 10px');
  expect(caption.background).toBe('none');
  await expect(gallery.locator('[data-gallery-slot="2"]')).toBeDisabled();
  await expect(gallery.locator('.gallery-disclaimer')).toContainText('Tap an available');
  await first.click();
  const dialog=page.getByRole('dialog',{name:'Wedding photo viewer'});
  await expect(dialog).toBeVisible();
  await expect(page.locator('#galleryPosition')).toHaveText('1 / 2');
  await expect(page.locator('#galleryViewCaption')).toHaveText('Together');
  await expect(page.getByRole('button',{name:'Close photo viewer'})).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#galleryViewCaption')).toHaveText('The Bride');
  await expect(page.locator('#galleryPosition')).toHaveText('2 / 2');
  await page.getByRole('button',{name:'Next photo'}).click();
  await expect(page.locator('#galleryViewCaption')).toHaveText('Together');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(first).toBeFocused();
  expect(errors).toEqual([]);
});


test('Gallery QA mode loads only five downloaded local WebPs and displays captions',async({page})=>{
  const filenames=['moody.webp','moody-bride.webp','moody-groom.webp','moody-garden.webp','moody-lake.webp'];
  const requested=[];
  const externalRequests=[];
  page.on('request',req=>{
    if (/undangankahwin\.com\/images\/concierge\/couples\//.test(req.url())) externalRequests.push(req.url());
  });
  await page.route('**/assets/gallery/reference/*.webp', route => {
    const uri=new URL(route.request().url());
    requested.push(uri.pathname.split('/').at(-1));
    return route.fulfill({status:200,contentType:'image/webp',body:testImage});
  });
  const {gallery,errors}=await reachGallery(page,'?galleryReference=1');
  await expect(gallery).toHaveAttribute('data-gallery-art','reference-comparison');
  await expect(gallery.locator('.gallery-reference-note')).toBeVisible();
  await expect(gallery.locator('.gallery-reference-note')).toContainText('Local comparison');
  await expect(gallery.locator('.gallery-photo.has-image')).toHaveCount(5,{timeout:15000});
  expect(requested.sort()).toEqual([...filenames].sort());
  expect(externalRequests).toEqual([]);
  const urls = await gallery.locator('.gallery-image').evaluateAll(nodes=>nodes.map(el=>el.getAttribute('src')));
  expect(urls).toEqual(filenames.map(name=>'./assets/gallery/reference/'+name));
  await gallery.locator('[data-gallery-slot="4"]').click();
  await expect(page.locator('#galleryViewCaption')).toHaveText('The Lake');
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});

test('Gallery local reference mode retains placeholders if downloaded WebPs are missing',async({page})=>{
  await page.route('**/assets/gallery/reference/*.webp',route=>route.fulfill({status:404,body:'Unavailable'}));
  const {gallery,errors}=await reachGallery(page,'?galleryReference=1');
  await expect(gallery.locator('.gallery-photo.has-image')).toHaveCount(0);
  await expect(gallery.locator('[data-gallery-slot="0"]')).toBeDisabled();
  await expect(gallery.locator('.gallery-photo-placeholder').first()).toBeVisible();
  await expect(gallery.locator('.gallery-disclaimer')).toContainText('Local reference WebP missing');
  expect(errors).toEqual([]);
});
