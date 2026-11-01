import {test, expect} from '@playwright/test';

test('second section replaces the preview and becomes readable after opening', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const letter = page.locator('#message');
  await expect(letter).toHaveAttribute('data-section', '2');
  await expect(letter).toBeHidden();
  await page.getByRole('button', {name:'Open Invitation'}).click();
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, Math.round(innerHeight * 4.08));
  });
  await expect.poll(() => page.evaluate(() => window.scrollY / innerHeight)).toBeGreaterThan(3.9);
  await expect(letter).toHaveClass(/is-visible/);
  await expect(page.getByRole('heading', {name:'We joyfully invite you'})).toBeVisible();
  await expect(letter.locator('.letter-names')).toContainText('Rayyan');
  await expect(letter.locator('.letter-names')).toContainText('Sofea');
  await expect(letter.locator('.letter-bismillah')).toHaveAttribute('lang','ar');
  expect(errors).toEqual([]);
});

test('second section fits narrow phones and uses no external artwork', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button', {name:'Open Invitation'}).click();
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, Math.round(innerHeight * 4.1));
  });
  await expect(page.locator('#message')).toBeVisible();
  const size = await page.evaluate(() => ({
    page:document.documentElement.scrollWidth,
    viewport:innerWidth,
    frame:document.querySelector('#message .letter-page').getBoundingClientRect().width
  }));
  expect(size.page).toBeLessThanOrEqual(size.viewport+1);
  expect(size.frame).toBeLessThanOrEqual(size.viewport);
  await expect(page.locator('#message img')).toHaveCount(0);
  await expect(page.locator('#message [aria-hidden="true"]').first()).toBeAttached();
});

test('reduced motion keeps all second-section text visible without transitions', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await page.getByRole('button', {name:'Open Invitation'}).click();
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, Math.round(innerHeight * 4.1));
  });
  const text = page.locator('#message .letter-heading');
  await expect(text).toBeVisible();
  const style = await text.evaluate(el => ({opacity:getComputedStyle(el).opacity,
    transform:getComputedStyle(el).transform}));
  expect(style.opacity).toBe('1');
  expect(style.transform).toBe('none');
});


test('Section 2 visual QA captures card at each mobile breakpoint', async ({page}, testInfo) => {
  await page.goto('/');
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior='auto';
    window.scrollTo(0, Math.round(innerHeight * 4.12));
  });
  const letter = page.locator('#message');
  await expect(letter).toHaveClass(/is-visible/);
  const layout = await letter.evaluate(el => {
    const frame=el.querySelector('.letter-page');
    const rect=frame.getBoundingClientRect();
    const screen=window.innerWidth;
    const text=Array.from(el.querySelectorAll('.letter-content *'))
      .filter(node=>node.children.length===0 && node.textContent.trim())
      .map(node=>({text:node.textContent.trim().slice(0,40),
        right:node.getBoundingClientRect().right,
        left:node.getBoundingClientRect().left}));
    return {screen,frameWidth:rect.width,frameLeft:rect.left,
      frameRight:rect.right,overflow:document.documentElement.scrollWidth-screen,
      outside:text.filter(x=>x.left < -1 || x.right > screen+1)};
  });
  expect(layout.frameLeft).toBeGreaterThanOrEqual(-1);
  expect(layout.frameRight).toBeLessThanOrEqual(layout.screen+1);
  expect(layout.overflow).toBeLessThanOrEqual(1);
  expect(layout.outside).toEqual([]);
  await page.screenshot({path:testInfo.outputPath('section-two-mobile-viewport.png'),
    animations:'disabled'});
  await letter.screenshot({path:testInfo.outputPath('section-two-full-letter.png'),
    animations:'disabled'});
});
