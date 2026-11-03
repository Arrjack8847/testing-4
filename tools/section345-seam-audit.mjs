// Focused Section 3->4->5 continuity audit (research prototype).
// Generates numerical seam/edge color metrics and real screenshots.
// The CI artifacts expire; no source-owned image files are committed.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const folder='section345-seam-audit';
await mkdir(folder,{recursive:true});
const report=[];
const devices=[{w:320,h:568},{w:360,h:740},{w:390,h:844},{w:430,h:932}];
const seams=[
 {name:'couple-to-events',a:'couple',b:'eventDetails'},
 {name:'events-to-save-date',a:'eventDetails',b:'saveTheDate'}
];
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
async function analyzePNG(page,png,relativeSeamY,viewportWidth){
 const result=await page.evaluate(async ({data,relativeSeamY,viewportWidth})=>{
  const im=new Image(); im.src='data:image/png;base64,'+data; await im.decode();
  const can=document.createElement('canvas'); can.width=im.width; can.height=im.height;
  const ctx=can.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0);
  const image=ctx.getImageData(0,0,im.width,im.height).data;
  const summarize=(startY,endY,xFrom,xTo)=>{
   const rgb=[0,0,0];let n=0;
   for(let y=Math.max(0,startY);y<Math.min(im.height,endY);y++)for(let x=Math.max(0,xFrom);x<Math.min(im.width,xTo);x++){
    const k=(y*im.width+x)*4;
    for(let c=0;c<3;c++)rgb[c]+=image[k+c];n++;
   }
   return rgb.map(v=>Math.round(v/Math.max(1,n)));
  };
  const zones=[
   {label:'left',from:2,to:Math.round(im.width*.2)},
   {label:'center',from:Math.round(im.width*.3),to:Math.round(im.width*.7)},
   {label:'right',from:Math.round(im.width*.8),to:im.width-2}
  ];
  const edge=Math.round(relativeSeamY);
  const detail=zones.map(z=>{
   const above=summarize(edge-5,edge-1,z.from,z.to),below=summarize(edge+1,edge+5,z.from,z.to);
   const jump=Math.round(100*(Math.abs(above[0]-below[0])+Math.abs(above[1]-below[1])+Math.abs(above[2]-below[2]))/3)/100;
   return {zone:z.label,above,below,meanJump:jump};
  });
  const line1=summarize(edge-1,edge,0,im.width),line2=summarize(edge,edge+1,0,im.width);
  const onePxJump=Math.round(100*(Math.abs(line1[0]-line2[0])+Math.abs(line1[1]-line2[1])+Math.abs(line1[2]-line2[2]))/3)/100;
  return {zones:detail,onePxJump,pictureSize:[im.width,im.height],requestedW:viewportWidth};
 },{data:png.toString('base64'),relativeSeamY,viewportWidth});
 return result;
}
try {
 for(const device of devices) {
  const context=await browser.newContext({viewport:{width:device.w,height:device.h},isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8000/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.getByRole('button',{name:'Open Invitation'}).click({timeout:12000});
  await page.waitForTimeout(1400);
  for(const seam of seams){
   const metrics=await page.evaluate(({a,b})=>{
    const x=document.getElementById(a),y=document.getElementById(b);
    const xr=x.getBoundingClientRect(),yr=y.getBoundingClientRect();
    return {
     seamDocumentY:yr.top+scrollY,
     gap:yr.top-xr.bottom,
     aboveRect:{h:xr.height,w:xr.width},
     belowRect:{h:yr.height,w:yr.width},
     scrollWidth:document.documentElement.scrollWidth,
     innerWidth,
     artAbove:x.dataset.art??null,
     artBelow:y.dataset.art??null,
     paperState:document.getElementById('eventDetails')?.dataset.referencePaper??null,
     bodyBackground:getComputedStyle(document.body).backgroundColor
    };
   },seam);
   await page.evaluate(y=>{
     document.documentElement.style.scrollBehavior='auto';
     window.scrollTo({top:Math.round(y-innerHeight/2),behavior:'instant'});
   },metrics.seamDocumentY);
   await page.waitForTimeout(550);
   const observed=await page.evaluate(({b})=>{
     const bound=document.getElementById(b).getBoundingClientRect();
     return {seamY:bound.top,scrollY,overflow:document.documentElement.scrollWidth-innerWidth};
   },seam);
   const png=await page.screenshot({animations:'disabled'});
   const name=device.w+'-'+seam.name;
   await writeFile(folder+'/'+name+'.png',png);
   const colors=await analyzePNG(page,png,observed.seamY,device.w);
   const item={width:device.w,height:device.h,seam:seam.name,...metrics,...observed,...colors,errors};
   report.push(item);
   console.log('SECTION345_SEAM '+JSON.stringify(item));
   if(Math.abs(metrics.gap)>1||observed.overflow>1)throw Error('Geometry broken at '+name);
  }
  await context.close();
 }
 await writeFile(folder+'/metrics.json',JSON.stringify(report,null,2));
} finally {await browser.close();}
