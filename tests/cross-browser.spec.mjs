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
  await expect(page.getByRole('link',{name:'Swipe up for wedding message'})).toHaveCount(0);
  await expect(page.locator('#stage')).toHaveAttribute('aria-hidden','true');
  await open(page);
  await expect(page.locator('#cover')).toHaveJSProperty('inert',true);
  await expect(page.locator('#opened')).toHaveJSProperty('inert',false);
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
