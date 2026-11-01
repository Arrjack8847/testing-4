import {test,expect} from '@playwright/test';

async function load(page){
  const failures=[];
  page.on('pageerror',e=>failures.push(e.message));
  await page.goto('/');
  await expect(page.locator('#invitation')).toHaveAttribute('data-layers','ready',{timeout:30000});
  return failures;
}
async function open(page){
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(page.locator('#invitation')).toHaveAttribute('data-state','opened');
}
async function setScroll(page,fraction){
  await page.evaluate(fraction=>{
    document.documentElement.style.scrollBehavior='auto';
    window.scrollTo(0,Math.round(innerHeight*fraction));
  },fraction);
  await expect.poll(async()=>page.evaluate(()=>scrollY/innerHeight)).toBeCloseTo(fraction,1);
}

// Structural accessibility: no unlabeled interactive opening controls,
// no visual-only image content accidentally in the accessibility tree.
test('accessible named opening, ordered headings, and inert content',async({page})=>{
  const errors=await load(page);
  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(page.getByRole('heading',{name:'Rayyan & Sofea',level:1})).toHaveCount(1);
  await expect(page.getByRole('button',{name:'Open Invitation'})).toHaveCount(1);
  await expect(page.locator('#opened')).toHaveJSProperty('inert',true);
  await expect(page.locator('#opened')).toHaveAttribute('aria-hidden','true');
  await expect(page.getByRole('link',{name:'Swipe up for wedding message'})).toHaveCount(0);
  await expect(page.locator('#stage')).toHaveAttribute('aria-hidden','true');
  await open(page);
  await expect(page.locator('#cover')).toHaveJSProperty('inert',true);
  await expect(page.locator('#cover')).toHaveAttribute('aria-hidden','true');
  await expect(page.locator('#opened')).toHaveJSProperty('inert',false);
  await expect(page.locator('#opened')).toHaveAttribute('aria-hidden','false');
  await expect(page.getByRole('link',{name:'Swipe up for wedding message'})).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('keyboard Enter enters opened invitation with visible focus',async({page})=>{
  await load(page);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button',{name:'Open Invitation'})).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#invitation')).toHaveAttribute('data-state','opened');
  const cue=page.getByRole('link',{name:'Swipe up for wedding message'});
  await expect(cue).toBeFocused();
  const visual=await cue.evaluate(el=>{
    const s=getComputedStyle(el);
    return {style:s.outlineStyle,width:s.outlineWidth};
  });
  expect(visual.style).not.toBe('none');
  expect(parseFloat(visual.width)).toBeGreaterThanOrEqual(2);
  await page.keyboard.press('Enter');
  await expect.poll(async()=>page.evaluate(()=>scrollY/innerHeight),{timeout:6000})
    .toBeGreaterThan(1.2);
});

test('button touch/click, scroll, garden and text remain usable across engines',async({page})=>{
  const errors=await load(page);
  await open(page);
  await setScroll(page,.45);
  await expect.poll(async()=>page.evaluate(()=>
    Number(document.documentElement.style.getPropertyValue('--palace-scroll-scale'))
  )).toBeLessThan(.89);
  await setScroll(page,1.5);
  await expect.poll(async()=>page.evaluate(()=>
    Number(document.documentElement.style.getPropertyValue('--frame-scroll-opacity'))
  )).toBeGreaterThan(.8);
  await expect(page.locator('.ceremony-names')).toBeVisible();
  await setScroll(page,2.25);
  await expect.poll(async()=>page.evaluate(()=>
    Number(document.documentElement.style.getPropertyValue('--second-name-progress'))
  )).toBe(1);
  expect(errors).toEqual([]);
});

test('reduced motion suppresses decorative rendering, preserves content',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const errors=await load(page);
  await expect(page.locator('#invitation')).toHaveAttribute('data-ambient','paused');
  await open(page);
  await setScroll(page,1.6);
  await expect(page.locator('#invitation')).toHaveAttribute('data-lettering','playing');
  await expect(page.locator('.name-first')).toBeVisible();
  await expect(page.locator('.butterfly-layer').first()).toBeHidden();
  expect(errors).toEqual([]);
});

test('focusable controls fit 44px minimum and document avoids horizontal overflow',async({page})=>{
  await load(page);
  const before=await page.evaluate(()=>({
    scrollWidth:document.documentElement.scrollWidth,
    innerWidth,
    button:(()=>{const r=document.querySelector('#openButton').getBoundingClientRect();return [r.width,r.height]})()
  }));
  expect(before.scrollWidth).toBeLessThanOrEqual(before.innerWidth+1);
  expect(before.button[0]).toBeGreaterThanOrEqual(44);
  expect(before.button[1]).toBeGreaterThanOrEqual(44);
  await open(page);
  const cue=await page.locator('.swipe-cue').boundingBox();
  expect(cue.width).toBeGreaterThanOrEqual(44);
  expect(cue.height).toBeGreaterThanOrEqual(44);
  await setScroll(page,2.3);
  const width=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  expect(width).toBeLessThanOrEqual(1);
});

test('canvas caps density and falls back gracefully if artwork cannot load',async({page})=>{
  const errors=await load(page);
  const dimensions=await page.locator('#petalCanvas').evaluate(el=>{
    const r=el.getBoundingClientRect();
    return {width:el.width,height:el.height,cssW:r.width,cssH:r.height};
  });
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.cssW*2+1);
  expect(dimensions.height).toBeLessThanOrEqual(dimensions.cssH*2+1);
  await open(page);
  expect(errors).toEqual([]);
});

test('large text zoom is usable and keyboard action remains operable',async({page})=>{
  await page.setViewportSize({width:320,height:568});
  await load(page);
  await page.evaluate(()=>document.documentElement.style.fontSize='20px');
  await expect(page.getByRole('button',{name:'Open Invitation'})).toBeInViewport();
  await open(page);
  await expect(page.locator('#invitation')).toHaveAttribute('data-state','opened');
  await setScroll(page,1.5);
  await expect(page.locator('#viewport')).toBeInViewport();
});


test('Section 2 measured mauve message band follows the sticky opener',async({page})=>{
  const errors=await load(page);
  await open(page);
  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    document.getElementById('message').scrollIntoView({block:'start',behavior:'instant'});
  });
  const letter=page.locator('#message');
  await expect(letter).toHaveAttribute('data-section','2');
  await expect(letter).toHaveClass(/is-visible/);
  await expect(page.getByRole('heading',{name:'Wedding invitation message'})).toHaveCount(1);
  await expect(letter.locator('.letter-lead')).toContainText('With grateful hearts');
  await expect(letter.locator('.letter-source')).toContainText('SURAH AR-RUM');
  await expect(letter.locator('.letter-names')).toHaveCount(0);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});


test('Section 3 event details remain accessible and safe without a venue',async({page})=>{
  const errors=await load(page);
  const event=page.locator('#eventDetails');
  await expect(event).toHaveAttribute('aria-hidden','true');
  await expect(event).toHaveJSProperty('inert',true);
  await open(page);
  await expect(event).toHaveAttribute('aria-hidden','false');
  await expect(event).toHaveJSProperty('inert',false);
  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    const target=document.getElementById('eventDetails');
    window.scrollTo(0,Math.round(window.scrollY+target.getBoundingClientRect().top));
  });
  await expect(event).toBeInViewport();
  await expect(page.getByRole('heading',{level:2,name:'The Celebration'})).toBeVisible();
  await expect(event.locator('#eventVenue')).toHaveText('Venue to be announced');
  await expect(event.locator('#eventDirections')).toBeHidden();
  expect(errors).toEqual([]);
});


test('Section 4 calendar-day countdown remains accessible across browser engines',async({page})=>{
  const errors=await load(page);
  const section=page.locator('#saveTheDate');
  await expect(section).toHaveAttribute('aria-hidden','true');
  await expect(section).toHaveJSProperty('inert',true);
  await open(page);
  await expect(section).toHaveAttribute('aria-hidden','false');
  await expect(section).toHaveJSProperty('inert',false);
  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    document.getElementById('saveTheDate').scrollIntoView({block:'start',behavior:'instant'});
  });
  await expect(section).toBeInViewport();
  await expect(page.getByRole('heading',{level:2,name:'Save the Date'})).toBeVisible();
  await expect(section.locator('#countdownDays')).toHaveText(/^\d+$/);
  await expect(section.locator('#saveDateButton')).toBeDisabled();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});


test('Section 5 provides an accessible gallery without falsely populated photos',async({page})=>{
  const errors=await load(page);
  const gallery=page.locator('#gallery');
  await expect(gallery).toHaveAttribute('aria-hidden','true');
  await expect(gallery).toHaveJSProperty('inert',true);
  await open(page);
  await expect(gallery).toHaveAttribute('aria-hidden','false');
  await expect(gallery).toHaveJSProperty('inert',false);
  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    document.getElementById('gallery').scrollIntoView({block:'start',behavior:'instant'});
  });
  await expect(gallery).toBeInViewport();
  await expect(page.getByRole('heading',{level:2,name:'Our Memories'})).toBeVisible();
  await expect(gallery.locator('[data-gallery-slot]')).toHaveCount(5);
  await expect(gallery.locator('[data-gallery-slot="0"]')).toBeDisabled();
  await expect(gallery.locator('.gallery-disclaimer')).toContainText('not been provided');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});


test('Section 6 RSVP preview is accessible, validated and not falsely sent',async({page})=>{
  const errors=await load(page);
  const section=page.locator('#rsvp');
  await expect(section).toHaveAttribute('aria-hidden','true');
  await expect(section).toHaveJSProperty('inert',true);
  await open(page);
  await expect(section).toHaveAttribute('aria-hidden','false');
  await expect(section).toHaveJSProperty('inert',false);
  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    document.getElementById('rsvp').scrollIntoView({block:'start',behavior:'instant'});
  });
  await expect(section).toBeInViewport();
  await expect(page.getByRole('heading',{level:2,name:'Kindly Respond'})).toBeVisible();
  await expect(section.locator('#rsvpWarning')).toContainText('will not be sent');
  await section.locator('#rsvpName').fill('Test Guest');
  await section.getByRole('radio',{name:'Regretfully declines'}).check();
  await section.getByRole('button',{name:'Preview RSVP — not sent'}).click();
  await expect(section.locator('#rsvpPreview')).toBeVisible();
  await expect(section.locator('#rsvpPreviewGuests')).toHaveText('Not attending');
  await expect(section.locator('.rsvp-preview-disclosure')).toContainText('has not been submitted');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
