import {test, expect} from '@playwright/test';

async function reachMessage(page) {
  await page.goto('/');
  const section = page.locator('#message');
  await expect(section).toHaveAttribute('data-section','2');
  await expect(section).toBeHidden();
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    document.getElementById('message').scrollIntoView({block:'start',behavior:'instant'});
  });
  await expect(section).toBeInViewport();
  // Geometry must be measured after the 750ms entrance transform finishes.
  // Otherwise the scaled frame yields false width/top mismatches.
  await expect(section).toHaveClass(/is-visible/);
  await expect.poll(()=>section.locator('.letter-frame').evaluate(el=>getComputedStyle(el).transform)).toBe('none');
  return section;
}

test('reference-structured Section 2 is a mauve invitation-message band',async({page})=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const section=await reachMessage(page);
  await expect(section).toHaveClass(/is-visible/);
  await expect(page.getByRole('heading',{name:'Wedding invitation message'})).toHaveCount(1);
  await expect(section.locator('.letter-bismillah')).toHaveAttribute('lang','ar');
  await expect(section.locator('.letter-lead')).toContainText('With grateful hearts');
  await expect(section.locator('.letter-quote')).toContainText('tranquility');
  await expect(section.locator('.letter-source')).toContainText('SURAH AR-RUM');
  await expect(section.locator('.letter-names')).toHaveCount(0);
  await expect(section.locator('.letter-date')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('double-line message frame fits mobile viewports without overflow',async({page})=>{
  const section=await reachMessage(page);
  const dims=await section.evaluate(el=>{
    const frame=el.querySelector('.letter-frame').getBoundingClientRect();
    const text=[...el.querySelectorAll('.letter-lead,.letter-quote,.letter-source')].map(node=>{
      const r=node.getBoundingClientRect();return {left:r.left,right:r.right};
    });
    return {
      viewport:innerWidth,
      sectionHeight:el.getBoundingClientRect().height,
      frameWidth:frame.width,frameLeft:frame.left,frameRight:frame.right,
      overflow:document.documentElement.scrollWidth-innerWidth,
      text
    };
  });
  expect(dims.overflow).toBeLessThanOrEqual(1);
  expect(dims.sectionHeight).toBeGreaterThanOrEqual(740);
  expect(dims.frameWidth).toBeCloseTo(dims.viewport-44,0);
  expect(dims.frameLeft).toBeGreaterThanOrEqual(-1);
  expect(dims.frameRight).toBeLessThanOrEqual(dims.viewport+1);
  for(const p of dims.text){
    expect(p.left).toBeGreaterThanOrEqual(-1);
    expect(p.right).toBeLessThanOrEqual(dims.viewport+1);
  }
  await expect(section.locator('img')).toHaveCount(0);
});

test('reduced motion keeps Section 2 scripture and message visible',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const section=await reachMessage(page);
  const frame=section.locator('.letter-frame');
  await expect(section.locator('.letter-lead')).toBeVisible();
  const css=await frame.evaluate(el=>({opacity:getComputedStyle(el).opacity,
    transform:getComputedStyle(el).transform}));
  expect(css).toEqual({opacity:'1',transform:'none'});
  const petal=await section.locator('.letter-petal').first().evaluate(el=>getComputedStyle(el).animationName);
  expect(petal).toBe('none');
});

test('capture the corrected mobile Section 2 at each viewport',async({page},testInfo)=>{
  const section=await reachMessage(page);
  await expect(section).toHaveClass(/is-visible/);
  await section.screenshot({
    path:testInfo.outputPath('section-two-reference-structured-band.png'),
    animations:'disabled'
  });
  await page.screenshot({
    path:testInfo.outputPath('section-two-mobile-viewport.png'),
    animations:'disabled'
  });
});


test('full sticky lake remains under mauve overlay until exactly 3H',async({page},testInfo)=>{
  await page.goto('/');
  const initial=await page.evaluate(()=>{
    const track=document.getElementById('sceneTrack').getBoundingClientRect();
    const message=document.getElementById('message').getBoundingClientRect();
    const trackStyle=getComputedStyle(document.getElementById('sceneTrack'));
    return {height:innerHeight,trackHeight:track.height,
      trackNegativeMargin:parseFloat(trackStyle.marginBottom),messageStart:message.top+scrollY,
      overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(initial.trackHeight/initial.height).toBeCloseTo(4,2);
  expect(initial.trackNegativeMargin/initial.height).toBeCloseTo(-1,2);
  expect((initial.trackHeight+initial.trackNegativeMargin)/initial.height).toBeCloseTo(3,2);
  expect(initial.messageStart/initial.height).toBeCloseTo(3,2);
  expect(initial.overflow).toBeLessThanOrEqual(1);

  await page.getByRole('button',{name:'Open Invitation'}).click();
  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    window.scrollTo({top:Math.round(innerHeight*2.5),behavior:'instant'});
  });
  await expect.poll(()=>page.evaluate(()=>Number((scrollY/innerHeight).toFixed(2))))
    .toBeCloseTo(2.5,1);
  const mid=await page.evaluate(()=>{
    const lake=document.getElementById('viewport').getBoundingClientRect();
    const message=document.getElementById('message').getBoundingClientRect();
    return {lakeTop:lake.top/innerHeight,lakeBottom:lake.bottom/innerHeight,
      messageTop:message.top/innerHeight,overlap:lake.bottom-message.top,
      textShift:document.documentElement.style.getPropertyValue('--text-scroll-shift').trim()};
  });
  // Entire lake stays pinned under the mauve band. The lower half is
  // intentionally overlaid; only the upper half of the garden remains visible.
  expect(mid.lakeTop).toBeCloseTo(0,1);
  expect(mid.lakeBottom).toBeCloseTo(1,1);
  expect(mid.messageTop).toBeCloseTo(.5,1);
  expect(mid.overlap/initial.height).toBeCloseTo(.5,1);
  await expect.poll(()=>page.evaluate(()=>parseFloat(document.documentElement.style
    .getPropertyValue('--text-scroll-shift'))/innerHeight)).toBeCloseTo(-.5,1);
  await page.screenshot({path:testInfo.outputPath('section-two-transition-half.png'),animations:'disabled'});

  await page.evaluate(()=>window.scrollTo({top:Math.round(innerHeight*3),behavior:'instant'}));
  await expect.poll(()=>page.evaluate(()=>Number((scrollY/innerHeight).toFixed(2))))
    .toBeCloseTo(3,1);
  const completed=await page.evaluate(()=>{
    const lake=document.getElementById('viewport').getBoundingClientRect();
    const message=document.getElementById('message').getBoundingClientRect();
    return {lakeTop:lake.top,lakeBottom:lake.bottom,messageTop:message.top,
      sectionBackground:getComputedStyle(document.getElementById('message')).backgroundColor};
  });
  expect(Math.abs(completed.lakeTop)).toBeLessThanOrEqual(2);
  expect(Math.abs(completed.lakeBottom-initial.height)).toBeLessThanOrEqual(2);
  expect(Math.abs(completed.messageTop)).toBeLessThanOrEqual(2);
  expect(completed.sectionBackground).not.toBe('rgba(0, 0, 0, 0)');
  // The mauve panel now fully covers the still-sticky artwork.
  await expect(page.locator('#invitation')).toHaveAttribute('data-ambient','paused');
  await expect(page.locator('#message')).toHaveClass(/is-visible/);
  await page.screenshot({path:testInfo.outputPath('section-two-transition-full.png'),animations:'disabled'});
});


test('Section 2 original textured layer is present and its reference-aligned frame retains geometry',async({page},testInfo)=>{
  const section=await reachMessage(page);
  await expect(section).toHaveClass(/is-visible/);
  await expect.poll(()=>section.locator('.letter-lead').evaluate(el=>getComputedStyle(el).opacity)).toBe('1');
  const sprite=await section.evaluate(el=>{
    const frame=el.querySelector('.letter-frame').getBoundingClientRect();
    const band=el.getBoundingClientRect();
    const source=getComputedStyle(el,'::before');
    const lead=el.querySelector('.letter-lead').getBoundingClientRect();
    return {top:frame.top-band.top,width:frame.width,
      messageHeight:band.height,leadRelative:lead.top-band.top,leadWidth:lead.width,
      texture:source.backgroundImage,opacity:source.opacity,
      opacityText:getComputedStyle(el.querySelector('.letter-lead')).opacity};
  });
  expect(sprite.texture).toContain('section2-mauve-original.svg');
  expect(sprite.opacityText).toBe('1');
  if(await page.evaluate(()=>innerWidth)===390){
    expect(sprite.top).toBeCloseTo(187,0);
    expect(sprite.width).toBeCloseTo(346,0);
    // Content-based subpixel rounding may extend the 762.4px reference band slightly.
    expect(Math.abs(sprite.messageHeight-762.4)).toBeLessThan(2);
    expect(sprite.leadRelative).toBeGreaterThan(280);
    expect(sprite.leadRelative).toBeLessThan(320);
    expect(sprite.leadWidth).toBeCloseTo(324,0);
  }
  const textureResponse=await page.request.get('/assets/section2-mauve-original.svg');
  expect(textureResponse.ok()).toBe(true);
  expect(await textureResponse.text()).toContain('<svg');

  for(const fraction of [2.75,3.25]){
    await page.evaluate(frac=>window.scrollTo({top:Math.round(innerHeight*frac),behavior:'instant'}),fraction);
    await expect.poll(()=>page.evaluate(()=>Number((scrollY/innerHeight).toFixed(2))))
      .toBeCloseTo(fraction,1);
    await page.screenshot({
      path:testInfo.outputPath('section-two-reference-checkpoint-'+String(fraction).replace('.','_')+'.png'),
      animations:'disabled'});
  }
});


test('Section 2 local petal clock remains an active fallback while global field avoids duplicate motion',async({page})=>{
  await page.goto('/');
  const section=page.locator('#message');
  const petal=section.locator('.letter-petal').first();
  await expect(section).toHaveAttribute('data-petals-active','false');
  await expect(petal).toHaveCSS('animation-play-state','paused');

  await page.getByRole('button',{name:'Open Invitation'}).click();
  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    document.getElementById('message').scrollIntoView({block:'start',behavior:'instant'});
  });
  await expect(section).toHaveAttribute('data-petals-active','true');
  // Normal guest mode uses the globally continuous petal canvas. The
  // section-local petals are hidden and their redundant clocks are paused.
  await expect(page.locator('html')).toHaveClass(/global-petals-active/);
  await expect(petal).toBeHidden();
  await expect(petal).toHaveCSS('animation-play-state','paused');
  // If the global field becomes unavailable, the original authored section
  // choreography must still run without modifying its animation keyframes.
  await page.evaluate(()=>document.documentElement.classList.remove('global-petals-active'));
  await expect(petal).toBeVisible();
  await expect(petal).toHaveCSS('animation-play-state','running');

  await page.evaluate(()=>document.getElementById('eventDetails').scrollIntoView({
    block:'start',behavior:'instant'
  }));
  await expect(section).toHaveAttribute('data-petals-active','false');
  await expect(petal).toHaveCSS('animation-play-state','paused');
});

test('petals remain motionless under a reduced-motion preference',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const section=await reachMessage(page);
  await expect(section).toHaveAttribute('data-petals-active','false');
  await expect(section.locator('.letter-petal').first()).toHaveCSS('animation-name','none');
});

test('live-reference frame and 19px lead align at all four phone widths',async({page})=>{
  const section=await reachMessage(page);
  await expect(section).toHaveClass(/is-visible/);
  const actual=await section.evaluate(el=>{
    const band=el.getBoundingClientRect();
    const frame=el.querySelector('.letter-frame').getBoundingClientRect();
    const lead=el.querySelector('.letter-lead');
    const b=lead.getBoundingClientRect();
    return {
      viewport:innerWidth,
      top:frame.top-band.top,
      left:frame.left-band.left,
      width:frame.width,
      leadTop:b.top-band.top,
      leadWidth:b.width,
      fontSize:getComputedStyle(lead).fontSize,
      overflow:document.documentElement.scrollWidth-innerWidth
    };
  });
  // Calibrated against the reference itself at 320, 360, 390, 430 CSS pixels.
  expect(Math.abs(actual.top-187)).toBeLessThan(2);
  expect(Math.abs(actual.left-22)).toBeLessThan(1);
  expect(Math.abs(actual.width-(actual.viewport-44))).toBeLessThan(1);
  expect(Math.abs(actual.leadTop-291.8)).toBeLessThan(3);
  expect(actual.leadWidth).toBeCloseTo(Math.min(actual.viewport-56,324),0);
  expect(actual.fontSize).toBe('19px');
  expect(actual.overflow).toBeLessThanOrEqual(1);
});

test('original Section 2 petals have independent curved trajectories without changing document geometry',async({page})=>{
  const section=await reachMessage(page);
  const petals=section.locator('.letter-petal');
  await expect(petals).toHaveCount(8);
  await expect(page.locator('html')).toHaveClass(/global-petals-active/);
  await page.evaluate(()=>document.documentElement.classList.remove('global-petals-active'));
  await expect(petals.first()).toHaveCSS('animation-play-state','running');
  const before=await petals.evaluateAll(nodes=>nodes.map(el=>({
    name:getComputedStyle(el).animationName,
    duration:getComputedStyle(el).animationDuration,
    state:getComputedStyle(el).animationPlayState,
    transform:getComputedStyle(el).transform,
    pointerEvents:getComputedStyle(el.parentElement).pointerEvents
  })));
  // Verify the underlying section-specific trajectories with the global
  // display override disabled, as in a legacy/local fallback scenario.
  // The preceding lifecycle test covers the default global guest mode.
  expect(new Set(before.map(x=>x.name))).toEqual(new Set([
    'letter-petal-fall-a','letter-petal-fall-b','letter-petal-fall-c'
  ]));
  expect(before.every(x=>x.state==='running'&&x.pointerEvents==='none')).toBe(true);
  expect(new Set(before.map(x=>x.duration)).size).toBeGreaterThanOrEqual(6);
  await page.waitForTimeout(700);
  const after=await petals.evaluateAll(nodes=>nodes.map(el=>getComputedStyle(el).transform));
  expect(after.some((x,i)=>x!==before[i].transform)).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
});
