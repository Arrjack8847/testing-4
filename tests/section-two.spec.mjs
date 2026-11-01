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
  expect(dims.frameWidth).toBeLessThanOrEqual(346.5);
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


test('Section 1 releases into Section 2 after exactly three mobile viewports',async({page},testInfo)=>{
  await page.goto('/');
  const initial=await page.evaluate(()=>{
    const track=document.getElementById('sceneTrack').getBoundingClientRect();
    const message=document.getElementById('message').getBoundingClientRect();
    return {height:innerHeight,trackHeight:track.height,messageStart:message.top+scrollY,
      overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(initial.trackHeight/initial.height).toBeCloseTo(3,2);
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
  expect(mid.lakeTop).toBeCloseTo(-.5,1);
  expect(mid.lakeBottom).toBeCloseTo(.5,1);
  expect(mid.messageTop).toBeCloseTo(.5,1);
  expect(Math.abs(mid.overlap)).toBeLessThanOrEqual(2);
  await expect.poll(()=>page.evaluate(()=>document.documentElement.style
    .getPropertyValue('--text-scroll-shift').trim())).toBe('0px');
  await page.screenshot({path:testInfo.outputPath('section-two-transition-half.png'),animations:'disabled'});

  await page.evaluate(()=>window.scrollTo({top:Math.round(innerHeight*3),behavior:'instant'}));
  await expect.poll(()=>page.evaluate(()=>Number((scrollY/innerHeight).toFixed(2))))
    .toBeCloseTo(3,1);
  const completed=await page.evaluate(()=>{
    const lake=document.getElementById('viewport').getBoundingClientRect();
    const message=document.getElementById('message').getBoundingClientRect();
    return {lakeBottom:lake.bottom,messageTop:message.top};
  });
  expect(Math.abs(completed.lakeBottom)).toBeLessThanOrEqual(2);
  expect(Math.abs(completed.messageTop)).toBeLessThanOrEqual(2);
  await expect(page.locator('#message')).toHaveClass(/is-visible/);
  await page.screenshot({path:testInfo.outputPath('section-two-transition-full.png'),animations:'disabled'});
});
