// Section 4 comparison at all 4 phone sizes and 3 scroll checkpoints.
// Captures read-only screenshots for LOCAL inspection only.
// No source assets are copied into the repository or outputs committed.
// Usage: node tools/section4-visual-parity-4phones.mjs
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

const sourceUrl=process.env.SECTION4_REFERENCE_URL||
  'https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en';
const localUrl=process.env.SECTION4_LOCAL_URL||'http://127.0.0.1:8000/';
const sizes=[[320,568],[360,740],[390,844],[430,932]];
const phases=[['top',0],['middle',.5],['bottom',1]];
const sites=[
  {name:'reference',url:sourceUrl,selector:'#cgv-events'},
  {name:'local',url:localUrl,selector:'#eventDetails'}
];
const dir='section4-exact-audit/screenshots';
await mkdir(dir,{recursive:true});
const report={
  generatedAt:new Date().toISOString(),
  note:'Read-only comparison. Different dynamic text, animation times and provider chrome can affect raw pixels; zero difference is not a licensing proof.',
  samples:[],errors:[]
};
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
  for(const [width,height] of sizes){
    const images={};
    for(const site of sites){
      const context=await browser.newContext({
        viewport:{width,height},deviceScaleFactor:1,isMobile:true,
        hasTouch:true,reducedMotion:'reduce',
        locale:'en-MY',timezoneId:'Asia/Kuala_Lumpur'
      });
      const page=await context.newPage();
      try{
        await page.goto(site.url,{waitUntil:'domcontentloaded',timeout:60000});
        const open=page.getByRole('button',{name:'Open Invitation',exact:true}).first();
        if(await open.count())await open.click({timeout:16000});
        await page.evaluate(()=>document.fonts.ready);
        await page.waitForTimeout(1000);
        for(const [phase,fraction] of phases){
          const section=await page.evaluate(({selector,fraction})=>{
            const node=document.querySelector(selector);
            if(!node)throw Error('Missing Events: '+selector);
            document.documentElement.style.scrollBehavior='auto';
            const box=node.getBoundingClientRect();
            const top=box.top+scrollY;
            const distance=Math.max(0,box.height-innerHeight);
            window.scrollTo({top:top+distance*fraction,behavior:'instant'});
            return {top,height:box.height};
          },{selector:site.selector,fraction});
          await page.waitForTimeout(1200);
          const crop=await page.evaluate(selector=>{
            const r=document.querySelector(selector).getBoundingClientRect();
            return {x:r.left,y:r.top,right:r.right,bottom:r.bottom,
              width:r.width,height:r.height,viewportWidth:innerWidth,
              viewportHeight:innerHeight};
          },site.selector);
          const image=await page.screenshot({animations:'disabled'});
          images[site.name+'-'+phase]={image:image.toString('base64'),rect:crop,
            sectionHeight:section.height};
          await writeFile(dir+'/'+site.name+'-'+width+'x'+height+'-'+phase+'.png',image);
        }
      }catch(error){
        report.errors.push({width,height,site:site.name,error:String(error).slice(0,800)});
        console.error('SECTION4_PARITY_CAPTURE_FAILED '+site.name+' '+width+' '+String(error).slice(0,180));
      }finally{await context.close();}
    }
    const context=await browser.newContext();
    const page=await context.newPage();
    try{
      for(const [phase] of phases){
        const source=images['reference-'+phase],local=images['local-'+phase];
        if(!source||!local)continue;
        const score=await page.evaluate(async data=>{
          const load=async encoded=>{
            const image=new Image();
            image.src='data:image/png;base64,'+encoded;
            await image.decode();return image;
          };
          const [a,b]=await Promise.all([load(data.source.image),load(data.local.image)]);
          if(a.width!==b.width||a.height!==b.height){
            throw Error('Captured viewport dimensions differ');
          }
          const c=document.createElement('canvas');
          c.width=a.width;c.height=a.height;
          const cx=c.getContext('2d',{willReadFrequently:true});
          cx.drawImage(a,0,0);
          const A=cx.getImageData(0,0,c.width,c.height).data;
          cx.clearRect(0,0,c.width,c.height);cx.drawImage(b,0,0);
          const B=cx.getImageData(0,0,c.width,c.height).data;
          const ar=data.source.rect,br=data.local.rect;
          const x1=Math.max(0,Math.ceil(ar.x),Math.ceil(br.x));
          const x2=Math.min(c.width,Math.floor(ar.right),Math.floor(br.right));
          const y1=Math.max(0,Math.ceil(ar.y),Math.ceil(br.y));
          const y2=Math.min(c.height,Math.floor(ar.bottom),Math.floor(br.bottom));
          let pixels=0,sum=0,over30=0;
          for(let y=y1;y<y2;y++){
            for(let x=x1;x<x2;x++){
              const k=4*(y*c.width+x);
              const d=(Math.abs(A[k]-B[k])+Math.abs(A[k+1]-B[k+1])+
                Math.abs(A[k+2]-B[k+2]))/3;
              pixels++;sum+=d;if(d>30)over30++;
            }
          }
          return {
            region:{x:x1,y:y1,width:Math.max(0,x2-x1),height:Math.max(0,y2-y1)},
            comparedPixels:pixels,
            meanRgbDifference:pixels?+(sum/pixels).toFixed(3):null,
            differingPixelsOver30Pct:pixels?+(over30/pixels*100).toFixed(2):null
          };
        },{source,local});
        const sample={width,height,phase,
          sourceSectionHeight:source.sectionHeight,
          localSectionHeight:local.sectionHeight,
          heightDifference:+(local.sectionHeight-source.sectionHeight).toFixed(1),
          sourceRect:source.rect,localRect:local.rect,...score};
        report.samples.push(sample);
        console.log('SECTION4_PARITY '+JSON.stringify({
          width,height,phase,heightDifference:sample.heightDifference,
          meanRgbDifference:score.meanRgbDifference,
          differingPixelsOver30Pct:score.differingPixelsOver30Pct
        }));
      }
    }finally{await context.close();}
  }
}finally{
  await browser.close();
  await writeFile('section4-exact-audit/section4-visual-parity.json',
    JSON.stringify(report,null,2)+'\n');
}
console.log('Local output: section4-exact-audit/section4-visual-parity.json');
if(report.errors.length||report.samples.length!==12){
  console.error('Incomplete image comparison; do not claim 1:1 parity.');
  process.exitCode=2;
}else if(report.samples.some(s=>s.meanRgbDifference>0)){
  console.error('Visual pixel differences remain. Investigate screenshot pairs.');
  process.exitCode=1;
}else console.log('Measured frames matched. Validate dynamic behavior and permissions separately.');
