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
      rsvpNum:rsvp.dataset.section};
  });
  expect(m.prevNext).toBe(true);expect(m.nextPrev).toBe(true);
  expect(Math.abs(m.boundary1)).toBeLessThanOrEqual(1);
  expect(Math.abs(m.boundary2)).toBeLessThanOrEqual(1);
  expect(m.overflow).toBeLessThanOrEqual(1);
  expect(m.sectionWidth).toBe(m.viewport);
  expect(m.color).toBe('rgb(92, 38, 79)');
  expect(m.galleryColor).toBe('rgb(250, 247, 251)');
  expect(m.paddingLeft).toBe('28px');
  expect(m.paddingTop).toBe('96px');expect(m.paddingBottom).toBe('96px');
  expect(m.rsvpNum).toBe('9');
  await gift.screenshot({path:testInfo.outputPath('gift-390-reference-needed.png'),animations:'disabled'});
  expect(faults).toEqual([]);
});

test('Section 8 uses the actual source content order without unsafe fake transactions',async({page})=>{
  const {gift,faults}=await openGift(page);
  await expect(gift.getByRole('heading',{name:'Wedding Gift'})).toBeVisible();
  await expect(gift.getByRole('heading',{name:'Send Gift'})).toBeVisible();
  await expect(gift.getByRole('heading',{name:'Gift Wishlist'})).toBeVisible();
  await expect(gift.locator('.gift-eight-bank')).toHaveCount(2);
  await expect(gift.locator('.gift-eight-bank-name')).toHaveText(['Maybank','CIMB']);
  await expect(gift.locator('.gift-eight-item')).toHaveCount(3);
  await expect(gift.locator('.gift-eight-item h4')).toHaveText([
    'Philips Avance Collection Rice Cooker HD3175/62',
    'Philips 1.7L Kettle 1000 Series HD9314',
    'IKEA Gift Card'
  ]);
  for(const button of await gift.locator('.gift-eight-copy').all()) await expect(button).toBeDisabled();
  expect(await gift.locator('button:not(:disabled)').count()).toBe(0);
  expect(await gift.locator('a[href]').count()).toBe(0);
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
    expect(values.backdrop).not.toContain('http');
  }
});

test('Reveals in each viewport and resets when scrolled away',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  const {gift}=await openGift(page);
  await expect(gift).toHaveAttribute('data-gift-reveal-ready','true');
  const heading=gift.locator('.gift-eight-heading');
  await expect(heading).toHaveClass(/in/);
  const pos=await gift.evaluate(el=>el.getBoundingClientRect().top+scrollY);
  await page.evaluate(y=>scrollTo({top:Math.max(0,y-innerHeight*2),behavior:'instant'}),pos);
  await expect(heading).not.toHaveClass(/in/);
  await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),pos);
  await expect(heading).toHaveClass(/in/);
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
