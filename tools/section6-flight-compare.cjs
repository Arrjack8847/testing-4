'use strict';
// Development-only geometry audit. No third-party images or screenshots are copied.
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('@playwright/test');

const OUT=path.resolve(__dirname,'../artifacts/section6-flight');
const widths=[320,360,390,430], targets=[240,0,-200];
const sites=[
  {name:'reference',url:'https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en',
   section:'.cgv-dress',wing:'.cgv-bf-wl'},
  {name:'local',url:'http://127.0.0.1:8000/',
   section:'#dressCode',wing:'.dress-flight-wing-left'}
];
async function inspect(page,spec){
  return await page.evaluate(spec=>{
    const section=document.querySelector(spec.section);
    const wing=section?.querySelector(spec.wing);
    if(!section||!wing)return {error:'Missing butterfly section or wing'};
    const r=section.getBoundingClientRect(),w=wing.getBoundingClientRect();
    const st=getComputedStyle(wing);
    return {
      sectionTop:+r.top.toFixed(2),sectionHeight:+r.height.toFixed(2),
      x:+w.left.toFixed(2),y:+(w.top-r.top).toFixed(2),
      wingWidth:+w.width.toFixed(2),wingHeight:+w.height.toFixed(2),
      opacity:st.opacity,transform:st.transform,animationName:st.animationName,
      visible:w.width>0&&w.height>0&&st.visibility!=='hidden'
    };
  },spec);
}
async function runOne(browser,width,spec){
  const page=await browser.newPage({viewport:{width,height:844},deviceScaleFactor:1,
    isMobile:true,hasTouch:true,reducedMotion:'no-preference'});
  const outcome={name:spec.name,width,states:[]};
  try{
    const response=await page.goto(spec.url,{waitUntil:'domcontentloaded',timeout:45000});
    if(response?.status()>=400)throw Error('HTTP '+response.status());
    await page.evaluate(()=>document.fonts?.ready);
    const open=page.getByRole('button',{name:/open invitation/i});
    if(await open.count())await open.first().click({timeout:7000});
    await page.waitForTimeout(1800);
    await page.locator(spec.section).waitFor({state:'attached',timeout:10000});
    for(const target of targets){
      await page.evaluate(({selector,target})=>{
        document.documentElement.style.scrollBehavior='auto';
        const section=document.querySelector(selector);
        scrollTo({top:scrollY+section.getBoundingClientRect().top-target,behavior:'instant'});
      },{selector:spec.section,target});
      await page.waitForTimeout(1180);
      outcome.states.push({target,geometry:await inspect(page,spec)});
    }
    outcome.ok=true;
  }catch(e){outcome.ok=false;outcome.error=String(e)}
  finally{await page.close()}
  return outcome;
}
async function main(){
  fs.mkdirSync(OUT,{recursive:true});
  const browser=await chromium.launch({headless:true});
  const data={generatedAt:new Date().toISOString(),viewports:widths,targets,results:[]};
  try{
    for(const width of widths){
      const ref=await runOne(browser,width,sites[0]);
      const local=await runOne(browser,width,sites[1]);
      const deltas=[];
      for(let i=0;i<targets.length;i++){
        const r=ref.states[i]?.geometry,l=local.states[i]?.geometry;
        if(r&&!r.error&&l&&!l.error) deltas.push({
          target:targets[i],
          dx:+(l.x-r.x).toFixed(2),
          dy:+(l.y-r.y).toFixed(2),
          sourceX:r.x,localX:l.x,
          sourceY:r.y,localY:l.y
        });
      }
      data.results.push({width,reference:ref,local,deltas});
      console.log('FLIGHT '+width+'px '+JSON.stringify(deltas));
    }
  }finally{await browser.close()}
  fs.writeFileSync(path.join(OUT,'flight.json'),JSON.stringify(data,null,2));
  if(data.results.some(x=>!x.reference.ok||!x.local.ok||x.deltas.length!==targets.length))process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1});
