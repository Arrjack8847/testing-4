// Read-only Section 7 visual audit. Reference photos are shown from their original
// remote URL only inside ephemeral GitHub Actions screenshots. Never ship these assets.
import {chromium} from '@playwright/test';
import fs from 'node:fs';

const BASE='section7-live-evidence';
fs.mkdirSync(BASE,{recursive:true});
const VENDOR='https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en';
const LOCAL='http://127.0.0.1:8000/?galleryReference=1';
const SIZE=[{width:390,height:844},{width:320,height:568}];
const LABELS=['Together','The Bride','The Groom','The Garden','The Lake'];
const output={generated:new Date().toISOString(),reference:VENDOR,local:LOCAL,measurements:[]};
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});

const near=(n)=>Number.isFinite(n)?Math.round(n*10)/10:null;

async function capture(type,url,viewport){
  const context=await browser.newContext({
    viewport,deviceScaleFactor:1,isMobile:true,hasTouch:true,
    reducedMotion:'reduce',locale:'en-MY'
  });
  const page=await context.newPage();
  const record={kind:type,viewport,url,opened:false,status:'started',errors:[]};
  page.on('pageerror',e=>record.errors.push(String(e.message).slice(0,400)));
  output.measurements.push(record);
  try {
    const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:55000});
    record.httpStatus=response?.status()??null;
    await page.waitForTimeout(1250);
    const gates=page.getByRole('button',{name:'Open Invitation'});
    for(let i=0;i<await gates.count();i++){
      if(await gates.nth(i).isVisible()){
        await gates.nth(i).click({timeout:8000});
        record.opened=true;
        break;
      }
    }
    await page.waitForTimeout(1350);
    const h=page.getByRole('heading',{name:'Our Gallery',exact:true}).first();
    await h.waitFor({state:'attached',timeout:12000});
    const top=await h.evaluate(el=>el.getBoundingClientRect().top+window.scrollY);
    record.headingDocumentTop=near(top);
    // Three fixed checkpoints near the reference heading, then after the frames.
    for(const [name,offset] of [['heading',-80],['frames',360],['lower',930]]){
      const y=Math.max(0,Math.round(top+offset));
      await page.evaluate(y=>{
        document.documentElement.style.scrollBehavior='auto';
        window.scrollTo({top:y,behavior:'instant'});
      },y);
      await page.waitForTimeout(850);
      await page.screenshot({path:`${BASE}/${type}-${viewport.width}-${name}.png`,animations:'disabled'});
    }
    record.metrics=await page.evaluate((labels)=>{
      const heading=[...document.querySelectorAll('h1,h2,h3,h4')]
        .find(el=>(el.textContent||'').trim()==='Our Gallery');
      const scroll=window.scrollY;
      const rect=el=>{
        if(!el)return null;
        const r=el.getBoundingClientRect();
        return {x:+r.x.toFixed(1),docY:+(r.y+scroll).toFixed(1),
          width:+r.width.toFixed(1),height:+r.height.toFixed(1)};
      };
      const fmt=el=>{
        if(!el)return null;
        const cs=getComputedStyle(el);
        return {tag:el.tagName,classes:typeof el.className==='string'?el.className.slice(0,130):'',
          rect:rect(el),font:cs.fontFamily,fontSize:cs.fontSize,lineHeight:cs.lineHeight,
          weight:cs.fontWeight,color:cs.color,background:cs.backgroundColor,
          border:cs.border,borderRadius:cs.borderRadius,boxShadow:cs.boxShadow,
          objectFit:cs.objectFit,objectPosition:cs.objectPosition,
          opacity:cs.opacity,transform:cs.transform,translate:cs.translate,
          animationName:cs.animationName,animationDuration:cs.animationDuration,
          transitionDuration:cs.transitionDuration,letterSpacing:cs.letterSpacing,
          backgroundImage:cs.backgroundImage.slice(0,500),textShadow:cs.textShadow,
          display:cs.display,position:cs.position,padding:cs.padding,margin:cs.margin};
      };
      const sampleImage=(label,index)=>{
        const localFrame=document.querySelector('#gallery [data-gallery-slot="'+index+'"]');
        const img=[...document.querySelectorAll('img')].find(node=>node.alt===label);
        if(!img)return {label,found:Boolean(localFrame),image:null,
          frame:fmt(localFrame),src:null,natural:null};
        const chain=[];
        let el=img;
        for(let i=0;el&&i<4;i++,el=el.parentElement)chain.push(fmt(el));
        const frame=img.parentElement;
        return {label,found:true,src:img.currentSrc||img.src,
          natural:[img.naturalWidth,img.naturalHeight],image:fmt(img),frame:fmt(frame),ancestors:chain};
      };
      const section=heading?.closest('section');
      const hint=[...document.querySelectorAll('p,span,div')].find(el=>{
        return el.children.length===0&&(el.textContent||'').trim()==='Tap a frame to view';
      });
      const eyebrow=[...document.querySelectorAll('p,span')].find(el=>{
        return el.children.length===0&&(el.textContent||'').trim()==='Moments'
          && Math.abs(el.getBoundingClientRect().top+scroll-(heading?.getBoundingClientRect().top+scroll||0))<450;
      });
      return {
        title:document.title,viewport:{width:innerWidth,height:innerHeight},
        scrollHeight:document.documentElement.scrollHeight,
        horizontalOverflow:document.documentElement.scrollWidth-innerWidth,
        heading:fmt(heading),eyebrow:fmt(eyebrow),hint:fmt(hint),section:fmt(section),
        photos:labels.map(sampleImage)
      };
    },LABELS);
    record.status='captured';
    console.log('SECTION7_AUDIT '+JSON.stringify({
      kind:type,width:viewport.width,found:record.metrics.photos.filter(p=>p.found).length,
      frames:record.metrics.photos.map(p=>({
        label:p.label,src:p.src,
        image:p.image?.rect,frame:p.frame?.rect,
        styles:p.frame?{radius:p.frame.borderRadius,border:p.frame.border,
          shadow:p.frame.boxShadow,padding:p.frame.padding}:null
      })),
      heading:record.metrics.heading,
      eyebrow:record.metrics.eyebrow,
      hint:record.metrics.hint,
      section:record.metrics.section,
      photoStyle:record.metrics.photos[0]?.image?{
        objectFit:record.metrics.photos[0].image.objectFit,
        objectPosition:record.metrics.photos[0].image.objectPosition,
        animationName:record.metrics.photos[0].image.animationName,
        transitionDuration:record.metrics.photos[0].image.transitionDuration}:null,
      overflow:record.metrics.horizontalOverflow
    }));
  } catch (e){
    record.status='error';record.error=String(e);
    console.error('SECTION7_AUDIT_ERROR '+type+' '+viewport.width+' '+record.error);
  } finally{
    await context.close();
  }
}

try {
  for(const v of SIZE){
    await capture('reference',VENDOR,v);
    await capture('local',LOCAL,v);
  }
} finally{
  await browser.close();
  fs.writeFileSync(`${BASE}/measurements.json`,JSON.stringify(output,null,2));
}
if(output.measurements.some(x=>x.status!=='captured')) process.exitCode=1;
