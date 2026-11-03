// Read-only source/local Section 8 audit. Do not download, commit or redistribute vendor art.
import {chromium} from '@playwright/test';
import fs from 'node:fs';
const folder='section8-evidence';
fs.mkdirSync(folder,{recursive:true});
const urls={
  reference:'https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en',
  local:'http://127.0.0.1:8000/'
};
const sizes=[{width:320,height:568},{width:360,height:740},
  {width:390,height:844},{width:430,height:932}];
const outcome={at:new Date().toISOString(),source:urls.reference,metrics:[],diffs:[]};
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const round=x=>Number.isFinite(x)?+x.toFixed(2):null;
async function inspect(label,viewport){
  const context=await browser.newContext({
    viewport,isMobile:true,hasTouch:true,deviceScaleFactor:1,
    reducedMotion:'no-preference',locale:'en-MY'
  });
  const page=await context.newPage();
  const report={label,viewport,status:'pending',errors:[]};
  outcome.metrics.push(report);
  page.on('pageerror',e=>report.errors.push(String(e.message).slice(0,300)));
  try{
    const response=await page.goto(urls[label],{waitUntil:'domcontentloaded',timeout:60000});
    report.http=response?.status();
    await page.waitForTimeout(900);
    const button=page.getByRole('button',{name:'Open Invitation'});
    if(await button.count()&&await button.first().isVisible()){
      await button.first().click({timeout:8000});
      await page.waitForTimeout(1450);
    }
    const heading=page.getByRole('heading',{name:'Wedding Gift',exact:true}).first();
    await heading.waitFor({state:'attached',timeout:15000});
    const section=label==='reference'?page.locator('#cgv-gift'):page.locator('#weddingGift');
    const root=await section.count()?section.first():heading.locator('xpath=ancestor::section[1]');
    report.initial=await root.evaluate(el=>{
      const r=el.getBoundingClientRect();
      return {docY:r.top+window.scrollY,height:r.height,offsetTop:r.top,
        scrollHeight:document.documentElement.scrollHeight};
    });
    const top=report.initial.docY;
    const checkpoints=[
      ['entry',Math.max(0,top-viewport.height*.72),0],
      ['initial',Math.max(0,top-viewport.height*.15),0],
      ['t1',Math.max(0,top-viewport.height*.15),1000],
      ['t3',Math.max(0,top-viewport.height*.15),2000],
      ['t5',Math.max(0,top-viewport.height*.15),2000],
      ['middle',Math.max(0,top+report.initial.height/2-viewport.height/2),0],
      ['exit',Math.max(0,top+report.initial.height-viewport.height*.25),0]
    ];
    report.frames=[];
    for(const [name,y,delay] of checkpoints){
      await page.evaluate(y=>{
        document.documentElement.style.scrollBehavior='auto';
        window.scrollTo({top:Math.round(y),behavior:'instant'});
      },y);
      await page.waitForTimeout(delay||220);
      const frame=await root.evaluate(el=>{
        const rect=e=>{
          if(!e)return null;
          const r=e.getBoundingClientRect();
          return {x:r.x,y:r.y,width:r.width,height:r.height,docY:r.y+scrollY};
        };
        const sty=e=>{
          if(!e)return null;
          const s=getComputedStyle(e);
          return {font:s.fontFamily,fontSize:s.fontSize,fontWeight:s.fontWeight,
            lineHeight:s.lineHeight,letterSpacing:s.letterSpacing,color:s.color,
            background:s.backgroundColor,backgroundImage:s.backgroundImage,
            padding:s.padding,margin:s.margin,gap:s.gap,
            opacity:s.opacity,transform:s.transform,animation:s.animationName,
            animationDuration:s.animationDuration,
            transition:s.transitionDuration,transitionTiming:s.transitionTimingFunction,
            position:s.position,zIndex:s.zIndex};
        };
        const h=[...el.querySelectorAll('h1,h2,h3')].find(x=>x.textContent.trim()==='Wedding Gift');
        const banks=[...el.querySelectorAll('button')].filter(x=>x.textContent.includes('Copy Account Number'));
        const assets=[];
        for(const e of [el,...el.querySelectorAll('*')]){
          const s=getComputedStyle(e),img=s.backgroundImage;
          if(img&&img!=='none'&&img.includes('url('))assets.push({tag:e.tagName,className:typeof e.className==='string'?e.className.slice(0,80):'',background:img});
          if(e.tagName==='IMG')assets.push({tag:'IMG',src:e.currentSrc||e.src,natural:[e.naturalWidth,e.naturalHeight]});
          if(e.tagName==='CANVAS')assets.push({tag:'CANVAS',rect:rect(e),width:e.width,height:e.height});
        }
        return {section:rect(el),sectionStyle:sty(el),
          heading:rect(h),headingStyle:sty(h),
          banks:banks.map(e=>({rect:rect(e),style:sty(e)})),
          children:[...el.children].map(e=>({tag:e.tagName,cls:typeof e.className==='string'?e.className:'',rect:rect(e),style:sty(e)})),
          media:assets.slice(0,40),
          overflow:document.documentElement.scrollWidth-innerWidth,
          visibleText:(el.innerText||'').slice(0,2500)};
      });
      report.frames.push({name,y:round(y),data:frame});
      if(viewport.width===390){
        await page.screenshot({path:folder+'/'+label+'-390-'+name+'.png',
          animations:'allow',timeout:18000});
      }
    }
    report.status='captured';
    console.log('SECTION8_'+label.toUpperCase()+'_'+viewport.width+' '+JSON.stringify({
      top:round(report.initial.docY),height:round(report.initial.height),
      background:report.frames[0].data.sectionStyle.background,
      image:report.frames[0].data.media.slice(0,5),
      heading:report.frames[0].data.headingStyle,
      viewport,overflow:report.frames[0].data.overflow
    }));
  }catch(e){
    report.status='error';report.error=String(e).slice(0,800);
    console.error('SECTION8_AUDIT_ERROR '+label+' '+viewport.width+' '+report.error);
  }finally{await context.close();}
}
try{
  for(const viewport of sizes){
    await inspect('reference',viewport);
    await inspect('local',viewport);
  }
}finally{await browser.close();}
for(const viewport of sizes){
  const reference=outcome.metrics.find(x=>x.label==='reference'&&x.viewport.width===viewport.width);
  const local=outcome.metrics.find(x=>x.label==='local'&&x.viewport.width===viewport.width);
  if(reference?.status==='captured'&&local?.status==='captured'){
    outcome.diffs.push({
      width:viewport.width,
      heightDelta:round(local.initial.height-reference.initial.height),
      referenceHeight:round(reference.initial.height),
      localHeight:round(local.initial.height),
      referenceBackground:reference.frames[0].data.sectionStyle.background,
      localBackground:local.frames[0].data.sectionStyle.background,
      referencePadding:reference.frames[0].data.sectionStyle.padding,
      localPadding:local.frames[0].data.sectionStyle.padding
    });
  }
}
fs.writeFileSync(folder+'/measurements.json',JSON.stringify(outcome,null,2));
console.log('SECTION8_SUMMARY '+JSON.stringify(outcome.diffs));
if(outcome.metrics.some(x=>x.status!=='captured'))process.exitCode=1;
