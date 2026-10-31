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
    const button = document.querySelector('#openButton').getBoundingClientRect();
    const sprites = document.querySelectorAll('.sprite');
    const peacocks = document.querySelectorAll('.sprite.peacock-sprite');
    return {
      stage: {x:stage.x, y:stage.y, width:stage.width, height:stage.height},
      trees, master: [master.naturalWidth,master.naturalHeight],
      button: { x:button.x,y:button.y,width:button.width,height:button.height },
      spriteCount:sprites.length,peacockCount:peacocks.length,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight
    };
  });
  expect(geometry.master).toEqual([1080,1920]);
  expect(geometry.trees).toHaveLength(2);
  for (const tree of geometry.trees) {
    expect([tree.naturalWidth, tree.naturalHeight]).toEqual([1080,1920]);
    expect(tree.width).toBeCloseTo(geometry.stage.width * .7,0);
    expect(tree.height).toBeCloseTo(geometry.innerHeight * .7,0);
    expect(tree.y).toBeCloseTo(geometry.innerHeight * .26,0);
  }
  expect(geometry.spriteCount).toBe(28);
  expect(geometry.peacockCount).toBe(2);
  if (geometry.innerWidth === 390) {
    expect(geometry.stage.width).toBeCloseTo(474.75,0);
    expect(geometry.stage.x).toBeCloseTo(-42.375,0);
    expect(geometry.trees[0].x).toBeGreaterThan(-170);
    expect(geometry.trees[0].x).toBeLessThan(-140);
    expect(geometry.trees[1].x).toBeGreaterThan(245);
    expect(geometry.trees[1].x).toBeLessThan(280);
    expect(geometry.button.x).toBeCloseTo(84.7,0);
    expect(geometry.button.y).toBeCloseTo(422.2,0);
    expect(geometry.button.width).toBeCloseTo(220.6,0);
    expect(geometry.button.height).toBeCloseTo(49.1,0);
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
  await expect(page.locator('#invitation')).toHaveAttribute('data-reading','no');
  await expect(page.locator('.opened-copy')).toHaveCSS('opacity','0');
  await expect.poll(async () => page.evaluate(() => document.documentElement.style.overflowY)).toBe('auto');
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo({top: Math.floor(window.innerHeight * .65), behavior: 'instant'});
  });
  await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await expect(page.locator('#invitation')).toHaveAttribute('data-reading','yes');
  await expect(page.locator('.opened-copy')).toHaveCSS('opacity','1');
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
