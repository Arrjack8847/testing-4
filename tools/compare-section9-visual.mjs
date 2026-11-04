// Read-only 390x844 source-versus-local Section 9 capture with aligned section scroll.
import {chromium} from '@playwright/test';
import fs from 'node:fs';
const OUT='section9-visual-evidence';
fs.mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const urls={reference:'https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en',
  local:'http://127.0.0.1:8000/'};
const SELECT={
  eyebrow:['#cgv-rsvp .cgv-eyebrow','#rsvp .s9-eyebrow'],
  heading:['#cgv-rsvp h2','#rsvpHeading'],
  form:['#cgv-rsvp form','#s9RsvpForm'],
  name:['#cgv-rsvp label[for="cgv_name"]','#rsvp label[for="s9Name"]'],
  attendance:['#cgv-rsvp label[for="cgv_attend"]','#rsvp label[for="s9Attendance"]'],
  guests:['#cgv-rsvp label[for="cgv_pax"]','#rsvp label[for="s9Guests"]'],
  wish:['#cgv-rsvp label[for="cgv_wish"]','#rsvp label[for="s9Wish"]'],
  nameInput:['#cgv_name','#s9Name'],
  attendSelect:['#cgv_attend','#s9Attendance'],
  guestsSelect:['#cgv_pax','#s9Guests'],
  wishArea:['#cgv_wish','#s9Wish'],
  submit:['#cgv-rsvp button[type=submit]','#rsvp button[type=submit]'],
  wall:['#cgv-rsvp .cgv-wall','#rsvp .s9-wall'],
  wish1:['#cgv-rsvp .cgv-wish:first-child','#rsvp .s9-wish:first-child']
};
const result={timestamp:new Date().toISOString(),viewport:[390,844],screenshots:[],sourceImagePolicy:'source-only screenshot; local default uses original procedural artwork'};
async function capture(kind,index){
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,
   isMobile:true,hasTouch:true,locale:'en-MY',reducedMotion:'no-preference'});
 const page=await context.newPage();
 try{
   await page.goto(urls[kind],{waitUntil:'domcontentloaded',timeout:65000});
   await page.evaluate(()=>document.fonts.ready);
   const buttons=page.getByRole('button',{name:'Open Invitation'});
   if(await buttons.count()&&await buttons.first().isVisible())await buttons.first().click({timeout:10000});
   await page.waitForTimeout(1800);
   const root=kind==='reference'?'#cgv-rsvp':'#rsvp';
   await page.waitForSelector(root);
   const boxes=await page.evaluate(({root,selectors,index})=>{
     const base=document.querySelector(root),sec=base.getBoundingClientRect();
     const get=selector=>{
       const node=document.querySelector(selector);if(!node)return null;
       const r=node.getBoundingClientRect(),cs=getComputedStyle(node);
       return {x:+r.x.toFixed(2),relativeY:+(r.y-sec.y).toFixed(2),
         width:+r.width.toFixed(2),height:+r.height.toFixed(2),
         font:cs.fontFamily,fontSize:cs.fontSize,lineHeight:cs.lineHeight,
         letterSpacing:cs.letterSpacing,color:cs.color,bg:cs.backgroundColor,
         radius:cs.borderRadius,padding:cs.padding,border:cs.border,
         margin:cs.margin,opacity:cs.opacity};
     };
     return {section:get(root),overflow:document.documentElement.scrollWidth-innerWidth,
       background:getComputedStyle(base).backgroundColor,
       paper:[...base.querySelectorAll('img')].map(i=>({src:i.currentSrc||i.src,natural:[i.naturalWidth,i.naturalHeight]})),
       fields:Object.fromEntries(Object.entries(selectors).map(([key,pair])=>[key,get(pair[index])]))};
   },{root,selectors:SELECT,index});
   result[kind]=boxes;
   for(const [name,offset] of [['entry',100],['middle',-355],['exit',-775]]){
     await page.evaluate(({root,offset})=>{
       document.documentElement.style.scrollBehavior='auto';
       const top=document.querySelector(root).getBoundingClientRect().top+scrollY;
       window.scrollTo({top:Math.round(top-offset),behavior:'instant'});
     },{root,offset});
     await page.waitForTimeout(1800);
     const path=OUT+'/'+kind+'-'+name+'.png';
     await page.screenshot({path,animations:'disabled'});
     result.screenshots.push(path);
   }
 }finally{await context.close();}
}
try{
 await capture('reference',0);
 await capture('local',1);
 const deltas={};
 for(const key of Object.keys(SELECT)){
   const a=result.reference.fields[key],b=result.local.fields[key];
   if(a&&b)deltas[key]={dx:+(b.x-a.x).toFixed(2),dy:+(b.relativeY-a.relativeY).toFixed(2),
     dw:+(b.width-a.width).toFixed(2),dh:+(b.height-a.height).toFixed(2)};
 }
 result.deltas=deltas;
 result.sectionHeightDelta=+(result.local.section.height-result.reference.section.height).toFixed(2);
 console.log('S9_VISUAL_GEOMETRY '+JSON.stringify({source:{section:result.reference.section,fields:result.reference.fields},
   local:{section:result.local.section,fields:result.local.fields},deltas,sectionHeightDelta:result.sectionHeightDelta}));
} catch(e){result.error=String(e);console.error('S9_VISUAL_ERROR '+String(e));process.exitCode=1}
finally{fs.writeFileSync(OUT+'/geometry.json',JSON.stringify(result,null,2));await browser.close();}