// Read-only Section 10 source measurement. No third-party assets are committed.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const URL='https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en';
const OUTPUT='section10-evidence';
await mkdir(OUTPUT,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
page.on('pageerror',e=>console.log('PAGEERROR',e.message));
const report={reference:URL,viewport:{width:390,height:844},checkedAt:new Date().toISOString(),snapshots:[]};
try{
  const resp=await page.goto(URL,{waitUntil:'domcontentloaded',timeout:65000});
  report.httpStatus=resp?.status();
  await page.waitForTimeout(3000);
  const open=page.getByRole('button',{name:'Open Invitation',exact:true});
  if(await open.count()){await open.first().click({timeout:10000});await page.waitForTimeout(1200);}
  const details=await page.evaluate(()=>{
    const simple=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {
      tag:el.tagName,id:el.id,cls:String(el.className).slice(0,130),
      text:(el.innerText||'').replace(/\s+/g,' ').trim().slice(0,150),
      top:+(r.top+scrollY).toFixed(2),bottom:+(r.bottom+scrollY).toFixed(2),
      left:+r.left.toFixed(2),width:+r.width.toFixed(2),height:+r.height.toFixed(2),
      color:s.color,bg:s.backgroundColor,bgImage:s.backgroundImage,
      font:s.font,fontFamily:s.fontFamily,fontSize:s.fontSize,lineHeight:s.lineHeight,
      letterSpacing:s.letterSpacing,margin:s.margin,padding:s.padding,
      position:s.position,zIndex:s.zIndex,opacity:s.opacity,transform:s.transform,
      border:s.border,shadow:s.boxShadow,
      before:getComputedStyle(el,'::before').backgroundImage,
      after:getComputedStyle(el,'::after').backgroundImage,
      animation:s.animation,transition:s.transition
    }};
    const elems=[...document.querySelectorAll('h1,h2,h3,h4,p,span,div')];
    const title=elems.find(e=>e.children.length===0 && (e.textContent||'').trim()==='Until we meet');
    const names=elems.find(e=>e.children.length===0 && /Rayyan\s*&\s*Sofea/.test(e.textContent||''));
    const chain=[];
    for(let e=title,i=0;e&&i<8;e=e.parentElement,i++)chain.push(simple(e));
    let region=chain.find(x=>x.tag==='SECTION')||chain.find(x=>x.height>=800);
    const top=region?.top??11612,bottom=region?.bottom??document.documentElement.scrollHeight;
    const media=[...document.querySelectorAll('img,svg,canvas')].filter(e=>{
      const r=e.getBoundingClientRect(),absTop=r.top+scrollY;
      return absTop+r.height>top-100 && absTop<bottom+100;
    }).map(el=>({...simple(el),src:el.currentSrc||el.src||'',naturalWidth:el.naturalWidth||0,naturalHeight:el.naturalHeight||0})).slice(0,55);
    const siblings=title?.parentElement?[...title.parentElement.children].map(simple):[];
    const animationEls=[...document.querySelectorAll('*')].filter(e=>{
      const r=e.getBoundingClientRect(),absTop=r.top+scrollY;
      const s=getComputedStyle(e);
      return absTop+r.height>top && absTop<bottom &&
        (s.animationName!=='none'||s.transitionDuration!=='0s');
    }).slice(0,50).map(simple);
    return {docHeight:document.documentElement.scrollHeight,scrollMax:document.documentElement.scrollHeight-innerHeight,
      overflow:document.documentElement.scrollWidth-innerWidth,
      titleFound:!!title,namesFound:!!names,chain,siblings,media,animationEls,
      pageEndText:document.body.innerText.slice(-1200)};
  });
  report.initial=details;
  console.log('SECTION10_SOURCE_LAYOUT '+JSON.stringify(details).slice(0,35000));
  const top=details.chain.find(x=>x.tag==='SECTION')?.top??11612;
  const max=details.scrollMax;
  const points=[['entry',Math.max(0,top-100)],['quarter',Math.min(max,top+100)],['middle',Math.min(max,top+400)],['exit',max]];
  for(const [name,y] of points){
    await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);
    await page.waitForTimeout(450);
    const frame=await page.evaluate(()=>{
      const t=[...document.querySelectorAll('*')].find(e=>e.children.length===0&&(e.textContent||'').trim()==='Until we meet');
      return {scrollY,top:t?.getBoundingClientRect().top,animations:document.getAnimations().filter(a=>a.playState==='running').length};
    });
    report.snapshots.push({name,...frame});
    await page.screenshot({path:OUTPUT+'/'+name+'.png',animations:'allow'});
  }
  await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),Math.min(max,top+190));
  for(const t of [0,1000,3000,5000]){
    if(t)await page.waitForTimeout(t===1000?1000:2000);
    const frame=await page.evaluate(()=>{
      const e=[...document.querySelectorAll('*')].find(e=>e.children.length===0&&(e.textContent||'').trim()==='Until we meet');
      const s=e?getComputedStyle(e):null;
      return {scrollY,y:e?.getBoundingClientRect().y,opacity:s?.opacity,transform:s?.transform,
        activeAnimations:document.getAnimations().filter(a=>a.playState==='running').length};
    });
    report.snapshots.push({name:'time-'+t+'ms',...frame});
    await page.screenshot({path:OUTPUT+'/time-'+t+'.png'});
  }
  console.log('SECTION10_SOURCE_MOTION '+JSON.stringify(report.snapshots));
}catch(e){report.error=String(e);console.log('SECTION10_AUDIT_ERROR '+report.error);process.exitCode=1}
finally{await writeFile(OUTPUT+'/source.json',JSON.stringify(report,null,2));await browser.close();}
