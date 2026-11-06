import {test, expect} from '@playwright/test';

// Mobile thermal regression: expensive cameras should not repaint while their
// section is distant. Existing four-phone projects run this in CI.
test('offscreen Events camera does not mutate during closing-section scroll', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button',{name:'Open Invitation',exact:true}).click();
  await page.evaluate(() => {
    const events = document.getElementById('eventDetails');
    scrollTo({top:events.getBoundingClientRect().top + scrollY + 80,behavior:'instant'});
  });
  await expect.poll(() => page.locator('#eventDetails').evaluate(el =>
    el.style.getPropertyValue('--event-stage-y'))).not.toBe('');

  // Move far away and let observers finish releasing assets before measuring.
  await page.evaluate(() => {
    const closing = document.getElementById('closingMessage');
    scrollTo({top:closing.getBoundingClientRect().top + scrollY + 30,behavior:'instant'});
  });
  await expect(page.locator('#eventDetails')).toHaveAttribute('data-asset-lifecycle','released');
  await page.waitForTimeout(100);
  await page.evaluate(() => {
    const events = document.getElementById('eventDetails');
    window.__eventOffscreenMutations = 0;
    window.__eventOffscreenObserver = new MutationObserver(records => {
      window.__eventOffscreenMutations += records.length;
    });
    window.__eventOffscreenObserver.observe(events,{
      attributes:true, attributeFilter:['style','data-event-camera','data-event-paper-shift']
    });
  });

  await page.evaluate(async () => {
    const closing = document.getElementById('closingMessage');
    const base = closing.getBoundingClientRect().top + scrollY;
    for (const delta of [45,100,160,225,305,185,90]) {
      scrollTo({top:base + delta,behavior:'instant'});
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    await new Promise(resolve => requestAnimationFrame(resolve));
  });
  const offscreenMutations = await page.evaluate(() => {
    window.__eventOffscreenObserver.disconnect();
    return window.__eventOffscreenMutations;
  });
  expect(offscreenMutations).toBe(0);

  // Returning through the Events section must still initialize its camera.
  await page.evaluate(() => {
    const events = document.getElementById('eventDetails');
    scrollTo({top:events.getBoundingClientRect().top + scrollY + 160,behavior:'instant'});
  });
  await expect.poll(() => page.locator('#eventDetails').evaluate(el =>
    el.dataset.eventCamera)).toMatch(/^-?\d+\.\d{2}$/);
  expect(errors).toEqual([]);
});

test('mobile artwork hysteresis scales with phone viewport',async({page})=>{
  await page.addInitScript(() => {
    const NativeObserver = window.IntersectionObserver;
    window.__artworkMargins = [];
    window.IntersectionObserver = class extends NativeObserver {
      constructor(callback, options = {}) {
        if (options.rootMargin) window.__artworkMargins.push(options.rootMargin);
        super(callback, options);
      }
    };
  });
  await page.goto('/');
  const {margins,height} = await page.evaluate(() => ({
    margins:window.__artworkMargins,
    height:window.innerHeight
  }));
  const near=Math.max(1000,Math.min(1700,Math.round(height*1.5)));
  const retain=Math.max(near+650,Math.min(3100,Math.round(height*2.75)));
  expect(margins).toContain(`${near}px 0px ${near}px 0px`);
  expect(margins).toContain(`${retain}px 0px ${retain}px 0px`);
});
