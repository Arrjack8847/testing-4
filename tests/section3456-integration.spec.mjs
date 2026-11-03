import {test,expect} from '@playwright/test';

// The source-matched section sequence is Couple -> Events ->
// Order of the Day -> Dress Code -> Gallery -> RSVP.
// The previous Save the Date is retained but hidden by default.
async function openAll(page,url='/'){
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(url);
 await page.getByRole('button',{name:'Open Invitation'}).click();
 await expect(page.locator('#dressCode')).toHaveAttribute('aria-hidden','false');
 return errors;
}

test('single local URL joins Couple, Events, Order, Dress Code, Gallery and RSVP at four widths',async({page},testInfo)=>{
 const errors=await openAll(page);
 const result=await page.evaluate(()=>{
  const ids=['couple','eventDetails','runningOrder','saveTheDate','dressCode','gallery','rsvp'];
  const elements=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));
  const snap=id=>elements[id].getBoundingClientRect();
  const visible=['couple','eventDetails','runningOrder','dressCode','gallery','rsvp'];
  return {
   sections:ids.map(id=>({id,number:elements[id].dataset.section,hidden:elements[id].hidden})),
   artModes:{couple:elements.couple.dataset.art,events:elements.eventDetails.dataset.art},
   paperSrc:elements.eventDetails.querySelector('#eventSourcePaper')?.getAttribute('src'),
   rows:elements.runningOrder.querySelectorAll('li.order-entry').length,
   dressCards:elements.dressCode.querySelectorAll('.dress-palette').length,
   dressSwatches:elements.dressCode.querySelectorAll('.dress-swatch').length,
   gaps:visible.slice(1).map((id,i)=>({from:visible[i],to:id,
     gap:+(snap(id).top-snap(visible[i]).bottom).toFixed(2)})),
   sizes:visible.map(id=>({id,h:+snap(id).height.toFixed(2),w:+snap(id).width.toFixed(2)})),
   overflow:document.documentElement.scrollWidth-innerWidth
  };
 });
 expect(result.sections.map(s=>s.number)).toEqual(['3','4','5','legacy-save-date','6','7','8']);
 expect(result.sections[3].hidden).toBe(true);
 expect(result.artModes).toEqual({couple:'reference',events:'reference'});
 expect(result.paperSrc).toContain('/tasik-kayangan/paper.webp');
 expect(result.rows).toBe(6);
 expect(result.dressCards).toBe(2);
 expect(result.dressSwatches).toBe(6);
 expect(result.gaps.every(x=>Math.abs(x.gap)<=1),JSON.stringify(result.gaps)).toBe(true);
 expect(result.overflow).toBeLessThanOrEqual(1);
 expect(result.sizes.find(x=>x.id==='runningOrder').h).toBeGreaterThanOrEqual(650);
 expect(result.sizes.find(x=>x.id==='dressCode').h).toBeGreaterThanOrEqual(679);
 expect(errors).toEqual([]);
 if(testInfo.project.name==='iphone-390'){
  for(const id of ['runningOrder','dressCode']){
   await page.evaluate(id=>{
    const el=document.getElementById(id),r=el.getBoundingClientRect();
    document.documentElement.style.scrollBehavior='auto';
    scrollTo({top:Math.round(scrollY+r.top-innerHeight*.5),behavior:'instant'});
   },id);
   await page.waitForTimeout(750);
   await page.screenshot({path:testInfo.outputPath('integrated-before-'+id+'.png'),animations:'disabled'});
  }
 }
});

test('Order of the Day is the original plum fallback, Dress Code matches measured palette cards',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 const errors=await openAll(page);
 const metrics=await page.evaluate(()=>{
  const order=document.getElementById('runningOrder');
  const dress=document.getElementById('dressCode');
  const cards=[...dress.querySelectorAll('.dress-palette')];
  const back=getComputedStyle(order).backgroundImage;
  return {
    plum:back,
    sourceOriginalArt:getComputedStyle(order.querySelector('.order-stage-original')).backgroundImage,
    cards:cards.map(c=>({color:getComputedStyle(c).backgroundColor,border:getComputedStyle(c).borderRadius,
      height:c.getBoundingClientRect().height})),
    title:getComputedStyle(dress.querySelector('.dress-heading')).fontSize,
    label:getComputedStyle(dress.querySelector('.dress-heading')).opacity,
    swatchColors:[...dress.querySelectorAll('.dress-swatch')].map(x=>getComputedStyle(x).backgroundColor),
    butterflyMotion:dress.querySelector('.dress-butterfly')?getComputedStyle(dress.querySelector('.dress-butterfly')).animationName:'none'
  };
 });
 expect(metrics.plum).toContain('linear-gradient');
 expect(metrics.sourceOriginalArt).toContain('order-plum-emboss-original.svg');
 expect(metrics.cards).toHaveLength(2);
 for(const card of metrics.cards){
  expect(card.color).toBe('rgba(255, 255, 255, 0.5)');
  expect(card.border).toBe('16px');
  expect(Math.abs(card.height-168.78)).toBeLessThan(1.2);
 }
 expect(metrics.title).toBe('52px');
 expect(metrics.label).toBe('1');
 expect(metrics.swatchColors).toEqual([
  'rgb(138, 154, 123)','rgb(179, 192, 164)','rgb(237, 231, 217)',
  'rgb(180, 105, 79)','rgb(220, 167, 154)','rgb(239, 221, 209)'
 ]);
 expect(errors).toEqual([]);
});

test('Dress Code scroll camera is reversible and Reduced Motion disables movement',async({page})=>{
 const errors=await openAll(page);
 const dress=page.locator('#dressCode');
 const top=await dress.evaluate(el=>el.getBoundingClientRect().top+scrollY);
 const sample=async delta=>{
  await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),top+delta);
  await expect.poll(()=>dress.evaluate(el=>el.style.getPropertyValue('--dress-camera-y'))).not.toBe('');
  await page.waitForTimeout(150);
  return Number(await dress.evaluate(el=>parseFloat(el.style.getPropertyValue('--dress-camera-y'))));
 };
 const initial=await sample(0),middle=await sample(220),back=await sample(0);
 expect(Math.abs(middle-initial)).toBeGreaterThan(6);
 expect(Math.abs(initial-back)).toBeLessThanOrEqual(1.4);
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect.poll(async()=>Number(await dress.evaluate(el=>parseFloat(el.style.getPropertyValue('--dress-camera-y'))))).toBe(0);
 expect(errors).toEqual([]);
});
