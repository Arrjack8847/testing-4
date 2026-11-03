'use strict';
// Read-only fixed-scroll flight telemetry: separates time-based motion from scroll parallax.
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('@playwright/test');
const out=path.resolve(__dirname,'../artifacts/section6-time-flight');
const specs=[
  {name:'reference',url:'https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en',
   section:'.cgv-dress',wing:'.cgv-bf-wl'},
  {name:'local',url:'http://127.0.0.1:8000/',section:'#dressCode',
   wing:'.dress-flight-wing-left'}
];
function delay(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
async function sample(page,spec){
 return await page.evaluate(spec=>{
  const sec=document.querySelector(spec.section),wing=sec?.querySelector(spec.wing);
  if(!sec||!wing)return {missing:true};
  const r=sec.getBoundingClientRect(),w=wing.getBoundingClientRect(),c=getComputedStyle(wing);
  const parent=wing.parentElement,p=parent?getComputedStyle(parent):null;
  return {
   x:+w.x.toFixed(2),relativeY:+(w.y-r.y).toFixed(2),
   sectionY:+r.y.toFixed(2),sectionHeight:+r.height.toFixed(2),
   wingSize:[+w.width.toFixed(2),+w.height.toFixed(2)],
   className:wing.className,transform:c.transform,opacity:c.opacity,
   wingAnimation:c.animationName,wingVisibility:c.visibility,
   parent:parent?.className??null,parentTransform:p?.transform??null,
   parentAnimation:p?.animationName??null,
   scrollY:+scrollY.toFixed(2),
   initialized:Math.abs(w.x)>.5||Math.abs(w.y-r.y)>3
  };
 },spec);
}
async function measure(browser,spec,width){
 const page=await browser.newPage({viewport:{width,height:844},isMobile:true,
   hasTouch:true,deviceScaleFactor:1,reducedMotion:'no-preference'});
 const result={name:spec.name,width,samples:[]};
 try{
   const resp=await page.goto(spec.url,{waitUntil:'domcontentloaded',timeout:55000});
   if(resp&&resp.status()>=400)throw Error('HTTP '+resp.status());
   await page.evaluate(()=>document.fonts?.ready);
   const open=page.getByRole('button',{name:/open invitation/i});
   if(await open.count()){
     await open.first().click({timeout:7000});
     result.opened=true;
   }else result.opened=false;
   await delay(2200);
   await page.locator(spec.section).waitFor({state:'attached',timeout:10000});
   await page.evaluate(selector=>{
     document.documentElement.style.scrollBehavior='auto';
     document.querySelector(selector).scrollIntoView({block:'start',behavior:'instant'});
   },spec.section);
   await delay(150);
   for(let i=0;i<15;i++){
      result.samples.push({elapsedMs:i*500,geometry:await sample(page,spec)});
      await delay(500);
   }
   result.ok=true;
 }catch(e){result.ok=false;result.error=String(e)}
 finally{await page.close()}
 return result;
}
async function main(){
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true});
 const data={generatedAt:new Date().toISOString(),results:[]};
 try{
  for(const width of [390,320]){
   for(const spec of specs){
    const record=await measure(browser,spec,width);
    data.results.push(record);
    console.log('TIME_FLIGHT '+width+'px '+spec.name+' '+JSON.stringify({
      ok:record.ok,error:record.error,opened:record.opened,
      frames:record.samples.map(s=>({
        t:s.elapsedMs,x:s.geometry.x,y:s.geometry.relativeY,
        sectionY:s.geometry.sectionY,ready:s.geometry.initialized,
        parent:s.geometry.parent,wingAnim:s.geometry.wingAnimation
      }))
    }));
   }
  }
 }finally{await browser.close()}
 fs.writeFileSync(path.join(out,'timeline.json'),JSON.stringify(data,null,2));
 if(data.results.some(r=>!r.ok))process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1});
