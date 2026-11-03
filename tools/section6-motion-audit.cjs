'use strict';
// Read-only non-reduced-motion calibration. Source images remain on the source server.
// This script exports measurements only; it does not distribute reference screenshots.
const {chromium}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const out=path.resolve(__dirname,'../artifacts/section6-motion');
const references=[
  {name:'reference',url:'https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en',selector:'.cgv-dress'},
  {name:'local',url:'http://127.0.0.1:8000/?dressReference=1',selector:'#dressCode'}
];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function capture(page,selector){
  return page.evaluate(selector=>{
    const sec=document.querySelector(selector);
    const local=selector==='#dressCode';
    if(!sec)return {error:'section missing'};
    const box=el=>{
      if(!el)return null;
      const r=el.getBoundingClientRect(),s=getComputedStyle(el);
      return {
        tag:el.tagName,
        className:typeof el.className==='string'?el.className.slice(0,100):'',
        x:+r.x.toFixed(2),y:+r.y.toFixed(2),w:+r.width.toFixed(2),h:+r.height.toFixed(2),
        opacity:s.opacity,transform:s.transform,translate:s.translate,scale:s.scale,
        transitionDuration:s.transitionDuration,transitionProperty:s.transitionProperty,
        transitionTimingFunction:s.transitionTimingFunction,transitionDelay:s.transitionDelay,
        animationName:s.animationName,animationDuration:s.animationDuration,
        animationDelay:s.animationDelay,animationTimingFunction:s.animationTimingFunction,
        position:s.position
      };
    };
    const cards=local?sec.querySelectorAll('.dress-palette'):sec.querySelectorAll('.cgv-dress-card');
    const paper=local?sec.querySelector('#dressSourceScene'):
      sec.querySelector('img[src*="paper.webp"]');
    const butterfly=local?sec.querySelector('.dress-source-butterfly'):
      sec.querySelector('.cgv-bf-w');
    const scene=local?sec.querySelector('.dress-art'):
      (paper?.parentElement||null);
    const reveals=local?sec.querySelectorAll('.dress-reveal'):
      sec.querySelectorAll('.cgv-rv');
    const paperLoaded=paper?.complete&&paper.naturalWidth>0;
    return {
      scrollY:+scrollY.toFixed(2),section:box(sec),
      header:box(local?sec.querySelector('.dress-heading'):sec.querySelector('.cgv-h-script')),
      intro:box(local?sec.querySelector('.dress-intro'):sec.querySelector('.cgv-note')),
      firstCard:box(cards[0]),secondCard:box(cards[1]),
      scene:box(scene),paper:box(paper),paperLoaded,
      butterfly:box(butterfly),
      revealElements:[...reveals].slice(0,9).map(box),
      cameraValue:local?sec.style.getPropertyValue('--dress-camera-y'):null
    };
  },selector);
}
async function setSectionTop(page,selector,screenY){
  await page.evaluate(({selector,screenY})=>{
    document.documentElement.style.scrollBehavior='auto';
    const el=document.querySelector(selector);
    const dest=el.getBoundingClientRect().top+scrollY-screenY;
    scrollTo({top:Math.max(0,dest),behavior:'instant'});
  },{selector,screenY});
}
async function one(browser,spec){
  const page=await browser.newPage({
    viewport:{width:390,height:844},deviceScaleFactor:1,
    isMobile:true,hasTouch:true,reducedMotion:'no-preference'
  });
  const result={name:spec.name,url:spec.url,states:[]};
  try{
    const response=await page.goto(spec.url,{waitUntil:'domcontentloaded',timeout:45000});
    if(response?.status()>=400)throw Error('HTTP '+response.status());
    await page.evaluate(()=>document.fonts?.ready);
    const button=page.getByRole('button',{name:/open invitation/i});
    if(await button.count())await button.first().click({timeout:6500});
    await sleep(1600);
    await page.locator(spec.selector).waitFor({state:'attached',timeout:9000});
    const positions=[
      ['approach',720,850],['enter-early',580,70],['enter-mid',580,250],
      ['enter-settled',580,1050],['center',240,900],
      ['at-top',0,900],['exit',-240,900]
    ];
    for(const [name,screenY,delay] of positions){
      await setSectionTop(page,spec.selector,screenY);
      await sleep(delay);
      result.states.push({name,screenY,capture:await capture(page,spec.selector)});
    }
    result.ok=true;
  }catch(error){result.ok=false;result.error=String(error)}
  finally{await page.close()}
  return result;
}
async function main(){
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({headless:true});
  let results;
  try{results=await Promise.all(references.map(spec=>one(browser,spec)))}
  finally{await browser.close()}
  const report={date:new Date().toISOString(),width:390,height:844,results};
  fs.writeFileSync(path.join(out,'motion.json'),JSON.stringify(report,null,2));
  for(const r of results){
    console.log('MOTION '+r.name+' '+(r.ok?'ok':r.error));
    for(const state of r.states){
      const c=state.capture;
      console.log('  '+state.name+
        ' sectionY='+(c.section?.y??'N/A')+
        ' headlineOpacity='+(c.header?.opacity??'N/A')+
        ' headlineTransform='+(c.header?.transform??'N/A')+
        ' cardOpacity='+(c.firstCard?.opacity??'N/A')+
        ' paperY='+(c.paper?.y??'N/A')+
        ' camera='+(c.cameraValue??'N/A'));
    }
  }
  if(results.some(r=>!r.ok))process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1});
