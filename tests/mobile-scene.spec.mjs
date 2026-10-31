import { test, expect } from '@playwright/test';

async function waitForArt(page) {
  await expect.poll(async () =>
    await page.locator('#invitation').getAttribute('data-layers'), { timeout: 30_000 }
  ).toBe('ready');
}

test('mobile artwork geometry matches full transparent canvas dimensions', async ({ page }) => {
  const runtimeErrors = [];
  page.on('pageerror', err => runtimeErrors.push(err.message));
  await page.goto('/');
  await waitForArt(page);
  const geometry = await page.evaluate(() => {
    const stage = document.querySelector('#stage').getBoundingClientRect();
    const trees = [...document.querySelectorAll('.depth.tree')].map(node => {
      const bounds = node.getBoundingClientRect();
      const image = node.querySelector('img');
      return { x: bounds.x, y:bounds.y, width: bounds.width, height: bounds.height,
        naturalWidth:image.naturalWidth, naturalHeight:image.naturalHeight };
    });
    const master = document.querySelector('#masterArt');
    return {
      stage: {x:stage.x, y:stage.y, width:stage.width, height:stage.height},
      trees, master: [master.naturalWidth,master.naturalHeight],
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth
    };
  });
  expect(geometry.master).toEqual([1080,1920]);
  expect(geometry.trees).toHaveLength(2);
  for (const tree of geometry.trees) {
    expect([tree.naturalWidth, tree.naturalHeight]).toEqual([1080,1920]);
    expect(tree.width).toBeCloseTo(geometry.stage.width,0);
    expect(tree.height).toBeCloseTo(geometry.stage.height,0);
    expect(tree.x).toBeCloseTo(geometry.stage.x,0);
    expect(tree.y).toBeCloseTo(geometry.stage.y,0);
  }
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.innerWidth + 1);
  expect(runtimeErrors).toEqual([]);
});

test('cover opens and enables vertical invitation scrolling', async ({ page }) => {
  await page.goto('/');
  await waitForArt(page);
  await expect(page.locator('#invitation')).toHaveAttribute('data-state','cover');
  await expect(page.locator('#openButton')).toBeVisible();
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(page.locator('#invitation')).toHaveAttribute('data-state','opened');
  await expect(page.locator('#opened')).not.toHaveAttribute('inert');
  await expect(page.locator('#cover')).toHaveAttribute('inert','');
  await expect.poll(async () => page.evaluate(() => document.documentElement.style.overflowY)).toBe('auto');
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo({top: Math.floor(window.innerHeight * .65), behavior: 'instant'});
  });
  await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});

test('developer alignment controls and reset work after scrolling', async ({ page }) => {
  await page.goto('/?debug=1');
  await waitForArt(page);
  const view = page.locator('#compareMode');
  await view.selectOption('master');
  await expect(page.locator('#invitation')).toHaveAttribute('data-compare','master');
  await view.selectOption('layers');
  await expect(page.locator('#invitation')).toHaveAttribute('data-compare','layers');
  await view.selectOption('blend');
  await expect(page.locator('#blendControl')).toBeVisible();
  await page.locator('#blendSlider').fill('70');
  await expect(page.locator('#blendValue')).toHaveText('70%');
  await view.selectOption('normal');
  await page.locator('#debugOpen').click();
  await expect(page.locator('#invitation')).toHaveAttribute('data-state','opened');
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo({top: Math.floor(window.innerHeight * .65), behavior:'instant'});
  });
  await expect.poll(async () => page.evaluate(() => Number(window.scrollY))).toBeGreaterThan(0);
  await page.waitForTimeout(200);
  await page.locator('#resetButton').click();
  await expect(page.locator('#invitation')).toHaveAttribute('data-state','cover');
  await expect.poll(async () =>
    page.evaluate(() => window.scrollY)).toBe(0);
  await expect.poll(async () =>
    page.evaluate(() => document.documentElement.style.getPropertyValue('--stage-parallax').trim())).toBe('0px');
  await expect(page.locator('#opened')).toHaveAttribute('inert','');
});
