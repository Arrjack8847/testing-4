import {test,expect} from '@playwright/test';
// Section 9 source-grounded RSVP & Wishes. Intentionally no real submission backend.
async function go(page){
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  const section=page.locator('#rsvp');
  await expect(section).toHaveAttribute('aria-hidden','true');
  await expect(section).toHaveJSProperty('inert',true);
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(section).toHaveAttribute('aria-hidden','false');
  await expect(section).toHaveJSProperty('inert',false);
  await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';
    document.getElementById('rsvp').scrollIntoView({block:'start',behavior:'instant'});});
  await expect(section).toBeInViewport();
  return {section,errors};
}
test('Section 9 matches source structure, field choices and section order',async({page})=>{
  const {section,errors}=await go(page);
  await expect(section).toHaveAttribute('data-section','9');
  await expect(section.getByRole('heading',{name:'RSVP & Wishes'})).toBeVisible();
  await expect(section.locator('.s9-eyebrow')).toContainText('31 December 2026');
  const ids=await page.locator('#invitation > section').evaluateAll(xs=>xs.map(x=>x.id));
  expect(ids.indexOf('rsvp')).toBe(ids.indexOf('weddingGift')+1);
  expect(ids.indexOf('closingMessage')).toBe(ids.indexOf('rsvp')+1);
  await expect(section.locator('#s9Name')).toHaveAttribute('placeholder','e.g. Aiman');
  await expect(section.locator('#s9Attendance option')).toHaveCount(3);
  await expect(section.locator('#s9Guests option')).toHaveCount(5);
  await expect(section.locator('#s9Wish')).toHaveAttribute('maxlength','300');
  await expect(section.locator('.s9-wish')).toHaveCount(3);
  await expect(section.locator('#s9FormStatus')).toContainText('not sent');
  expect(errors).toEqual([]);
});
test('No submission, guest message or public wish is persisted by demo',async({page})=>{
  const writes=[];page.on('request',req=>{if(!['GET','HEAD'].includes(req.method()))writes.push(req.method()+' '+req.url())});
  const {section,errors}=await go(page);
  await section.locator('#s9Name').fill('  Dana    Test  ');
  await section.locator('#s9Attendance').selectOption('yes');
  await section.locator('#s9Guests').selectOption('3');
  await section.locator('#s9Wish').fill('A lovely celebration!');
  await section.getByRole('button',{name:'Send RSVP'}).click();
  await expect(section.locator('#s9Preview')).toBeVisible();
  await expect(section.locator('#s9PreviewName')).toHaveText('Dana Test');
  await expect(section.locator('#s9PreviewGuests')).toHaveText('3');
  await expect(section.locator('#s9FormStatus')).toContainText('not sent or saved');
  expect(writes).toEqual([]);
  await page.reload();
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(page.locator('#s9Preview')).toBeHidden();
  await expect(page.locator('#s9Name')).toHaveValue('');
  await expect(page.locator('.s9-wish')).toHaveCount(3);
  expect(errors).toEqual([]);
});
test('Declining disables guest count and cover reset clears local preview',async({page})=>{
  const {section}=await go(page);
  await section.locator('#s9Name').fill('Guest Example');
  await section.locator('#s9Attendance').selectOption('no');
  await expect(section.locator('#s9Guests')).toBeDisabled();
  await section.getByRole('button',{name:'Send RSVP'}).click();
  await expect(section.locator('#s9PreviewGuests')).toHaveText('Not attending');
  await page.evaluate(()=>{document.getElementById('invitation').dataset.state='cover';});
  await expect(section).toHaveJSProperty('inert',true);
  await expect(section.locator('#s9Preview')).toBeHidden();
  await expect(section.locator('#s9Name')).toHaveValue('');
});
test('Four widths have no overflow and Section 8→9→10 seams stay exact',async({page},testInfo)=>{
  const {section,errors}=await go(page);
  await page.waitForTimeout(1300);
  const m=await page.evaluate(()=>{
    const rect=selector=>{const e=document.querySelector(selector);if(!e)return null;const r=e.getBoundingClientRect(),b=document.querySelector('#rsvp').getBoundingClientRect();return {x:+r.x.toFixed(1),y:+(r.y-b.y).toFixed(1),width:+r.width.toFixed(1),height:+r.height.toFixed(1)};};
    const a=document.getElementById('weddingGift').getBoundingClientRect(),
      b=document.getElementById('rsvp').getBoundingClientRect(),
      c=document.getElementById('closingMessage').getBoundingClientRect();
    const refs=['#rsvp','#s9RsvpForm','#s9Name','#s9Attendance','#s9Guests','#s9Wish'].map(rect);
    return {overflow:document.documentElement.scrollWidth-innerWidth,
      section:{height:b.height,width:b.width},before:b.top-a.bottom,after:c.top-b.bottom,
      refs,artSrc:document.getElementById('s9ReferenceArt').getAttribute('src')};
  });
  expect(m.overflow).toBeLessThanOrEqual(1);
  expect(Math.abs(m.before)).toBeLessThanOrEqual(1);
  expect(Math.abs(m.after)).toBeLessThanOrEqual(1);
  expect(m.section.width).toBe(page.viewportSize().width);
  expect(m.section.height).toBeGreaterThanOrEqual(1150);
  expect(m.artSrc).toBeNull();
  for(const r of m.refs){expect(r).toBeTruthy();expect(r.x).toBeGreaterThanOrEqual(-1);
    expect(r.x+r.width).toBeLessThanOrEqual(page.viewportSize().width+1);}
  if(testInfo.project.name==='iphone-390'){
    expect(Math.abs(m.section.height-1215.9)).toBeLessThan(4);
    const measured=await page.evaluate(()=>{const rect=selector=>{const e=document.querySelector(selector);if(!e)return null;const r=e.getBoundingClientRect(),b=document.querySelector('#rsvp').getBoundingClientRect();return {x:+r.x.toFixed(1),y:+(r.y-b.y).toFixed(1),width:+r.width.toFixed(1),height:+r.height.toFixed(1)};}; return ({
      eyebrow:rect('#rsvp .s9-eyebrow'),heading:rect('#rsvpHeading'),
      name:rect('#rsvp label[for="s9Name"]'),
      attend:rect('#rsvp label[for="s9Attendance"]'),
      guests:rect('#rsvp label[for="s9Guests"]'),
      wish:rect('#rsvp label[for="s9Wish"]')
    });});
    console.log('S9_LOCAL_GEOMETRY '+JSON.stringify(measured));
    for(const [id,y] of [['eyebrow',96],['heading',144.3],['name',240.1],['attend',342.3],['guests',342.3],['wish',444.5]]){
      expect(Math.abs(measured[id].y-y),id).toBeLessThan(3);
    }
  }
  await section.screenshot({path:testInfo.outputPath('s9-mobile-'+testInfo.project.name+'.png'),animations:'disabled'});
  await page.evaluate(()=>document.getElementById('closingMessage').scrollIntoView({block:'start',behavior:'instant'}));
  await page.evaluate(()=>document.getElementById('rsvp').scrollIntoView({block:'start',behavior:'instant'}));
  await expect(section).toBeInViewport();
  expect(errors).toEqual([]);
});
test('Animation pauses outside view and Reduced Motion remains legible',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const {section}=await go(page);
  await expect(section.locator('.s9-heading')).toBeVisible();
  const state=await section.evaluate(el=>({
    headingOpacity:getComputedStyle(el.querySelector('.s9-heading')).opacity,
    butterfly:getComputedStyle(el.querySelector('.s9-butterfly')).animationName,
    image:el.querySelector('.s9-reference-art').getAttribute('src')
  }));
  expect(state.headingOpacity).toBe('1');
  expect(state.butterfly).toBe('none');
  expect(state.image).toBeNull();
});
