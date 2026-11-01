import {test, expect} from '@playwright/test';

async function reachEvents(page) {
  await page.goto('/');
  const event = page.locator('#eventDetails');
  await expect(event).toHaveAttribute('aria-hidden','true');
  await expect(event).toHaveJSProperty('inert',true);
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(event).toHaveAttribute('aria-hidden','false');
  await expect(event).toHaveJSProperty('inert',false);
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    const target = document.getElementById('eventDetails');
    window.scrollTo(0, Math.round(window.scrollY + target.getBoundingClientRect().top));
  });
  await expect(event).toBeInViewport();
  return event;
}

test('wedding event section follows invitation letter and preserves demo disclosures',async({page}) => {
  const errors=[];
  page.on('pageerror',e => errors.push(e.message));
  const event = await reachEvents(page);
  await expect(event).toHaveAttribute('data-section','3');
  await expect(page.getByRole('heading',{name:'The Celebration',level:2})).toBeVisible();
  await expect(event.locator('.event-date-day')).toHaveText('23');
  await expect(event.locator('.event-date-month')).toHaveText('JANUARY');
  await expect(event.locator('.event-demo-note')).toContainText('Sample date');
  await expect(event.locator('#eventTime')).toHaveText('To be confirmed');
  await expect(event.locator('#eventVenue')).toHaveText('Venue to be announced');
  await expect(event.locator('#eventDirections')).toBeHidden();
  await expect(event.locator('#eventDirections')).not.toHaveAttribute('href');
  expect(errors).toEqual([]);
});

test('Section 3 fits each mobile size without horizontal overflow',async({page},testInfo)=>{
  const event = await reachEvents(page);
  await expect(event).toHaveClass(/is-visible/);
  const geometry = await event.evaluate(section => {
    const viewport=innerWidth;
    const info=section.querySelector('.event-info-panel').getBoundingClientRect();
    const calendar=section.querySelector('.event-date-card').getBoundingClientRect();
    return {
      viewport, overflow:document.documentElement.scrollWidth-viewport,
      infoLeft:info.left, infoRight:info.right, calendarLeft:calendar.left,calendarRight:calendar.right
    };
  });
  expect(geometry.overflow).toBeLessThanOrEqual(1);
  for(const side of [geometry.infoLeft,geometry.calendarLeft]) expect(side).toBeGreaterThanOrEqual(-1);
  for(const side of [geometry.infoRight,geometry.calendarRight]) expect(side).toBeLessThanOrEqual(geometry.viewport+1);
  await event.screenshot({path:testInfo.outputPath('section-three-full-details.png'),animations:'disabled'});
});

test('reduced-motion event details remain legible',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const event=await reachEvents(page);
  const title=event.locator('.event-title');
  await expect(title).toBeVisible();
  const motion=await title.evaluate(el=>({opacity:getComputedStyle(el).opacity,transform:getComputedStyle(el).transform}));
  expect(motion).toEqual({opacity:'1',transform:'none'});
  await expect(event.locator('#eventDirectionsNote')).toBeVisible();
});


test('Section 2 to Section 3 transition is contiguous and visually bridged',async({page},testInfo)=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Open Invitation'}).click();
  const seam=await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    const letter=document.getElementById('message');
    const event=document.getElementById('eventDetails');
    const continuous=letter.nextElementSibling===event;
    const point=event.getBoundingClientRect().top+scrollY-innerHeight/2;
    window.scrollTo(0,Math.round(point));
    return {continuous};
  });
  expect(seam.continuous).toBe(true);
  await expect(page.locator('#eventDetails')).toBeInViewport();
  await expect(page.locator('#message')).toBeInViewport();
  const position=await page.evaluate(()=>{
    const letter=document.getElementById('message').getBoundingClientRect();
    const event=document.getElementById('eventDetails').getBoundingClientRect();
    const transition=getComputedStyle(document.getElementById('eventDetails'),'::after');
    return {gap:event.top-letter.bottom,
      gradient:transition.backgroundImage,
      pointerEvents:transition.pointerEvents,
      pageOverflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(Math.abs(position.gap)).toBeLessThanOrEqual(1);
  expect(position.gradient).toContain('linear-gradient');
  expect(position.pointerEvents).toBe('none');
  expect(position.pageOverflow).toBeLessThanOrEqual(1);
  await page.screenshot({path:testInfo.outputPath('section-three-transition-seam.png'),
    animations:'disabled'});
});
