import {test,expect} from '@playwright/test';

async function openCouple(page){
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  const section=page.locator('#couple');
  await expect(section).toHaveAttribute('aria-hidden','true');
  await expect(section).toHaveJSProperty('inert',true);
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(section).toHaveJSProperty('inert',false);
  await expect(section).toHaveAttribute('aria-hidden','false');
  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    document.getElementById('couple').scrollIntoView({block:'start',behavior:'instant'});
  });
  await expect(section).toBeInViewport();
  return {section,errors};
}
test('reference-inspired couple scene follows mauve and keeps events afterward',async({page})=>{
  const {section,errors}=await openCouple(page);
  await expect(section).toHaveAttribute('data-section','3');
  await expect(page.getByRole('heading',{level:2,name:'The Couple'})).toHaveCount(1);
  await expect(section.locator('.couple-portrait')).toHaveCount(2);
  await expect(section.locator('#groomPortrait')).toHaveAttribute('alt',/placeholder/);
  await expect(section.locator('#bridePortrait')).toHaveAttribute('alt',/placeholder/);
  await expect(section.locator('.couple-name').first()).toHaveText('Rayyan');
  await expect(section.locator('.couple-name').nth(1)).toHaveText('Sofea');
  await expect(section.locator('.couple-demo-note')).toContainText('Replace');
  const adjacency=await section.evaluate(el=>({
    prior:el.previousElementSibling?.id,next:el.nextElementSibling?.id,
    following:el.nextElementSibling?.getAttribute('data-section')
  }));
  expect(adjacency).toEqual({prior:'message',next:'eventDetails',following:'4'});
  await expect(page.locator('#eventDetails #eventVenue')).toContainText('Venue to be announced');
  expect(errors).toEqual([]);
});
test('couple layout has measured first-portrait geometry at 390px and never overflows',async({page},testInfo)=>{
  const {section,errors}=await openCouple(page);
  await section.locator('.couple-portrait').first().scrollIntoViewIfNeeded();
  await expect(section.locator('.couple-portrait').first()).toHaveClass(/in-view/);
  const sizes=await section.evaluate(el=>{
    const band=el.getBoundingClientRect(),intro=el.querySelector('.couple-intro').getBoundingClientRect();
    const arch=el.querySelector('.couple-arch').getBoundingClientRect();
    const first=el.querySelector('.couple-portrait').getBoundingClientRect();
    const images=[...el.querySelectorAll('.couple-portrait img')].map(img=>({complete:img.complete,width:img.naturalWidth}));
    const next=document.getElementById('eventDetails').getBoundingClientRect();
    return {viewport:innerWidth,h:band.height,top:band.top+scrollY,
      archX:arch.x,archOffset:arch.top-band.top,
      introOffset:intro.top-band.top,portraitOffset:first.top-band.top,
      portraitWidth:first.width,portraitHeight:first.height,
      seam:next.top-band.bottom,overflow:document.documentElement.scrollWidth-innerWidth,images};
  });
  expect(sizes.top/await page.evaluate(()=>innerHeight)).toBeCloseTo(3+762/await page.evaluate(()=>innerHeight),0);
  expect(Math.abs(sizes.seam)).toBeLessThanOrEqual(1);
  expect(sizes.overflow).toBeLessThanOrEqual(1);
  expect(sizes.images.every(i=>i.complete&&i.width>0)).toBe(true);
  if(sizes.viewport===390){
    expect(sizes.h).toBeGreaterThanOrEqual(1839);
    expect(sizes.h).toBeLessThan(1843);
    expect(sizes.archX).toBeCloseTo(12,0);
    expect(sizes.archOffset).toBeCloseTo(129,0);
    expect(sizes.introOffset).toBeCloseTo(225,0);
    expect(sizes.portraitOffset).toBeCloseTo(359,0);
    expect(sizes.portraitWidth).toBeCloseTo(240.5,0);
    expect(sizes.portraitHeight).toBeCloseTo(332.7,0);
  }
  await page.screenshot({path:testInfo.outputPath('section3-couple-first-'+testInfo.project.name+'.png'),animations:'disabled'});
  expect(errors).toEqual([]);
});
test('second portrait has a separate reveal, and section joins Celebration without gaps',async({page},testInfo)=>{
  const {section,errors}=await openCouple(page);
  const second=section.locator('.couple-profile--bride .couple-portrait');
  await second.scrollIntoViewIfNeeded();
  await expect(second).toHaveClass(/in-view/);
  const values=await section.evaluate(el=>{
    const a=el.querySelector('.couple-profile--groom .couple-portrait').getBoundingClientRect();
    const b=el.querySelector('.couple-profile--bride .couple-portrait').getBoundingClientRect();
    return {difference:b.top-a.top,overflow:document.documentElement.scrollWidth-innerWidth};
  });
  if(await page.evaluate(()=>innerWidth)===390){
    expect(values.difference).toBeGreaterThan(748);
    expect(values.difference).toBeLessThan(768);
  }
  expect(values.overflow).toBeLessThanOrEqual(1);
  await page.screenshot({path:testInfo.outputPath('section3-couple-second-'+testInfo.project.name+'.png'),animations:'disabled'});
  expect(errors).toEqual([]);
});
test('couple scene respects Reduced Motion and disables decorative petals',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const {section}=await openCouple(page);
  const first=section.locator('.couple-portrait').first();
  await first.scrollIntoViewIfNeeded();
  await expect(section).toHaveAttribute('data-petals-active','false');
  const style=await first.evaluate(el=>({
    opacity:getComputedStyle(el).opacity,
    transform:getComputedStyle(el).transform
  }));
  expect(style).toEqual({opacity:'1',transform:'none'});
  await expect(section.locator('.couple-floating-petals span').first()).toHaveCSS('animation-name','none');
});

test('original floral scene parallax follows scrolling without moving cards',async({page})=>{
  const {section}=await openCouple(page);
  const sample=async targetY=>{
    await page.evaluate(y=>window.scrollTo({top:Math.round(y),behavior:'instant'}),targetY);
    await expect.poll(()=>page.evaluate(()=>{
      const section=document.getElementById('couple');
      return section.style.getPropertyValue('--couple-bg-y').trim();
    })).not.toBe('');
    return section.evaluate(el=>({
      offset:parseFloat(el.style.getPropertyValue('--couple-bg-y')),
      bg:getComputedStyle(el).backgroundImage,
      overflow:document.documentElement.scrollWidth-innerWidth
    }));
  };
  // Relative section positions are used because 5H is not the same part
  // of the Couple scene at 320x568 and 430x932.
  const target=await section.evaluate(el=>{
    const box=el.getBoundingClientRect();
    return {start:box.top+scrollY,height:box.height,vh:innerHeight};
  });
  const first=await sample(target.start-target.vh*.25);
  const second=await sample(target.start+target.height-target.vh*.4);
  await expect.poll(()=>section.evaluate(el=>parseFloat(el.style.getPropertyValue('--couple-bg-y'))))
    .toBeGreaterThan(5);
  expect(first.offset).toBeLessThan(-10);
  expect(second.bg).toContain('couple-garden-original.svg');
  expect(second.overflow).toBeLessThanOrEqual(1);
});
