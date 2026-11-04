// Read-only time-aligned source/local Section 9 visual comparison.
// It does not copy vendor scripts, publish source images or claim exact parity.
import {chromium} from '@playwright/test';
import fs from 'node:fs';
const output='section9-frame-audit';fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const sourceUrl='https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en';
const localUrl='http://127.0.0.1:8000/';
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,locale:'en-MY'});
const original=await context.newPage(), local=await context.newPage();
const metrics={source:sourceUrl,local:localUrl,viewport:[390,844],frames:[],checkedAt:new Date().toISOString()};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const open=async(page)=>{
  await page.evaluate(()=>document.fonts.ready);
  const button=page.getByRole('button',{name:'Open Invitation'});
  if(await button.count()&&await button.first().isVisible()){
    await button.first().click({timeout:12000});
  }
};
const pose=async(page,root,butterfly)=>{
  return page.evaluate(({root,butterfly})=>{
    const section=document.querySelector(root);
    const bf=document.querySelector(butterfly);
    const box=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {
      x:Number(r.x.toFixed(1)),y:Number(r.y.toFixed(1)),
      width:Number(r.width.toFixed(1)),height:Number(r.height.toFixed(1)),
      transform:getComputedStyle(e).transform,opacity:getComputedStyle(e).opacity
    }};
    return {section:box(section),butterfly:box(bf)};
  },{root,butterfly});
};
try{
  await Promise.all([
    original.goto(sourceUrl,{waitUntil:'domcontentloaded',timeout:60000}),
    local.goto(localUrl,{waitUntil:'domcontentloaded',timeout:30000})
  ]);
  await Promise.all([open(original),open(local)]);
  await Promise.all([original.waitForSelector('#cgv-rsvp'),local.waitForSelector('#rsvp')]);
  await local.waitForFunction(()=>{
    const s=document.querySelector('#rsvp');
    return s.classList.contains('s9-reference-loaded')&&s.classList.contains('s9-reference-butterfly-loaded');
  },null,{timeout:20000});
  for(const [label,offset] of [['entry',100],['middle',-355],['exit',-775]]){
    const scroll=async(page,id)=>{
      await page.evaluate(({id,offset})=>{
        document.documentElement.style.scrollBehavior='auto';
        const el=document.querySelector(id);
        const y=el.getBoundingClientRect().top+scrollY-offset;
        window.scrollTo({top:Math.round(y),behavior:'instant'});
      },{id,offset});
    };
    await Promise.all([scroll(original,'#cgv-rsvp'),scroll(local,'#rsvp')]);
    await wait(300);
    const t0=Date.now();
    for(const ms of [0,600,1200,1800,2400,3600,4800]){
      const elapsed=Date.now()-t0;
      if(ms>elapsed)await wait(ms-elapsed);
      const name=label+'-'+String(ms).padStart(4,'0');
      const [o,l,op,lp]=await Promise.all([
        original.screenshot({path:output+'/reference-'+name+'.png',animations:'allow',timeout:25000}),
        local.screenshot({path:output+'/local-'+name+'.png',animations:'allow',timeout:25000}),
        pose(original,'#cgv-rsvp','.cgv-bf'),
        pose(local,'#rsvp','.s9-butterfly')
      ]);
      metrics.frames.push({checkpoint:label,elapsedMs:Date.now()-t0,
        files:['reference-'+name+'.png','local-'+name+'.png'],
        original:op,local:lp});
    }
  }
}catch(error){
  metrics.failure=String(error);
  console.error('S9_FRAME_AUDIT_ERROR',String(error));
  process.exitCode=1;
}finally{
  fs.writeFileSync(output+'/frames.json',JSON.stringify(metrics,null,2));
  await browser.close();
}
