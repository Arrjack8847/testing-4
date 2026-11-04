import {test,expect} from '@playwright/test';
// Protect the merged Gallery, Section 9 RSVP API and Section 10 from Section 8 integration.
test('new Section 8 replaces placeholder while preserving Gallery, RSVP and closing',async({page})=>{
  // The global scene's parallax and reveal animation can keep an offscreen
  // button moving during an automatic scroll on taller phone viewports.
  // Verify click semantics with motion disabled; motion has separate tests.
  await page.emulateMedia({reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  const gift=page.locator('#weddingGift');
  await expect(gift).toHaveClass(/gift-eight/);
  await expect(gift).toHaveAttribute('data-section','8');
  await expect(page.locator('#gallery')).toHaveAttribute('data-section','7');
  await expect(page.locator('#rsvp')).toHaveAttribute('data-section','9');
  await expect(page.locator('#closingMessage')).toHaveAttribute('data-section','10');
  await expect(page.locator('#gallery .gallery-scene-backdrop')).toHaveCount(1);
  await expect(page.locator('#s9RsvpForm')).toHaveCount(1);
  await expect(page.locator('#rsvpForm')).toHaveCount(0);
  await expect(page.locator('#weddingGift .ref-gift-card')).toHaveCount(0);
  const siblings=await page.locator('#weddingGift').evaluate(g=>({
    gallery:g.previousElementSibling?.id,
    next:g.nextElementSibling?.id,
    afterNext:g.nextElementSibling?.nextElementSibling?.id,
    gapBefore:g.getBoundingClientRect().top-g.previousElementSibling.getBoundingClientRect().bottom,
    gapAfter:g.nextElementSibling.getBoundingClientRect().top-g.getBoundingClientRect().bottom,
    overflow:document.documentElement.scrollWidth-innerWidth
  }));
  expect(siblings.gallery).toBe('gallery');
  expect(siblings.next).toBe('rsvp');
  expect(siblings.afterNext).toBe('closingMessage');
  expect(Math.abs(siblings.gapBefore)).toBeLessThanOrEqual(1);
  expect(Math.abs(siblings.gapAfter)).toBeLessThanOrEqual(1);
  expect(siblings.overflow).toBeLessThanOrEqual(1);
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(gift).toHaveAttribute('aria-hidden','false');
  const btn=gift.getByRole('button',{name:/Send Gift/});
  await expect(btn).toHaveAttribute('aria-expanded','false');
  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    document.getElementById('weddingGift').scrollIntoView({behavior:'instant',block:'start'});
  });
  await expect(btn).toBeInViewport();
  await btn.click();
  await expect(btn).toHaveAttribute('aria-expanded','true');
  await expect(gift.locator('#giftEightBanks')).toBeVisible();
  await expect(gift.locator('#giftEightWishlist')).toBeVisible();
  await expect(page.locator('#s9RsvpForm')).toHaveCount(1);
  expect(errors).toEqual([]);
});
