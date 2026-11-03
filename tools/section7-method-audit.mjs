// Phase 1, 3 and 5 independent source-versus-local Gallery investigation.
// Public-source browser research only: never download source photos into the repository.
// Screenshots are temporary QA evidence; do not republish without permission.
import {chromium} from '@playwright/test';
import fs from 'node:fs';

const SOURCE='https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en';
const LOCAL='http://127.0.0.1:8000/';
const OUT='section7-method-evidence';
const VIEWPORTS=[{width:320,height:568},{width:360,height:740},{width:390,height:844},{width:430,height:932}];
const LABELS=['Together','The Bride','The Groom','The Garden','The Lake'];
fs.mkdirSync(OUT,{recursive:true});
const report={capturedAt:new Date().toISOString(),source:SOURCE,local:LOCAL,
  viewports:VIEWPORTS,measurements:[],timelines:[],comparisons:[],
  caveats:[
    'Source photos are not included in GitHub; local screenshots may have placeholders.',
    'Pixel similarity is NOT certified unless exact authorized photos load at both sites.',
    'Differences in neighboring sections and document scroll heights may affect screenshots.',
    'QA browser screenshots can include copyrighted imagery; use them only for review.'
  ]};
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const round=n=>Number.isFinite(n)?Math.round(n*100)/100:null;
function sampleGallery(){
  const heading=[...document.querySelectorAll('h1,h2,h3,h4')].find(e=>
    (e.textContent||'').trim()==='Our Gallery');
  if(!heading)return {error:'Gallery heading missing'};
  const section=heading.closest('section');
  const rect=el=>{
    if(!el)return null;
    const r=el.getBoundingClientRect();
    return {x:Math.round(r.x*100)/100,y:Math.round(r.y*100)/100,
      docY:Math.round((r.y+scrollY)*100)/100,
      width:Math.round(r.width*100)/100,height:Math.round(r.height*100)/100};
  };
  const style=el=>{
    if(!el)return null;
    const s=getComputedStyle(el);
    return {color:s.color,background:s.backgroundColor,
      backgroundImage:s.backgroundImage.slice(0,350),font:s.fontFamily,
      fontSize:s.fontSize,lineHeight:s.lineHeight,weight:s.fontWeight,
      spacing:s.letterSpacing,padding:s.padding,margin:s.margin,
      border:s.border,borderRadius:s.borderRadius,shadow:s.boxShadow,
      opacity:s.opacity,transform:s.transform,translate:s.translate,
      transition:s.transition,animation:s.animationName,objectFit:s.objectFit,
      objectPosition:s.objectPosition};
  };
  const findText=(txt)=>[...section.querySelectorAll('p,div,span')]
    .find(el=>el.children.length===0&&(el.textContent||'').trim().toLowerCase()===txt.toLowerCase());
  const frames=LABELS.map((label,index)=>{
    const img=[...section.querySelectorAll('img')]
      .find(x=>(x.alt||'').toLowerCase()===label.toLowerCase()||
        (index===0&&(x.alt||'').toLowerCase()==='wedding couple together')||
        (index===3&&(x.alt||'').toLowerCase()==='the wedding garden')||
        (index===4&&(x.alt||'').toLowerCase()==='the lakeside scene'));
    const node=section.querySelector('[data-gallery-slot="'+index+'"]')||img?.parentElement||null;
    const expectedNote=[...node?.querySelectorAll('span')||[]]
      .find(x=>(x.textContent||'').trim().toLowerCase()===label.toLowerCase());
    return {label,frame:rect(node),frameStyle:style(node),
      image:img?{src:(img.currentSrc||img.src),natural:[img.naturalWidth,img.naturalHeight],
        complete:img.complete,box:rect(img),style:style(img)}:null,
      caption:expectedNote?{box:rect(expectedNote),style:style(expectedNote)}:null,
      classes:String(node?.className||''),disabled:node?.disabled??null};
  });
  const prev=section.previousElementSibling,next=section.nextElementSibling;
  const sectionHead=el=>el?{
    id:el.id,classes:String(el.className||''),
    heading:[...el.querySelectorAll('h1,h2,h3')].slice(0,2).map(x=>(x.textContent||'').trim()),
    bg:getComputedStyle(el).backgroundColor,
    bgImage:getComputedStyle(el).backgroundImage.slice(0,300),
    box:rect(el)}:null;
  const extraStyles=[...section.querySelectorAll('*')].filter(x=>
    getComputedStyle(x).backgroundImage!=='none').slice(0,15)
    .map(x=>({tag:x.tagName,classes:String(x.className||'').slice(0,80),
      background:getComputedStyle(x).backgroundImage.slice(0,200)}));
  return {scrollY,section:{id:section.id,box:rect(section),style:style(section)},
    heading:{box:rect(heading),style:style(heading)},
    eyebrow:{box:rect(findText('Moments')),style:style(findText('Moments'))},
    hint:{box:rect(findText('Tap a frame to view')),style:style(findText('Tap a frame to view'))},
    frames,neighbors:{previous:sectionHead(prev),next:sectionHead(next),
      beforeGap:prev?Math.round((section.getBoundingClientRect().top-prev.getBoundingClientRect().bottom)*100)/100:null,
      afterGap:next?Math.round((next.getBoundingClientRect().top-section.getBoundingClientRect().bottom)*100)/100:null},
    media:{images:[...section.querySelectorAll('img')].map(x=>({
        alt:x.alt,src:x.currentSrc||x.src,complete:x.complete,
        natural:[x.naturalWidth,x.naturalHeight]})),
      svgs:section.querySelectorAll('svg').length,
      canvases:section.querySelectorAll('canvas').length,
      cssBackgrounds:extraStyles},
    overflow:document.documentElement.scrollWidth-innerWidth};
}
async function openInvitation(page){
  await page.goto(page.__target,{waitUntil:'domcontentloaded',timeout:55000});
  await page.waitForTimeout(900);
  const b=page.getByRole('button',{name:'Open Invitation'});
  for(let i=0;i<await b.count();i++){
    if(await b.nth(i).isVisible()){
      await b.nth(i).click({timeout:10000});
      break;
    }
  }
  await page.getByRole('heading',{name:'Our Gallery',exact:true}).first()
    .waitFor({state:'attached',timeout:15000});
  await page.waitForTimeout(850);
}
async function setScroll(page,y){
  await page.evaluate(y=>{
    document.documentElement.style.scrollBehavior='auto';
    window.scrollTo({top:Math.max(0,y),behavior:'instant'});
  },y);
}
async function staticCapture(site,url,viewport){
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true,
    deviceScaleFactor:1,locale:'en-MY',reducedMotion:'reduce'});
  const page=await context.newPage();
  page.__target=url;
  const record={kind:site,viewport,status:'started',errors:[],networkGallery:[]};
  report.measurements.push(record);
  page.on('pageerror',err=>record.errors.push(String(err.message).slice(0,300)));
  page.on('response',res=>{
    if(res.url().includes('/gallery/')||res.url().includes('/couples/')){
      record.networkGallery.push({url:res.url(),status:res.status(),
        type:res.headers()['content-type']||''});
    }
  });
  try{
    await openInvitation(page);
    const start=await page.evaluate(sampleGallery);
    if(start.error)throw Error(start.error);
    const top=start.section.box.docY;
    const sectionHeight=start.section.box.height;
    for(const [stage,relative] of [['start',0],['middle',sectionHeight/2],['end',Math.max(0,sectionHeight-viewport.height*.65)]]){
      await setScroll(page,top+relative);
      await page.waitForTimeout(850);
      await page.screenshot({path:OUT+'/'+site+'-'+viewport.width+'-'+stage+'.png',animations:'disabled'});
    }
    record.data=await page.evaluate(sampleGallery);
    record.galleryHeight=round(sectionHeight);
    record.status='captured';
    console.log('SECTION7_METHOD_STATIC '+JSON.stringify({kind:site,width:viewport.width,
      galleryHeight:record.galleryHeight,neighbors:record.data.neighbors,
      backgrounds:[record.data.section.style.background,record.data.section.style.backgroundImage],
      frames:record.data.frames.map(x=>({label:x.label,box:x.frame,
        source:x.image?.src||null,loaded:!!x.image?.natural?.[0]})),
      media:record.data.media,overflow:record.data.overflow}).slice(0,15000));
  }catch(e){
    record.status='error';record.error=String(e);
    console.error('SECTION7_METHOD_ERROR '+site+' '+viewport.width+' '+record.error);
  }finally{await context.close();}
}
async function timeline(site,url){
  const viewport={width:390,height:844};
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true,
    deviceScaleFactor:1,locale:'en-MY',reducedMotion:'no-preference'});
  const page=await context.newPage();
  page.__target=url;
  const rec={kind:site,viewport,status:'started',stages:[],errors:[]};
  report.timelines.push(rec);
  page.on('pageerror',err=>rec.errors.push(String(err.message).slice(0,300)));
  try{
    await openInvitation(page);
    const first=await page.evaluate(sampleGallery);
    if(first.error)throw Error(first.error);
    const headingTop=first.heading.box.docY;
    const sectionBottom=first.section.box.docY+first.section.box.height;
    const log=async name=>{
      const data=await page.evaluate(sampleGallery);
      rec.stages.push({name,section:data.section,heading:data.heading,
        frames:data.frames.map(f=>({label:f.label,frame:f.frame,opacity:f.frameStyle?.opacity,
          transform:f.frameStyle?.transform,transition:f.frameStyle?.transition,
          classes:f.classes}))});
      await page.screenshot({path:OUT+'/'+site+'-390-motion-'+name+'.png'});
      console.log('SECTION7_METHOD_MOTION '+JSON.stringify({
        kind:site,stage:name,heading:data.heading.style,
        frames:data.frames.map(f=>({label:f.label,opacity:f.frameStyle?.opacity,
          transform:f.frameStyle?.transform,classes:f.classes}))}).slice(0,7500));
    };
    await setScroll(page,headingTop-viewport.height*1.85);
    await page.waitForTimeout(700);
    await log('before');
    await setScroll(page,headingTop-viewport.height*.65);
    await log('entry');
    await page.waitForTimeout(1000);await log('1s');
    await page.waitForTimeout(2000);await log('3s');
    await page.waitForTimeout(2000);await log('5s');
    await setScroll(page,sectionBottom+viewport.height*.5);
    await page.waitForTimeout(1200);
    await log('exit');
    await setScroll(page,headingTop-viewport.height*.65);
    await page.waitForTimeout(1000);await log('return-1s');
    rec.status='captured';
  }catch(e){
    rec.status='error';rec.error=String(e);
    console.error('SECTION7_METHOD_MOTION_ERROR '+site+' '+rec.error);
  }finally{await context.close();}
}
try{
  for(const viewport of VIEWPORTS){
    await staticCapture('reference',SOURCE,viewport);
    await staticCapture('local',LOCAL,viewport);
  }
  await timeline('reference',SOURCE);
  await timeline('local',LOCAL);
}finally{
  await browser.close();
  const records=report.measurements;
  for(const viewport of VIEWPORTS){
    const source=records.find(x=>x.kind==='reference'&&x.viewport.width===viewport.width);
    const local=records.find(x=>x.kind==='local'&&x.viewport.width===viewport.width);
    if(!source?.data||!local?.data)continue;
    const errors=source.data.frames.map((f,i)=>{
      const v=local.data.frames[i];
      if(!f.frame||!v.frame)return {label:f.label,error:'missing frame geometry'};
      const diff={x:round(v.frame.x-f.frame.x),
        width:round(v.frame.width-f.frame.width),height:round(v.frame.height-f.frame.height)};
      return {label:f.label,diff,within1px:Object.values(diff).every(n=>Math.abs(n)<=1)};
    });
    const sourcePhotosReady=source.data.frames.every(x=>x.image?.natural?.[0]>0);
    const localPhotosReady=local.data.frames.every(x=>x.image?.natural?.[0]>0);
    report.comparisons.push({width:viewport.width,frameComparisons:errors,
      sourcePhotosReady,localPhotosReady,exactArtworkComparable:sourcePhotosReady&&localPhotosReady,
      sourceNext:source.data.neighbors.next?.heading,
      localNext:local.data.neighbors.next?.heading,
      sourceGap:source.data.neighbors.afterGap,localGap:local.data.neighbors.afterGap,
      warning:(!sourcePhotosReady||!localPhotosReady)?
        'Original WebP photos missing from at least one environment. No pixel-perfect claim possible.':null});
  }
  fs.writeFileSync(OUT+'/measurements.json',JSON.stringify(report,null,2));
  const md=['# Section 7 — QA evidence (automated)', '',
    'Captured: '+report.capturedAt,'',
    '| Width | Frame geometry within 1px | Reference photos loaded | Local photos loaded | Next section |',
    '|---|---|---|---|---|'];
  for(const x of report.comparisons){
    md.push('| '+x.width+' | '+x.frameComparisons.filter(y=>y.within1px).length+
      '/5 | '+(x.sourcePhotosReady?'yes':'no')+
      ' | '+(x.localPhotosReady?'yes':'no')+
      ' | '+(x.sourceNext||[]).join(', ')+' → '+(x.localNext||[]).join(', ')+' |');
  }
  md.push('', 'Screenshots are paired by viewport and relative Section 7 position.',
    'Motion screenshots: initial/1s/3s/5s/exit/re-entry.',
    'These are test measurements, not proof of pixel-perfect resemblance.',
    'Source screenshots and media are copyright-controlled QA evidence; do not republish.',
    'See measurements.json for all computed dimensions, styles, asset URLs and timing.');
  fs.writeFileSync(OUT+'/QA-REPORT.md',md.join('\n')+'\n');
}
if([...report.measurements,...report.timelines].some(x=>x.status!=='captured'))process.exitCode=1;
