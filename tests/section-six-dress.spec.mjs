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
    const top=el.getBoundingClientRect().top;
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
