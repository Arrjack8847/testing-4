/**
 * Section 5: read-only pixel comparison against the live Tasik Kayangan reference.
 *
 * Requires the locally staged permission-cleared artwork to be present.
 * DOES NOT download, hotlink, redistribute, or commit reference WebP files.
 *
 * From the repository root, with localhost:8000 already serving this branch:
 *   node tools/section5-visual-parity-audit.mjs
 *
 * Optional:
 *   node tools/section5-visual-parity-audit.mjs --reference-only
 *   node tools/section5-visual-parity-audit.mjs --local-url http://localhost:8000/
 *
 * Evidence is written to artifacts/section5-visual-parity/ (gitignored).
 */
import {chromium} from '@playwright/test';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {join} from 'node:path';

const args=process.argv.slice(2);
const valueOf=(name,fallback)=>{
  const i=args.indexOf(name);
  return i<0?fallback:args[i+1]||fallback;
};
const referenceOnly=args.includes('--reference-only');
const localUrl=valueOf('--local-url','http://localhost:8000/');
const referenceUrl='https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en';
const output='artifacts/section5-visual-parity';
const viewports=[
  {id:'320x568',width:320,height:568},
  {id:'360x740',width:360,height:740},
  {id:'390x844',width:390,height:844},
  {id:'430x932',width:430,height:932}
];
const required=[
  'assets/reference-dev/band_plum.webp',
  'assets/reference-dev/bfly_blush.webp'
];

async function checkStagedArt(){
  const assets=[];
  for(const name of required){
    try{
      const file=await readFile(name);
      const valid=file.length>64&&file.toString('ascii',0,4)==='RIFF'&&
        file.toString('ascii',8,12)==='WEBP';
      assets.push({name,valid,bytes:file.length});
    }catch(e){assets.push({name,valid:false,error:e.code||e.message});}
  }
  return assets;
}

async function capture(browser,url,id,viewport){
  const context=await browser.newContext({
    viewport:{width:viewport.width,height:viewport.height},
    deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'
  });
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const selector=id==='reference'?'.cgv-timeline':'#runningOrder';
  const path=join(output,id+'-'+viewport.id+'.png');
  try{
    const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
    if(!response?.ok())throw new Error(id+' returned HTTP '+response?.status());
    const open=page.getByRole('button',{name:'Open Invitation'}).first();
    if(await open.count() && await open.isVisible())await open.click();
    await page.locator(selector).waitFor({state:'attached',timeout:15000});
    await page.evaluate(()=>document.fonts.ready);
    const element=page.locator(selector).first();
    await element.evaluate(el=>{
      document.documentElement.style.scrollBehavior='auto';
      el.scrollIntoView({block:'start',behavior:'instant'});
    });
    await page.waitForTimeout(650);
    const details=await element.evaluate((el,id)=>{
      const section=el.getBoundingClientRect();
      const style=getComputedStyle(el);
      const box=node=>{
        if(!node)return null;
        const r=node.getBoundingClientRect();
        return {
          x:+(r.left-section.left).toFixed(2),
          y:+(r.top-section.top).toFixed(2),
          width:+r.width.toFixed(2),
          height:+r.height.toFixed(2)
        };
      };
      const q=s=>el.querySelector(s);
      const rows=[...el.querySelectorAll(id==='reference'?'.cgv-tl-row':'.order-entry')];
      const label=q(id==='reference'?'.cgv-tl-kicker':'.order-eyebrow');
      const heading=q(id==='reference'?'.cgv-tl-title':'.order-heading');
      const time=q(id==='reference'?'.cgv-tl-time':'.order-time');
      const butterfly=q(id==='reference'?'.cgv-bf':'#orderButterflyFlight');
      return {
        width:+section.width.toFixed(2),height:+section.height.toFixed(2),
        background:style.backgroundImage,backgroundSize:style.backgroundSize,
        backgroundPosition:style.backgroundPosition,
        artworkStatus:el.dataset.artworkStatus||null,
        eyebrow:box(label),heading:box(heading),time:box(time),
        rows:rows.map(box),butterfly:box(butterfly),
        horizontalOverflow:document.documentElement.scrollWidth-innerWidth
      };
    },id);
    if(id==='local'){
      await page.waitForFunction(()=>{
        const status=document.querySelector('#runningOrder')?.dataset.artworkStatus;
        return ['ready','partial','missing'].includes(status);
      },null,{timeout:12000});
      const status=await element.getAttribute('data-artwork-status');
      if(status!=='ready'){
        const warning=await page.locator('#orderArtworkNotice').textContent().catch(()=>null);
        throw new Error('Local reference artwork not ready ('+status+'). '+(warning||'Check assets/reference-dev/.'));
      }
    }
    await element.screenshot({path,animations:'disabled',timeout:30000});
    return {status:'captured',file:path,details,errors};
  }finally{await context.close();}
}

function differences(a,b){
  const coordinates=['x','y','width','height'];
  const delta=(left,right)=>{
    if(!left||!right)return null;
    return Object.fromEntries(coordinates.map(k=>[k,+(right[k]-left[k]).toFixed(2)]));
  };
  return {
    eyebrow:delta(a.eyebrow,b.eyebrow),
    heading:delta(a.heading,b.heading),
    rows:a.rows.map((r,i)=>delta(r,b.rows[i])),
    sectionHeight:+(b.height-a.height).toFixed(2)
  };
}

async function comparePixels(browser,aBytes,bBytes){
  const page=await browser.newPage();
  try{
    const result=await page.evaluate(async ({a,b})=>{
      const load=source=>new Promise((resolve,reject)=>{
        const img=new Image();
        img.onload=()=>resolve(img);
        img.onerror=()=>reject(new Error('Could not decode screenshot'));
        img.src='data:image/png;base64,'+source;
      });
      const [r,l]=await Promise.all([load(a),load(b)]);
      const width=Math.max(r.width,l.width);
      const height=Math.max(r.height,l.height);
      const canvas=()=>{const c=document.createElement('canvas');c.width=width;c.height=height;return c};
      const ca=canvas(),cb=canvas(),heat=canvas();
      const c1=ca.getContext('2d'),c2=cb.getContext('2d'),ch=heat.getContext('2d');
      c1.drawImage(r,0,0,width,height);
      c2.drawImage(l,0,0,width,height);
      const da=c1.getImageData(0,0,width,height).data;
      const db=c2.getImageData(0,0,width,height).data;
      const image=ch.createImageData(width,height);
      let error=0,over12=0,over32=0;
      for(let i=0;i<da.length;i+=4){
        const d=(Math.abs(da[i]-db[i])+
          Math.abs(da[i+1]-db[i+1])+
          Math.abs(da[i+2]-db[i+2]))/3;
        error+=d;
        if(d>12)over12++;
        if(d>32)over32++;
        const intensity=Math.min(255,Math.round(d*3));
        image.data[i]=intensity;
        image.data[i+1]=Math.round(intensity*.15);
        image.data[i+2]=Math.round(intensity*.28);
        image.data[i+3]=255;
      }
      ch.putImageData(image,0,0);
      const pixels=width*height;
      return {
        stats:{
          comparedWidth:width,comparedHeight:height,
          referenceWidth:r.width,referenceHeight:r.height,
          localWidth:l.width,localHeight:l.height,
          meanAbsoluteColorError:+(error/pixels).toFixed(3),
          percentPixelsDifferent12:+(100*over12/pixels).toFixed(2),
          percentPixelsDifferent32:+(100*over32/pixels).toFixed(2)
        },
        diffImage:heat.toDataURL('image/png')
      };
    },{a:aBytes.toString('base64'),b:bBytes.toString('base64')});
    return {stats:result.stats,diff:Buffer.from(result.diffImage.split(',')[1],'base64')};
  }finally{await page.close();}
}

await mkdir(output,{recursive:true});
const report={
  referenceUrl,localUrl,checkedAt:new Date().toISOString(),
  artAssets:await checkStagedArt(),widths:[],mode:referenceOnly?'reference-only':'comparison'
};
let failures=0;
if(!referenceOnly&&report.artAssets.some(asset=>!asset.valid)){
  console.error('Section 5 artwork preflight: permission-cleared local WebPs are missing or invalid.');
  console.error('Run download-section5-reference.ps1 -IHavePermission ONLY if you have rights to those assets.');
  for(const asset of report.artAssets)console.error(asset.name+': '+(asset.valid?'OK':'MISSING/INVALID'));
  report.error='Local reference WebPs missing/invalid; no pixel-parity claim possible.';
  await writeFile(join(output,'report.json'),JSON.stringify(report,null,2));
  process.exit(2);
}
const browser=await chromium.launch({headless:true});
try{
  for(const viewport of viewports){
    const result={viewport:viewport.id};
    report.widths.push(result);
    try{
      result.reference=await capture(browser,referenceUrl,'reference',viewport);
      if(!referenceOnly){
        result.local=await capture(browser,localUrl,'local',viewport);
        result.geometryDifference=differences(result.reference.details,result.local.details);
        const [a,b]=await Promise.all([readFile(result.reference.file),readFile(result.local.file)]);
        const diff=await comparePixels(browser,a,b);
        const diffPath=join(output,'diff-'+viewport.id+'.png');
        await writeFile(diffPath,diff.diff);
        result.pixelDifference=diff.stats;
        result.diffFile=diffPath;
        if(result.local.details.horizontalOverflow>1)throw new Error('Section 5 causes mobile horizontal overflow');
      }
      console.log('SECTION5_PARITY '+JSON.stringify({
        viewport:viewport.id,status:'captured',
        geometry:result.geometryDifference||null,
        pixels:result.pixelDifference||null
      }));
    }catch(e){failures++;result.error=String(e);console.error('SECTION5_PARITY_ERROR '+viewport.id+' '+String(e));}
  }
}finally{
  await browser.close();
  await writeFile(join(output,'report.json'),JSON.stringify(report,null,2));
}
console.log('Review '+output+'/report.json and paired screenshots.');
console.log('Pixel error is diagnostic, not proof of exact proprietary animation parity.');
if(failures)process.exitCode=1;
