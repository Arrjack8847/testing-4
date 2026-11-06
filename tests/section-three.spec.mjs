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
  await expect(section).toHaveAttribute('data-art','reference');
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
  await expect(section.locator('#eventSourcePaper')).toHaveAttribute('src',/(?:tasik-kayangan|reference-dev)\/paper\.webp/);
  await expect(section.locator('#eventSourceButterfly')).toHaveAttribute('src',/anggerik-nirmala\/bfly_white\.webp/);
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
    const links=[...el.querySelectorAll('a')].map(x=>({box:x.getBoundingClientRect(),isMap:x.classList.contains('event-map-link')}));
    return {width:innerWidth,height:sectionBox.height,
      overflow:document.documentElement.scrollWidth-innerWidth,
      body:{left:body.left,right:body.right},
      cards:cards.map(x=>({left:x.left,right:x.right,height:x.height,top:x.top,bottom:x.bottom})),
      links:links.map(({box:x,isMap})=>({width:x.width,height:x.height,left:x.left,right:x.right,isMap}))};
  });
  // Live source four-phone measurements: 320=1742.3, 360=1649.9,
  // 390=1580.9. At 430 the recovered comparison did not include a
  // section-height measurement; avoid inventing one.
  const measuredHeightByWidth={320:1742.3,360:1649.9,390:1580.9};
  if(Object.prototype.hasOwnProperty.call(measuredHeightByWidth,geometry.width)){
    expect(Math.abs(geometry.height-measuredHeightByWidth[geometry.width])).toBeLessThanOrEqual(5);
  }
  await expect(section.locator('.event-card-links')).not.toHaveClass(/event-reveal/);
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
    // The reference ghost link measures 42px while its .955 entrance
    // transform is active. Do not impose the old 43px prototype minimum.
    expect(link.height).toBeGreaterThanOrEqual(link.isMap ? 41 : 43);
    if(link.isMap) expect(link.height).toBeLessThanOrEqual(45.5);
    expect(link.left).toBeGreaterThanOrEqual(-1);
    expect(link.right).toBeLessThanOrEqual(geometry.width+1);
  }
  await section.screenshot({path:testInfo.outputPath('section4-events-full.png'),animations:'disabled'});
  expect(errors).toEqual([]);
});

test('Section 4 source-measured typography, link and countdown styling are retained',async({page})=>{
  const {section,errors}=await openEvents(page);
  const styles=await section.evaluate(el=>{
    const css=(selector)=>getComputedStyle(el.querySelector(selector));
    const time=css('.event-card-time');
    const diamond=css('.event-card-diamond');
    const place=css('.event-card-place');
    const address=css('.event-card-address');
    const map=css('.event-map-link');
    const grid=css('.event-countdown-grid');
    const tile=css('.event-countdown-grid span');
    return {
      timeBottomMargin:time.marginBottom,
      diamondFontSize:diamond.fontSize,
      diamondLineHeight:diamond.lineHeight,
      diamondBottomMargin:diamond.marginBottom,
      placeBottomMargin:place.marginBottom,
      addressFontSize:address.fontSize,
      addressLineHeight:address.lineHeight,
      addressBottomMargin:address.marginBottom,
      mapMinHeight:map.minHeight,
      gridGap:grid.columnGap,
      tileColor:tile.backgroundColor,
      timerNumberFontSize:css('.event-countdown-grid strong').fontSize,
      titleFontSize:css('.event-card-title').fontSize,
      dateFontSize:css('.event-card-date').fontSize,
      timeFontSize:time.fontSize,
      venueFontSize:place.fontSize,
      tileRadius:tile.borderRadius
    };
  });
  expect(styles.timeBottomMargin).toBe('18px');
  expect(styles.diamondFontSize).toBe('18px');
  expect(styles.diamondLineHeight).toBe('29.7px');
  expect(styles.diamondBottomMargin).toBe('18px');
  expect(styles.placeBottomMargin).toBe('0px');
  expect(styles.addressFontSize).toBe('16px');
  expect(styles.addressLineHeight).toBe('26.4px');
  expect(styles.addressBottomMargin).toBe('16px');
  expect(styles.mapMinHeight).toBe('44px');
  expect(styles.gridGap).toBe('14px');
  expect(styles.tileColor).toBe('rgb(92, 38, 79)');
  expect(styles.timerNumberFontSize).toBe('28px');
  expect(styles.titleFontSize).toBe('42px');
  expect(styles.dateFontSize).toBe('22px');
  expect(styles.timeFontSize).toBe('14px');
  expect(styles.venueFontSize).toBe('19px');

  expect(styles.tileRadius).toBe('12px');
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

test('Section 4 source-art is the development default and leaves earlier sections unchanged',async({page})=>{
  const {section}=await openEvents(page);
  await expect(section).toHaveAttribute('data-art','reference');
  await expect(section.locator('#eventSourcePaper')).toHaveAttribute(
    'src',/(?:https:\/\/undangankahwin\.com\/images\/concierge\/packs\/tasik-kayangan|assets\/reference-dev)\/paper\.webp/);
  await expect(section.locator('#eventSourceButterfly')).toHaveAttribute(
    'src','https://undangankahwin.com/images/concierge/packs/anggerik-nirmala/bfly_white.webp');
  await expect(section.locator('.event-reference-card')).toHaveCount(2);
  // Local/remote image outcome is checked, never presumed (hotlink blocking).
  await expect(section).toHaveAttribute('data-reference-paper',/^(loading|loaded|failed)$/);
  // main already approved the Couple reference as the default; integrating
  // Events must preserve that approved rendering.
  await expect(page.locator('#couple')).toHaveAttribute('data-art','reference');
  await expect(page.locator('#message')).toHaveAttribute('data-section','2');
});

test('Section 4 uses staged local files for all measured source-art layers when present',async({page})=>{
  // The CI fixture uses tiny synthetic SVGs, not copyrighted vendor files.
  // This checks local path selection only; exact source identity is checked
  // separately by the permission-gated staging script.
  const syntheticSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="white"/></svg>';
  for (const suffix of ['paper.webp','arch_event.svg','bfly_white.webp']) {
    await page.route('**/assets/reference-dev/'+suffix,route=>route.fulfill({
      status:200,contentType:'image/svg+xml',body:syntheticSVG
    }));
  }
  const {section,errors}=await openEvents(page);
  await expect(section).toHaveAttribute('data-reference-paper-source','local');
  await expect(section).toHaveAttribute('data-reference-frame-source','local');
  await expect(section).toHaveAttribute('data-reference-wing-source','local');
  await expect(section).toHaveAttribute('data-reference-paper','loaded');
  await expect(section.locator('#eventSourcePaper')).toHaveAttribute(
    'src','./assets/reference-dev/paper.webp');
  const frameSource = await section.locator('.event-reference-card').first().evaluate(
    el=>getComputedStyle(el,'::before').borderImageSource);
  expect(frameSource).toContain('assets/reference-dev/arch_event.svg');
  const sprite = await section.locator('.event-reference-butterfly').evaluate(el=>{
    const b=el.getBoundingClientRect();
    const left=el.querySelector('.event-reference-butterfly-left');
    const right=el.querySelector('.event-reference-butterfly-right');
    const ls=getComputedStyle(left);
    const rs=getComputedStyle(right);
    return {
      width:b.width,height:b.height,opacity:getComputedStyle(el).opacity,
      wingWidth:left.getBoundingClientRect().width,
      leftPosition:ls.backgroundPosition,
      rightPosition:rs.backgroundPosition,
      leftSize:ls.backgroundSize,rightSize:rs.backgroundSize,
      leftImage:ls.backgroundImage,rightImage:rs.backgroundImage
    };
  });
  expect(sprite.width).toBe(44);
  expect(sprite.height).toBe(34);
  expect(sprite.wingWidth).toBe(22);
  expect(sprite.opacity).toBe('0');
  expect(sprite.leftSize).toBe('200% 100%');
  expect(sprite.rightSize).toBe('200% 100%');
  expect(sprite.leftPosition).toMatch(/^0(?:px|%) 0(?:px|%)$/);
  expect(sprite.rightPosition).toMatch(/^100% 0(?:px|%)$/);
  expect(sprite.leftImage).toContain('assets/reference-dev/bfly_white.webp');
  expect(sprite.rightImage).toContain('assets/reference-dev/bfly_white.webp');
  expect(errors).toEqual([]);
});

test('Section 4 pin-camera stays bounded, returns on backward scroll, and respects Reduced Motion',async({page})=>{
  const {section}=await openEvents(page);
  const top=await section.evaluate(el=>el.getBoundingClientRect().top+scrollY);
  // Camera updates on requestAnimationFrame; wait for the measured
  // 0.0427px/scroll-pixel target rather than reading a stale value.
  async function sampleAt(offset) {
    await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),top+offset);
    const expected=Number(Math.min(24,Math.max(-20,offset*.0427)).toFixed(2));
    await expect.poll(async()=>Number(await section.getAttribute('data-event-camera')),
      {timeout:5000}).toBeCloseTo(expected,1);
    return Number(await section.getAttribute('data-event-camera'));
  }
  const at150=await sampleAt(150);
  const at500=await sampleAt(500);
  const back=await sampleAt(150);
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
  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    document.getElementById('eventDetails').scrollIntoView({block:'start',behavior:'instant'});
  });
  await expect(section).toHaveAttribute('data-asset-lifecycle','near');
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
  expect(visuals.paperFit).toBe('cover');
  expect(visuals.paperSize).toEqual([1080,1920]);
  expect(visuals.archLoaded).toBe(true);
  expect(visuals.tileCount).toBe(4);
  expect(visuals.tileDisplay).toBe('grid');
  // The 2026-11-03 live source computed color is rgb(92,38,79); the previous 97,40,82 assertion was stale.
  expect(visuals.tileBackground).toBe('rgb(92, 38, 79)');
  expect(visuals.timerValue).toMatch(/^\d+$/);
  expect(visuals.venueWeight).toBe('600');
  expect(visuals.directionsCase).toBe('uppercase');
  expect(visuals.guideLine).toBe('""');
  expect(errors).toEqual([]);
});


test('single localhost root URL joins reference Couple -> reference Events -> Order of the Day',async({page})=>{
  const {section,errors}=await openEvents(page);
  const combined=await section.evaluate(events=>{
    const couple=document.getElementById('couple');
    const save=document.getElementById('runningOrder');
    const rect1=couple.getBoundingClientRect();
    const rect2=events.getBoundingClientRect();
    const rect3=save.getBoundingClientRect();
    return {
      coupleArt:couple.dataset.art,
      eventsArt:events.dataset.art,
      eventPaper:events.querySelector('#eventSourcePaper').getAttribute('src')||'',
      eventPaperSource:events.dataset.referencePaperSource,
      prior:events.previousElementSibling?.id,
      following:events.nextElementSibling?.id,
      section3To4Gap:rect2.top-rect1.bottom,
      section4To5Gap:rect3.top-rect2.bottom,
      pageOverflow:document.documentElement.scrollWidth-innerWidth
    };
  });
  expect(combined.coupleArt).toBe('reference');
  expect(combined.eventsArt).toBe('reference');
  // Local authorized art is intentionally preferred when staged; the same
  // reference file remains the remote fallback when not present.
  expect(['local','remote']).toContain(combined.eventPaperSource);
  expect(combined.eventPaper).toContain(combined.eventPaperSource==='local'
    ? '/assets/reference-dev/paper.webp' : '/tasik-kayangan/paper.webp');
  expect(combined.prior).toBe('couple');
  expect(combined.following).toBe('runningOrder');
  expect(Math.abs(combined.section3To4Gap)).toBeLessThanOrEqual(1);
  expect(Math.abs(combined.section4To5Gap)).toBeLessThanOrEqual(1);
  expect(combined.pageOverflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
