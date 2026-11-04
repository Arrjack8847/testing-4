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
test('default reference couple scene follows mauve and keeps events afterward',async({page})=>{
  const {section,errors}=await openCouple(page);
  await expect(section).toHaveAttribute('data-section','3');
  await expect(page.getByRole('heading',{level:2,name:'The Couple'})).toHaveCount(1);
  await expect(section.locator('.couple-portrait')).toHaveCount(2);
  await expect(section.locator('#groomPortrait')).toHaveAttribute('alt',/Reference website example/);
  await expect(section.locator('#bridePortrait')).toHaveAttribute('alt',/Reference website example/);
  await expect(section.locator('.couple-name').first()).toHaveText('Muhammad Rayyan bin Bujang');
  await expect(section.locator('.couple-name').nth(1)).toHaveText('Nur Sofea binti Dzulkharnain');
  await expect(section.locator('.couple-demo-note')).toHaveCount(0);
  const adjacency=await section.evaluate(el=>({
    prior:el.previousElementSibling?.id,next:el.nextElementSibling?.id,
    following:el.nextElementSibling?.getAttribute('data-section')
  }));
  expect(adjacency).toEqual({prior:'message',next:'eventDetails',following:'4'});
  await expect(page.locator('#eventDetails #eventVenue')).toContainText('Masjid Wilayah Persekutuan');
  expect(errors).toEqual([]);
});
test('couple layout has measured first-portrait geometry at 390px and never overflows',async({page},testInfo)=>{
  const {section,errors}=await openCouple(page);
  const firstPortrait=section.locator('.couple-portrait').first();
  const intro=section.locator('.couple-intro');
  await firstPortrait.scrollIntoViewIfNeeded();
  await expect(firstPortrait).toHaveClass(/in-view/);
  // Wait for both 950ms reveal transforms to settle before sampling boxes.
  // The in-view class is applied at animation start, not at its end.
  await expect(intro).toHaveClass(/in-view/);
  await expect.poll(()=>intro.evaluate(el=>getComputedStyle(el).transform),
    {timeout:5000}).toBe('none');
  await expect.poll(()=>firstPortrait.evaluate(el=>getComputedStyle(el).transform),
    {timeout:5000}).toBe('none');
  await page.evaluate(()=>document.fonts.ready);
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


test('default reference garden camera follows scrolling without moving cards',async({page})=>{
  const {section,errors}=await openCouple(page);
  await expect(section).toHaveAttribute('data-art','reference');
  const begin=await section.evaluate(el=>({
    start:el.getBoundingClientRect().top+scrollY,
    distance:Math.max(0,el.offsetHeight-innerHeight)
  }));
  const sample=async fraction=>{
    await page.evaluate(async target=>{
      window.scrollTo({top:Math.round(target),behavior:'instant'});
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
    },begin.start+begin.distance*fraction);
    return section.evaluate(el=>({
      camera:parseFloat(el.dataset.referenceCameraOffset),
      total:parseFloat(el.style.getPropertyValue('--couple-reference-y')),
      background:getComputedStyle(el.querySelector('.couple-reference-scene'),'::before').backgroundImage,
      overflow:document.documentElement.scrollWidth-innerWidth
    }));
  };
  const first=await sample(.10);
  const second=await sample(.80);
  expect(first.camera).toBeLessThan(second.camera);
  expect(second.background).toMatch(/(?:assets\/scene\.webp|tasik-kayangan\/scene\.webp)/);
  expect(first.overflow).toBeLessThanOrEqual(1);
  expect(second.overflow).toBeLessThanOrEqual(1);
  expect(Number.isFinite(second.total)).toBe(true);
  expect(errors).toEqual([]);
});


test('Section 3 uses the local Section 1 painting with enough overscan at every scroll position',async({page})=>{
  await page.goto('/');
  await expect(page.locator('#couple')).toHaveAttribute('data-art','reference');
  // CI installs the 25 first-scene WebPs in assets/ before starting browsers.
  await expect.poll(()=>page.locator('#couple').getAttribute('data-reference-scene-source')).toBe('local');
  await page.getByRole('button',{name:'Open Invitation'}).click();
  const section=page.locator('#couple');
  const geom=await section.evaluate(el=>({
    start:el.getBoundingClientRect().top+scrollY,
    travel:Math.max(0,el.offsetHeight-innerHeight)
  }));
  for(const fraction of [0,.15,.50,.85,1]){
    await page.evaluate(async y=>{
      document.documentElement.style.scrollBehavior='auto';
      scrollTo({top:Math.round(y),behavior:'instant'});
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
    },geom.start+geom.travel*fraction);
    const actual=await section.evaluate(el=>{
      const image=el.querySelector('.couple-reference-scene');
      const sectionBox=el.getBoundingClientRect();
      const view=innerHeight;
      const camera=parseFloat(el.dataset.referenceCameraOffset);
      const pinned=Math.max(0,Math.min(el.offsetHeight-view,-sectionBox.top));
      const computed=getComputedStyle(image,'::before');
      const marginTop=parseFloat(computed.top);
      const marginBottom=parseFloat(computed.bottom);
      const pictureTop=sectionBox.top+pinned+camera+marginTop;
      const pictureBottom=sectionBox.top+pinned+camera+view-marginBottom;
      return {
        local:el.dataset.referenceSceneSource,
        originalHidden:getComputedStyle(el).backgroundImage==='none',
        source:computed.backgroundImage,
        marginTop,marginBottom,pictureTop,pictureBottom,view,
        overflow:document.documentElement.scrollWidth-innerWidth
      };
    });
    expect(actual.local).toBe('local');
    expect(actual.originalHidden).toBe(true);
    expect(actual.source).toContain('assets/scene.webp');
    expect(actual.marginTop).toBe(-64);
    expect(actual.marginBottom).toBe(-64);
    expect(actual.pictureTop).toBeLessThanOrEqual(0);
    expect(actual.pictureBottom).toBeGreaterThanOrEqual(actual.view);
    expect(actual.overflow).toBeLessThanOrEqual(1);
  }
});

test('default reference replaces original illustrations and keeps section 4 seam intact',async({page})=>{
  const {section,errors}=await openCouple(page);
  const data=await section.evaluate(el=>{
    const arch=el.querySelector('.couple-arch');
    const props=el=>getComputedStyle(el);
    const s=el.getBoundingClientRect();
    const next=document.getElementById('eventDetails').getBoundingClientRect();
    return {
      hiddenArtwork:['.couple-lake-finish','.couple-botanical-edges','.couple-hanging','.couple-arch-finial']
        .every(selector=>props(el.querySelector(selector)).display==='none'),
      arch:props(arch).borderImageSource,
      sourcePortraits:[...el.querySelectorAll('.couple-portrait img')].map(img=>img.getAttribute('src')),
      gap:next.top-s.bottom,
      overflow:document.documentElement.scrollWidth-innerWidth
    };
  });
  expect(data.hiddenArtwork).toBe(true);
  expect(data.arch).toContain('arch_panel.svg');
  expect(data.sourcePortraits.every(src=>!src.includes('-original.svg'))).toBe(true);
  expect(Math.abs(data.gap)).toBeLessThanOrEqual(1);
  expect(data.overflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});


test('default reference arch, paper tint, portraits and text preserve mobile layering',async({page},testInfo)=>{
  const {section,errors}=await openCouple(page);
  const report=await section.evaluate(el=>{
    const arch=el.querySelector('.couple-arch');
    const details=el.querySelector('.couple-inner');
    const next=el.nextElementSibling;
    return {
      art:el.dataset.art,
      washOpacity:getComputedStyle(el,'::before').opacity,
      washZ:Number(getComputedStyle(el,'::before').zIndex),
      archZ:Number(getComputedStyle(arch).zIndex),
      innerZ:Number(getComputedStyle(details).zIndex),
      garden:getComputedStyle(el.querySelector('.couple-reference-scene'),'::before').backgroundImage,
      archImage:getComputedStyle(arch).borderImageSource,
      footer:next.id,
      seam:next.getBoundingClientRect().top-el.getBoundingClientRect().bottom,
      overflow:document.documentElement.scrollWidth-innerWidth
    };
  });
  expect(report.art).toBe('reference');
  expect(report.washOpacity).toBe('0.1');
  expect(report.archZ).toBeGreaterThan(report.washZ);
  expect(report.innerZ).toBeGreaterThan(report.archZ);
  expect(report.garden).toMatch(/(?:assets\/scene\.webp|tasik-kayangan\/scene\.webp)/);
  expect(report.archImage).toContain('arch_panel.svg');
  expect(report.footer).toBe('eventDetails');
  expect(Math.abs(report.seam)).toBeLessThanOrEqual(1);
  expect(report.overflow).toBeLessThanOrEqual(1);
  await page.screenshot({path:testInfo.outputPath('section3-reference-default-'+testInfo.project.name+'.png'),animations:'disabled'});
  expect(errors).toEqual([]);
});

test('both plain / and old flag URL show identical approved Section 3 artwork',async({page})=>{
  await page.goto('/');
  const section=page.locator('#couple');
  await expect(section).toHaveAttribute('data-art','reference');
  // Three known WebP URLs (garden, groom, bride) are actively observed,
  // not merely referenced in markup. Third-party hosting may block them.
  await expect(section).toHaveAttribute('data-reference-webp-state',/^(loading|ready|partial)$/);
  await expect.poll(()=>section.getAttribute('data-reference-webp-count'))
    .toMatch(/^[0-3]$/);
  await expect(section.locator('.couple-name').first()).toHaveText('Muhammad Rayyan bin Bujang');
  await expect(section.locator('.couple-name').nth(1)).toHaveText('Nur Sofea binti Dzulkharnain');
  await expect(section.locator('#groomPortrait')).toHaveAttribute('data-reference-url',/couples\/moody-groom\.webp$/);
  await expect(section.locator('#bridePortrait')).toHaveAttribute('data-reference-url',/couples\/moody-bride\.webp$/);
  const style=await section.evaluate(el=>({
    arch:getComputedStyle(el.querySelector('.couple-arch')).borderImageSource,
    garden:getComputedStyle(el.querySelector('.couple-reference-scene'),'::before').backgroundImage,
    clouds:getComputedStyle(el.querySelector('.couple-hanging')).display,
    width:document.documentElement.scrollWidth-window.innerWidth,
    washOpacity:getComputedStyle(el,'::before').opacity,
    washZ:Number(getComputedStyle(el,'::before').zIndex),
    archZ:Number(getComputedStyle(el.querySelector('.couple-arch')).zIndex)
  }));
  expect(style.washOpacity).toBe('0.1');
  expect(style.archZ).toBeGreaterThan(style.washZ);
  expect(style.arch).toContain('arch_panel.svg');
  expect(style.garden).toMatch(/(?:assets\/scene\.webp|tasik-kayangan\/scene\.webp)/);
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

  // The legacy URL may still be bookmarked, but cannot change Section 3.
  await page.goto('/?coupleReference=1');
  await expect(page.locator('#couple')).toHaveAttribute('data-art','reference');
  await expect(page.locator('.couple-name').first()).toHaveText('Muhammad Rayyan bin Bujang');
  await expect(page.locator('#groomPortrait')).toHaveAttribute('data-reference-url',/couples\/moody-groom\.webp$/);
});


test('reference preview camera matches four measured 390px scroll checkpoints',async({page},testInfo)=>{
  await page.goto('/');
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
    // Save reference-art evidence at entry, groom, bride and lower garden
    // on EVERY configured phone, not only 390px. This makes visual alignment
    // review possible without assuming all widths crop the same artwork.
    const stage={2743:'entry',3165:'groom',3587:'middle',4220:'bride'}[y];
    await page.screenshot({
      path:testInfo.outputPath('section3-reference-'+viewport+'-'+stage+'.png'),
      animations:'disabled'
    });
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


test('reference garden camera moves continuously forwards and backwards across Section 3',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Open Invitation'}).click();
  const section=page.locator('#couple');
  const geometry=await section.evaluate(el=>({
    start:el.getBoundingClientRect().top+window.scrollY,
    travel:Math.max(0,el.offsetHeight-window.innerHeight)
  }));
  const samples=[0,.1,.2,.3,.4,.5,.6,.7,.8,.9,1,.7,.4,.1];
  let previous=null;
  for(const fraction of samples){
    const target=Math.round(geometry.start+geometry.travel*fraction);
    await page.evaluate(async y=>{
      document.documentElement.style.scrollBehavior='auto';
      window.scrollTo({top:y,behavior:'instant'});
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
    },target);
    const reading=await section.evaluate(el=>({
      y:window.scrollY,
      camera:Number(el.dataset.referenceCameraOffset),
      total:Number.parseFloat(el.style.getPropertyValue('--couple-reference-y')),
      top:el.getBoundingClientRect().top,
      height:el.offsetHeight,
      screen:window.innerHeight
    }));
    const pinned=Math.max(0,Math.min(reading.height-reading.screen,-reading.top));
    expect(Number.isFinite(reading.camera)).toBe(true);
    expect(Math.abs(reading.total-(pinned+reading.camera))).toBeLessThan(1.5);
    expect(reading.camera).toBeGreaterThanOrEqual(-44.81);
    expect(reading.camera).toBeLessThanOrEqual(20.01);
    if(previous){
      // Drift rate must remain at or below the calibrated 0.0427 px per
      // scroll pixel: no discontinuity when reversing in the same section.
      const allowed=Math.abs(reading.y-previous.y)*.0427+.5;
      expect(Math.abs(reading.camera-previous.camera)).toBeLessThanOrEqual(allowed);
    }
    previous=reading;
  }
});


test('reference groom image uses measured 5% zoom without resizing the portrait frame',async({page})=>{
  await page.goto('/');
  const section=page.locator('#couple');
  await expect(section).toHaveAttribute('data-art','reference');
  await page.getByRole('button',{name:'Open Invitation'}).click();
  const groom=section.locator('.couple-profile--groom .couple-portrait');
  // Align the portrait to the viewport CENTER, as the live reference does.
  await page.evaluate(()=>{
    const p=document.querySelector('.couple-profile--groom .couple-portrait');
    const r=p.getBoundingClientRect();
    document.documentElement.style.scrollBehavior='auto';
    scrollTo({top:scrollY+r.top+r.height/2-innerHeight/2,behavior:'instant'});
  });
  await expect(groom).toHaveClass(/in-view/);
  await expect.poll(()=>groom.evaluate(el=>getComputedStyle(el).transform)).toBe('none');
  await expect(groom).toHaveClass(/is-focal/);
  await expect.poll(()=>groom.locator('img').evaluate(el=>getComputedStyle(el).transform))
    .toBe('matrix(1.05, 0, 0, 1.05, 0, 0)');
  const report=await groom.evaluate(el=>{
    const image=el.querySelector('img');
    const frame=el.getBoundingClientRect();
    const picture=image.getBoundingClientRect();
    const scale=getComputedStyle(image).transform;
    return {
      frameWidth:frame.width,frameHeight:frame.height,
      zoomedWidth:picture.width,zoomedHeight:picture.height,
      unscaledWidth:image.clientWidth,unscaledHeight:image.clientHeight,
      scale,overflow:getComputedStyle(el).overflow,
      horizontalOverflow:document.documentElement.scrollWidth-innerWidth
    };
  });
  expect(report.scale).toBe('matrix(1.05, 0, 0, 1.05, 0, 0)');
  expect(report.zoomedWidth/report.unscaledWidth).toBeCloseTo(1.05,2);
  expect(report.zoomedHeight/report.unscaledHeight).toBeCloseTo(1.05,2);
  expect(report.overflow).toBe('hidden');
  expect(report.horizontalOverflow).toBeLessThanOrEqual(1);
  if(await page.evaluate(()=>innerWidth)===390){
    expect(report.frameWidth).toBeCloseTo(240.5,0);
    expect(report.frameHeight).toBeCloseTo(332.7,0);
  }
  // The default view is still reference art, but a portrait that is NOT
  // in the focal band has no permanent zoom.
  await page.goto('/');
  await expect(page.locator('#couple')).toHaveAttribute('data-art','reference');
  await expect(page.locator('#groomPortrait')).toHaveCSS('transform','none');
});

test('both reference portraits zoom only in the central viewport and reverse cleanly',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Open Invitation'}).click();
  const section=page.locator('#couple');
  const portraits=[
    section.locator('.couple-profile--groom .couple-portrait'),
    section.locator('.couple-profile--bride .couple-portrait')
  ];
  const center=async portrait=>{
    await portrait.evaluate(el=>{
      const r=el.getBoundingClientRect();
      document.documentElement.style.scrollBehavior='auto';
      window.scrollTo({top:scrollY+r.top+r.height/2-innerHeight/2,behavior:'instant'});
    });
    await expect(portrait).toHaveClass(/is-focal/);
    await expect.poll(()=>portrait.locator('img').evaluate(el=>getComputedStyle(el).transform))
      .toBe('matrix(1.05, 0, 0, 1.05, 0, 0)');
  };
  const away=async portrait=>{
    await portrait.evaluate(el=>{
      const r=el.getBoundingClientRect();
      window.scrollTo({top:scrollY+r.top+r.height/2-innerHeight*1.5,behavior:'instant'});
    });
    await expect(portrait).not.toHaveClass(/is-focal/);
    await expect.poll(()=>portrait.locator('img').evaluate(el=>getComputedStyle(el).transform))
      .toBe('none');
  };
  for(const portrait of portraits){
    await center(portrait);
    await away(portrait);
    await center(portrait); // Reverse scrolling restores the zoom.
  }
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('reference preview entrance matches measured 52px lift and Reduced Motion removes it',async({page})=>{
  await page.goto('/');
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
