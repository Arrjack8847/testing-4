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
  await expect(page.locator('.opened-copy .eyebrow')).toHaveCSS('opacity','0');
  await expect.poll(async () => page.evaluate(() => document.documentElement.style.overflowY)).toBe('auto');
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo({top: Math.floor(window.innerHeight * .65), behavior: 'instant'});
  });
  await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await expect(page.locator('#invitation')).toHaveAttribute('data-swiped','yes');
  await expect(page.locator('#invitation')).toHaveAttribute('data-reading','no');
  await expect(page.locator('.opened-copy .eyebrow')).toHaveCSS('opacity','0');
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
  expect(butterflies[0].animation).toContain('bf-violet-garden');
  expect(butterflies[1].animation).toContain('bf-ivory-garden');
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
  await expect(page.locator('.opened-copy .eyebrow')).toHaveCSS('opacity','0');
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
  await expect(page.locator('.opened-copy .eyebrow')).toHaveCSS('opacity','0');
  await expect.poll(async()=>page.evaluate(()=>
    document.documentElement.style.getPropertyValue('--frame-scroll-opacity')
  )).toBe('0.0000');
  await visit(1.15);
  await expect.poll(async()=>page.evaluate(()=>
    parseFloat(document.documentElement.style.getPropertyValue('--frame-scroll-opacity'))
  )).toBeGreaterThan(.1);
  await expect(page.locator('.opened-copy .eyebrow')).toHaveCSS('opacity','0');
  await visit(1.50);
  await expect(page.locator('#invitation')).toHaveAttribute('data-reading','yes');
  await expect.poll(async()=>page.evaluate(()=>
    parseFloat(getComputedStyle(document.querySelector('.opened-copy .eyebrow')).opacity)
  )).toBeGreaterThan(.25);
  await expect(page.locator('#invitation')).toHaveAttribute('data-lettering','playing');
  const activeAnimation=await page.locator('.name-first').evaluate(el=>{
    const style=getComputedStyle(el);
    return {name:style.animationName,duration:style.animationDuration,delay:style.animationDelay};
  });
  expect(activeAnimation).toEqual({name:'write-ceremony-name',duration:'1.5s',delay:'0.35s'});
  await expect.poll(async()=>page.evaluate(()=>
    parseFloat(document.documentElement.style.getPropertyValue('--first-name-progress'))
  )).toBeGreaterThan(.5);
  await expect(page.locator('.ceremony-names')).toHaveCSS('opacity','1');
  await expect(page.locator('.ceremony-names .name-amp')).toHaveCSS('opacity','0');
  await visit(2.20);
  await expect(page.locator('.opened-copy .eyebrow')).toHaveCSS('opacity','1');
  await expect.poll(async()=>page.evaluate(()=>
    parseFloat(document.documentElement.style.getPropertyValue('--second-name-progress'))
  )).toBe(1);
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


test('ceremony lettering matches live 390px typography and stacked geometry',async({page})=>{
  await page.goto('/');
  await waitForArt(page);
  await page.getByRole('button',{name:'Open Invitation'}).click();
  const geometry=await page.evaluate(()=>{
    const bounds=selector=>{
      const el=document.querySelector(selector);
      const r=el.getBoundingClientRect(),s=getComputedStyle(el);
      return {x:r.x,y:r.y,w:r.width,h:r.height,font:s.fontFamily,size:s.fontSize,spacing:s.letterSpacing};
    };
    return {
      header:bounds('.opened-copy .eyebrow'),
      names:bounds('.ceremony-names'),
      first:bounds('.name-first'),
      amp:bounds('.name-amp'),
      second:bounds('.name-second')
    };
  });
  if (await page.evaluate(()=>innerWidth)===390) {
    expect(geometry.header.y).toBeCloseTo(253,0);
    expect(geometry.header.h).toBeCloseTo(36,0);
    expect(geometry.header.size).toBe('22px');
    expect(geometry.header.spacing).toBe('2.2px');
    expect(geometry.names.x).toBeCloseTo(28,0);
    expect(geometry.names.y).toBeCloseTo(289,0);
    expect(geometry.names.w).toBeCloseTo(334,0);
    expect(geometry.names.h).toBeCloseTo(174,0);
    expect(geometry.first.x).toBeCloseTo(84,0);
    expect(geometry.first.y).toBeCloseTo(269,0);
    expect(geometry.first.w).toBeCloseTo(222,0);
    expect(geometry.amp.y).toBeCloseTo(356,0);
    expect(geometry.second.y).toBeCloseTo(378,0);
    expect(geometry.names.size).toBe('60px');
  }
  expect(geometry.names.font).toContain('Pinyon Script');
  await expect(page.locator('#invitation')).toHaveAttribute('data-lettering','idle');
  await expect.poll(async()=>page.locator('.name-first').evaluate(el=>
    getComputedStyle(el).clipPath
  )).toBe('none');
  const maskBefore=await page.locator('.name-first').evaluate(el=>getComputedStyle(el).maskImage);
  expect(maskBefore).toContain('linear-gradient');
  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    scrollTo({top:innerHeight*1.5,behavior:'instant'});
  });
  await expect.poll(async()=>page.evaluate(()=>
    parseFloat(document.documentElement.style.getPropertyValue('--first-name-progress'))
  )).toBeGreaterThan(.5);
  await expect.poll(async()=>page.evaluate(()=>
    parseFloat(document.documentElement.style.getPropertyValue('--first-name-hidden'))
  )).toBeLessThan(50);
  await expect.poll(async()=>page.evaluate(()=>
    parseFloat(document.documentElement.style.getPropertyValue('--second-name-progress'))
  )).toBe(0);
  await page.evaluate(()=>scrollTo({top:innerHeight*2.2,behavior:'instant'}));
  await expect.poll(async()=>page.evaluate(()=>
    parseFloat(document.documentElement.style.getPropertyValue('--second-name-progress'))
  )).toBe(1);
  await expect.poll(async()=>page.locator('.name-second').evaluate(el=>
    getComputedStyle(el).maskPosition
  ),{timeout:7000}).toBe('0% 0px');
  await expect(page.locator('.name-first')).toHaveCSS('mask-position','0% 0px');
  await expect(page.locator('.name-amp')).toHaveCSS('opacity','1');
});


test('writing continues after swipe stops and replays after reset', async ({page})=>{
  await page.goto('/?debug=1');
  await waitForArt(page);
  await page.locator('#debugOpen').click();
  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    window.scrollTo({top:Math.round(innerHeight*1.4),behavior:'instant'});
  });
  await expect(page.locator('#invitation')).toHaveAttribute('data-lettering','playing');
  const initialPosition=await page.locator('.name-first').evaluate(el=>
    getComputedStyle(el).maskPosition
  );
  await expect.poll(async()=>page.locator('.name-first').evaluate(el=>
    getComputedStyle(el).maskPosition
  ),{timeout:4000}).toBe('0% 0px');
  // The user has not scrolled further; a timed reveal must still finish.
  await expect(page.locator('.name-first')).toHaveCSS('mask-position','0% 0px');
  await page.locator('#resetButton').click();
  await expect(page.locator('#invitation')).toHaveAttribute('data-lettering','idle');
  await page.locator('#debugOpen').click();
  await page.evaluate(()=>window.scrollTo({top:Math.round(innerHeight*1.4),behavior:'instant'}));
  await expect(page.locator('#invitation')).toHaveAttribute('data-lettering','playing');
  const replay=await page.locator('.name-first').evaluate(el=>({
    animation:getComputedStyle(el).animationName,
    position:getComputedStyle(el).maskPosition
  }));
  expect(replay.animation).toBe('write-ceremony-name');
  expect(replay.position).not.toBe('0% 0px');
});


test('waterfall mist and peacock glints use independently animated masked layers',async({page})=>{
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(error.message));
  await page.goto('/');
  await waitForArt(page);
  await expect(page.locator('.waterfalls .scene-mist')).toHaveCount(2);
  await expect(page.locator('.scene-mist > i')).toHaveCount(6);
  await expect(page.locator('.peacock-glint')).toHaveCount(2);
  const details=await page.evaluate(()=>({
    mist:[...document.querySelectorAll('.scene-mist')].map(e=>({
      children:e.children.length,
      animation:getComputedStyle(e.firstElementChild).animationName,
      speed:getComputedStyle(e.firstElementChild).animationDuration
    })),
    peacocks:[...document.querySelectorAll('.peacock-glint')].map(e=>({
      mask:getComputedStyle(e).maskImage,
      animation:getComputedStyle(e).animationName,
      duration:getComputedStyle(e).animationDuration
    }))
  }));
  expect(details.mist).toHaveLength(2);
  for(const mist of details.mist) {
    expect(mist.children).toBe(3);
    expect(mist.animation).toBe('scene-mist-drift');
    expect(mist.speed).toBe('16s');
  }
  for(const bird of details.peacocks) {
    expect(bird.mask).toContain('peacock.webp');
    expect(bird.animation).toBe('peacock-sheen');
    expect(bird.duration).toBe('9s');
  }
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(page.locator('.scene-mist')).toHaveCount(2);
  expect(pageErrors).toEqual([]);
});

test('ambient overlays pause for reduced motion and debug freeze',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await waitForArt(page);
  await expect(page.locator('.peacock-glint').first()).toBeHidden();
  await expect(page.locator('.scene-mist i').first()).toHaveCSS('animation-name','none');
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(page.locator('#invitation')).toHaveAttribute('data-state','opened');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/?debug=1');
  await waitForArt(page);
  await expect(page.locator('.peacock-glint').first()).toHaveCSS('animation-name','none');
  await expect(page.locator('.scene-mist i').first()).toHaveCSS('animation-name','none');
  // Debugger can still open the invitation without breaking visual controls.
  await page.locator('#debugOpen').click();
  await expect(page.locator('#invitation')).toHaveAttribute('data-state','opened');
});


test('floral clusters sway independently from their correct root points',async({page})=>{
  await page.goto('/');
  await waitForArt(page);
  const motion=await page.evaluate(()=>{
    const read=(selector)=>[...document.querySelectorAll(selector)].map(el=>{
      const img=el.querySelector('img'),s=getComputedStyle(img);
      return {
        sprite:el.className,
        duration:s.animationDuration,
        delay:s.animationDelay,
        animation:s.animationName,
        origin:s.transformOrigin,
        expectedDuration:el.style.getPropertyValue('--sd'),
        expectedDelay:el.style.getPropertyValue('--sl')
      };
    });
    return {
      flowers:read('.sprite.flower'),
      hanging:read('.sprite.hanging'),
      plants:read('.sprite.plant:not(.still)'),
      stationary:read('.sprite.still')
    };
  });
  expect(motion.flowers.length).toBeGreaterThanOrEqual(4);
  expect(motion.hanging.length).toBe(8);
  expect(motion.plants.length).toBeGreaterThanOrEqual(5);
  for(const item of [...motion.flowers,...motion.hanging,...motion.plants]) {
    expect(item.animation).toBe('reference-sway');
    expect(parseFloat(item.duration)).toBeCloseTo(parseFloat(item.expectedDuration),4);
    expect(parseFloat(item.delay)).toBeCloseTo(parseFloat(item.expectedDelay),4);
  }
  expect(new Set(motion.hanging.map(x=>x.duration)).size).toBeGreaterThan(3);
  for(const item of motion.stationary) expect(item.animation).toBe('none');
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(page.locator('.sprite.hanging')).toHaveCount(8);
});

test('reduced motion stops decorative floral sway without blocking opening',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await waitForArt(page);
  const stationary=await page.locator('.sprite.hanging img').first().evaluate(el=>{
    const a=getComputedStyle(el);
    return {duration:a.animationDuration, iterations:a.animationIterationCount};
  });
  expect(stationary.duration).toBe('1e-05s');
  expect(stationary.iterations).toBe('1');
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(page.locator('#invitation')).toHaveAttribute('data-state','opened');
});


test('butterfly routes visit real garden perches and match species wingbeat speeds',async({page})=>{
  await page.goto('/');
  await waitForArt(page);
  const flights=await page.locator('.butterfly-cover .butterfly').evaluateAll(nodes=>nodes.map(el=>{
    const animation=el.getAnimations().find(a=>a.effect?.getKeyframes()?.length>2);
    const wing=el.querySelector('.butterfly-wing-l');
    const waypoints=animation?.effect?.getKeyframes()?.map(k=>k.transform || '').join(' ') || '';
    return {
      name:getComputedStyle(el).animationName,
      duration:getComputedStyle(el).animationDuration,
      wingDuration:getComputedStyle(wing).animationDuration,
      waypoints
    };
  }));
  expect(flights).toHaveLength(2);
  expect(flights[0].name).toContain('bf-violet-garden');
  expect(flights[1].name).toContain('bf-ivory-garden');
  expect(flights[0].duration).toBe('24s');
  expect(flights[1].duration).toBe('22s');
  expect(parseFloat(flights[0].wingDuration)).toBeCloseTo(1/(2*2.2),3);
  expect(parseFloat(flights[1].wingDuration)).toBeCloseTo(1/(2*2.6),3);
  const viewport=await page.evaluate(()=>({w:innerWidth,h:innerHeight}));
  for(const flight of flights) {
    // Chromium resolves viewport units into pixel coordinates in the
    // Web Animations API, so assess the path's actual normalized extent.
    const coords=[...flight.waypoints.matchAll(/translate3d\(\s*([-\d.]+)px,\s*([-\d.]+)px/g)]
      .map(match=>({x:Number(match[1]),y:Number(match[2])}));
    expect(coords.length).toBeGreaterThanOrEqual(9);
    expect(Math.min(...coords.map(p=>p.x))).toBeLessThan(0);
    expect(Math.max(...coords.map(p=>p.x))).toBeGreaterThan(viewport.w*.75);
    expect(Math.max(...coords.map(p=>p.y))).toBeGreaterThan(viewport.h*.8);
    expect(Math.min(...coords.map(p=>p.y))).toBeLessThan(viewport.h*.55);
  }
});


test('debug freeze cancels petal frames and unfreezing resumes at 30fps or less',async({page})=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/?debug=1');
  await waitForArt(page);
  await expect(page.locator('#invitation')).toHaveAttribute('data-ambient','paused');
  expect(await page.evaluate(()=>window.__scenePerf.pendingFrame)).toBe(false);
  await page.locator('#freezeMotion').uncheck();
  await expect(page.locator('#invitation')).toHaveAttribute('data-ambient','running');
  await expect.poll(()=>page.evaluate(()=>window.__scenePerf.draws),{timeout:2000})
    .toBeGreaterThan(2);
  const before=await page.evaluate(()=>window.__scenePerf.draws);
  await page.waitForTimeout(450);
  const after=await page.evaluate(()=>window.__scenePerf.draws);
  expect(after-before).toBeGreaterThan(2);
  // A 450ms window at 30fps should draw about 13 frames, allowing slack.
  expect(after-before).toBeLessThanOrEqual(20);
  await page.locator('#freezeMotion').check();
  await expect(page.locator('#invitation')).toHaveAttribute('data-ambient','paused');
  const frozen=await page.evaluate(()=>window.__scenePerf.draws);
  await page.waitForTimeout(180);
  expect(await page.evaluate(()=>window.__scenePerf.draws)).toBe(frozen);
  expect(await page.evaluate(()=>window.__scenePerf.pendingFrame)).toBe(false);
  expect(errors).toEqual([]);
});

test('petal loop reacts immediately to reduced-motion changes',async({page})=>{
  await page.goto('/?debug=1');
  await waitForArt(page);
  await page.locator('#freezeMotion').uncheck();
  await expect(page.locator('#invitation')).toHaveAttribute('data-ambient','running');
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('#invitation')).toHaveAttribute('data-ambient','paused');
  expect(await page.evaluate(()=>window.__scenePerf.pendingFrame)).toBe(false);
  await expect(page.locator('.butterfly-cover')).toBeHidden();
  await page.emulateMedia({reducedMotion:'no-preference'});
  await expect(page.locator('#invitation')).toHaveAttribute('data-ambient','running');
  await expect.poll(()=>page.evaluate(()=>window.__scenePerf.pendingFrame))
    .toBe(true);
  await page.locator('#debugOpen').click();
  await expect(page.locator('#invitation')).toHaveAttribute('data-state','opened');
});

test('pagehide stops animation frames and pageshow restarts them',async({page})=>{
  await page.goto('/?debug=1');
  await waitForArt(page);
  await page.locator('#freezeMotion').uncheck();
  await expect(page.locator('#invitation')).toHaveAttribute('data-ambient','running');
  await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  await expect(page.locator('#invitation')).toHaveAttribute('data-ambient','paused');
  const before=await page.evaluate(()=>window.__scenePerf.draws);
  await page.waitForTimeout(170);
  expect(await page.evaluate(()=>window.__scenePerf.draws)).toBe(before);
  expect(await page.evaluate(()=>window.__scenePerf.pendingFrame)).toBe(false);
  await page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));
  await expect(page.locator('#invitation')).toHaveAttribute('data-ambient','running');
  await expect.poll(()=>page.evaluate(()=>window.__scenePerf.draws))
    .toBeGreaterThan(before);
});

test('scrolling past sticky Section 1 suspends ambient motion and restores on return',async({page})=>{
  await page.goto('/?debug=1');
  await waitForArt(page);
  await page.locator('#freezeMotion').uncheck();
  await expect(page.locator('#invitation')).toHaveAttribute('data-ambient','running');
  await page.locator('#debugOpen').click();
  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    const end=document.documentElement.scrollHeight-innerHeight;
    scrollTo({top:end,behavior:'instant'});
  });
  await expect.poll(async()=>page.evaluate(()=>document.querySelector('#viewport')
    .getBoundingClientRect().bottom)).toBeLessThanOrEqual(0);
  await expect(page.locator('#invitation')).toHaveAttribute('data-ambient','paused');
  await expect(page.locator('.sprite.hanging img').first())
    .toHaveCSS('animation-play-state','paused');
  expect(await page.evaluate(()=>window.__scenePerf.pendingFrame)).toBe(false);
  const frozen=await page.evaluate(()=>window.__scenePerf.draws);
  await page.waitForTimeout(150);
  expect(await page.evaluate(()=>window.__scenePerf.draws)).toBe(frozen);
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  await expect(page.locator('#invitation')).toHaveAttribute('data-ambient','running');
  await expect(page.locator('.sprite.hanging img').first())
    .toHaveCSS('animation-play-state','running');
  await expect.poll(()=>page.evaluate(()=>window.__scenePerf.draws))
    .toBeGreaterThan(frozen);
});
