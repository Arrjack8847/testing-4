'use strict';
const {chromium}=require('@playwright/test');
const urls=[
{name:'reference',url:'https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en',section:'.cgv-dress'},
{name:'local',url:'http://127.0.0.1:8000/',section:'#dressCode'}
];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function run(browser,spec,width){
 const page=await browser.newPage({viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const output={name:spec.name,width};
 try{
  const resp=await page.goto(spec.url,{waitUntil:'domcontentloaded',timeout:45000});
  output.http=resp?.status();
  const open=page.getByRole('button',{name:/open invitation/i});
  if(await open.count())await open.first().click({timeout:8000});
  await sleep(1300);
  await page.locator(spec.section).scrollIntoViewIfNeeded({timeout:10000});
  await sleep(200);
  output.layers=await page.evaluate(selector=>{
   const el=document.querySelector(selector),r=el.getBoundingClientRect();
   const st=(e,p='')=>{
    const z=getComputedStyle(e,p);
    const q=e.getBoundingClientRect();
    return {tag:e.tagName,class:String(e.className||'').slice(0,100),
     pseudo:p,content:z.content,width:z.width,height:z.height,
     x:+(q.x-r.x).toFixed(2),y:+(q.y-r.y).toFixed(2),
     position:z.position,display:z.display,visibility:z.visibility,
     zIndex:z.zIndex,opacity:z.opacity,pointerEvents:z.pointerEvents,
     background:z.background,backgroundColor:z.backgroundColor,
     backgroundImage:z.backgroundImage,boxShadow:z.boxShadow,
     mixBlendMode:z.mixBlendMode,filter:z.filter,backdropFilter:z.backdropFilter,
     isolation:z.isolation,transform:z.transform,
     inset:z.inset,top:z.top,bottom:z.bottom,left:z.left,right:z.right,
     borderRadius:z.borderRadius};
   };
   const nodes=[el,...el.querySelectorAll('*')].filter(e=>{
    const z=getComputedStyle(e),b=getComputedStyle(e,'::before'),a=getComputedStyle(e,'::after');
    const c=z.backgroundColor!=='rgba(0, 0, 0, 0)'||z.backgroundImage!=='none'||
      e.tagName==='IMG'||e.querySelectorAll('img').length===0&&e.textContent?.trim()==='Dress Code';
    return c||b.content!=='none'&&b.content!=='normal'||
      a.content!=='none'&&a.content!=='normal';
   });
   return {sectionHeight:r.height,layers:nodes.slice(0,65).map(e=>{
    const x={normal:st(e)};
    for(const p of ['::before','::after']){
      const z=st(e,p);
      if(z.content!=='none'&&z.content!=='normal'||z.backgroundImage!=='none')x[p]=z;
    }
    return x;
   })};
  },spec.section);
 }catch(e){output.error=String(e)}finally{await page.close()}
 return output;
}
async function main(){
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [390]){
   for(const site of urls){
    const r=await run(browser,site,width);
    console.log('LAYER_AUDIT '+site.name+' '+width+' '+JSON.stringify(r));
   }
  }
 }finally{await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
