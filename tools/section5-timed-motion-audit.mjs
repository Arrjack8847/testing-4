/**
 * Read-only motion tracing for Section 5 (Order of the Day).
 * Unlike the geometry comparator, motion tracing uses reducedMotion=no-preference.
 * No vendor WebP is downloaded, copied or committed. This is diagnostic data,
 * NOT proof of pixel-perfect imagery or proprietary animation parity.
 * Usage: node tools/section5-timed-motion-audit.mjs
 *        node tools/section5-timed-motion-audit.mjs --local-url http://localhost:8000/
 */
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

const argv=process.argv;
const value=(flag,fallback)=>argv.includes(flag)?argv[argv.indexOf(flag)+1]||fallback:fallback;
const sourceUrl='https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en';
const localUrl=value('--local-url','http://localhost:8000/');
const out='artifacts/section5-motion-trace';
const viewport={width:390,height:844};
const checkpoints=[0,2000,6000,10000,13000,16000,22000,27000,32000];

async function enter(page,source){
  const response=await page.goto(source?sourceUrl:localUrl,{waitUntil:'domcontentloaded',timeout:60000});
  if(!response?.ok())throw Error('Preview HTTP '+response?.status());
  await page.waitForTimeout(source?1800:250);
  const buttons=page.getByRole('button',{name:'Open Invitation'});
  let opened=false;
  for(let i=0;i<await buttons.count();i++){
    if(await buttons.nth(i).isVisible()){
      await buttons.nth(i).click({timeout:15000});opened=true;break;
    }
  }
  if(!opened)throw Error('Open Invitation button unavailable');
  await page.waitForTimeout(source?1400:350);
  const selector=source?'.cgv-timeline':'#runningOrder';
  const section=page.locator(selector).first();
  await section.waitFor({state:'attached',timeout:15000});
  await page.evaluate(()=>document.fonts.ready);
  await section.evaluate(el=>{
    document.documentElement.style.scrollBehavior='auto';
    el.scrollIntoView({block:'start',behavior:'instant'});
  });
  await page.waitForTimeout(650);
  return selector;
}
async function observe(page,source,selector){
  return page.evaluate(({source,selector})=>{
    const section=document.querySelector(selector);
    if(!section)return {error:'Section missing'};
    const r=section.getBoundingClientRect();
    const bf=section.querySelector(source?'.cgv-bf':'#orderButterflyFlight');
    const b=bf?.getBoundingClientRect();
    const style=bf?getComputedStyle(bf):null;
    const canvas=source?document.querySelector('canvas.cgv-petals'):section.querySelector('#orderPetalCanvas');
    let visiblePixels=null,meanAlpha=null;
    if(canvas?.width&&canvas?.height){
      try{
        const data=canvas.getContext('2d')?.getImageData(0,0,canvas.width,canvas.height).data;
        if(data){
          let count=0,sum=0;
          for(let i=3;i<data.length;i+=4)if(data[i]>0){count++;sum+=data[i]}
          visiblePixels=count;meanAlpha=count?Math.round(sum/count):0;
        }
      }catch(e){visiblePixels='unavailable: '+String(e)}
    }
    return {
      pageClockMs:Math.round(performance.now()),
      section:{top:+r.top.toFixed(2),height:+r.height.toFixed(2)},
      butterfly:bf?{
        visible:style.display!=='none'&&style.visibility!=='hidden'&&style.opacity!=='0'&&b.width>0,
        relativeX:+(b.left-r.left).toFixed(2),relativeY:+(b.top-r.top).toFixed(2),
        width:+b.width.toFixed(2),height:+b.height.toFixed(2),
        transform:style.transform,
        dataX:bf.dataset.x??null,dataY:bf.dataset.y??null,
        direction:bf.dataset.direction??null,passage:bf.dataset.passage??null
      }:null,
      petals:canvas?{width:canvas.width,height:canvas.height,nonTransparentPixels:visiblePixels,
        averageVisibleAlpha:meanAlpha}:null,
      artworkStatus:section.dataset.artworkStatus??null,
      butterflyMotion:section.dataset.butterflyMotion??null,
      petalMotion:section.dataset.petalMotion??null
    };
  },{source,selector});
}
async function trace(browser,source){
  const context=await browser.newContext({
    viewport,deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'no-preference'
  });
  const page=await context.newPage();
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(e.message));
  try{
    const selector=await enter(page,source);
    const start=Date.now(),samples=[];
    for(const targetMs of checkpoints){
      const remaining=targetMs-(Date.now()-start);
      if(remaining>0)await page.waitForTimeout(remaining);
      samples.push({
        targetMs,actualElapsedMs:Date.now()-start,
        ...(await observe(page,source,selector))
      });
    }
    return {status:'captured',pageErrors,samples};
  }catch(error){return {status:'error',error:String(error),pageErrors}}
  finally{await context.close()}
}

await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
let report;
try{
  const [reference,local]=await Promise.all([trace(browser,true),trace(browser,false)]);
  report={
    measuredAt:new Date().toISOString(),sourceUrl,localUrl,viewport,checkpoints,
    note:'Diagnostic only. Source and local clocks can start at different phases; missing artwork leaves local butterfly invisible.',
    reference,local
  };
}finally{await browser.close()}
const path=out+'/report.json';
await writeFile(path,JSON.stringify(report,null,2));
for(const side of ['reference','local']){
  const r=report[side];
  console.log(side.toUpperCase()+': '+r.status+
    ' visible butterfly observations='+((r.samples||[]).filter(x=>x.butterfly?.visible).length));
  if(r.error)console.error(side+': '+r.error);
}
console.log('Motion trace: '+path);
if(report.reference.status!=='captured'||report.local.status!=='captured')process.exitCode=1;
