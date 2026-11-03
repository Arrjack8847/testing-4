import {test,expect} from '@playwright/test';

// Repo names this spec "section-three" for historical reasons; the DOM's
// #eventDetails[data-section=4] is the Events section AFTER The Couple.
async function openEvents(page,query='') {
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/'+query);
  const section=page.locator('#eventDetails');
  await expect(section).toHaveAttribute('aria-hidden','true');
  await expect(section).toHaveJSProperty('inert',true);
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(section).toHaveAttribute('aria-hidden','false');
  await expect(section).toHaveJSProperty('inert',false);
  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    document.getElementById('eventDetails').scrollIntoView({block:'start',behavior:'instant'});
  });
  await expect(section).toBeInViewport();
  return {section,errors};
}

test('Section 4 shows TWO reference-example ceremonies, source venue links and clear demo disclosure',async({page})=>{
  const {section,errors}=await openEvents(page);
  await expect(section).toHaveAttribute('data-section','4');
  await expect(section).toHaveAttribute('data-art','original');
  await expect(section.getByRole('heading',{name:'Akad Nikah',level:2})).toBeVisible();
  await expect(section.getByRole('heading',{name:'Wedding Reception',level:2})).toBeVisible();
  await expect(section.locator('.event-reference-card')).toHaveCount(2);
  await expect(section.locator('.event-card-date')).toHaveCount(2);
  await expect(section.locator('.event-card-date').first()).toHaveAttribute('datetime','2027-01-23');
  await expect(section.locator('#eventTime')).toContainText('10:00 AM');
  await expect(section.locator('#eventTime')).toContainText('12:00 PM');
  await expect(section.locator('#eventVenue')).toHaveText('Masjid Wilayah Persekutuan');
  await expect(section.locator('.event-card-reception')).toContainText('7:30 PM');
  await expect(section.locator('.event-card-reception')).toContainText('St. Regis Kuala Lumpur');
  await expect(section.locator('.event-map-link')).toHaveCount(3);
  await expect(section.locator('#eventDirections')).toHaveAttribute('href',/www.google.com\/maps\/search/);
  await expect(section.locator('.event-waze-link')).toHaveAttribute('href',/waze.com\/ul/);
  await expect(section.getByRole('link',{name:'Add to Calendar'})).toHaveAttribute('href',/calendar\/render/);
  await expect(section.locator('.event-demo-note')).toContainText('Demonstration only');
  await expect(section.locator('#eventSourcePaper')).not.toHaveAttribute('src');
  await expect(section.locator('#eventSourceButterfly')).not.toHaveAttribute('src');
  expect(errors).toEqual([]);
});

test('Section 4 event cards, countdown and edge positions fit each phone viewport',async({page},testInfo)=>{
  const {section,errors}=await openEvents(page);
  await expect(section.locator('.event-card-nikah')).toBeVisible();
  await expect(section.locator('.event-card-reception')).toBeVisible();
  const geometry=await section.evaluate(el=>{
    const sectionBox=el.getBoundingClientRect();
    const body=el.querySelector('.event-body').getBoundingClientRect();
    const cards=[...el.querySelectorAll('.event-reference-card')].map(x=>x.getBoundingClientRect());
    const links=[...el.querySelectorAll('a')].map(x=>x.getBoundingClientRect());
    return {width:innerWidth,height:sectionBox.height,
      overflow:document.documentElement.scrollWidth-innerWidth,
      body:{left:body.left,right:body.right},
      cards:cards.map(x=>({left:x.left,right:x.right,height:x.height,top:x.top,bottom:x.bottom})),
      links:links.map(x=>({width:x.width,height:x.height,left:x.left,right:x.right}))};
  });
  expect(geometry.overflow).toBeLessThanOrEqual(1);
  expect(geometry.height).toBeGreaterThanOrEqual(1581);
  expect(geometry.body.left).toBeGreaterThanOrEqual(-1);
  expect(geometry.body.right).toBeLessThanOrEqual(geometry.width+1);
  expect(geometry.cards).toHaveLength(2);
  for(const card of geometry.cards){
    expect(card.left).toBeGreaterThanOrEqual(-1);
    expect(card.right).toBeLessThanOrEqual(geometry.width+1);
    expect(card.height).toBeGreaterThan(400);
  }
  expect(geometry.cards[1].top).toBeGreaterThan(geometry.cards[0].bottom);
  for(const link of geometry.links){
    expect(link.height).toBeGreaterThanOrEqual(43);
    expect(link.left).toBeGreaterThanOrEqual(-1);
    expect(link.right).toBeLessThanOrEqual(geometry.width+1);
  }
  await section.screenshot({path:testInfo.outputPath('section4-events-full.png'),animations:'disabled'});
  expect(errors).toEqual([]);
});

test('Section 4 countdown changes every second and does not claim real wedding details',async({page})=>{
  const {section}=await openEvents(page);
  for(const id of ['eventCountDays','eventCountHours','eventCountMinutes','eventCountSeconds']){
    await expect(section.locator('#'+id)).toHaveText(/^\d{2,3}$/);
  }
  const before=await section.locator('#eventCountSeconds').textContent();
  await page.waitForTimeout(1400);
  const after=await section.locator('#eventCountSeconds').textContent();
  expect(after).not.toBe(before);
  await expect(section.locator('.event-demo-note')).toContainText('not a confirmed invitation');
});

test('Section 4 source-art comparison is opt-in and leaves earlier sections unchanged',async({page})=>{
  const {section}=await openEvents(page,'?eventsReference=1');
  await expect(section).toHaveAttribute('data-art','reference');
  await expect(section.locator('#eventSourcePaper')).toHaveAttribute(
    'src','https://undangankahwin.com/images/concierge/packs/tasik-kayangan/paper.webp');
  await expect(section.locator('#eventSourceButterfly')).toHaveAttribute(
    'src','https://undangankahwin.com/images/concierge/packs/anggerik-nirmala/bfly_white.webp');
  await expect(section.locator('.event-reference-card')).toHaveCount(2);
  // Local/remote image outcome is checked, never presumed (hotlink blocking).
  await expect(section).toHaveAttribute('data-reference-paper',/^(loading|loaded|failed)$/);
  await expect(page.locator('#couple')).not.toHaveAttribute('data-art','reference');
  await expect(page.locator('#message')).toHaveAttribute('data-section','2');
});

test('Section 4 pin-camera stays bounded, returns on backward scroll, and respects Reduced Motion',async({page})=>{
  const {section}=await openEvents(page);
  const top=await section.evaluate(el=>el.getBoundingClientRect().top+scrollY);
  await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),top+150);
  await expect.poll(()=>section.getAttribute('data-event-camera')).not.toBeNull();
  const at150=Number(await section.getAttribute('data-event-camera'));
  await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),top+500);
  await page.waitForTimeout(80);
  const at500=Number(await section.getAttribute('data-event-camera'));
  await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),top+150);
  await page.waitForTimeout(80);
  const back=Number(await section.getAttribute('data-event-camera'));
  expect(at500).toBeGreaterThan(at150);
  expect(Math.abs(back-at150)).toBeLessThan(.5);
  expect(Math.abs(at500)).toBeLessThanOrEqual(24);
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect.poll(async()=>Number(await section.getAttribute('data-event-camera'))).toBe(0);
  await expect(section.locator('.event-card-title').first()).toBeVisible();
  const title=await section.locator('.event-card-title').first().evaluate(el=>getComputedStyle(el).opacity);
  expect(title).toBe('1');
});

test('Section 3 Couple → Section 4 Events preserves an exact seam and Section 3 geometry',async({page},testInfo)=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Open Invitation'}).click();
  const geometry=await page.evaluate(()=>{
    const couple=document.getElementById('couple');
    const events=document.getElementById('eventDetails');
    const body=document.getElementById('invitation');
    const coupleBox=couple.getBoundingClientRect(),eventBox=events.getBoundingClientRect();
    document.documentElement.style.scrollBehavior='auto';
    window.scrollTo(0,Math.round(scrollY+eventBox.top-innerHeight*.5));
    return {adjacent:couple.nextElementSibling===events,
      gap:eventBox.top-coupleBox.bottom,
      coupleHeight:coupleBox.height,
      overflow:document.documentElement.scrollWidth-innerWidth,
      coverOpen:body.dataset.state==='opened'};
  });
  expect(geometry.adjacent).toBe(true);
  expect(Math.abs(geometry.gap)).toBeLessThanOrEqual(1);
  expect(geometry.coupleHeight).toBeGreaterThan(1750);
  expect(geometry.overflow).toBeLessThanOrEqual(1);
  expect(geometry.coverOpen).toBe(true);
  await expect(page.locator('#couple')).toBeInViewport();
  await expect(page.locator('#eventDetails')).toBeInViewport();
  if(testInfo.project.name==='iphone-390') {
    await page.screenshot({path:testInfo.outputPath('section3-to-4-events-seam.png'),animations:'disabled'});
  }
});


test('390px Section 4 shared arch follows measured source geometry, without clipping',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='iphone-390','Measured mobile reference at 390x844');
  await page.emulateMedia({reducedMotion:'reduce'});
  const {section,errors}=await openEvents(page);
  const measure=await section.evaluate(el=>{
    const base=el.getBoundingClientRect();
    const rect=selector=>{
      const box=el.querySelector(selector).getBoundingClientRect();
      return {x:box.x,y:box.y-base.y,w:box.width,h:box.height};
    };
    return {
      arch:rect('.event-shared-arch'),
      first:rect('.event-card-nikah'),
      second:rect('.event-card-reception'),
      firstTitle:rect('#eventNikahHeading'),
      secondTitle:rect('#eventReceptionHeading'),
      date:rect('.event-card-nikah .event-card-date'),
      time:rect('#eventTime'),
      venue:rect('#eventVenue'),
      venue2:rect('.event-card-reception .event-card-place'),
      maps:rect('#eventDirections'),
      calendar:rect('.event-calendar-link'),
      sectionHeight:base.height,
      dateFont:getComputedStyle(el.querySelector('.event-card-nikah .event-card-date')).fontSize,
      timeFont:getComputedStyle(el.querySelector('#eventTime')).fontSize,
      firstTitleFont:getComputedStyle(el.querySelector('#eventNikahHeading')).fontSize,
      secondTitleFont:getComputedStyle(el.querySelector('#eventReceptionHeading')).fontSize,
      overflow:document.documentElement.scrollWidth-innerWidth
    };
  });
  // Reference at 390x844: shared arch x26/w338/y120, first title at
  // relative (x62,y224), second event row y666.5, second title y770.5.
  expect(measure.arch.x).toBeCloseTo(26,0);
  expect(measure.arch.w).toBeCloseTo(338,0);
  expect(measure.arch.y).toBeCloseTo(120,0);
  expect(measure.first.x).toBeCloseTo(32,0);
  expect(measure.first.w).toBeCloseTo(326,0);
  expect(measure.firstTitle.x).toBeCloseTo(62,0);
  expect(measure.firstTitle.y).toBeCloseTo(224,0);
  expect(measure.firstTitleFont).toBe('42px');
  expect(measure.secondTitleFont).toBe('42px');
  expect(Math.abs(measure.second.y-666.5)).toBeLessThanOrEqual(12);
  expect(Math.abs(measure.secondTitle.y-770.5)).toBeLessThanOrEqual(12);
  // Sub-fields and total section height measured on the live source.
  expect(measure.dateFont).toBe('22px');
  expect(measure.timeFont).toBe('14px');
  for(const [key,expected] of [
    ['date',305.3],['time',345.6],['venue',434.3],['venue2',1050.1],
    ['maps',534.5],['calendar',1413.1]
  ]) expect(Math.abs(measure[key].y-expected)).toBeLessThanOrEqual(5);
  expect(Math.abs(measure.sectionHeight-1580.9)).toBeLessThanOrEqual(5);
  expect(measure.overflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});


test('390px reference mode uses source individual arches and reversible paper parallax',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='iphone-390','Reference motion measured at 390x844');
  await page.goto('/?eventsReference=1');
  const section=page.locator('#eventDetails');
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(section).toHaveAttribute('data-reference-paper','loaded',{timeout:16000});
  const arch=await section.locator('.event-card-nikah').evaluate(el=>{
    const style=getComputedStyle(el,'::before');
    return {image:style.borderImageSource,borderWidth:style.borderImageWidth};
  });
  expect(arch.image).toContain('arch_event.svg');
  const wrapImage=await section.locator('.event-shared-arch').evaluate(el=>getComputedStyle(el,'::before').display);
  expect(wrapImage).toBe('none');

  const shifts=[];
  for(const progress of [0,0.5,1,0]){
    await section.evaluate((el,p)=>{
      document.documentElement.style.scrollBehavior='auto';
      const r=el.getBoundingClientRect(),track=Math.max(0,r.height-innerHeight);
      scrollTo(0,Math.round(r.top+scrollY+track*p));
    },progress);
    await expect.poll(async()=>Number(await section.getAttribute('data-event-paper-shift')),{
      timeout:4000
    }).not.toBeNaN();
    await page.waitForTimeout(130);
    shifts.push(Number(await section.getAttribute('data-event-paper-shift')));
  }
  expect(shifts[0]).toBeLessThan(-13);
  expect(Math.abs(shifts[1])).toBeLessThan(2);
  expect(shifts[2]).toBeGreaterThan(13);
  expect(Math.abs(shifts[3]-shifts[0])).toBeLessThan(1);
  const title=section.locator('#eventNikahHeading');
  await expect(title).toHaveClass(/event-reveal/);
  await expect(title).toHaveClass(/in-view/);
  await section.evaluate(el=>scrollTo(0,el.getBoundingClientRect().top+scrollY+el.clientHeight-innerHeight));
  await expect(title).not.toHaveClass(/in-view/);
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect.poll(async()=>Number(await section.getAttribute('data-event-paper-shift'))).toBe(0);
});


test('390px source visual mode keeps full paper edges, true arch SVG and four purple countdown tiles',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='iphone-390','Source screenshot measured at 390x844');
  await page.emulateMedia({reducedMotion:'reduce'});
  const {section,errors}=await openEvents(page,'?eventsReference=1');
  await expect(section).toHaveAttribute('data-reference-paper','loaded',{timeout:16000});
  const visuals=await section.evaluate(async el=>{
    const paper=el.querySelector('#eventSourcePaper');
    const tiles=el.querySelectorAll('.event-countdown-grid span');
    const tileStyle=getComputedStyle(tiles[0]);
    const archSrc='https://undangankahwin.com/images/concierge/packs/tasik-kayangan/arch_event.svg';
    const archLoaded=await new Promise(resolve=>{
      const img=new Image();
      const timeout=setTimeout(()=>resolve(false),9000);
      img.onload=()=>{clearTimeout(timeout);resolve(img.naturalWidth>0)};
      img.onerror=()=>{clearTimeout(timeout);resolve(false)};
      img.src=archSrc;
    });
    return {
      paperFit:getComputedStyle(paper).objectFit,
      paperSize:[paper.naturalWidth,paper.naturalHeight],
      archLoaded,
      tileCount:tiles.length,
      tileDisplay:getComputedStyle(el.querySelector('.event-countdown-grid')).display,
      tileBackground:tileStyle.backgroundColor,
      timerValue:el.querySelector('#eventCountDays').textContent.trim(),
      dateWeight:getComputedStyle(el.querySelector('.event-card-date')).fontWeight,
      venueWeight:getComputedStyle(el.querySelector('#eventVenue')).fontWeight,
      directionsCase:getComputedStyle(el.querySelector('#eventDirections')).textTransform,
      guideLine:getComputedStyle(el.querySelector('.event-card-diamond'),'::before').content
    };
  });
  expect(visuals.paperFit).toBe('fill');
  expect(visuals.paperSize).toEqual([1080,1920]);
  expect(visuals.archLoaded).toBe(true);
  expect(visuals.tileCount).toBe(4);
  expect(visuals.tileDisplay).toBe('grid');
  expect(visuals.tileBackground).toBe('rgb(97, 40, 82)');
  expect(visuals.timerValue).toMatch(/^\d+$/);
  expect(visuals.venueWeight).toBe('600');
  expect(visuals.directionsCase).toBe('uppercase');
  expect(visuals.guideLine).toBe('""');
  expect(errors).toEqual([]);
});
