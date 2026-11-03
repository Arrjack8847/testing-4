import {test,expect} from '@playwright/test';

async function openGift(page,url='/') {
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(url);
  const section=page.locator('#weddingGift');
  await expect(section).toHaveAttribute('aria-hidden','true');
  await expect(section).toHaveJSProperty('inert',true);
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(section).toHaveAttribute('aria-hidden','false');
  await expect(section).toHaveJSProperty('inert',false);
  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    document.getElementById('weddingGift').scrollIntoView({block:'start',behavior:'instant'});
  });
  await expect(section).toBeInViewport();
  return {section,errors};
}

test('source-order Gift appears between existing Gallery and RSVP without touching earlier scenes',async({page})=>{
  const {section,errors}=await openGift(page);
  await expect(section).toHaveAttribute('data-section','7');
  await expect(page.locator('#gallery')).toHaveAttribute('data-section','6');
  await expect(page.locator('#rsvp')).toHaveAttribute('data-section','8');
  const structure=await section.evaluate(el=>({
    previous:el.previousElementSibling?.id,next:el.nextElementSibling?.id,
    above:el.getBoundingClientRect().top-el.previousElementSibling.getBoundingClientRect().bottom,
    below:el.nextElementSibling.getBoundingClientRect().top-el.getBoundingClientRect().bottom
  }));
  expect(structure.previous).toBe('gallery');
  expect(structure.next).toBe('rsvp');
  expect(Math.abs(structure.above)).toBeLessThanOrEqual(1);
  expect(Math.abs(structure.below)).toBeLessThanOrEqual(1);
  await expect(section.getByRole('heading',{name:'Wedding Gift',level:2})).toBeVisible();
  await expect(section.getByRole('heading',{name:'Gift Wishlist'})).toBeVisible();
  expect(errors).toEqual([]);
});

test('Gift demo never gives real transfer details or promises booked reservations',async({page})=>{
  const {section,errors}=await openGift(page);
  const banks=section.locator('.gift-bank');
  await expect(banks).toHaveCount(2);
  await expect(banks.first()).toContainText('Maybank');
  await expect(banks.last()).toContainText('CIMB');
  await expect(section.getByRole('button',{name:'Copy Account Number'})).toHaveCount(2);
  for(const button of await section.locator('button').all())await expect(button).toBeDisabled();
  await expect(section.locator('.gift-item')).toHaveCount(3);
  await expect(section.locator('.gift-disclosure')).toContainText('not active');
  await expect(section.locator('.gift-thumb img')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('reference Gift CSS stays inside phone widths and preserves botanical seam',async({page},testInfo)=>{
  const {section,errors}=await openGift(page);
  const geometry=await section.evaluate(el=>{
    const r=el.getBoundingClientRect();
    const box=el.querySelector('.gift-content').getBoundingClientRect();
    return {width:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,
      height:r.height,left:box.left,right:box.right};
  });
  expect(geometry.height).toBeGreaterThanOrEqual(990);
  expect(geometry.overflow).toBeLessThanOrEqual(1);
  expect(geometry.left).toBeGreaterThanOrEqual(-1);
  expect(geometry.right).toBeLessThanOrEqual(geometry.width+1);
  if(testInfo.project.name==='iphone-390'){
    await section.screenshot({path:testInfo.outputPath('section5-gift-390.png'),animations:'disabled'});
  }
  expect(errors).toEqual([]);
});

test('Gift camera parallax is reversible and resets when invitation closes',async({page})=>{
  const {section}=await openGift(page);
  const start=await section.evaluate(el=>el.getBoundingClientRect().top+scrollY);
  const read=async offset=>{
    await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),start+offset);
    await page.waitForTimeout(90);
    return section.evaluate(el=>parseFloat(el.style.getPropertyValue('--gift-camera-y'))||0);
  };
  const a=await read(50), b=await read(280), c=await read(50);
  expect(Math.abs(b-a)).toBeGreaterThan(.5);
  expect(Math.abs(c-a)).toBeLessThan(.7);
  await page.evaluate(()=>document.getElementById('invitation').dataset.state='cover');
  await expect(section).toHaveJSProperty('inert',true);
  await expect(section).toHaveAttribute('aria-hidden','true');
  await expect(section).toHaveCSS('--gift-camera-y','0px');
});

test('reduced motion keeps copy and wishlist readable',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const {section}=await openGift(page);
  await expect(section.locator('.gift-script')).toBeVisible();
  const style=await section.evaluate(el=>({
    ready:el.hasAttribute('data-reveal-ready'),
    opacity:getComputedStyle(el.querySelector('.gift-script')).opacity,
    animation:getComputedStyle(el.querySelector('.gift-vine')).animationName,
    camera:el.style.getPropertyValue('--gift-camera-y')
  }));
  expect(style.ready).toBe(false);
  expect(style.opacity).toBe('1');
  expect(style.animation).toBe('none');
  expect(style.camera).toBe('0px');
});

test('reference thumbnails are explicitly opt-in rather than shipped into default page',async({page})=>{
  await page.route('**/file/3ec07fce7759a329a17cd0dc411fef2a_tn',route=>route.abort());
  await page.route('**/g/p/99683b91c2b2cfcd5ce838a7a7a0d711.jpg_200x200q80.jpg_.webp',route=>route.abort());
  const {section}=await openGift(page,'/?giftsReference=1');
  await expect(section.locator('[data-gift-thumb="0"]')).toHaveAttribute('data-image-state',/requested|unavailable/);
  await expect(section.locator('[data-gift-thumb="1"]')).toHaveAttribute('data-image-state',/requested|unavailable/);
});
