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
      galleryColor:getComputedStyle(gallery).backgroundColor,
      galleryBackgroundImage:getComputedStyle(gallery).backgroundImage,
      rsvpNum:rsvp.dataset.section};
  });
  expect(m.prevNext).toBe(true);expect(m.nextPrev).toBe(true);
  expect(Math.abs(m.boundary1)).toBeLessThanOrEqual(1);
  expect(Math.abs(m.boundary2)).toBeLessThanOrEqual(1);
  expect(m.overflow).toBeLessThanOrEqual(1);
  expect(m.sectionWidth).toBe(m.viewport);
  expect(m.color).toBe('rgb(92, 38, 79)');
  // Gallery styling belongs to the current main branch, not the Section 8 worker.
  expect(m.galleryBackgroundImage).toContain('gradient');
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
      butterflyWidth:butterfly.getBoundingClientRect().width,
      butterflyTop:butterfly.getBoundingClientRect().top-el.getBoundingClientRect().top,
      overflow:document.documentElement.scrollWidth-innerWidth
    };
  });
  expect(visual.backdrop).toContain('reference-dev/band_plum.webp');
  expect(visual.wing).toContain('reference-dev/bfly_blush.webp');
  expect(visual.butterflyVisibility).toBe('visible');
  expect(visual.butterflyOpacity).toBeGreaterThan(.8);
  expect(visual.butterflyWidth).toBeGreaterThanOrEqual(25);
  expect(visual.butterflyWidth).toBeLessThanOrEqual(40);
  expect(visual.butterflyTop).toBeLessThan(70);
  expect(visual.overflow).toBeLessThanOrEqual(1);
  expect(faults).toEqual([]);
});

test('Missing private butterfly remains invisible without fetching vendor URLs',async({page})=>{
  const requested=[];
  page.on('request',req=>{
    if(/bfly_blush|band_plum/i.test(req.url()))requested.push(req.url());
  });
  const {gift}=await openGift(page);
  const value=await gift.evaluate(el=>({
    status:el.dataset.giftButterfly,
    visibility:getComputedStyle(el.querySelector('.gift-eight-butterfly')).visibility,
    background:getComputedStyle(el.querySelector('.gift-eight-bfly-left')).backgroundImage
  }));
  expect(['unavailable','reference-local']).toContain(value.status);
  if(value.status==='unavailable'){
    expect(value.visibility).toBe('hidden');
    expect(value.background).toBe('none');
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
