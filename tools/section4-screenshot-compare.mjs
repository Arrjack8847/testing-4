// Capture equivalent 390x844 screen regions of the public reference and
// comparison prototype for internal fidelity testing. Screenshots and a
// numeric pixel report live in expiring CI artifacts, never the repository.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const out='section4-comparison';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const entries=[
 ['reference','https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en','#cgv-events'],
 ['prototype','http://127.0.0.1:8000/?eventsReference=1','#eventDetails']
];
const shots={};
const positions=[['top',0],['middle',.5],['bottom',1]];
try{
 for(const [name,url,selector] of entries){
  const context=await browser.newContext({viewport:{width:390,height:844},
   deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'no-preference'});
  const page=await context.newPage();
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForTimeout(3000);
  const btn=page.getByRole('button',{name:'Open Invitation',exact:true}).first();
  if(await btn.count())await btn.click({timeout:16000});
  await page.waitForTimeout(4200);
  await page.evaluate(()=>document.fonts.ready);
  for(const [label,p] of positions){
   await page.evaluate(({selector,p})=>{
    const target=document.querySelector(selector);
    if(!target)throw Error('section missing '+selector);
    const rect=target.getBoundingClientRect();
    document.documentElement.style.scrollBehavior='auto';
    window.scrollTo({top:scrollY+rect.top+Math.max(0,rect.height-innerHeight)*p,behavior:'instant'});
   },{selector,p});
   await page.waitForTimeout(1600);
   const png=await page.screenshot({animations:'disabled'});
   shots[name+'-'+label]=png.toString('base64');
   await writeFile(out+'/'+name+'-'+label+'.png',png);
  }
  await context.close();
 }
 const compareContext=await browser.newContext();
 const comparePage=await compareContext.newPage();
 const scores=[];
 for(const [label] of positions){
  const a=shots['reference-'+label],b=shots['prototype-'+label];
  const diff=await comparePage.evaluate(async ({a,b,label})=>{
   const canvas=document.createElement('canvas');
   const ctx=canvas.getContext('2d',{willReadFrequently:true});
   const load=async source=>{
    const im=new Image();im.src='data:image/png;base64,'+source;
    await im.decode();return im;
   };
   const [imA,imB]=await Promise.all([load(a),load(b)]);
   if(imA.width!==imB.width||imA.height!==imB.height)throw Error('different image size');
   canvas.width=imA.width;canvas.height=imA.height;
   ctx.drawImage(imA,0,0);const dA=ctx.getImageData(0,0,canvas.width,canvas.height).data;
   ctx.clearRect(0,0,canvas.width,canvas.height);
   ctx.drawImage(imB,0,0);const dB=ctx.getImageData(0,0,canvas.width,canvas.height).data;
   let rgb=0,count=0,over30=0;
   for(let i=0;i<dA.length;i+=4){
    const e=(Math.abs(dA[i]-dB[i])+Math.abs(dA[i+1]-dB[i+1])+Math.abs(dA[i+2]-dB[i+2]))/3;
    rgb+=e;count++;if(e>30)over30++;
   }
   return {label,width:canvas.width,height:canvas.height,
    meanPixelDifference:+(rgb/count).toFixed(3),
    differingPixelsOver30Pct:+(100*over30/count).toFixed(2)};
  },{a,b,label});
  scores.push(diff);
  console.log('SECTION4_VISUAL_DIFF '+JSON.stringify(diff));
 }
 await writeFile(out+'/comparison.json',JSON.stringify({scores,method:'per-pixel RGB mean, independent CI Chromium screenshots'},null,2));
 await compareContext.close();
}finally{await browser.close();}
