import { test, expect } from '@playwright/test';

// Runs in the project's four mobile viewport profiles. The guest must never
// bypass Open Invitation by repeatedly flinging the unopened mobile cover.
test('phone cover resists continuous wheel gestures until tapped', async ({page, browserName}) => {
  await page.goto('/');
  const invite = page.locator('#invitation');
  await expect(invite).toHaveAttribute('data-state', 'cover');
  await expect(page.locator('html')).toHaveClass(/invitation-cover-locked/);
  expect(await page.evaluate(() => getComputedStyle(document.body).position)).toBe('fixed');

  const viewport = page.viewportSize();
  await page.mouse.move(viewport.width / 2, viewport.height * .72);
  for (let swipe = 0; swipe < 6; swipe++) {
    await page.mouse.wheel(0, viewport.height * 2);
  }
  // Chromium mobile touch dispatcher checks actual gesture interception, too;
  // other engines still exercise the effective body/root CSS scroll lock.
  if (browserName === 'chromium') {
    const session = await page.context().newCDPSession(page);
    const x = Math.round(viewport.width * .5);
    for (let swipe = 0; swipe < 3; swipe++) {
      await session.send('Input.dispatchTouchEvent', {
        type:'touchStart',touchPoints:[{x,y:Math.round(viewport.height * .78)}]
      });
      for (let step = 1; step <= 6; step++) {
        await session.send('Input.dispatchTouchEvent', {
          type:'touchMove',touchPoints:[{x,y:Math.round(viewport.height * (.78 - .1 * step))}]
        });
      }
      await session.send('Input.dispatchTouchEvent', {type:'touchEnd',touchPoints:[]});
    }
    await session.detach();
  }
  await page.waitForTimeout(170);
  expect(await page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(1);
  await expect(invite).toHaveAttribute('data-state', 'cover');
  const cover = page.locator('#cover');
  await expect(cover).toBeVisible();
  expect(await page.locator('#message').evaluate(el => el.getBoundingClientRect().top))
    .toBeGreaterThan(viewport.height);

  await page.getByRole('button', {name:'Open Invitation',exact:true}).click();
  await expect(invite).toHaveAttribute('data-state', 'opened');
  await expect(page.locator('html')).not.toHaveClass(/invitation-cover-locked/);
  expect(await page.evaluate(() => getComputedStyle(document.body).position)).not.toBe('fixed');
  await page.mouse.wheel(0, viewport.height * 1.3);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(50);
});

test('all ten mobile sections remain reachable after explicit opening, including reverse scroll', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button', {name:'Open Invitation',exact:true}).click();
  const sections = [
    '#viewport','#message','#couple','#eventDetails','#runningOrder',
    '#dressCode','#gallery','#weddingGift','#rsvp','#closingMessage'
  ];
  for (const selector of sections) {
    await page.evaluate((id) => {
      const el = document.querySelector(id);
      if (!el) throw new Error('Missing section: ' + id);
      const rect = el.getBoundingClientRect();
      window.scrollTo({top: Math.max(0, rect.top + window.scrollY), behavior:'instant'});
    }, selector);
    await expect.poll(async () => page.locator(selector).evaluate(el => {
      const r = el.getBoundingClientRect();
      return r.top < innerHeight && r.bottom > 0;
    })).toBe(true);
    await expect(page.locator('#invitation')).toHaveAttribute('data-state','opened');
  }
  await page.evaluate(() => window.scrollTo({top:0,behavior:'instant'}));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(1);
  await expect(page.locator('#invitation')).toHaveAttribute('data-state','opened');
});
