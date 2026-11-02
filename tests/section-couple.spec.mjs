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
  const first=section.locator('.couple-profile--groom .couple-portrait');
  const second=section.locator('.couple-profile--bride .couple-portrait');
  // Wait for BOTH 900ms scroll-reveal transforms to finish. Measuring one
  // entering card against one settled card produced misleading 22px offsets.
  await first.scrollIntoViewIfNeeded();
  await expect(first).toHaveClass(/in-view/);
  await expect.poll(()=>first.evaluate(el=>getComputedStyle(el).transform)).toBe('none');
  await second.scrollIntoViewIfNeeded();
  await expect(second).toHaveClass(/in-view/);
  await expect.poll(()=>second.evaluate(el=>getComputedStyle(el).transform)).toBe('none');
  const values=await section.evaluate(el=>{
    const a=el.querySelector('.couple-profile--groom .couple-portrait').getBoundingClientRect();
    const b=el.querySelector('.couple-profile--bride .couple-portrait').getBoundingClientRect();
    const root=el.getBoundingClientRect();
    return {difference:b.top-a.top,brideOffset:b.top-root.top,
      overflow:document.documentElement.scrollWidth-innerWidth};
  });
  if(await page.evaluate(()=>innerWidth)===390){
    expect(values.difference).toBeGreaterThan(756);
    expect(values.difference).toBeLessThan(758);
    expect(values.brideOffset).toBeGreaterThan(1115);
    expect(values.brideOffset).toBeLessThan(1117);
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


test('Section 3 original lakeside edge illustration is behind arch and keeps section 4 seam intact',async({page})=>{
  const {section,errors}=await openCouple(page);
  const image=section.locator('.couple-lake-finish');
  await expect(image).toHaveCount(1);
  const data=await section.evaluate(el=>{
    const foot=el.querySelector('.couple-lake-finish');
    const arch=el.querySelector('.couple-arch');
    const a=arch.getBoundingClientRect();
    const f=foot.getBoundingClientRect();
    const s=el.getBoundingClientRect();
    const next=document.getElementById('eventDetails').getBoundingClientRect();
    return {sectionWidth:s.width,footerWidth:f.width,footerHeight:f.height,
      footerBottom:f.bottom-s.bottom,
      panelBeyondFooter:a.bottom-f.top,belowPanel:f.bottom-a.bottom,
      zFooter:+getComputedStyle(foot).zIndex,zArch:+getComputedStyle(arch).zIndex,
      bg:getComputedStyle(foot).backgroundImage,
      gap:next.top-s.bottom,overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(data.footerWidth).toBeCloseTo(data.sectionWidth,0);
  expect(data.footerHeight).toBeCloseTo(178,0);
  expect(data.footerBottom).toBeCloseTo(0,0);
  expect(data.zArch).toBeGreaterThan(data.zFooter);
  expect(data.belowPanel).toBeCloseTo(140,0);
  expect(data.bg).toContain('couple-lake-finish-original.svg');
  expect(Math.abs(data.gap)).toBeLessThanOrEqual(1);
  expect(data.overflow).toBeLessThanOrEqual(1);
  const loaded=await page.evaluate(async()=>{
    const img=new Image();
    img.src='./assets/couple-lake-finish-original.svg';
    try {await img.decode();return img.naturalWidth>0;}catch{return false;}
  });
  expect(loaded).toBe(true);
  expect(errors).toEqual([]);
});

test('original botanical side art and carved arch render without covering text or overflowing',async({page},testInfo)=>{
  const {section,errors}=await openCouple(page);
  const report=await section.evaluate(async el=>{
    const edge=el.querySelector('.couple-botanical-edges');
    const arch=el.querySelector('.couple-arch');
    const content=el.querySelector('.couple-inner');
    const load=async path=>{
      const img=new Image();
      img.src=path;
      try{await img.decode();return {width:img.naturalWidth,height:img.naturalHeight};}
      catch{return {width:0,height:0};}
    };
    const [flowers,relief]=await Promise.all([
      load('./assets/couple-botanical-edges-original.svg'),
      load('./assets/couple-arch-relief-original.svg')
    ]);
    return {
      flow:el.nextElementSibling?.id,
      flowers,relief,
      edgeZ:Number(getComputedStyle(edge).zIndex),
      archZ:Number(getComputedStyle(arch).zIndex),
      contentZ:Number(getComputedStyle(content).zIndex),
      edgeImage:getComputedStyle(edge).backgroundImage,
      archImage:getComputedStyle(arch).backgroundImage,
      overflow:document.documentElement.scrollWidth-innerWidth,
      seam:el.nextElementSibling.getBoundingClientRect().top-el.getBoundingClientRect().bottom
    };
  });
  expect(report.flow).toBe('eventDetails');
  expect(report.flowers).toEqual({width:390,height:1840});
  expect(report.relief).toEqual({width:366,height:1571});
  expect(report.edgeZ).toBeGreaterThan(report.archZ);
  expect(report.contentZ).toBeGreaterThan(report.edgeZ);
  expect(report.edgeImage).toContain('couple-botanical-edges-original.svg');
  expect(report.archImage).toContain('couple-arch-relief-original.svg');
  expect(report.overflow).toBeLessThanOrEqual(1);
  expect(Math.abs(report.seam)).toBeLessThanOrEqual(1);
  const width=await page.evaluate(()=>innerWidth);
  await page.evaluate(()=>document.getElementById('couple').scrollIntoView({block:'start',behavior:'instant'}));
  await page.screenshot({path:testInfo.outputPath('section3-botanical-'+width+'.png'),animations:'disabled'});
  expect(errors).toEqual([]);
});


test('opt-in Section 3 reference-art preview uses existing vendor asset URLs without changing default',async({page})=>{
  await page.goto('/?coupleReference=1');
  const section=page.locator('#couple');
  await expect(section).toHaveAttribute('data-art','reference');
  await expect(section.locator('.couple-name').first()).toHaveText('Muhammad Rayyan bin Bujang');
  await expect(section.locator('.couple-name').nth(1)).toHaveText('Nur Sofea binti Dzulkharnain');
  await expect(section.locator('#groomPortrait')).toHaveAttribute('data-reference-url',/couples\/moody-groom\.webp$/);
  await expect(section.locator('#bridePortrait')).toHaveAttribute('data-reference-url',/couples\/moody-bride\.webp$/);
  const style=await section.evaluate(el=>({
    arch:getComputedStyle(el.querySelector('.couple-arch')).borderImageSource,
    garden:getComputedStyle(el.querySelector('.couple-reference-scene')).backgroundImage,
    clouds:getComputedStyle(el.querySelector('.couple-hanging')).display,
    width:document.documentElement.scrollWidth-window.innerWidth
  }));
  expect(style.arch).toContain('arch_panel.svg');
  expect(style.garden).toContain('tasik-kayangan/scene.webp');
  expect(style.clouds).toBe('none');
  expect(style.width).toBeLessThanOrEqual(1);
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    document.getElementById('couple').scrollIntoView({block:'start',behavior:'instant'});
  });
  await expect.poll(()=>section.evaluate(el=>{
    const camera=parseFloat(el.dataset.referenceCameraOffset);
    const total=parseFloat(el.style.getPropertyValue('--couple-reference-y'));
    const root=el.getBoundingClientRect();
    const pinned=Math.max(0,Math.min(el.offsetHeight-innerHeight,-root.top));
    return Number.isFinite(total) && Number.isFinite(camera)
      && Math.abs(total-(pinned+camera))<1.5;
  })).toBe(true);
  const seam=await section.evaluate(el=>el.nextElementSibling.getBoundingClientRect().top-el.getBoundingClientRect().bottom);
  expect(Math.abs(seam)).toBeLessThanOrEqual(1);

  await page.goto('/');
  await expect(page.locator('#couple')).not.toHaveAttribute('data-art','reference');
  await expect(page.locator('#groomPortrait')).toHaveAttribute('src','./assets/couple-groom-art-original.svg');
  await expect(page.locator('#bridePortrait')).toHaveAttribute('src','./assets/couple-bride-art-original.svg');
});


test('reference preview camera matches four measured 390px scroll checkpoints',async({page},testInfo)=>{
  await page.goto('/?coupleReference=1');
  const section=page.locator('#couple');
  await page.getByRole('button',{name:'Open Invitation'}).click();
  const checks=[
    {y:2743,offset:-44.8},
    {y:3165,offset:-26.8},
    {y:3587,offset:-8.8},
    {y:4220,offset:18.2}
  ];
  const viewport=await page.evaluate(()=>innerWidth);
  const cameras=[];
  for (const {y,offset} of checks){
    const adjusted=await section.evaluate((el,point)=>{
      const start=el.getBoundingClientRect().top+scrollY;
      return start - 3294.4 + point;
    },y);
    await page.evaluate(async pos=>{
      document.documentElement.style.scrollBehavior='auto';
      window.scrollTo({top:Math.round(pos),behavior:'instant'});
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
    },adjusted);
    await expect.poll(()=>section.evaluate(el=>parseFloat(el.dataset.referenceCameraOffset))).toBeGreaterThan(-45);
    const reading=await section.evaluate(el=>{
      const root=el.getBoundingClientRect();
      const pic=el.querySelector('.couple-reference-scene').getBoundingClientRect();
      const scrollWithin=Math.max(0,Math.min(el.offsetHeight-innerHeight,-root.top));
      const camera=parseFloat(el.dataset.referenceCameraOffset);
      return {camera,visual:pic.top,expectedVisual:root.top+scrollWithin+camera,
        overflow:document.documentElement.scrollWidth-innerWidth};
    });
    // Only the measured reference viewport has absolute sample values.
    if(viewport===390){
      expect(Math.abs(reading.camera-offset)).toBeLessThan(1.3);
    }
    expect(Math.abs(reading.visual-reading.expectedVisual)).toBeLessThan(1.5);
    expect(reading.overflow).toBeLessThanOrEqual(1);
    cameras.push(reading.camera);
    if(viewport===390 && y===3587){
      await page.screenshot({path:testInfo.outputPath('section3-reference-midpoint-390.png'),animations:'disabled'});
    }
  }
  expect(cameras[0]).toBeLessThan(cameras[1]);
  expect(cameras[1]).toBeLessThan(cameras[2]);
  expect(cameras[2]).toBeLessThan(cameras[3]);
  // Backward scroll must restore the previous camera position.
  const start=await section.evaluate(el=>el.getBoundingClientRect().top+scrollY);
  await page.evaluate(async y=>{
    window.scrollTo({top:y,behavior:'instant'});
    await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
  },start-(3294.4-3165));
  if(viewport===390){
    const actual=await section.evaluate(el=>parseFloat(el.dataset.referenceCameraOffset));
    expect(Math.abs(actual-(-26.8))).toBeLessThan(1.3);
  }
});

test('reference preview entrance matches measured 52px lift and Reduced Motion removes it',async({page})=>{
  await page.goto('/?coupleReference=1');
  const section=page.locator('#couple');
  await expect(section).toHaveAttribute('data-art','reference');
  const first=section.locator('.couple-profile--groom .couple-portrait');
  // The initial opacity uses a CSS transition. Wait until it has settled
  // instead of sampling an intermediate value between 1 and 0.
  await expect.poll(()=>first.evaluate(el=>getComputedStyle(el).opacity)).toBe('0');
  const initial=await first.evaluate(el=>({
    transform:getComputedStyle(el).transform,
    opacity:getComputedStyle(el).opacity
  }));
  expect(initial.opacity).toBe('0');
  expect(initial.transform).not.toBe('none');
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await first.scrollIntoViewIfNeeded();
  await expect(first).toHaveClass(/in-view/);
  await expect.poll(()=>first.evaluate(el=>getComputedStyle(el).transform)).toBe('none');

  await page.emulateMedia({reducedMotion:'reduce'});
  await page.reload();
  await expect(section).toHaveAttribute('data-art','reference');
  const still=await first.evaluate(el=>({
    transform:getComputedStyle(el).transform,
    opacity:getComputedStyle(el).opacity
  }));
  expect(still).toEqual({transform:'none',opacity:'1'});
  const camera=await section.evaluate(el=>parseFloat(el.dataset.referenceCameraOffset));
  expect(camera).toBe(0);
});
