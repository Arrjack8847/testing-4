import {test,expect} from '@playwright/test';

async function openAndScroll(page,fraction){
  await page.evaluate(f=>{
    document.documentElement.style.scrollBehavior='auto';
    window.scrollTo({top:Math.round(innerHeight*f),behavior:'instant'});
  },fraction);
  await expect.poll(()=>page.evaluate(()=>Number((scrollY/innerHeight).toFixed(2))))
    .toBeCloseTo(fraction,1);
}
async function prepared(page){
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('#invitation')).toHaveAttribute('data-layers','ready',{timeout:30000});
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(page.locator('#invitation')).toHaveAttribute('data-state','opened');
  return errors;
}
test('ceremony heading follows measured live 1.35H, 1.50H and 1.70H opacity',async({page},testInfo)=>{
  const errors=await prepared(page);
  const heading=page.locator('.opened-copy .eyebrow');
  await openAndScroll(page,1.35);
  await expect.poll(()=>heading.evaluate(el=>Number(getComputedStyle(el).opacity))).toBeLessThan(.02);
  await openAndScroll(page,1.5);
  // The live reference has ~43% opacity at this checkpoint; the previous
  // reconstruction incorrectly reached ~93% too early.
  await expect.poll(()=>heading.evaluate(el=>Number(getComputedStyle(el).opacity)))
    .toBeGreaterThan(.33);
  const halfway=Number(await heading.evaluate(el=>getComputedStyle(el).opacity));
  expect(halfway).toBeLessThan(.55);
  await page.screenshot({path:testInfo.outputPath('section-one-ceremony-1_50H.png'),animations:'allow'});
  await openAndScroll(page,1.7);
  await expect.poll(()=>heading.evaluate(el=>Number(getComputedStyle(el).opacity))).toBe(1);
  await page.screenshot({path:testInfo.outputPath('section-one-ceremony-1_70H.png'),animations:'allow'});
  expect(errors).toEqual([]);
});
test('returning-garden butterfly animation begins with the names instead of waiting offscreen',async({page},testInfo)=>{
  const errors=await prepared(page);
  await expect(page.locator('.butterfly-hero')).toBeHidden();
  await openAndScroll(page,1.5);
  await expect(page.locator('#invitation')).toHaveAttribute('data-reading','yes');
  await expect(page.locator('.butterfly-hero')).toBeVisible();
  const flights=page.locator('.butterfly-hero .butterfly');
  await expect(flights).toHaveCount(2);
  await expect.poll(()=>flights.evaluateAll(nodes=>nodes.filter(el=>{
    const rect=el.getBoundingClientRect(),style=getComputedStyle(el);
    return Number(style.opacity)>.15 && rect.right>0 && rect.left<innerWidth &&
      rect.bottom>0 && rect.top<innerHeight;
  }).length),{timeout:5000}).toBeGreaterThanOrEqual(1);
  const styles=await flights.evaluateAll(nodes=>nodes.map(el=>({
    className:el.className,
    duration:getComputedStyle(el).animationDuration,
    delay:getComputedStyle(el).animationDelay,
    state:getComputedStyle(el).animationPlayState
  })));
  expect(styles.every(x=>x.state==='running')).toBe(true);
  expect(styles.every(x=>x.delay.startsWith('-'))).toBe(true);
  // Preserve the moving species rather than forcing animation completion
  // during screenshot capture; this is a real animation checkpoint.
  await page.screenshot({path:testInfo.outputPath('section-one-butterflies-1_50H.png'),animations:'allow'});
  expect(errors).toEqual([]);
});
test('reduced motion hides original butterflies and preserves readable names',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const errors=await prepared(page);
  await openAndScroll(page,1.7);
  await expect(page.locator('.butterfly-hero')).toBeHidden();
  await expect(page.locator('.name-first')).toBeVisible();
  await expect(page.locator('.name-second')).toBeVisible();
  expect(errors).toEqual([]);
});


test('garden flowers use gentle multi-phase sway without moving the edge anchors',async({page})=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('#invitation')).toHaveAttribute('data-layers','ready',{timeout:30000});
  const data=await page.evaluate(()=>{
    const roots=[...document.querySelectorAll('.sprite.hanging,.sprite.plant:not(.still),.sprite.flower')];
    return roots.map(root=>{
      const img=root.querySelector('img');
      const style=getComputedStyle(img);
      const animation=img.getAnimations().find(a=>a.animationName==='reference-sway');
      const keyframes=animation?.effect?.getKeyframes() || [];
      const duration=parseFloat(style.animationDuration);
      const sa=parseFloat(root.style.getPropertyValue('--sa'));
      return {
        className:root.className,origin:style.transformOrigin,
        duration,keyframeOffsets:keyframes.map(k=>Number(k.offset.toFixed(2))),
        keyframeAngles:keyframes.map(k=>{
          const m=(k.transform||'').match(/rotate\((-?[\d.]+)deg\)/);
          return m?Number(m[1]):NaN;
        }),
        sa
      };
    });
  });
  expect(data.length).toBeGreaterThanOrEqual(18);
  for(const item of data){
    expect(item.keyframeOffsets).toEqual([0,.17,.38,.57,.78,1]);
    expect(item.keyframeAngles.every(Number.isFinite)).toBe(true);
    expect(Math.max(...item.keyframeAngles.map(Math.abs))).toBeLessThanOrEqual(item.sa*1.01);
    // Relative pivots: the hanging flowers swing from the branch,
    // lower plants from their rooted ground attachment.
    const y=Number.parseFloat(item.origin.split(' ')[1]);
    expect(Number.isFinite(y)).toBe(true);
    expect(item.duration).toBeGreaterThan(2);
  }
  expect(errors).toEqual([]);
});

test('two butterfly species briefly hover near lower garden flowers',async({page})=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('#invitation')).toHaveAttribute('data-layers','ready',{timeout:30000});
  const paths=await page.locator('.butterfly-cover .butterfly').evaluateAll(nodes=>nodes.map(el=>{
    const animation=el.getAnimations().find(a=>/^bf-(violet|ivory)-garden$/.test(a.animationName||''));
    const frames=animation?.effect?.getKeyframes() || [];
    const grab=offset=>{
      const k=frames.find(k=>Math.abs(k.offset-offset)<.0001);
      if(!k)return null;
      const match=(k.transform||'').match(/translate3d\(\s*([-\d.]+)px,\s*([-\d.]+)px/);
      return match ? {x:Number(match[1]),y:Number(match[2])}:null;
    };
    const violet=el.classList.contains('violet');
    return {
      species:violet?'violet':'ivory',
      duration:getComputedStyle(el).animationDuration,
      before:grab(violet?.35:.46),
      dwell:grab(violet?.38:.49),
      drift:grab(violet?.40:.51),
      after:grab(violet?.42:.54),
      wing:getComputedStyle(el.querySelector('.butterfly-wing-l')).animationDuration
    };
  }));
  expect(paths).toHaveLength(2);
  for(const p of paths){
    for(const k of ['before','dwell','drift','after'])expect(p[k]).not.toBeNull();
    const distance=Math.hypot(p.before.x-p.dwell.x,p.before.y-p.dwell.y);
    expect(distance).toBeLessThan(1.5);
    const shift=Math.hypot(p.after.x-p.before.x,p.after.y-p.before.y);
    expect(shift).toBeGreaterThan(6);
    expect(parseFloat(p.duration)).toBeGreaterThan(20);
    expect(parseFloat(p.wing)).toBeLessThan(.25);
  }
  expect(errors).toEqual([]);
});
