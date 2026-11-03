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
