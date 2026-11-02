import {test, expect} from '@playwright/test';

async function visitCountdown(page){
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(e.message));
  await page.goto('/');
  const section=page.locator('#saveTheDate');
  await expect(section).toHaveAttribute('aria-hidden','true');
  await expect(section).toHaveJSProperty('inert',true);
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(section).toHaveAttribute('aria-hidden','false');
  await expect(section).toHaveJSProperty('inert',false);
  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    document.getElementById('saveTheDate').scrollIntoView({block:'start',behavior:'instant'});
  });
  await expect(section).toBeInViewport();
  return {section,pageErrors};
}

test('Section 4 follows the venue, shows a date-only sample countdown, and blocks unconfirmed download',async({page})=>{
  const {section,pageErrors}=await visitCountdown(page);
  await expect(section).toHaveAttribute('data-section','5');
  await expect(page.getByRole('heading',{level:2,name:'Save the Date'})).toBeVisible();
  await expect(section.locator('.save-date-disclaimer')).toContainText('Demonstration date');
  await expect(section.locator('time')).toHaveAttribute('datetime','2027-01-23');
  await expect(section.locator('#countdownDays')).toHaveText(/^\d+$/);
  await expect(section.locator('#countdownStatus')).toContainText('sample wedding date');
  await expect(section.locator('#saveDateButton')).toBeDisabled();
  await expect(section.locator('#saveDateHelp')).toContainText('after the wedding date is confirmed');
  await expect(section.locator('a[download]')).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test('Section 4 date uses local calendar-day arithmetic, not a made-up ceremony start',async({page})=>{
  const {section}=await visitCountdown(page);
  const current=await page.evaluate(()=>{
    const now=new Date();
    const sample=Date.UTC(2027,0,23);
    const localDay=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate());
    return Math.max(0,Math.round((sample-localDay)/86400000));
  });
  await expect(section.locator('#countdownDays')).toHaveText(String(current));
  await expect(section.locator('#countdownUnit')).toHaveText(current===1?'Day':'Days');
});

test('Section 4 calendar and portal fit every phone size',async({page},testInfo)=>{
  const {section}=await visitCountdown(page);
  await expect(section).toHaveClass(/is-visible/);
  const geometry=await section.evaluate(el=>{
    const orbit=el.querySelector('.save-date-orbit').getBoundingClientRect();
    const card=el.querySelector('.save-date-card').getBoundingClientRect();
    const viewport=innerWidth;
    return {viewport,overflow:document.documentElement.scrollWidth-viewport,
      orbitLeft:orbit.left,orbitRight:orbit.right,
      cardLeft:card.left,cardRight:card.right};
  });
  expect(geometry.overflow).toBeLessThanOrEqual(1);
  expect(geometry.orbitLeft).toBeGreaterThanOrEqual(-1);
  expect(geometry.cardLeft).toBeGreaterThanOrEqual(-1);
  expect(geometry.orbitRight).toBeLessThanOrEqual(geometry.viewport+1);
  expect(geometry.cardRight).toBeLessThanOrEqual(geometry.viewport+1);
  await section.screenshot({
    path:testInfo.outputPath('section-four-full-countdown.png'),animations:'disabled'
  });
});

test('Section 4 respects reduced motion and remains readable',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const {section}=await visitCountdown(page);
  const heading=section.locator('.save-date-title');
  await expect(heading).toBeVisible();
  const result=await heading.evaluate(el=>({
    opacity:getComputedStyle(el).opacity,
    transform:getComputedStyle(el).transform,
    transition:getComputedStyle(el).transitionDuration
  }));
  expect(result.opacity).toBe('1');
  expect(result.transform).toBe('none');
  await expect(section.locator('#saveDateButton')).toBeDisabled();
});


test('Section 3 to Section 4 keeps a continuous lavender transition',async({page},testInfo)=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Open Invitation'}).click();
  const adjacent=await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    const prior=document.getElementById('eventDetails');
    const next=document.getElementById('saveTheDate');
    const adjacent=prior.nextElementSibling===next;
    const nextTop=next.getBoundingClientRect().top+scrollY;
    window.scrollTo(0,Math.round(nextTop-innerHeight*.5));
    return adjacent;
  });
  expect(adjacent).toBe(true);
  await expect(page.locator('#eventDetails')).toBeInViewport();
  await expect(page.locator('#saveTheDate')).toBeInViewport();
  const bounds=await page.evaluate(()=>{
    const prior=document.getElementById('eventDetails').getBoundingClientRect();
    const next=document.getElementById('saveTheDate').getBoundingClientRect();
    const overlay=getComputedStyle(document.getElementById('saveTheDate'),'::after');
    return {seam:next.top-prior.bottom,gradient:overlay.backgroundImage,
      pageOverflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(Math.abs(bounds.seam)).toBeLessThanOrEqual(1);
  expect(bounds.gradient).toContain('linear-gradient');
  expect(bounds.pageOverflow).toBeLessThanOrEqual(1);
  await page.screenshot({path:testInfo.outputPath('section-four-transition-seam.png'),animations:'disabled'});
});
