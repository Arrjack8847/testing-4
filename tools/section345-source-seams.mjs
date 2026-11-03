// Read-only source comparison for Section 3→4 and Section 4→next section.
// Records pixel-band colors and screenshots only in expiring CI artifacts;
// no original artwork or HTML/CSS is copied into source control.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const dir='section345-source-seams';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const out=[];
try{
 for(const {w,h} of [{w:320,h:568},{w:360,h:740},{w:390,h:844},{w:430,h:932}]){
  const ctx=await browser.newContext({viewport:{width:w,height:h},isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});
  const page=await ctx.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForTimeout(2400);
  const open=page.getByRole('button',{name:'Open Invitation',exact:true}).first();
  if(await open.count())try{await open.click({timeout:12000})}catch(e){errors.push('Open click: '+String(e).slice(0,160))}
  await page.waitForTimeout(2000);
  for(const [name,edge] of [['couple-to-events','top'],['events-to-following','bottom']]){
   const metrics=await page.evaluate(({edge})=>{
    const e=document.querySelector('.cgv-events');
    if(!e)throw Error('source .cgv-events missing');
    const r=e.getBoundingClientRect(),other=edge==='top'?e.previousElementSibling:e.nextElementSibling;
    const or=other?.getBoundingClientRect();
    return {sourceSectionY:r.y+scrollY,sourceSectionHeight:r.height,
      boundaryDocumentY:(edge==='top'?r.top:r.bottom)+scrollY,
      other:{tag:other?.tagName,cls:String(other?.className??'').slice(0,160),id:other?.id,rect:or?{top:or.y+scrollY,bottom:or.bottom+scrollY,h:or.height}:null},
      sourceClasses:e.className,gap:or?(edge==='top'?r.top-or.bottom:or.top-r.bottom):null,overflow:document.documentElement.scrollWidth-innerWidth};
   },{edge});
   await page.evaluate(y=>{
    document.documentElement.style.scrollBehavior='auto';
    scrollTo({top:Math.round(y-innerHeight/2),behavior:'instant'});
   },metrics.boundaryDocumentY);
   await page.waitForTimeout(650);
   const screenshot=await page.screenshot({animations:'disabled'});
   await writeFile(dir+'/'+w+'-'+name+'.png',screenshot);
   const scan=await page.evaluate(async data=>{
     const img=new Image();img.src='data:image/png;base64,'+data;await img.decode();
     const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
     const ct=canvas.getContext('2d',{willReadFrequently:true});ct.drawImage(img,0,0);
     const px=ct.getImageData(0,0,img.width,img.height).data;
     const bound=document.querySelector('.cgv-events').getBoundingClientRect();
     const at=Math.round(data.endsWith('')?0:0); // unused, boundary is provided separately
     return {viewport:[img.width,img.height],nearby:Math.round(bound.top)};
   },screenshot.toString('base64'));
   const edgeY=await page.evaluate(edge=>{
     const r=document.querySelector('.cgv-events').getBoundingClientRect();return edge==='top'?r.top:r.bottom;
   },edge);
   const pixel=await page.evaluate(async({data,edgeY})=>{
     const im=new Image();im.src='data:image/png;base64,'+data;await im.decode();
     const c=document.createElement('canvas');c.width=im.width;c.height=im.height;
     const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0);
     const p=ctx.getImageData(0,0,c.width,c.height).data,y=Math.round(edgeY);
     const zones=[['left',2,Math.round(c.width*.2)],['center',Math.round(c.width*.3),Math.round(c.width*.7)],['right',Math.round(c.width*.8),c.width-2]];
     const color=(ya,yb,xa,xb)=>{
      let r=0,g=0,b=0,n=0;
      for(let yy=Math.max(0,ya);yy<Math.min(c.height,yb);yy++)for(let xx=xa;xx<xb;xx++){
       const i=(yy*c.width+xx)*4;r+=p[i];g+=p[i+1];b+=p[i+2];n++;
      }return [r,g,b].map(z=>Math.round(z/Math.max(1,n)));
     };
     return {seamScreenY:edgeY,
      zones:zones.map(([zone,xa,xb])=>{
        const before=color(y-5,y-1,xa,xb),after=color(y+1,y+5,xa,xb);
        return {zone,before,after,jump:+(before.reduce((s,v,i)=>s+Math.abs(v-after[i]),0)/3).toFixed(2)};
      }),
      onePxJump:(()=>{const a=color(y-1,y,0,c.width),b=color(y,y+1,0,c.width);return +(a.reduce((s,v,i)=>s+Math.abs(v-b[i]),0)/3).toFixed(2)})()
     };
   },{data:screenshot.toString('base64'),edgeY});
   const result={w,h,name,...metrics,...pixel,errors};
   out.push(result);console.log('SOURCE345_SEAM '+JSON.stringify(result));
  }
  await ctx.close();
 }
 await writeFile(dir+'/source-metrics.json',JSON.stringify(out,null,2));
}finally{await browser.close();}
