// Read-only computed-layout audit: measures source and Section 4 prototype, 
// retaining geometric/style metadata only (no source images/screenshots).
import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const REF='https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en';
const OWN='http://127.0.0.1:8000/?eventsReference=1';
const outputs=[];
const browser=await chromium.launch({headless:true, args:['--no-sandbox']});
const targetTexts=[
  'Akad Nikah','Wedding Reception',
  'Masjid Wilayah Persekutuan',
  'Grand Ballroom, St. Regis Kuala Lumpur',
  'Open in Maps','Waze','Add to Calendar'
];
async function inspect(url,kind,width,height) {
 const context=await browser.newContext({viewport:{width,height},
  deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const page=await context.newPage();
 const logs=[];
 page.on('pageerror',e=>logs.push('pageerror: '+e.message));
 let status='ok';
 try {
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForTimeout(3200);
  if(kind==='ours'){
    await page.getByRole('button',{name:'Open Invitation',exact:true}).first().click({timeout:10000});
  } else {
    const buttons=page.getByRole('button',{name:'Open Invitation',exact:true});
    if(await buttons.count()) {
     try{await buttons.first().click({timeout:8000});}catch(e){logs.push('open-click '+String(e).slice(0,200));}
    }
  }
  await page.waitForTimeout(1600);
 }catch(e){status='navigation-error';logs.push(String(e).slice(0,500));}
 const metrics=await page.evaluate((texts)=>{
  const norm=t=>String(t??'').replace(/\s+/g,' ').trim();
  const pick=t=>{
   const all=[...document.querySelectorAll('h1,h2,h3,h4,span,div,p,a,button,time,strong')].filter(el=>{
    const s=norm(el.textContent);
    return s===t || (t==='Open in Maps' && s.startsWith(t) && s.length<30);
   });
   all.sort((a,b)=>a.textContent.length-b.textContent.length || a.children.length-b.children.length);
   return all[0]??null;
  };
  const compactRect=el=>{
    const r=el.getBoundingClientRect(),scroll=scrollY,cs=getComputedStyle(el);
    return {tag:el.tagName,cls:String(el.className).slice(0,130),id:el.id||'',
     x:+r.x.toFixed(1),y:+(r.y+scroll).toFixed(1),
     w:+r.width.toFixed(1),h:+r.height.toFixed(1),
     font:cs.fontFamily,fontSize:cs.fontSize,lineHeight:cs.lineHeight,
     weight:cs.fontWeight,color:cs.color,background:cs.backgroundColor,
     bgImage:cs.backgroundImage.slice(0,220),radius:cs.borderRadius,
     padding:cs.padding,display:cs.display,position:cs.position,
     transform:cs.transform,opacity:cs.opacity,zIndex:cs.zIndex,
     border:cs.border,overflow:cs.overflow};
  };
  const elements={};
  for(const target of texts){
   const el=pick(target);
   if(!el){elements[target]={found:false};continue;}
   elements[target]={found:true,self:compactRect(el),ancestors:[]};
   let p=el.parentElement;
   for(let n=0;p && n<5;n++,p=p.parentElement)
    elements[target].ancestors.push(compactRect(p));
  }
  const event=pick('Akad Nikah'),section=event?.closest('section');
  const media=[...document.querySelectorAll('img')].filter(el=>{
    const r=el.getBoundingClientRect();
    const y=r.y+scrollY;
    const start=event?event.getBoundingClientRect().y+scrollY:0;
    return Math.abs(y-start)<2000 && r.width>0;
  }).slice(0,24).map(el=>({...compactRect(el),src:el.currentSrc||el.src,naturalWidth:el.naturalWidth,naturalHeight:el.naturalHeight}));
  const parentChain=[];
  let anc=event;
  for(let n=0;anc&&n<10;n++,anc=anc.parentElement)parentChain.push({
    tag:anc.tagName,cls:String(anc.className).slice(0,180),id:anc.id||'',text:norm(anc.textContent).slice(0,100),
    rect:compactRect(anc)
  });
  return {url:location.href,title:document.title,viewport:{w:innerWidth,h:innerHeight,
    documentHeight:document.documentElement.scrollHeight,overflowX:document.documentElement.scrollWidth-innerWidth},
    hasOpened:document.getElementById('invitation')?.dataset.state,
    section:section?compactRect(section):null,
    elements,media,parentChain};
 },targetTexts);
 const result={kind,width,height,status,errors:logs,metrics};
 outputs.push(result);
 console.log('SECTION4_METRICS '+JSON.stringify(result));
 await context.close();
}
try {
 await inspect(REF,'reference',390,844);
 for(const width of [320,360,390,430]){
  const height=width===320?568:width===360?740:width===390?844:932;
  await inspect(OWN,'prototype',width,height);
 }
 await writeFile('section4-reference-metrics.json',JSON.stringify(outputs,null,2));
}finally{await browser.close();}
