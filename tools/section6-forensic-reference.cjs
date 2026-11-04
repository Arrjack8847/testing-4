'use strict';
/** Reference/source Section 6 isolated audit. Images remain ephemeral on CI only. */
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('@playwright/test');
const out=path.resolve(__dirname,'../artifacts/section6-forensic');
const localArg=process.argv.indexOf('--local');
const localUrl=(localArg>=0&&process.argv[localArg+1])?process.argv[localArg+1]:'http://127.0.0.1:8000/';
const versions=[
  {name:'reference',url:'https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en',selector:'.cgv-dress'},
  {name:'local',url:localUrl,selector:'#dressCode'}
];
const widths=[320,360,390,430];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const inspect=async(page,selector)=>{
  return page.evaluate(selector=>{
    const section=document.querySelector(selector);
    if(!section)return {error:'section selector missing'};
    const sr=section.getBoundingClientRect();
    const rect=el=>{
      if(!el)return null;
      const r=el.getBoundingClientRect();
      return {x:+(r.x-sr.x).toFixed(2),y:+(r.y-sr.y).toFixed(2),
        width:+r.width.toFixed(2),height:+r.height.toFixed(2),
        rawX:+r.x.toFixed(2),rawY:+r.y.toFixed(2)};
    };
    const style=el=>{
      if(!el)return null;
      const s=getComputedStyle(el);
      return {display:s.display,position:s.position,overflow:s.overflow,
        opacity:s.opacity,zIndex:s.zIndex,background:s.backgroundColor,
        backgroundImage:s.backgroundImage,bgSize:s.backgroundSize,
        bgPosition:s.backgroundPosition,filter:s.filter,mask:s.maskImage,
        transform:s.transform,objectFit:s.objectFit,objectPosition:s.objectPosition,
        padding:s.padding,margin:s.margin,width:s.width,height:s.height,
        boxSizing:s.boxSizing,blend:s.mixBlendMode};
    };
    const describe=el=>{
      if(!el)return null;
      return {tag:el.tagName,class:String(el.className||'').slice(0,120),
        id:el.id||'',rect:rect(el),style:style(el),source:el.tagName==='IMG'?{
         src:el.currentSrc||el.src,w:el.naturalWidth,h:el.naturalHeight,complete:el.complete}:undefined,
         before:{image:getComputedStyle(el,'::before').backgroundImage,
           content:getComputedStyle(el,'::before').content,
           opacity:getComputedStyle(el,'::before').opacity},
         after:{image:getComputedStyle(el,'::after').backgroundImage,
           content:getComputedStyle(el,'::after').content,
           opacity:getComputedStyle(el,'::after').opacity}};
    };
    const paper=[...section.querySelectorAll('img')].find(el=>(el.src||'').includes('paper.webp'));
    const paperParent=paper?.parentElement;
    const getAncestors=el=>{
      const list=[];
      while(el&&list.length<5){
        list.push(describe(el));if(el===section)break;
        el=el.parentElement;
      }
      return list;
    };
    const panelList=[...section.querySelectorAll('*')].filter(el=>{
      const s=getComputedStyle(el),r=el.getBoundingClientRect();
      return r.width>175&&r.height>110&&r.height<230&&r.width<500&&
        (s.borderRadius.includes('16px')||s.backgroundColor==='rgba(255, 255, 255, 0.5)');
    }).slice(0,12).map(describe);
    const candidates=[...section.querySelectorAll('*')]
      .filter(el=>{
        const s=getComputedStyle(el),r=el.getBoundingClientRect();
        return (s.backgroundImage.includes('url(')||el.tagName==='IMG')&&r.width>=35;
      }).slice(0,25).map(describe);
    const topLevel=[...section.children].slice(0,25).map(describe);
    return {section:describe(section),paperHierarchy:getAncestors(paper),
      topLevel,panelList,candidates,
      body:describe(section.querySelector('.cgv-inner, .dress-body')),
      allImageCount:section.querySelectorAll('img').length,
      sectionText:(section.textContent||'').trim().slice(0,550)};
  },selector);
};
async function capture(browser,width,version){
 const page=await browser.newPage({
    viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,
    reducedMotion:'reduce'
 });
 const result={width,version:version.name};
 try{
  const nav=await page.goto(version.url,{waitUntil:'domcontentloaded',timeout:40000});
  result.http=nav?.status();
  await page.evaluate(()=>document.fonts?.ready);
  const open=page.getByRole('button',{name:/open invitation/i});
  if(await open.count())await open.first().click({timeout:6000});
  await sleep(1200);
  const section=page.locator(version.selector);
  await section.waitFor({state:'attached',timeout:8000});
  await section.scrollIntoViewIfNeeded({timeout:8000});
  await sleep(800);
  result.info=await inspect(page,version.selector);
  await section.screenshot({path:path.join(out,version.name+'-section-'+width+'.png'),
    animations:'disabled'});
  result.ok=true;
 }catch(err){result.ok=false;result.error=String(err)}
 finally{await page.close()}
 return result;
}
async function main(){
 fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch({headless:true});
 const results=[];
 try{
  for(const width of widths){
   for(const v of versions){
    const r=await capture(b,width,v);
    results.push(r);
    const img=r.info?.paperHierarchy?.[0];
    console.log('FORENSIC '+v.name+' '+width,JSON.stringify({
      ok:r.ok,error:r.error,section:r.info?.section?.rect,
      paper:img?.rect,paperStyle:img?.style,
      paperParent:r.info?.paperHierarchy?.[1]?.rect,
      panelBoxes:r.info?.panelList?.map(x=>x.rect),
      candidates:r.info?.candidates?.map(x=>({tag:x.tag,src:x.source?.src,rect:x.rect}))
    }).slice(0,7000));
   }
  }
 }finally{await b.close()}
 fs.writeFileSync(path.join(out,'dom-geometry.json'),JSON.stringify({results},null,2));
 if(results.some(x=>!x.ok))process.exitCode=1;
}
main().catch(err=>{console.error(err);process.exitCode=1});
