import {test,expect} from '@playwright/test';
// Section 9 source-grounded RSVP & Wishes with real API; UI uses safe stub while Python tests exercise SQLite.
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
  await expect(section.locator('#s9FormStatus')).toContainText('save it privately');
  expect(errors).toEqual([]);
});
test('A confirmed POST reveals a receipt; errors never pretend to save',async({page})=>{
  const writes=[];
  await page.route('**/api/rsvp',async route=>{
    const payload=route.request().postDataJSON();
    writes.push(payload);
    await route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({
      ok:true,saved:true,receipt:payload.requestId
    })});
  });
  const {section,errors}=await go(page);
  await section.locator('#s9Name').fill('  Dana    Test  ');
  await section.locator('#s9Attendance').selectOption('yes');
  await section.locator('#s9Guests').selectOption('3');
  await section.locator('#s9Wish').fill('A lovely celebration!');
  await section.getByRole('button',{name:'Send RSVP'}).click();
  await expect(section.locator('#s9Preview')).toBeVisible();
  await expect(section.locator('#s9PreviewName')).toHaveText('Dana Test');
  await expect(section.locator('#s9PreviewGuests')).toHaveText('3');
  await expect(section.locator('#s9FormStatus')).toContainText('received and saved');
  expect(writes).toHaveLength(1);
  expect(writes[0].requestId).toMatch(/^[a-f0-9-]{36}$/);
  expect(writes[0].shareWish).toBe(false);
  await page.reload();
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(page.locator('#s9Preview')).toBeHidden();
  expect(errors).toEqual([]);
});
test('Declining saves guest count zero and closing cover hides receipt',async({page})=>{
  let sent;
  await page.route('**/api/rsvp',async route=>{
    sent=route.request().postDataJSON();
    await route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({
      ok:true,saved:true,receipt:sent.requestId
    })});
  });
  const {section}=await go(page);
  await section.locator('#s9Name').fill('Guest Example');
  await section.locator('#s9Attendance').selectOption('no');
  await expect(section.locator('#s9Guests')).toBeDisabled();
  await section.getByRole('button',{name:'Send RSVP'}).click();
  await expect(section.locator('#s9PreviewGuests')).toHaveText('Not attending');
  expect(sent.guests).toBe(0);
  await page.evaluate(()=>{document.getElementById('invitation').dataset.state='cover';});
  await expect(section).toHaveJSProperty('inert',true);
  await expect(section.locator('#s9Preview')).toBeHidden();
});
test('Backend error preserves entry and never claims saved',async({page})=>{
  await page.route('**/api/rsvp',route=>route.fulfill({
    status:503,contentType:'application/json',body:JSON.stringify({ok:false,error:'Service unavailable.'})
  }));
  const {section}=await go(page);
  await section.locator('#s9Name').fill('Test Guest');
  await section.locator('#s9Attendance').selectOption('yes');
  await section.getByRole('button',{name:'Send RSVP'}).click();
  await expect(section.locator('#s9FormStatus')).toContainText('Service unavailable');
  await expect(section.locator('#s9Preview')).toBeHidden();
  await expect(section.locator('#s9Name')).toHaveValue('Test Guest');
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
    const exact=await section.evaluate(el=>{
      const inp=el.querySelector('#s9Name'),btn=el.querySelector('.s9-submit'),paper=el.querySelector('.s9-reference-art'),
        wall=el.querySelector('.s9-wall'),wish=el.querySelector('.s9-wish'),base=el.getBoundingClientRect();
      const rc=e=>{const r=e.getBoundingClientRect();return {y:r.y-base.y,height:r.height}};
      return {inputHeight:inp.getBoundingClientRect().height,inputRadius:getComputedStyle(inp).borderRadius,
        buttonBg:getComputedStyle(btn).backgroundColor,buttonRadius:getComputedStyle(btn).borderRadius,
        paperTop:getComputedStyle(paper).top,paperHeight:getComputedStyle(paper).height,
        wall:rc(wall),wishRadius:getComputedStyle(wish).borderRadius};
    });
    expect(Math.abs(exact.inputHeight-58.05)).toBeLessThan(1);
    expect(exact.inputRadius).toBe('12px');
    expect(exact.buttonBg).toBe('rgb(123, 61, 110)');
    expect(exact.buttonRadius).toBe('999px');
    expect(exact.wishRadius).toBe('14px');
    const frame=await section.locator('.s9-frame').evaluate(el=>{
      const r=el.getBoundingClientRect(),s=document.getElementById('rsvp').getBoundingClientRect();
      return {top:r.top-s.top,left:r.left-s.left,width:r.width,
        radius:getComputedStyle(el).borderTopLeftRadius,
        background:getComputedStyle(el).backgroundImage};
    });
    expect(Math.abs(frame.top-5)).toBeLessThan(5);
    expect(frame.left).toBeGreaterThan(8);
    expect(frame.left).toBeLessThan(22);
    expect(frame.background).toContain('linear-gradient');

    const flight=await section.locator('.s9-butterfly').evaluate(el=>({
      top:parseFloat(getComputedStyle(el).top),
      duration:getComputedStyle(el).animationDuration
    }));
    expect(Math.abs(flight.top-(m.section.height-80))).toBeLessThan(2);
    expect(flight.duration).toBe('16s');
    expect(Math.abs(exact.wall.y-756.88)).toBeLessThan(4);
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
test('Local reference mode loads split-wing sprite only with explicit opt-in',async({page})=>{
  // Intercept source files with harmless fixtures: no copyrighted assets enter Git.
  const transparentPng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/2XcAAAAASUVORK5CYII=','base64');
  await page.route('**/assets/reference-dev/section9/*.webp',route=>route.fulfill({
    status:200,contentType:'image/png',body:transparentPng
  }));
  await page.goto('/?section9Reference=1');
  const section=page.locator('#rsvp');
  await expect(section).toHaveClass(/s9-reference-loaded/);
  await expect(section).toHaveClass(/s9-reference-butterfly-loaded/);
  await expect(section).toHaveAttribute('data-reference-art','loaded');
  await expect(section).toHaveAttribute('data-reference-butterfly','loaded');
  const wing=section.locator('.s9-wing-left');
  const style=await wing.evaluate(el=>({image:getComputedStyle(el).backgroundImage,
    size:getComputedStyle(el).backgroundSize,animation:getComputedStyle(el).animationName}));
  expect(style.image).toContain('assets/reference-dev/section9/bfly_1.webp');
  expect(style.size).toBe('200% 100%');
  expect(style.animation).toBe('s9-sprite-flap-left');
});
test('Plain localhost root automatically loads locally staged paper and butterfly',async({page})=>{
  // Harmless generated fixture; no vendor artwork enters Git or CI.
  const transparentPng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/2XcAAAAASUVORK5CYII=','base64');
  await page.route('**/assets/reference-dev/section9/*.webp',route=>route.fulfill({
    status:200,contentType:'image/png',body:transparentPng
  }));
  await page.goto('/');
  const section=page.locator('#rsvp');
  await expect(section).toHaveClass(/s9-reference-loaded/);
  await expect(section).toHaveClass(/s9-reference-butterfly-loaded/);
  expect(new URL(page.url()).searchParams.has('section9Reference')).toBe(false);
  await page.goto('/?section9Reference=0');
  await expect(section).not.toHaveClass(/s9-reference-loaded/);
  await expect(section).not.toHaveClass(/s9-reference-butterfly-loaded/);
  await expect(section.locator('#s9ReferenceArt')).not.toHaveAttribute('src');
});

test('Missing original Section 9 files report diagnostics rather than silently vanishing',async({page})=>{
  await page.route('**/assets/reference-dev/section9/*.webp',route=>route.fulfill({
    status:404,contentType:'text/plain',body:'Not found'
  }));
  await page.goto('/');
  const section=page.locator('#rsvp');
  await expect(section).toHaveAttribute('data-reference-art','missing');
  await expect(section).toHaveAttribute('data-reference-butterfly','missing');
  await expect(section).not.toHaveClass(/s9-reference-loaded/);
  await expect(section).not.toHaveClass(/s9-reference-butterfly-loaded/);
  await expect(section.locator('#s9ReferenceArt')).not.toHaveAttribute('src');
});

test('Missing optional butterfly sprite gracefully falls back to CSS art',async({page})=>{
  await page.route('**/assets/reference-dev/section9/bfly_1.webp',route=>route.fulfill({status:404,body:'not found'}));
  await page.goto('/?section9Reference=1');
  const section=page.locator('#rsvp');
  await expect(section).toHaveAttribute('data-reference-butterfly','missing');
  await expect(section).not.toHaveClass(/s9-reference-butterfly-loaded/);
  const style=await section.locator('.s9-wing-left').evaluate(el=>getComputedStyle(el).backgroundImage);
  expect(style).toContain('radial-gradient');
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
