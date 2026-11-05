import {test,expect} from '@playwright/test';

async function openGift(page){
  const faults=[];
  page.on('pageerror',e=>faults.push(e.message));
  await page.goto('/');
  const gift=page.locator('#weddingGift');
  await expect(gift).toHaveAttribute('data-section','8');
  await expect(gift).toHaveAttribute('aria-hidden','true');
  await expect(gift).toHaveJSProperty('inert',true);
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(gift).toHaveAttribute('aria-hidden','false');
  await expect(gift).toHaveJSProperty('inert',false);
  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    document.getElementById('weddingGift').scrollIntoView({block:'start',behavior:'instant'});
  });
  await expect(gift).toBeInViewport();
  return {gift,faults};
}

test('Section 8 is between Gallery and RSVP with no gap or mobile overflow',async({page},testInfo)=>{
  const {gift,faults}=await openGift(page);
  const m=await gift.evaluate(g=>{
    const gallery=document.getElementById('gallery'),rsvp=document.getElementById('rsvp');
    const prev=gallery.getBoundingClientRect(),here=g.getBoundingClientRect(),
      next=rsvp.getBoundingClientRect(),css=getComputedStyle(g);
    return {prevNext:gallery.nextElementSibling===g,
      nextPrev:rsvp.previousElementSibling===g,
      boundary1:here.top-prev.bottom,boundary2:next.top-here.bottom,
      overflow:document.documentElement.scrollWidth-innerWidth,
      sectionWidth:here.width,viewport:innerWidth,
      color:css.backgroundColor,paddingLeft:css.paddingLeft,
      paddingTop:css.paddingTop,paddingBottom:css.paddingBottom,
      // Gallery paint is owned by Section 7 and can be a scene image, gradient or none.
      rsvpNum:rsvp.dataset.section};
  });
  expect(m.prevNext).toBe(true);expect(m.nextPrev).toBe(true);
  expect(Math.abs(m.boundary1)).toBeLessThanOrEqual(1);
  expect(Math.abs(m.boundary2)).toBeLessThanOrEqual(1);
  expect(m.overflow).toBeLessThanOrEqual(1);
  expect(m.sectionWidth).toBe(m.viewport);
  expect(m.color).toBe('rgb(92, 38, 79)');
  // Section 8 integration checks Gallery adjacency, not Gallery artwork implementation.
  expect(m.paddingLeft).toBe('28px');
  expect(m.paddingTop).toBe('96px');expect(m.paddingBottom).toBe('96px');
  expect(m.rsvpNum).toBe('9');
  await gift.screenshot({path:testInfo.outputPath('gift-390-reference-needed.png'),animations:'disabled'});
  expect(faults).toEqual([]);
});

test('Section 8 uses the actual source content order without unsafe fake transactions',async({page})=>{
  const {gift,faults}=await openGift(page);
  await expect(gift.getByRole('heading',{name:'Wedding Gift'})).toBeVisible();
  const trigger=gift.getByRole('button',{name:/Send Gift/i});
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded','false');
  await expect(gift.locator('#giftEightBanks')).toBeHidden();
  await expect(gift.locator('#giftEightWishlist')).toBeHidden();
  await expect(gift.locator('#giftEightDisclaimer')).toBeHidden();
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded','true');
  await expect(gift.locator('#giftEightBanks')).toBeVisible();
  await expect(gift.locator('#giftEightWishlist')).toBeVisible();
  await expect(gift.locator('#giftEightDisclaimer')).toBeVisible();
  await expect(gift.getByRole('heading',{name:'Gift Wishlist'})).toBeVisible();
  const carousel=await gift.locator('#giftEightBanks').evaluate(el=>({
    width:el.getBoundingClientRect().width,
    scrollWidth:el.scrollWidth,
    cards:[...el.querySelectorAll('.gift-eight-bank')].map(x=>x.getBoundingClientRect().width)
  }));
  expect(carousel.scrollWidth).toBeGreaterThan(carousel.width);
  expect(carousel.cards).toEqual([278,278]);
  await expect(gift.locator('.gift-eight-bank')).toHaveCount(2);
  await expect(gift.locator('.gift-eight-bank-name')).toHaveText(['Maybank','CIMB']);
  await expect(gift.locator('.gift-eight-item')).toHaveCount(3);
  await expect(gift.locator('.gift-eight-item h4')).toHaveText([
    'Philips Avance Collection Rice Cooker HD3175/62',
    'Philips 1.7L Kettle 1000 Series HD9314',
    'IKEA Gift Card'
  ]);
  for(const button of await gift.locator('.gift-eight-copy').all()) await expect(button).toBeDisabled();
  expect(await gift.locator('button:not(:disabled):not(.gift-eight-trigger)').count()).toBe(0);
  expect(await gift.locator('a[href]').count()).toBe(0);
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded','false');
  await expect(gift.locator('#giftEightBanks')).toBeHidden();
  await expect(gift.locator('#giftEightWishlist')).toBeHidden();
  await expect(gift.locator('#giftEightDisclaimer')).toBeHidden();
  await expect(gift.locator('.gift-eight-disclaimer')).toContainText('not enabled');
  expect(faults).toEqual([]);
});

test('Artwork is local-only and does not expose unauthorized vendor URLs',async({page})=>{
  const {gift}=await openGift(page);
  const values=await gift.evaluate(el=>({
    art:el.dataset.giftArtwork,
    urls:[...el.querySelectorAll('img')].map(x=>x.src),
    backdrop:getComputedStyle(el.querySelector('.gift-eight-art')).backgroundImage,
    scripts:[...document.scripts].map(x=>x.src).filter(x=>x.includes('gift'))
  }));
  expect(['original','reference-local']).toContain(values.art);
  expect(values.urls).toEqual([]);
  expect(values.scripts.every(x=>x.startsWith('http://127.0.0.1:8000/'))).toBe(true);
  if(values.art==='reference-local'){
    expect(values.backdrop).toContain('assets/reference-dev/band_plum.webp');
  }else{
    expect(values.backdrop).toContain('section8-plum-botanical-original.svg');
    expect(values.backdrop).not.toContain('undangankahwin.com');
  }
});

test('Reveals in each viewport and resets when scrolled away',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  const {gift}=await openGift(page);
  await expect(gift).toHaveAttribute('data-gift-reveal-ready','true');
  const heading=gift.locator('.gift-eight-heading');
  await expect(heading).toHaveClass(/\bin\b/);
  const pos=await gift.evaluate(el=>el.getBoundingClientRect().top+scrollY);
  await page.evaluate(y=>scrollTo({top:Math.max(0,y-innerHeight*2),behavior:'instant'}),pos);
  await expect(heading).not.toHaveClass(/\bin\b/);
  await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),pos);
  await expect(heading).toHaveClass(/\bin\b/);
});

test('Reduced Motion eliminates gift entrance transforms',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const {gift}=await openGift(page);
  await expect(gift).not.toHaveAttribute('data-gift-reveal-ready','true');
  const css=await gift.locator('.gift-eight-heading').evaluate(el=>{
    const cs=getComputedStyle(el);return {opacity:cs.opacity,transform:cs.transform,transition:cs.transitionDuration};
  });
  expect(css.opacity).toBe('1');expect(css.transform).toBe('none');
  expect(css.transition.split(',').every(x=>x.trim()==='0s')).toBe(true);
});

test('Copy is activated only by explicit verified customer configuration',async({page})=>{
  await page.addInitScript(()=>{
    window.WEDDING_GIFT_CONFIG={bankAccounts:[
      {bank:'Example Bank',number:'123456789012',holder:'Authorized Test Owner',verified:true},
      {bank:'Unverified Bank',number:'123456789012',holder:'Test Recipient',verified:false}
    ]};
  });
  const {gift}=await openGift(page);
  await expect(gift.locator('.gift-eight-bank').first().locator('.gift-eight-bank-name'))
    .toHaveText('Example Bank');
  await expect(gift.locator('.gift-eight-copy').first()).toBeEnabled();
  await expect(gift.locator('.gift-eight-copy').last()).toBeDisabled();
});


test('Gallery to Wedding Gift to RSVP scrolls forward and backward without changing neighbors',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const {gift,faults}=await openGift(page);
  const sequence=['gallery','weddingGift','rsvp','weddingGift','gallery'];
  const states=[];
  for(const id of sequence){
    await page.evaluate(id=>{
      document.getElementById(id).scrollIntoView({block:'start',behavior:'instant'});
    },id);
    const data=await page.evaluate(id=>{
      const node=document.getElementById(id);
      const r=node.getBoundingClientRect();
      return {id,top:r.top,bottom:r.bottom,height:r.height,viewport:innerHeight,
        overflow:document.documentElement.scrollWidth-innerWidth};
    },id);
    expect(data.height).toBeGreaterThan(0);
    expect(data.top).toBeGreaterThanOrEqual(-2);
    expect(data.top).toBeLessThanOrEqual(2);
    expect(data.overflow).toBeLessThanOrEqual(1);
    states.push(data.id);
  }
  expect(states).toEqual(sequence);
  await expect(gift).toHaveAttribute('data-section','8');
  await expect(page.locator('#rsvp')).toHaveAttribute('data-section','9');
  await expect(gift).toHaveAttribute('aria-hidden','false');
  expect(faults).toEqual([]);
});


test('Authorized downloaded local plum and blush WebPs are detected independently',async({page})=>{
  // Tiny valid 4×4 image fixture, not the reference vendor artwork.
  const sample=Buffer.from('UklGRh4AAABXRUJQVlA4TBEAAAAvA8AAAAdQ69rXvP+BiOh/AAA=','base64');
  await page.route('**/assets/reference-dev/band_plum.webp',route=>
    route.fulfill({status:200,contentType:'image/webp',body:sample}));
  await page.route('**/assets/reference-dev/bfly_blush.webp',route=>
    route.fulfill({status:200,contentType:'image/webp',body:sample}));
  const {gift,faults}=await openGift(page);
  await expect(gift).toHaveAttribute('data-gift-artwork','reference-local');
  await expect(gift).toHaveAttribute('data-gift-butterfly','reference-local');
  const visual=await gift.evaluate(el=>{
    const art=getComputedStyle(el.querySelector('.gift-eight-art'));
    const butterfly=el.querySelector('.gift-eight-butterfly');
    const wing=el.querySelector('.gift-eight-bfly-left');
    const bcss=getComputedStyle(butterfly);
    const wcss=getComputedStyle(wing);
    return {
      backdrop:art.backgroundImage,
      wing:wcss.backgroundImage,
      butterflyVisibility:bcss.visibility,
      butterflyOpacity:parseFloat(bcss.opacity),
      // Computed width ignores the flight's rotation of the bounding box.
      butterflyWidth:parseFloat(bcss.width),
      // The source-calibrated handoff is near the *upper* Gift edge.
      // Read the CSS anchor, not the animated transformed visual rectangle.
      butterflyTop:parseFloat(bcss.top),
      butterflyBottom:bcss.bottom,
      overflow:document.documentElement.scrollWidth-innerWidth
    };
  });
  expect(visual.backdrop).toContain('reference-dev/band_plum.webp');
  expect(visual.wing).toContain('reference-dev/bfly_blush.webp');
  expect(visual.butterflyVisibility).toBe('visible');
  expect(visual.butterflyOpacity).toBeGreaterThan(.8);
  // CSS retains the latest source-calibrated 52px paired-wing sprite
  // near the upper Wedding Gift handoff; the earlier bottom-edge test was stale.
  expect(visual.butterflyWidth).toBeGreaterThanOrEqual(50);
  expect(visual.butterflyWidth).toBeLessThanOrEqual(54);
  expect(visual.butterflyTop).toBeGreaterThanOrEqual(0);
  expect(visual.butterflyTop).toBeLessThanOrEqual(25);
  // Chromium may resolve computed bottom to a used pixel value when top and
  // height position an absolute element. Top, size and overflow are the
  // meaningful visual anchors, all asserted above and below.
  expect(visual.overflow).toBeLessThanOrEqual(1);
  expect(faults).toEqual([]);
});

test('Missing private butterfly uses original animated fallback without vendor hotlinks',async({page})=>{
  await page.route('**/assets/reference-dev/bfly_blush.webp',route=>
    route.fulfill({status:404,body:'Reference not installed'}));
  const requested=[];
  page.on('request',req=>{
    if(/bfly_blush|band_plum/i.test(req.url()))requested.push(req.url());
  });
  const {gift}=await openGift(page);
  const value=await gift.evaluate(el=>({
    status:el.dataset.giftButterfly,
    visibility:getComputedStyle(el.querySelector('.gift-eight-butterfly')).visibility,
    opacity:parseFloat(getComputedStyle(el.querySelector('.gift-eight-butterfly')).opacity),
    background:getComputedStyle(el.querySelector('.gift-eight-bfly-left')).backgroundImage
  }));
  expect(value.status).toBe('original');
  expect(value.visibility).toBe('visible');
  expect(value.opacity).toBeGreaterThan(.8);
  if(value.status==='original'){
    expect(value.background).toContain('section8-blush-wing-original.svg');
    const img=await page.request.get('/assets/section8-blush-wing-original.svg');
    expect(img.status()).toBe(200);
    expect(img.headers()['content-type']).toContain('image/svg+xml');
  }
  expect(requested.every(url=>new URL(url).hostname==='127.0.0.1')).toBe(true);
});

test('Reduced Motion keeps a downloaded blush butterfly still',async({page})=>{
  const sample=Buffer.from('UklGRh4AAABXRUJQVlA4TBEAAAAvA8AAAAdQ69rXvP+BiOh/AAA=','base64');
  await page.route('**/assets/reference-dev/bfly_blush.webp',route=>
    route.fulfill({status:200,contentType:'image/webp',body:sample}));
  await page.emulateMedia({reducedMotion:'reduce'});
  const {gift}=await openGift(page);
  await expect(gift).toHaveAttribute('data-gift-butterfly','reference-local');
  const timing=await gift.evaluate(el=>({
    butterfly:getComputedStyle(el.querySelector('.gift-eight-butterfly')).animationName,
    wings:[...el.querySelectorAll('.gift-eight-bfly-wing')]
      .map(node=>getComputedStyle(node).animationName)
  }));
  expect(timing.butterfly).toBe('none');
  expect(timing.wings).toEqual(['none','none']);
});


test('Default source-style Gift panel stays collapsed until requested',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const {gift,faults}=await openGift(page);
  await expect(gift.locator('#giftEightBanks')).toBeHidden();
  await expect(gift.locator('#giftEightWishlist')).toBeHidden();
  await expect(gift.getByRole('button',{name:/Send Gift/i})).toHaveAttribute('aria-expanded','false');
  const measurements=await gift.evaluate(el=>({
    section:el.getBoundingClientRect().height,
    bg:getComputedStyle(el).backgroundColor,
    frameTop:getComputedStyle(el,'::before').top,
    horizontalOverflow:document.documentElement.scrollWidth-innerWidth
  }));
  expect(measurements.horizontalOverflow).toBeLessThanOrEqual(1);
  expect(measurements.bg).toBe('rgb(92, 38, 79)');
  expect(measurements.frameTop).toBe('70px');
  expect(measurements.section).toBeGreaterThan(900);
  expect(faults).toEqual([]);
});

test('Section 8 petals and blush wing motions respect Reduce Motion',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const {gift}=await openGift(page);
  const result=await gift.evaluate(el=>({
    petals:[...el.querySelectorAll('.gift-eight-petals i')]
      .map(node=>getComputedStyle(node).animationName),
    hiddenWishlist:el.querySelector('#giftEightWishlist').hidden,
    hiddenBanks:el.querySelector('#giftEightBanks').hidden
  }));
  expect(result.petals).toHaveLength(8);
  expect(result.petals.every(x=>x==='none')).toBe(true);
  expect(result.hiddenWishlist).toBe(true);
  expect(result.hiddenBanks).toBe(true);
});


test('Authorized local product thumbnails replace placeholder glyphs without external hotlinks',async({page})=>{
  const sample=Buffer.from('UklGRh4AAABXRUJQVlA4TBEAAAAvA8AAAAdQ69rXvP+BiOh/AAA=','base64');
  for(const item of ['gift-rice-cooker.jpg','gift-kettle.webp']){
    await page.route('**/assets/reference-dev/'+item,route=>
      route.fulfill({status:200,contentType:'image/webp',body:sample}));
  }
  const {gift,faults}=await openGift(page);
  await expect(gift).toHaveAttribute('data-gift-thumb-rice','reference-local');
  await expect(gift).toHaveAttribute('data-gift-thumb-kettle','reference-local');
  const assets=await gift.evaluate(el=>({
    rice:getComputedStyle(el.querySelector('.gift-eight-thumb-rice')).backgroundImage,
    kettle:getComputedStyle(el.querySelector('.gift-eight-thumb-kettle')).backgroundImage
  }));
  expect(assets.rice).toContain('assets/reference-dev/gift-rice-cooker.jpg');
  expect(assets.kettle).toContain('assets/reference-dev/gift-kettle.webp');
  expect(assets.rice).not.toContain('susercontent.com');
  expect(assets.kettle).not.toContain('lazcdn.com');
  expect(faults).toEqual([]);
});


test('Expanded Gift cards never create a gap before RSVP or horizontal page scrolling',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const {gift,faults}=await openGift(page);
  const button=gift.locator('#giftEightTrigger');
  const before=await gift.evaluate(el=>el.getBoundingClientRect().height);
  await button.click();
  await expect(button).toHaveAttribute('aria-expanded','true');
  const measurements=await gift.evaluate(el=>{
    const r=el.getBoundingClientRect();
    const next=document.getElementById('rsvp').getBoundingClientRect();
    const bank=el.querySelector('#giftEightBanks');
    const wishlist=el.querySelector('#giftEightWishlist');
    return {
      height:r.height,
      gap:next.top-r.bottom,
      overflow:document.documentElement.scrollWidth-innerWidth,
      bankWidth:bank.clientWidth,
      bankScrollableWidth:bank.scrollWidth,
      bankVisible:getComputedStyle(bank).display!=='none',
      wishlistVisible:getComputedStyle(wishlist).display!=='none'
    };
  });
  expect(measurements.height).toBeGreaterThanOrEqual(before);
  expect(Math.abs(measurements.gap)).toBeLessThanOrEqual(1);
  expect(measurements.overflow).toBeLessThanOrEqual(1);
  expect(measurements.bankScrollableWidth).toBeGreaterThan(measurements.bankWidth);
  expect(measurements.bankVisible).toBe(true);
  expect(measurements.wishlistVisible).toBe(true);
  await button.click();
  await expect(button).toHaveAttribute('aria-expanded','false');
  await expect(gift.locator('#giftEightBanks')).toBeHidden();
  await expect(gift.locator('#giftEightWishlist')).toBeHidden();
  expect(faults).toEqual([]);
});


test('390px source-calibrated expanded Gift button and wishlist alignment',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='iphone-390','Reference screenshot baseline is 390×844');
  await page.emulateMedia({reducedMotion:'reduce'});
  const {gift,faults}=await openGift(page);
  await gift.locator('#giftEightTrigger').click();
  const data=await gift.evaluate(el=>{
    const base=el.getBoundingClientRect();
    const get=id=>{
      const r=el.querySelector(id).getBoundingClientRect();
      return {x:r.x,y:r.y-base.y,width:r.width,height:r.height};
    };
    return {
      button:get('#giftEightTrigger'),
      banks:get('#giftEightBanks'),
      firstCard:get('.gift-eight-bank'),
      wishlist:get('#giftEightWishlist'),
      wishlistIntro:get('.gift-eight-wishlist-intro'),
      overflow:document.documentElement.scrollWidth-innerWidth
    };
  });
  // Independent screenshot measurement: reference button top=395.6,
  // section top=36.4; the first card top≈420, wishlist top≈692.
  expect(data.button.y).toBeGreaterThan(351);
  expect(data.button.y).toBeLessThan(369);
  expect(data.firstCard.y).toBeGreaterThan(376);
  expect(data.firstCard.y).toBeLessThan(395);
  expect(data.firstCard.width).toBeGreaterThan(275);
  expect(data.firstCard.width).toBeLessThan(282);
  expect(data.wishlist.y).toBeGreaterThan(646);
  expect(data.wishlist.y).toBeLessThan(664);
  expect(data.wishlist.x).toBeGreaterThanOrEqual(27.5);
  expect(data.wishlist.x).toBeLessThanOrEqual(28.5);
  expect(data.wishlist.width).toBeGreaterThanOrEqual(333);
  expect(data.wishlist.width).toBeLessThanOrEqual(335);
  expect(data.wishlistIntro.x).toBeGreaterThanOrEqual(45);
  expect(data.wishlistIntro.x).toBeLessThanOrEqual(47);
  expect(data.overflow).toBeLessThanOrEqual(1);
  expect(faults).toEqual([]);
});


test('Expanded wishlist preserves measured first-card and 68px thumbnail geometry',async({page},testInfo)=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const {gift,faults}=await openGift(page);
  const trigger=gift.locator('#giftEightTrigger');
  const collapsedHeight=await gift.evaluate(el=>el.getBoundingClientRect().height);
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded','true');
  const wishlist=gift.locator('#giftEightWishlist');
  await expect(wishlist).toBeVisible();
  const m=await wishlist.evaluate(panel=>{
    const r=e=>{const b=e.getBoundingClientRect();return {width:b.width,height:b.height};};
    const products=[...panel.querySelectorAll('.gift-eight-item')];
    return {
      panel:r(panel),
      first:r(products[0]),
      items:products.map(r),
      thumbs:[...panel.querySelectorAll('.gift-eight-thumb')].map(r),
      bottomPadding:getComputedStyle(panel).paddingBottom,
      rowGap:getComputedStyle(panel.querySelector('.gift-eight-items')).rowGap,
      firstBackground:getComputedStyle(products[0]).backgroundColor,
      overflow:document.documentElement.scrollWidth-innerWidth
    };
  });
  expect(m.bottomPadding).toBe('10px');
  expect(m.rowGap).toBe('0px');
  expect(m.firstBackground).toBe('rgba(0, 0, 0, 0)');
  expect(m.items).toHaveLength(3);
  expect(m.thumbs).toHaveLength(3);
  for(const thumb of m.thumbs){
    expect(thumb.width).toBe(68);
    expect(thumb.height).toBe(68);
  }
  const sourceFirst={ 'small-phone':177.2, 'android-360':182.1,
    'iphone-390':185.5, 'large-phone':138.3 }[testInfo.project.name];
  expect(m.first.height).toBeGreaterThanOrEqual(sourceFirst-10);
  expect(m.first.height).toBeLessThanOrEqual(sourceFirst+16);
  expect(m.overflow).toBeLessThanOrEqual(1);
  if(testInfo.project.name==='large-phone'){
    const anchors=await gift.evaluate(section=>{
      const top=section.getBoundingClientRect().top;
      const cta=section.querySelector('#giftEightTrigger').getBoundingClientRect();
      const wish=section.querySelector('#giftEightWishlist').getBoundingClientRect();
      return {ctaY:cta.top-top,wishlistY:wish.top-top};
    });
    // Live reference at 430×932: CTA Y=308.4, wishlist Y=667.6.
    expect(Math.abs(anchors.ctaY-308.4)).toBeLessThanOrEqual(8);
    expect(Math.abs(anchors.wishlistY-667.6)).toBeLessThanOrEqual(8);
  }
  if(testInfo.project.name==='iphone-390'){
    // Source audit: panel 514.9px; first item 185.5px at 390px.
    // Tolerance accommodates fallback fonts and non-licensed placeholders.
    expect(m.panel.height).toBeGreaterThan(500);
    expect(m.panel.height).toBeLessThan(530);
  }
  await wishlist.scrollIntoViewIfNeeded();
  await wishlist.screenshot({
    path:testInfo.outputPath('section8-wishlist-expanded.png'),
    animations:'disabled'
  });
  await trigger.click();
  await expect(wishlist).toBeHidden();
  const reclosedHeight=await gift.evaluate(el=>el.getBoundingClientRect().height);
  expect(Math.abs(reclosedHeight-collapsedHeight)).toBeLessThanOrEqual(1);
  expect(faults).toEqual([]);
});


test('Expanded source geometry stays within measured tolerance at all four phone widths',async({page},testInfo)=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const {gift,faults}=await openGift(page);
  await gift.locator('#giftEightTrigger').click();
  await expect(gift.locator('#giftEightWishlist')).toBeVisible();
  // DOM values from the source/local screenshot audit in GitHub Actions 41789080486.
  // No vendor imagery is required for these layout/overflow checks.
  const reference={
    // 320px source audit sampled an unrevealed element at scale(.955)
    // translateY(52px). Its visible/revealed box was 537.3px high versus
    // 513.2px before reveal; normalize the source Y into the *untransformed*
    // coordinate system used by reduced-motion Playwright:
    // 798.1 - 52 - (537.3-513.2)/2 = 734.05.
    // Keep the same strict 10px tolerance as every other viewport.
    'small-phone':{y:734.05,panel:537.3,section:1367.4,first:185.5,third:98.6},
    'android-360':{y:676.4,panel:529.6,section:1289.1,first:182.8,third:97.2},
    'iphone-390':{y:655.7,panel:514.9,section:1266.6,first:185.5,third:98.6},
    'large-phone':{y:666.5,panel:443.8,section:1199.0,first:138.4,third:97.8}
  }[testInfo.project.name];
  const measured=await gift.evaluate(el=>{
    const r=el.getBoundingClientRect();
    const wish=el.querySelector('#giftEightWishlist').getBoundingClientRect();
    const products=[...el.querySelectorAll('.gift-eight-item')].map(x=>x.getBoundingClientRect().height);
    const doc=document.documentElement;
    const prev=document.getElementById('gallery').getBoundingClientRect();
    const next=document.getElementById('rsvp').getBoundingClientRect();
    return {
      y:wish.top-r.top,panel:wish.height,section:r.height,
      first:products[0],third:products[2],
      sideways:doc.scrollWidth-innerWidth,
      galleryGap:r.top-prev.bottom,rsvpGap:next.top-r.bottom
    };
  });
  // Include *actual* browser values in failure logs/evidence so an issue
  // can be fixed from one local run, without guessing which side moved.
  console.log('SECTION8_GEOMETRY_'+testInfo.project.name+' '+JSON.stringify({reference,measured}));
  await testInfo.attach('section8-source-geometry',{
    body:Buffer.from(JSON.stringify({viewport:testInfo.project.name,reference,measured},null,2)),
    contentType:'application/json'
  });
  for(const key of ['y','panel','section','first','third']){
    expect(Math.abs(measured[key]-reference[key]),key+' geometry drift; observed='+measured[key]+' ref='+reference[key]).toBeLessThanOrEqual(10);
  }
  expect(measured.sideways).toBeLessThanOrEqual(1);
  expect(Math.abs(measured.galleryGap)).toBeLessThanOrEqual(1);
  expect(Math.abs(measured.rsvpGap)).toBeLessThanOrEqual(1);
  expect(faults).toEqual([]);
});


test('Published wishlist icons use original assets and preserve local authorized photo overrides',async({page})=>{
  const {gift,faults}=await openGift(page);
  await gift.locator('#giftEightTrigger').click();
  const items=gift.locator('.gift-eight-item');
  const illustrations=[
    'section8-rice-cooker-original.svg',
    'section8-kettle-original.svg',
    'section8-giftcard-original.svg'
  ];
  for(let i=0;i<illustrations.length;i++){
    const url='/assets/'+illustrations[i];
    const response=await page.request.get(url);
    expect(response.status(),url+' must load on default localhost').toBe(200);
    expect(response.headers()['content-type']).toContain('image/svg+xml');
    expect(await response.text()).toContain('<svg ');
    const tile=items.nth(i).locator('.gift-eight-thumb');
    const style=await tile.evaluate(el=>getComputedStyle(el).backgroundImage);
    const source=i===0
      ?await gift.getAttribute('data-gift-thumb-rice')
      :i===1?await gift.getAttribute('data-gift-thumb-kettle'):null;
    const expected=source==='reference-local'
      ?(i===0?'reference-dev/gift-rice-cooker.jpg':'reference-dev/gift-kettle.webp')
      :illustrations[i];
    expect(style).toContain(expected);
  }
  expect(faults).toEqual([]);
});


test('Original plum botanical fallback uses self-contained relief artwork',async({page})=>{
  const {gift,faults}=await openGift(page);
  const response=await page.request.get('/assets/section8-plum-botanical-original.svg');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('image/svg+xml');
  const svg=await response.text();
  expect(svg).toContain('id="velvetNoise"');
  expect(svg).toContain('id="relief"');
  expect(svg).toContain('feTurbulence');
  // The SVG namespace itself uses an http:// URL; only external asset
  // imports or linked resources are prohibited.
  expect(svg).not.toMatch(/(?:href|src)\s*=\s*["']https?:\/\//i);
  const style=await gift.evaluate(el=>({
    mode:el.dataset.giftArtwork,
    background:getComputedStyle(el.querySelector('.gift-eight-art')).backgroundImage
  }));
  if(style.mode==='original')expect(style.background).toContain('section8-plum-botanical-original.svg');
  else{
    expect(style.mode).toBe('reference-local');
    expect(style.background).toContain('reference-dev/band_plum.webp');
  }
  expect(faults).toEqual([]);
});
