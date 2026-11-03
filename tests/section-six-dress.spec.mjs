import {test,expect} from '@playwright/test';

async function openDress(page) {
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  const dress=page.locator('#dressCode');
  await expect(dress).toHaveAttribute('data-section','6');
  await expect(dress).toHaveJSProperty('inert',true);
  await expect(dress).toHaveAttribute('aria-hidden','true');
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(dress).toHaveJSProperty('inert',false);
  await expect(dress).toHaveAttribute('aria-hidden','false');
  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    document.getElementById('dressCode').scrollIntoView({block:'start',behavior:'instant'});
  });
  await expect(dress).toBeInViewport();
  return {dress,errors};
}

test('Section 6 has the reference Dress Code wording and palettes',async({page},testInfo)=>{
  const {dress,errors}=await openDress(page);
  await expect(dress.getByRole('heading',{name:'Dress Code'})).toBeVisible();
  await expect(dress).toContainText('We would be delighted if you could dress along with our chosen palette.');
  await expect(dress).toContainText("Groom's Side");
  await expect(dress).toContainText('Sage Green & Cream');
  await expect(dress).toContainText('Sage, soft sage, cream');
  await expect(dress).toContainText("Bride's Side");
  await expect(dress).toContainText('Terracotta & Blush');
  await expect(dress).toContainText('Terracotta, blush, sand');
  await expect(dress.locator('.dress-swatch')).toHaveCount(6);
  await dress.screenshot({path:testInfo.outputPath('section-six-dress.png'),animations:'disabled'});
  expect(errors).toEqual([]);
});

test('Section 6 stays between running order and gallery without horizontal overflow',async({page})=>{
  const {dress,errors}=await openDress(page);
  const data=await dress.evaluate(el=>{
    const before=document.getElementById('runningOrder');
    const after=document.getElementById('gallery');
    const legacy=document.getElementById('saveTheDate');
    const a=before.getBoundingClientRect();
    const b=el.getBoundingClientRect();
    const c=after.getBoundingClientRect();
    return {
      sequence:before.compareDocumentPosition(el)&Node.DOCUMENT_POSITION_FOLLOWING,
      after:el.nextElementSibling===after,
      legacyHidden:legacy.hidden,
      beforeGap:b.top-a.bottom,
      afterGap:c.top-b.bottom,
      height:b.height,
      windowWidth:innerWidth,
      documentWidth:document.documentElement.scrollWidth,
      swatches:[...el.querySelectorAll('.dress-swatch')].map(e=>{
        const r=e.getBoundingClientRect();
        return {left:r.left,right:r.right,width:r.width};
      })
    };
  });
  expect(data.sequence).toBeTruthy();
  expect(data.after).toBe(true);
  expect(data.legacyHidden).toBe(true);
  expect(Math.abs(data.beforeGap)).toBeLessThanOrEqual(1);
  expect(Math.abs(data.afterGap)).toBeLessThanOrEqual(1);
  expect(data.height).toBeGreaterThanOrEqual(679);
  expect(data.documentWidth).toBeLessThanOrEqual(data.windowWidth+1);
  for(const swatch of data.swatches){
    expect(swatch.left).toBeGreaterThanOrEqual(-1);
    expect(swatch.right).toBeLessThanOrEqual(data.windowWidth+1);
    // Entrance reveal starts at 0.955 scale; a 30px swatch can briefly be 28.65px.
    expect(swatch.width).toBeGreaterThanOrEqual(28);
    expect(swatch.width).toBeLessThanOrEqual(31);
  }
  expect(errors).toEqual([]);
});

test('Reduced motion leaves labels and colours accessible',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const {dress}=await openDress(page);
  await expect(dress.locator('.dress-palette')).toHaveCount(2);
  const result=await dress.locator('.dress-heading').evaluate(el=>({
    opacity:getComputedStyle(el).opacity,
    transform:getComputedStyle(el).transform
  }));
  expect(result.opacity).toBe('1');
  expect(result.transform).toBe('none');
});


test('Section 6 preserves measured reference typography, palette positions and colours',async({page})=>{
  // Stable measurements at the final rest state; entrance motion is tested separately.
  await page.emulateMedia({reducedMotion:'reduce'});
  const {dress,errors}=await openDress(page);
  const actual=await dress.evaluate(el=>{
    // The reference y measurements are relative to its unpadded cgv-inner.
    const top=el.querySelector('.dress-body').getBoundingClientRect().top;
    const box=selector=>{
      const node=el.querySelector(selector),r=node.getBoundingClientRect(),s=getComputedStyle(node);
      return {y:r.top-top,fontSize:parseFloat(s.fontSize),color:s.color,width:r.width};
    };
    return {
      width:innerWidth,
      eyebrow:box('.dress-eyebrow'),
      title:box('.dress-heading'),
      intro:box('.dress-intro'),
      groomSide:box('.dress-palette:first-child .dress-side'),
      groomName:box('.dress-palette:first-child .dress-palette-name'),
      groomColours:box('.dress-palette:first-child .dress-colour-label'),
      brideSide:box('.dress-palette:last-child .dress-side'),
      brideName:box('.dress-palette:last-child .dress-palette-name'),
      brideColours:box('.dress-palette:last-child .dress-colour-label'),
      swatches:[...el.querySelectorAll('.dress-swatch')].map(node=>{
        const r=node.getBoundingClientRect();
        return {y:r.top-top,width:r.width,color:getComputedStyle(node).backgroundColor};
      })
    };
  });
  const narrow=actual.width<390;
  const expectedY=narrow
    ?{eyebrow:0,title:30.14,intro:89.94,groomSide:178.53,
      groomName:203.03,groomColours:283.72,brideSide:361.31,
      brideName:385.81,brideColours:466.50,swatchFirst:241.72,swatchSecond:424.50}
    :{eyebrow:0,title:30.14,intro:89.94,groomSide:158.73,
      groomName:183.23,groomColours:263.92,brideSide:341.52,
      brideName:366.02,brideColours:446.70,swatchFirst:221.92,swatchSecond:404.70};
  const referenceStyles={
    eyebrow:[11,'rgb(126, 100, 121)'],
    title:[52,'rgb(123, 61, 110)'],
    intro:[12,'rgb(111, 90, 108)'],
    groomSide:[10,'rgb(126, 100, 121)'],
    groomName:[19,'rgb(74, 42, 69)'],
    groomColours:[11,'rgb(111, 90, 108)'],
    brideSide:[10,'rgb(126, 100, 121)'],
    brideName:[19,'rgb(74, 42, 69)'],
    brideColours:[11,'rgb(111, 90, 108)']
  };
  for(const [key,style] of Object.entries(referenceStyles)){
    expect(Math.abs(actual[key].y-expectedY[key]),key+' vertical position').toBeLessThanOrEqual(0.8);
    expect(actual[key].fontSize,key+' font size').toBe(style[0]);
    expect(actual[key].color,key+' text colour').toBe(style[1]);
  }
  const paletteColours=[
    'rgb(138, 154, 123)','rgb(179, 192, 164)','rgb(237, 231, 217)',
    'rgb(180, 105, 79)','rgb(220, 167, 154)','rgb(239, 221, 209)'
  ];
  expect(actual.swatches).toHaveLength(6);
  for(const [index,swatch] of actual.swatches.entries()){
    expect(Math.abs(swatch.y-(index<3?expectedY.swatchFirst:expectedY.swatchSecond))).toBeLessThanOrEqual(0.8);
    expect(Math.abs(swatch.width-30)).toBeLessThanOrEqual(0.8);
    expect(swatch.color).toBe(paletteColours[index]);
  }
  expect(errors).toEqual([]);
});


test('Dress Code paper panels match the source measured surface at four widths',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const {dress,errors}=await openDress(page);
  const metrics=await dress.evaluate(section=>{
    const body=section.querySelector('.dress-body');
    const top=body.getBoundingClientRect().top;
    const cards=[...section.querySelectorAll('.dress-palette')].map(card=>{
      const r=card.getBoundingClientRect(),s=getComputedStyle(card);
      return {x:r.left,y:r.top-top,width:r.width,height:r.height,
        padding:s.padding,background:s.backgroundColor,border:s.border,
        radius:s.borderRadius,shadow:s.boxShadow};
    });
    const sr=section.getBoundingClientRect();
    const br=body.getBoundingClientRect();
    return {width:innerWidth,sectionHeight:sr.height,bodyHeight:br.height,
      cardGap:cards[1].y-(cards[0].y+cards[0].height),cards};
  });
  const narrow=metrics.width<390;
  const expectedBodyHeight=narrow?507.09:487.3;
  expect(Math.abs(metrics.sectionHeight-(expectedBodyHeight+192))).toBeLessThanOrEqual(.75);
  expect(Math.abs(metrics.bodyHeight-expectedBodyHeight)).toBeLessThanOrEqual(.75);
  expect(Math.abs(metrics.cardGap-14)).toBeLessThanOrEqual(.8);
  for(let index=0;index<2;index++){
    const card=metrics.cards[index];
    const firstTop=narrow?155.53:135.73;
    expect(Math.abs(card.y-(firstTop+index*(168.78+14)))).toBeLessThanOrEqual(.8);
    expect(Math.abs(card.width-(metrics.width-56))).toBeLessThanOrEqual(.8);
    expect(Math.abs(card.height-168.78)).toBeLessThanOrEqual(.8);
    expect(Math.abs(card.x-28)).toBeLessThanOrEqual(.8);
    expect(card.padding).toBe('22px 18px');
    expect(card.background).toBe('rgba(255, 255, 255, 0.5)');
    expect(card.border).toBe('1px solid rgba(126, 100, 121, 0.3)');
    expect(card.radius).toBe('16px');
    expect(card.shadow).toBe('none');
  }
  expect(errors).toEqual([]);
});


test('Section 6 uses the source-measured stagger and scroll camera',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  const {dress,errors}=await openDress(page);
  await expect(dress).toHaveAttribute('data-reveal-ready','true');
  const styles=await dress.evaluate(el=>{
    return ['.dress-eyebrow','.dress-heading','.dress-intro',
      '.dress-palette:first-child','.dress-palette:last-child'].map(sel=>{
      const s=getComputedStyle(el.querySelector(sel));
      return {duration:s.transitionDuration,delay:s.transitionDelay,
        ease:s.transitionTimingFunction};
    });
  });
  for(const [i,style] of styles.entries()){
    expect(style.duration).toBe('1s, 1.1s');
    expect(style.delay).toBe(['0s','.15s','.3s','.45s','.6s'][i].replace(/^\./,'0.'));
    expect(style.ease).toBe('ease, cubic-bezier(0.22, 0.9, 0.24, 1)');
  }
  for(const y of [0,240,-200]){
    await page.evaluate(y=>{
      const el=document.getElementById('dressCode');
      scrollTo({top:scrollY+el.getBoundingClientRect().top-y,behavior:'instant'});
    },y);
    await page.waitForTimeout(130);
    const data=await dress.evaluate(el=>({
      top:el.getBoundingClientRect().top,
      camera:parseFloat(el.style.getPropertyValue('--dress-camera-y'))
    }));
    const expected=3.5-data.top*.0427;
    expect(Math.abs(data.camera-expected)).toBeLessThanOrEqual(1);
  }
  expect(errors).toEqual([]);
});


test('Section 6 uses only original Section 6 paper and paired local wings by default',async({page})=>{
  const {dress,errors}=await openDress(page);
  const art=await dress.evaluate(el=>{
    const paper=el.querySelector('.dress-art-original');
    const src=el.querySelector('#dressSourceScene');
    const flight=el.querySelector('#dressFlight');
    return {
      paperBackground:getComputedStyle(paper).backgroundImage,
      sourceUrl:src?.getAttribute('src')||'',
      wingCount:flight?.querySelectorAll('.dress-flight-wing').length||0,
      flightHidden:getComputedStyle(flight).opacity,
      loaded:el.dataset.flightReady,
      bodyCount:flight?.querySelectorAll('.dress-flight-thorax').length||0
    };
  });
  expect(art.paperBackground).toContain('dress-paper-original.svg');
  expect(art.sourceUrl).toBe('');
  expect(art.wingCount).toBe(2);
  expect(art.bodyCount).toBe(1);
  expect(art.loaded).toBe('true');
  expect(Number(art.flightHidden)).toBeGreaterThan(.8);
  const fileResponse=await page.request.get('/assets/dress-paper-original.svg');
  expect(fileResponse.status()).toBe(200);
  expect((await fileResponse.text()).includes('<svg')).toBe(true);
  expect(errors).toEqual([]);
});

test('Section 6 butterfly flies autonomously while scroll position is fixed',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  const {dress,errors}=await openDress(page);
  // Do not scroll during the test. The source reference travels horizontally
  // at about 27–32px/sec even when the section stays in place.
  await page.waitForTimeout(1250);
  const first=await dress.evaluate(sec=>({
    x:parseFloat(sec.style.getPropertyValue('--dress-flight-x')),
    y:parseFloat(sec.style.getPropertyValue('--dress-flight-y')),
    angle:parseFloat(sec.style.getPropertyValue('--dress-flight-rotate')),
    top:sec.getBoundingClientRect().top,
    active:sec.dataset.flightReady,
    leftWing:getComputedStyle(sec.querySelector('.dress-flight-wing-left')).animationName,
    rightWing:getComputedStyle(sec.querySelector('.dress-flight-wing-right')).animationName
  }));
  await page.waitForTimeout(1050);
  const second=await dress.evaluate(sec=>({
    x:parseFloat(sec.style.getPropertyValue('--dress-flight-x')),
    y:parseFloat(sec.style.getPropertyValue('--dress-flight-y')),
    top:sec.getBoundingClientRect().top
  }));
  expect(first.active).toBe('true');
  expect(Number.isFinite(first.x)).toBe(true);
  expect(Number.isFinite(second.x)).toBe(true);
  expect(Math.abs(second.top-first.top)).toBeLessThanOrEqual(1);
  // Starts by flying right-to-left at reference-comparable speed.
  expect(second.x-first.x).toBeLessThan(-17);
  expect(second.x-first.x).toBeGreaterThan(-38);
  expect(first.angle).toBeLessThan(-50);
  expect(first.leftWing).toBe('dress-wing-flight-left');
  expect(first.rightWing).toBe('dress-wing-flight-right');
  expect(errors).toEqual([]);
});

test('Section 6 butterfly respects reduced-motion preferences',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const {dress}=await openDress(page);
  const result=await dress.evaluate(el=>{
    const wing=el.querySelector('.dress-flight-wing-left'),flight=el.querySelector('#dressFlight');
    return {animation:getComputedStyle(wing).animationName,
      x:flight.getBoundingClientRect().left,
      opacity:getComputedStyle(flight).opacity,
      width:el.getBoundingClientRect().width};
  });
  expect(result.animation).toBe('none');
  expect(Math.abs(result.x-(result.width-64))).toBeLessThanOrEqual(2);
  expect(Number(result.opacity)).toBeGreaterThan(.8);
});
