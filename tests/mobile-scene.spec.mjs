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
  await expect(page.locator('#invitation')).toHaveAttribute('data-swiped','yes');
  await expect(page.locator('#invitation')).toHaveAttribute('data-reading','no');
  await expect(page.locator('.opened-copy')).toHaveCSS('opacity','0');
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


test('ambient petals, birds and waterfall geometry remain lightweight', async ({ page }) => {
  const runtimeErrors = [];
  page.on('pageerror', err => runtimeErrors.push(err.message));
  await page.goto('/');
  await waitForArt(page);
  await expect(page.locator('#petalCanvas')).toBeAttached();
  await expect(page.locator('.sky-birds > span')).toHaveCount(2);
  await expect(page.locator('.waterfalls > .waterfall')).toHaveCount(2);
  const detail = await page.evaluate(() => {
    const canvas = document.querySelector('#petalCanvas');
    const rect = canvas.getBoundingClientRect();
    const waterfalls = [...document.querySelectorAll('.waterfall')].map(el => ({
      top:el.style.top,left:el.style.left,height:el.style.height,width:el.style.width,
      children:el.children.length
    }));
    return {
      canvasSize:[rect.width,rect.height],
      canvasPixels:[canvas.width,canvas.height],
      artLoaded:document.querySelector('.depth.palace img').naturalWidth,
      waterfalls
    };
  });
  expect(detail.canvasSize[0]).toBeCloseTo(await page.evaluate(() => innerWidth),0);
  expect(detail.canvasSize[1]).toBeCloseTo(await page.evaluate(() => innerHeight),0);
  expect(detail.canvasPixels[0]).toBeGreaterThan(0);
  expect(detail.artLoaded).toBe(1920);
  expect(detail.waterfalls).toEqual([
    {left:'16%',top:'64%',width:'10%',height:'11.5%',children:3},
    {left:'65.5%',top:'64%',width:'12%',height:'11.5%',children:3}
  ]);
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(page.locator('.depth.palace .waterfalls')).toHaveCSS('scale','0.99', {timeout:3000});
  expect(runtimeErrors).toEqual([]);
});

test('reduce motion preference hides decorative particles but keeps interactions', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await waitForArt(page);
  await expect(page.locator('#petalCanvas')).toBeHidden();
  await expect(page.locator('.sky-birds')).toBeHidden();
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(page.locator('#invitation')).toHaveAttribute('data-state','opened');
  await expect(page.locator('#opened')).not.toHaveAttribute('inert');
});


test('paired-wing butterflies fly only in the appropriate scene state', async ({page}) => {
  const errors=[];
  page.on('pageerror', error=>errors.push(error.message));
  await page.goto('/');
  await waitForArt(page);
  const cover=page.locator('.butterfly-cover');
  const hero=page.locator('.butterfly-hero');
  await expect(cover.locator('.butterfly')).toHaveCount(2);
  await expect(hero.locator('.butterfly')).toHaveCount(2);
  await expect(page.locator('.butterfly-wing')).toHaveCount(8);
  await expect(cover).toHaveCSS('opacity','1');
  await expect(hero).toHaveCSS('visibility','hidden');
  const butterflies=await cover.locator('.butterfly').evaluateAll(nodes=>nodes.map(el=>({
    size:[getComputedStyle(el).width,getComputedStyle(el).height],
    source:getComputedStyle(el.querySelector('.butterfly-wing')).backgroundImage,
    animation:getComputedStyle(el).animationName
  })));
  expect(butterflies[0].size).toEqual(['52px','41px']);
  expect(butterflies[1].size).toEqual(['44px','34px']);
  expect(butterflies[0].source).toContain('serambi-ungu/bfly_1.webp');
  expect(butterflies[1].source).toContain('anggerik-nirmala/bfly_white.webp');
  expect(butterflies[0].animation).toContain('bf-violet-cover');
  expect(butterflies[1].animation).toContain('bf-ivory-cover');
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(cover).toHaveCSS('visibility','hidden');
  await expect(hero).toHaveCSS('visibility','hidden');
  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    window.scrollTo({top:Math.floor(innerHeight*1.85),behavior:'instant'});
  });
  await expect(page.locator('#invitation')).toHaveAttribute('data-reading','yes');
  await expect(hero).toHaveCSS('visibility','visible');
  expect(errors).toEqual([]);
});

test('reduced-motion hides decorative butterflies', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await waitForArt(page);
  await expect(page.locator('.butterfly-cover')).toBeHidden();
  await expect(page.locator('.butterfly-hero')).toBeHidden();
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(page.locator('#invitation')).toHaveAttribute('data-state','opened');
});


test('lake stays pinned while scrolling through the mobile opening section',async({page})=>{
  await page.goto('/');
  await waitForArt(page);
  await page.getByRole('button',{name:'Open Invitation'}).click();
  const first=await page.locator('#viewport').boundingBox();
  expect(first).not.toBeNull();
  expect(first.y).toBeCloseTo(0,0);
  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    window.scrollTo({top:Math.round(innerHeight*.9),behavior:'instant'});
  });
  await expect.poll(async()=>page.evaluate(()=>scrollY)).toBeGreaterThan(0);
  await expect.poll(async()=>page.evaluate(()=>{
    const box=document.querySelector('#viewport').getBoundingClientRect();
    return Math.round(box.y);
  })).toBe(0);
  await expect(page.locator('#invitation')).toHaveAttribute('data-swiped','yes');
  await expect(page.locator('#invitation')).toHaveAttribute('data-reading','no');
  const bounds=await page.locator('.opened-copy').boundingBox();
  const height=await page.evaluate(()=>innerHeight);
  expect(bounds.y).toBeGreaterThan(-1);
  expect(bounds.y).toBeLessThan(height);
  const nextStart=await page.locator('#message').boundingBox();
  expect(nextStart.y).toBeGreaterThanOrEqual(height);
  await page.evaluate(()=>window.scrollTo({top:Math.round(innerHeight*3.45),behavior:'instant'}));
  await expect.poll(async()=>page.evaluate(()=>{
    const box=document.querySelector('#viewport').getBoundingClientRect();
    return Math.round(box.y);
  })).toBeLessThan(0);
  await expect.poll(async()=>page.evaluate(()=>{
    const box=document.querySelector('#message').getBoundingClientRect();
    return box.y;
  })).toBeLessThan(height);
});


test('garden returns before wedding text during the pinned scroll',async({page})=>{
  await page.goto('/');
  await waitForArt(page);
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(page.locator('.opened-copy')).toHaveCSS('opacity','0');
  const visit=async fraction=>{
    await page.evaluate(frac=>{
      document.documentElement.style.scrollBehavior='auto';
      scrollTo({top:Math.round(innerHeight*frac),behavior:'instant'});
    },fraction);
    await expect.poll(async()=>page.evaluate(()=>{
      return Number((scrollY/innerHeight).toFixed(2));
    })).toBeCloseTo(fraction,1);
  };
  await visit(.45);
  await expect(page.locator('#invitation')).toHaveAttribute('data-swiped','yes');
  await expect(page.locator('.opened-copy')).toHaveCSS('opacity','0');
  await expect.poll(async()=>page.evaluate(()=>
    document.documentElement.style.getPropertyValue('--frame-scroll-opacity')
  )).toBe('0.0000');
  await visit(1.15);
  await expect.poll(async()=>page.evaluate(()=>
    parseFloat(document.documentElement.style.getPropertyValue('--frame-scroll-opacity'))
  )).toBeGreaterThan(.1);
  await expect(page.locator('.opened-copy')).toHaveCSS('opacity','0');
  await visit(1.50);
  await expect(page.locator('#invitation')).toHaveAttribute('data-reading','yes');
  await expect.poll(async()=>page.evaluate(()=>
    parseFloat(getComputedStyle(document.querySelector('.opened-copy')).opacity)
  )).toBeGreaterThan(.25);
  await expect(page.locator('.opened-copy h2')).toHaveCSS('opacity','0');
  await visit(2.20);
  await expect(page.locator('.opened-copy')).toHaveCSS('opacity','1');
  await expect(page.locator('.opened-copy h2')).toHaveCSS('opacity','1');
  await expect.poll(async()=>page.evaluate(()=>
    Math.round(document.querySelector('#viewport').getBoundingClientRect().top)
  )).toBe(0);
  await expect.poll(async()=>page.evaluate(()=>
    document.documentElement.style.getPropertyValue('--stage-parallax').trim()
  )).toBe('0px');
  // The reference scrolls the typography upward after 2H but leaves
  // the garden pinned behind it.
  await visit(2.5);
  const viewportHeight=await page.evaluate(()=>innerHeight);
  // Scroll listeners commit their CSS variables on the next animation frame.
  // Poll instead of sampling a value from the previous scroll checkpoint.
  await expect.poll(async()=>page.evaluate(()=>Number.parseFloat(
    document.documentElement.style.getPropertyValue('--text-scroll-shift')
  ))).toBeCloseTo(-.5*viewportHeight,0);
  await expect.poll(async()=>page.evaluate(()=>
    Math.round(document.querySelector('#viewport').getBoundingClientRect().top)
  )).toBe(0);
});

test('swipe cue reveals greeting instead of skipping the sticky lake',async({page})=>{
  await page.goto('/');
  await waitForArt(page);
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await page.getByRole('link',{name:'Swipe up for wedding message'}).click();
  await expect.poll(async()=>page.evaluate(()=>window.scrollY)).toBeGreaterThan(100);
  await expect.poll(async()=>page.evaluate(()=>document.querySelector('#invitation').dataset.reading)).toBe('yes');
  await expect.poll(async()=>page.evaluate(()=>window.scrollY / innerHeight)).toBeLessThan(1.75);
  await expect.poll(async()=>page.evaluate(()=>Math.round(
    document.querySelector('#viewport').getBoundingClientRect().top
  ))).toBe(0);
  await expect.poll(async()=>page.evaluate(()=>document.querySelector('#message').getBoundingClientRect().top))
    .toBeGreaterThan(await page.evaluate(()=>innerHeight));
});
