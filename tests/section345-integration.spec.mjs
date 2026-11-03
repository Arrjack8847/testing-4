import {test,expect} from '@playwright/test';

async function openSite(page){
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.getByRole('button',{name:'Open Invitation'}).click();
 await expect(page.locator('#couple')).toHaveAttribute('data-art','reference');
 await expect(page.locator('#eventDetails')).toHaveAttribute('data-art','reference');
 return errors;
}

test('single URL integrates approved Couple, Events and Order of the Day without viewport gaps',async({page},testInfo)=>{
 const errors=await openSite(page);
 const state=await page.evaluate(()=>{
  const ids=['couple','eventDetails','runningOrder','saveTheDate','gallery'];
  const el=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));
  const r=id=>el[id].getBoundingClientRect();
  return {
   ids,sectionOrder:ids.map(id=>el[id]?.dataset.section),
   paperSrc:el.eventDetails.querySelector('#eventSourcePaper')?.getAttribute('src'),
   orderRows:el.runningOrder.querySelectorAll('li.order-entry').length,
   hiddenSave:el.saveTheDate.hidden,
   reducedNext:Math.abs(r('runningOrder').top-r('eventDetails').bottom),
   coupleEventsGap:Math.abs(r('eventDetails').top-r('couple').bottom),
   timelineGalleryGap:Math.abs(r('gallery').top-r('runningOrder').bottom),
   heights:ids.map(id=>({id,height:r(id).height})),
   viewport:innerWidth,
   overflow:document.documentElement.scrollWidth-innerWidth
  };
 });
 expect(state.sectionOrder).toEqual(['3','4','5','legacy-save-date','6']);
 expect(state.paperSrc).toContain('/tasik-kayangan/paper.webp');
 expect(state.orderRows).toBe(6);
 expect(state.hiddenSave).toBe(true);
 expect(state.coupleEventsGap).toBeLessThanOrEqual(1);
 expect(state.reducedNext).toBeLessThanOrEqual(1);
 expect(state.timelineGalleryGap).toBeLessThanOrEqual(1);
 expect(state.overflow).toBeLessThanOrEqual(1);
 expect(state.heights.find(x=>x.id==='runningOrder').height).toBeGreaterThanOrEqual(650);
 expect(errors).toEqual([]);
 if(testInfo.project.name==='iphone-390'){
  for(const id of ['eventDetails','runningOrder']){
   await page.evaluate(id=>{
    const rect=document.getElementById(id).getBoundingClientRect();
    document.documentElement.style.scrollBehavior='auto';
    scrollTo({top:scrollY+rect.top-innerHeight/2,behavior:'instant'});
   },id);
   await page.waitForTimeout(500);
   await page.screenshot({path:testInfo.outputPath('integrated-seam-'+id+'.png'),animations:'disabled'});
  }
 }
});

test('order scene has reversible scroll camera and honors Reduce Motion',async({page})=>{
 await openSite(page);
 const order=page.locator('#runningOrder');
 const top=await order.evaluate(el=>el.getBoundingClientRect().top+scrollY);
 const at=async delta=>{
  await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),top+delta);
  await expect.poll(()=>order.getAttribute('data-order-camera')).not.toBeNull();
  await page.waitForTimeout(120);
  return Number(await order.getAttribute('data-order-camera'));
 };
 const first=await at(0),down=await at(220),back=await at(0);
 expect(down).toBeGreaterThan(first);
 expect(Math.abs(first-back)).toBeLessThanOrEqual(1);
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect.poll(async()=>Number(await order.getAttribute('data-order-camera'))).toBe(0);
});
