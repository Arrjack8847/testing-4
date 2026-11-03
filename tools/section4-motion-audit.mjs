// Section 4 visual/motion forensic audit. Captures computed styles and
// scroll-layer motion, never copies reference HTML/CSS/graphics into repo.
import { chromium } from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const urls={
 reference:'https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en',
 prototype:'http://127.0.0.1:8000/?eventsReference=1'
};
const data={capturedAt:new Date().toISOString(),viewport:{width:390,height:844},results:{}};
for(const [kind,url] of Object.entries(urls)){
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'no-preference'});
 const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForTimeout(3000);
 const button=page.getByRole('button',{name:'Open Invitation',exact:true}).first();
 if(await button.count())try{await button.click({timeout:10000});}catch(e){errors.push('open: '+String(e).slice(0,300));}
 await page.waitForTimeout(4500);
 const selector=kind==='reference'?'#cgv-events':'#eventDetails';
 const overview=await page.evaluate(selector=>{
 const section=document.querySelector(selector);
 if(!section)return {error:'missing section'};
 const parent=section.getBoundingClientRect(),offset=parent.top+scrollY;
 const n=t=>String(t||'').replace(/\s+/g,' ').trim();
 const dims=el=>{const r=el.getBoundingClientRect();return {
   x:+r.x.toFixed(1),y:+(r.y+scrollY-offset).toFixed(1),
   w:+r.width.toFixed(1),h:+r.height.toFixed(1)};};
 const sty=(el,pseudo=null)=>{
  const c=getComputedStyle(el,pseudo);
  const keys=['content','display','position','zIndex','opacity','visibility','filter','transform','transition','animation','animationName','animationDuration','animationDelay','animationTimingFunction','border','borderImage','borderRadius','boxShadow','background','backgroundImage','backgroundSize','backgroundPosition','backgroundRepeat','objectFit','objectPosition','imageRendering','top','right','bottom','left','maskImage','clipPath','padding','margin','gap','font','fontFamily','fontSize','fontWeight','lineHeight','color','textShadow'];
  return Object.fromEntries(keys.map(key=>[key,String(c[key]??'').slice(0,850)]).filter(x=>x[1]&&x[1]!=='none'&&x[1]!=='normal'&&x[1]!=='0px'&&x[1]!=='auto'));
 };
 const rows=[section,...section.querySelectorAll('*')];
 const filtered=rows.filter(el=>{
  if(el.tagName==='SCRIPT'||el.tagName==='STYLE')return false;
  const r=el.getBoundingClientRect();
  return r.width>0&&r.height>0&&(r.width>10||r.height>10);
 }).slice(0,160);
 return {
  section:dims(section),htmlClass:document.documentElement.className,bodyClass:document.body.className,
  rows:filtered.map((el,i)=>({
   i,tag:el.tagName,cls:typeof el.className==='string'?el.className.slice(0,190):'',
   id:el.id,text:el.children.length===0?n(el.textContent).slice(0,80):'',
   rect:dims(el),style:sty(el),
   before:sty(el,'::before'),after:sty(el,'::after'),
   image:el.tagName==='IMG'?{src:el.currentSrc,natural:[el.naturalWidth,el.naturalHeight]}:undefined
  })),
  overlappingImages:[...document.querySelectorAll('img')].filter(img=>{
   const r=img.getBoundingClientRect(),s=section.getBoundingClientRect();
   return r.width>0&&r.height>0&&r.top<s.bottom&&r.bottom>s.top;
  }).map(img=>({src:img.currentSrc,rect:dims(img),natural:[img.naturalWidth,img.naturalHeight]})),
 };
 },selector);
 const snapshots=[];
 for(const [phase,fraction] of [['arrival',-0.2],['top',0],['quarter',0.25],['middle',0.5],['threeQuarter',0.75],['end',1]]){
  await page.evaluate(({selector,fraction})=>{
   const el=document.querySelector(selector);
   const top=el.getBoundingClientRect().top+scrollY;
   const distance=el.getBoundingClientRect().height-innerHeight;
   document.documentElement.style.scrollBehavior='auto';
   scrollTo({top:top+distance*fraction,behavior:'instant'});
  },{selector,fraction});
  await page.waitForTimeout(700);
  const snap=await page.evaluate(selector=>{
   const el=document.querySelector(selector),r=el.getBoundingClientRect();
   const take=node=>{
    if(!node)return null;
    const b=node.getBoundingClientRect(),s=getComputedStyle(node);
    return {id:node.id,cls:String(node.className).slice(0,100),tag:node.tagName,
      y:+b.y.toFixed(1),relativeY:+(b.y-r.y).toFixed(1),w:b.width,h:b.height,
      transform:s.transform,translate:s.translate,backgroundPosition:s.backgroundPosition,
      opacity:s.opacity,animation:s.animationName,src:node.tagName==='IMG'?node.currentSrc:undefined};
   };
   const sel=['.cgv-arch','.cgv-inner','.cgv-ev','.cgv-rv',
     '.cgv-bg','.cgv-paper','.cgv-stage','.cgv-plate','.cgv-ev-name',
     '.event-stage','.event-stage-paint','.event-source-paper',
     '.event-shared-arch','.event-reference-card','.event-reveal','.event-card-title'];
   const found={};for(const query of sel){
    const matches=[...el.querySelectorAll(query)].slice(0,4);
    if(matches.length)found[query]=matches.map(take);
   }
   const imgs=[...document.querySelectorAll('img')].filter(i=>{
    const b=i.getBoundingClientRect();
    return b.width>0&&b.height>0&&b.y<innerHeight&&b.bottom>0;
   }).slice(0,12).map(take);
   return {scrollY:+scrollY.toFixed(1),eventTop:+r.y.toFixed(1),
     eventBottom:+r.bottom.toFixed(1),eventHeight:r.height,found,imgs,
     pageOverflow:document.documentElement.scrollWidth-innerWidth};
  },selector);
  snapshots.push({phase,...snap});
 }
 data.results[kind]={errors,overview,snapshots};
 console.log('SECTION4_MOTION_SUMMARY '+JSON.stringify({
 kind,errors,overview:overview.error?overview.error:{
  section:overview.section,firstRows:overview.rows.slice(0,12).map(x=>({tag:x.tag,cls:x.cls,rect:x.rect,style:x.style,before:x.before,after:x.after})),
  images:overview.overlappingImages
 },snapshots
 }));
 await context.close();
}
await browser.close();
await writeFile('section4-motion-audit.json',JSON.stringify(data,null,2));
