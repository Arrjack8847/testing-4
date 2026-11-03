import {test,expect} from '@playwright/test';

// Section 5 → Section 6 integration tests. Section 6 owns the Dress Code code;
// these tests do not modify its markup, styles or JS.
async function openInvitation(page){
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  const order=page.locator('#runningOrder');
  const dress=page.locator('#dressCode');
  await expect(order).toHaveJSProperty('inert',true);
  await expect(dress).toHaveJSProperty('inert',true);
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(order).toHaveJSProperty('inert',false);
  await expect(dress).toHaveJSProperty('inert',false);
  await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto'});
  return {order,dress,errors};
}
async function snapTo(page,section,offset=0){
  await page.evaluate(({id,offset})=>{
    const el=document.getElementById(id);
    const y=el.getBoundingClientRect().top+scrollY+offset;
    scrollTo({top:y,behavior:'instant'});
  },{id:section,offset});
  await page.waitForTimeout(220);
}

test('Section 5 → 6 preserves reference sequence with no visible legacy scene or gap',async({page},testInfo)=>{
  const {order,dress,errors}=await openInvitation(page);
  await snapTo(page,'runningOrder');
  const data=await order.evaluate(el=>{
    const dress=document.getElementById('dressCode');
    const legacy=document.getElementById('saveTheDate');
    const event=document.getElementById('eventDetails');
    const a=event.getBoundingClientRect();
    const b=el.getBoundingClientRect();
    const c=dress.getBoundingClientRect();
    return {
      orderStartsAfterEvents:event.nextElementSibling===el,
      legacyDirectChild:el.nextElementSibling===legacy,
      legacyHidden:legacy.hidden,
      dressAfterLegacy:legacy.nextElementSibling===dress,
      legacyDisplay:getComputedStyle(legacy).display,
      gap45:b.top-a.bottom,
      gap56:c.top-b.bottom,
      width:innerWidth,
      overflow:document.documentElement.scrollWidth-innerWidth,
      orderHeight:b.height,dressHeight:c.height,
      orderBackground:getComputedStyle(el).backgroundImage,
      dressBackground:getComputedStyle(dress).backgroundImage
    };
  });
  expect(data.orderStartsAfterEvents).toBe(true);
  expect(data.legacyDirectChild).toBe(true);
  expect(data.legacyHidden).toBe(true);
  expect(data.dressAfterLegacy).toBe(true);
  expect(data.legacyDisplay).toBe('none');
  expect(Math.abs(data.gap45)).toBeLessThanOrEqual(1);
  expect(Math.abs(data.gap56)).toBeLessThanOrEqual(1);
  expect(data.overflow).toBeLessThanOrEqual(1);
  expect(data.orderHeight).toBeGreaterThanOrEqual(651);
  expect(data.dressHeight).toBeGreaterThanOrEqual(679);
  expect(data.orderBackground).toContain('order-plum-emboss-original.svg');
  expect(data.dressBackground).toContain('linear-gradient');
  await expect(order.locator('.order-entry')).toHaveCount(6);
  await expect(dress.locator('.dress-palette')).toHaveCount(2);
  if(testInfo.project.name==='iphone-390'){
    await snapTo(page,'runningOrder',Math.max(0,data.orderHeight-Math.round(page.viewportSize().height/2)));
    await page.screenshot({path:testInfo.outputPath('section5-to-6-seam-390.png'),animations:'disabled'});
  }
  expect(errors).toEqual([]);
});

test('forward/backward scroll pauses Section 5 motion while Dress Code keeps its independent camera',async({page})=>{
  const {order,dress,errors}=await openInvitation(page);
  await snapTo(page,'runningOrder');
  await expect(order).toHaveAttribute('data-petal-motion','running');
  await expect(order).toHaveAttribute('data-butterfly-motion','running');
  const initial=await order.locator('#orderButterflyFlight').evaluate(el=>Number(el.dataset.x));
  await page.waitForTimeout(250);
  const later=await order.locator('#orderButterflyFlight').evaluate(el=>Number(el.dataset.x));
  expect(later).toBeLessThan(initial);

  await snapTo(page,'dressCode');
  await expect(dress.getByRole('heading',{name:'Dress Code'})).toBeVisible();
  await expect(order).toHaveAttribute('data-petal-motion','paused');
  await expect(order).toHaveAttribute('data-butterfly-motion','paused');
  await page.waitForTimeout(100);
  const orderCam=await order.evaluate(el=>el.dataset.orderCamera);
  const dressCam=await dress.evaluate(el=>parseFloat(el.style.getPropertyValue('--dress-camera-y')));
  expect(Number.isFinite(dressCam)).toBe(true);
  expect(Math.abs(dressCam)).toBeLessThanOrEqual(45);
  expect(orderCam).toBeDefined();

  await snapTo(page,'runningOrder');
  await expect(order).toHaveAttribute('data-petal-motion','running');
  await expect(order).toHaveAttribute('data-butterfly-motion','running');
  const returned=await order.locator('#orderButterflyFlight').evaluate(el=>Number(el.dataset.x));
  expect(returned).toBeGreaterThan(200); // Reset to right-edge on re-entry.
  expect(errors).toEqual([]);
});

test('closing cover gates both sections and stops independent motion',async({page})=>{
  const {order,dress,errors}=await openInvitation(page);
  await snapTo(page,'runningOrder');
  await expect(order).toHaveAttribute('data-petal-motion','running');
  await page.evaluate(()=>document.getElementById('invitation').dataset.state='cover');
  await expect(order).toHaveAttribute('data-petal-motion','paused');
  await expect(order).toHaveAttribute('data-butterfly-motion','paused');
  await expect(order).toHaveJSProperty('inert',true);
  await expect(dress).toHaveJSProperty('inert',true);
  await expect(order).toHaveAttribute('aria-hidden','true');
  await expect(dress).toHaveAttribute('aria-hidden','true');
  expect(errors).toEqual([]);
});

test('Reduce Motion keeps both sections accessible and motion-free across boundary',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const {order,dress,errors}=await openInvitation(page);
  await snapTo(page,'runningOrder');
  await expect(order).toHaveAttribute('data-petal-motion','still');
  await expect(order).toHaveAttribute('data-butterfly-motion','paused');
  await expect(order.locator('#orderButterflyFlight')).toBeHidden();
  await expect(order.locator('.order-heading')).toHaveCSS('opacity','1');
  await snapTo(page,'dressCode');
  await expect(dress.locator('.dress-heading')).toHaveCSS('opacity','1');
  const camera=await dress.evaluate(el=>el.style.getPropertyValue('--dress-camera-y'));
  expect(parseFloat(camera||'0')).toBe(0);
  expect(errors).toEqual([]);
});
