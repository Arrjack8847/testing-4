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
