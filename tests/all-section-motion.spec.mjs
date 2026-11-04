import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';

// Integration-only test: do not change the source artwork or section clocks.
const ids=['message','couple','eventDetails','runningOrder','dressCode',
  'gallery','weddingGift','rsvp','closingMessage'];
const settle=page=>page.evaluate(()=>new Promise(done=>
  requestAnimationFrame(()=>requestAnimationFrame(done))));
async function open(page){
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/');
  await expect(page.locator('#invitation')).toHaveAttribute('data-layers','ready',{timeout:35000});
  await page.getByRole('button',{name:'Open Invitation',exact:true}).click();
  await expect(page.locator('#invitation')).toHaveAttribute('data-state','opened');
  await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto'});
  return errors;
}
async function position(page,id){
  return page.locator('#'+id).evaluate(el=>el.getBoundingClientRect().top+scrollY);
}
async function scroll(page,target){
  await page.evaluate(y=>window.scrollTo({top:Math.max(0,Math.round(y)),behavior:'instant'}),target);
  await settle(page);
}
async function measure(page,a,b){
  return page.evaluate(({a,b})=>{
    const x=document.getElementById(a).getBoundingClientRect(),
      y=document.getElementById(b).getBoundingClientRect();
    return {from:a,to:b,gap:+(y.top-x.bottom).toFixed(2),
      overflow:+(document.documentElement.scrollWidth-innerWidth).toFixed(2),
      scroll:+scrollY.toFixed(1),seamScreenY:+y.top.toFixed(1)};
  },{a,b});
}

test('all Section 2-10 transitions stay gap-free in both scroll directions',async({page},testInfo)=>{
  const errors=await open(page),observations=[];
  for(const direction of ['forward','reverse']){
    const indices=[...Array(ids.length-1).keys()];
    if(direction==='reverse')indices.reverse();
    for(const index of indices){
      const from=ids[index],to=ids[index+1];
      const top=await position(page,to);
      const vh=await page.evaluate(()=>innerHeight);
      await scroll(page,top-vh*.5);
      const state=await measure(page,from,to);
      observations.push({direction,...state});
      expect(Math.abs(state.gap),direction+' '+from+' -> '+to).toBeLessThanOrEqual(1.5);
      expect(state.overflow,direction+' '+from+' -> '+to).toBeLessThanOrEqual(1);
      if(direction==='forward'&&[0,3,5,7].includes(index)){
        await page.screenshot({
          path:testInfo.outputPath('motion-seam-'+(index+2)+'-'+testInfo.project.name+'.png'),
          animations:'allow'
        });
      }
    }
  }
  await writeFile(testInfo.outputPath('motion-seams-'+testInfo.project.name+'.json'),
    JSON.stringify({observations,errors},null,2));
  expect(observations).toHaveLength(16);
  expect(errors).toEqual([]);
});

test('Section 3 and 10 cameras return to exact position on reverse scroll',async({page},testInfo)=>{
  const errors=await open(page);
  const coupleTop=await position(page,'couple'),couple=page.locator('#couple');
  const sampleCouple=async offset=>{
    await scroll(page,coupleTop+offset);
    return couple.evaluate(el=>({
      camera:Number(el.dataset.referenceCameraOffset),
      displacement:parseFloat(el.style.getPropertyValue('--couple-reference-y')),
      petals:el.dataset.petalsActive
    }));
  };
  const c1=await sampleCouple(120),c2=await sampleCouple(300),c3=await sampleCouple(120);
  expect(c2.camera-c1.camera).toBeGreaterThan(3);
  expect(Math.abs(c3.camera-c1.camera)).toBeLessThan(.5);
  expect(c1.petals).toBe('true');
  const closingTop=await position(page,'closingMessage'),closing=page.locator('#closingMessage');
  const sampleClosing=async offset=>{
    await scroll(page,closingTop+offset);
    await expect(closing).toHaveAttribute('data-active','true');
    return closing.evaluate(el=>({
      pinned:parseFloat(el.style.getPropertyValue('--closing10-sticky-y')),
      scene:parseFloat(el.style.getPropertyValue('--closing10-scene-y'))
    }));
  };
  const z1=await sampleClosing(70),z2=await sampleClosing(215),z3=await sampleClosing(70);
  expect(z2.pinned-z1.pinned).toBeGreaterThan(100);
  expect(Math.abs(z3.pinned-z1.pinned)).toBeLessThan(2);
  expect(Math.abs(z3.scene-z1.scene)).toBeLessThan(1);
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(closing).toHaveAttribute('data-active','false');
  await expect(closing.locator('#closingHeading')).toBeVisible();
  await scroll(page,coupleTop+120);
  await expect(couple).toHaveAttribute('data-petals-active','false');
  await writeFile(testInfo.outputPath('motion-cameras-'+testInfo.project.name+'.json'),
    JSON.stringify({couple:[c1,c2,c3],closing:[z1,z2,z3],errors},null,2));
  expect(errors).toEqual([]);
});
