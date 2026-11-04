// Section 10 only: capture source and user's locally staged artwork at the
// same 390 x 844 viewport and final page position. Never writes vendor assets
// to Git, and never performs external interactions beyond opening the preview.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const OUTPUT='section10-visual-qa';
const SOURCE='https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en';
const LOCAL='http://127.0.0.1:8000';
await mkdir(OUTPUT,{recursive:true});
const server=spawn('python3',['-m','http.server','8000','--bind','127.0.0.1'],{stdio:'ignore'});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
let result={checkedAt:new Date().toISOString(),viewport:{width:390,height:844}};
const selectors={
  source:{section:'.cgv-closing',inner:'.cgv-closing .cgv-inner',frame:'.cgv-closing .cgv-tframe',heading:'.cgv-closing .cgv-eyebrow',message:'.cgv-closing .cgv-lead',rule:'.cgv-closing .cgv-rule',signoff:'.cgv-closing .cgv-eyebrow.cgv-d2',names:'.cgv-closing .cgv-closing-names',contacts:'.cgv-closing .cgv-contacts',footer:'.cgv-closing .cgv-foot',scene:'.cgv-closing img[src*="tasik-kayangan/scene.webp"]'},
  local:{section:'#closingMessage',inner:'#closingMessage .closing10-inner',frame:'#closingMessage .closing10-frame',heading:'#closingHeading',message:'#closingMessage .closing10-message',rule:'#closingMessage .closing10-rule',signoff:'#closingMessage .closing10-signoff',names:'#closingMessage .closing10-names',contacts:'#closingMessage .closing10-contacts',footer:'#closingMessage .closing10-credit',scene:'#closingMessage .closing10-source-scene'}
};
async function waitServer(){
  for(let i=0;i<40;i++){
    try{const r=await fetch(LOCAL);if(r.ok)return;}
    catch{}
    await new Promise(r=>setTimeout(r,200));
  }
  throw new Error('Local HTTP preview did not start.');
}
async function visit(kind,url){
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e.message)));
  try {
    const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:65000});
    await page.waitForTimeout(kind==='source'?2400:350);
    const open=page.getByRole('button',{name:'Open Invitation',exact:true});
    if(await open.count())await open.first().click({timeout:12000});
    await page.evaluate(()=>document.fonts.ready);
    if(kind==='local') {
      await page.waitForFunction(()=>document.querySelector('#closingMessage')?.dataset.artwork==='local-reference',null,{timeout:10000});
    }
    // Wait for images and layout shifts before matching section-end coordinates.
    await page.waitForTimeout(kind==='source'?1800:750);
    await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,document.documentElement.scrollHeight);});
    await page.waitForTimeout(1450);
    const rects=await page.evaluate(sel=>{
      const fields={};
      const item=q=>{
        const el= (q.includes('tasik-kayangan/scene.webp'))
          ? [...document.querySelectorAll('img[src*="tasik-kayangan/scene.webp"]')].find(e=>e.getBoundingClientRect().width>300)
          : document.querySelector(q);
        if(!el)return null;
        const r=el.getBoundingClientRect(),s=getComputedStyle(el);
        return {transform:s.transform,translate:s.translate,scale:s.scale,
          transition:s.transition,animation:s.animation,
          margin:s.margin,padding:s.padding,position:s.position,
          x:+r.x.toFixed(2),y:+r.y.toFixed(2),
          width:+r.width.toFixed(2),height:+r.height.toFixed(2),
          font:s.font,fontSize:s.fontSize,letterSpacing:s.letterSpacing,
          color:s.color,bg:s.backgroundColor,opacity:s.opacity,
          naturalWidth:el instanceof HTMLImageElement?el.naturalWidth:null,
          naturalHeight:el instanceof HTMLImageElement?el.naturalHeight:null,
          objectFit:s.objectFit,objectPosition:s.objectPosition};
      };
      for(const [name,q] of Object.entries(sel))fields[name]=item(q);
      return {scrollY,documentHeight:document.documentElement.scrollHeight,
        windowHeight:innerHeight,artwork:document.querySelector('#closingMessage')?.dataset.artwork||null,
        fields};
    },selectors[kind]);
    await page.screenshot({path:OUTPUT+'/'+kind+'-exit-390x844.png',animations:'disabled'});
    const exit=rects;
    const region=selectors[kind].section;
    await page.evaluate(q=>{
      const e=document.querySelector(q);
      window.scrollTo(0,e.getBoundingClientRect().top+scrollY+80);
    },region);
    await page.waitForTimeout(1800);
    const checkpoint=await page.evaluate(sel=>{
      const out={};
      for(const [name,q] of Object.entries(sel)){
        const el=document.querySelector(q);
        if(!el)continue;
        const r=el.getBoundingClientRect(),s=getComputedStyle(el);
        out[name]={x:+r.x.toFixed(2),y:+r.y.toFixed(2),width:+r.width.toFixed(2),
          height:+r.height.toFixed(2),transform:s.transform,opacity:s.opacity};
      }
      return {scrollY,items:out};
    },selectors[kind]);
    await page.screenshot({path:OUTPUT+'/'+kind+'-entry-390x844.png',animations:'disabled'});
    return {status:response?.status(),errors,...exit,entryCheckpoint:checkpoint};
  }finally{await context.close();}
}
try{
  await waitServer();
  result.source=await visit('source',SOURCE);
  result.local=await visit('local',LOCAL);
  result.geometryDifferences={};
  for(const name of ['section','inner','frame','heading','message','rule','signoff','names','contacts','footer','scene']){
    const s=result.source.fields[name],l=result.local.fields[name];
    if(s&&l){
      result.geometryDifferences[name]={dx:+(l.x-s.x).toFixed(2),dy:+(l.y-s.y).toFixed(2),
        dw:+(l.width-s.width).toFixed(2),dh:+(l.height-s.height).toFixed(2)};
    }
  }
  if(result.source.fields.scene?.naturalWidth!==1080)throw new Error('Unexpected source scene image dimensions.');
  if(result.local.fields.scene?.naturalWidth!==1080)throw new Error('Shared artwork was not loaded.');
  console.log('SECTION10_MATCHED_VISUAL_GEOMETRY '+JSON.stringify(result.geometryDifferences));
  console.log('SECTION10_MATCHED_ART '+JSON.stringify({source:result.source.fields.scene,local:result.local.fields.scene}));
}catch(e){
  result.error=String(e);
  console.error('SECTION10_VISUAL_QA_ERROR '+String(e));
  process.exitCode=1;
}finally{
  await writeFile(OUTPUT+'/comparison.json',JSON.stringify(result,null,2));
  await browser.close();
  server.kill('SIGTERM');
}
