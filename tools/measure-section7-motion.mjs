// Read-only Section 7 scroll entrance/reversal audit against the public reference.
// Measures computed motion, bounding boxes and classes. No source photos downloaded.
import {chromium} from '@playwright/test';
import fs from 'node:fs';

const source='https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en';
const local='http://127.0.0.1:8000/';
const out='section7-motion-evidence';
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const viewport={width:390,height:844};
const report={date:new Date().toISOString(),viewport,records:[]};
function sampleExpr() {
  const heading=[...document.querySelectorAll('h1,h2,h3,h4')]
    .find(e=>e.textContent.trim()==='Our Gallery');
  const gallery=heading?.closest('section');
  const rect=el=>{if(!el)return null;const r=el.getBoundingClientRect();
    return {x:+r.x.toFixed(1),y:+r.y.toFixed(1),w:+r.width.toFixed(1),h:+r.height.toFixed(1)};};
  const snap=el=>{if(!el)return null;const st=getComputedStyle(el);
    return {tag:el.tagName,class:String(el.className||'').slice(0,160),
      rect:rect(el),opacity:st.opacity,transform:st.transform,translate:st.translate,
      transition:st.transitionProperty,transitionDuration:st.transitionDuration,
      transitionDelay:st.transitionDelay,animation:st.animationName,
      animationDuration:st.animationDuration,animationDelay:st.animationDelay};};
  const words=[...gallery?.querySelectorAll('p,span,div')||[]];
  const kicker=words.find(e=>e.children.length===0&&(e.textContent||'').trim().toUpperCase()==='MOMENTS');
  const hint=words.find(e=>e.children.length===0&&(e.textContent||'').trim()==='Tap a frame to view');
  const slots=[...gallery?.querySelectorAll('[data-gallery-slot]')||[]];
  const refNames=['moody.webp','moody-bride.webp','moody-groom.webp','moody-garden.webp','moody-lake.webp'];
  const media=refNames.map((name,i)=>{
    const img=[...gallery.querySelectorAll('img')].find(el=>(el.currentSrc||el.src).includes('/'+name));
    return snap(slots[i]||img?.parentElement);
  });
  return {y:scrollY,heading:snap(heading),kicker:snap(kicker),hint:snap(hint),
    section:snap(gallery),frames:media};
}
async function measure(name,url){
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true,
    deviceScaleFactor:1,reducedMotion:'no-preference',locale:'en-MY'});
  const page=await context.newPage();
  const record={name,url,status:'started',samples:[],errors:[]};
  report.records.push(record);
  page.on('pageerror',error=>record.errors.push(String(error).slice(0,220)));
  try {
    const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:55000});
    record.httpStatus=response?.status();
    await page.waitForTimeout(1900);
    const open=page.getByRole('button',{name:'Open Invitation'});
    for(let i=0;i<await open.count();i++){
      if(await open.nth(i).isVisible()){
        await open.nth(i).click({timeout:6000});
        record.opened=true;
        break;
      }
    }
    await page.waitForTimeout(1400);
    const header=page.getByRole('heading',{name:'Our Gallery',exact:true}).first();
    await header.waitFor({state:'attached',timeout:12000});
    const y=await header.evaluate(el=>el.getBoundingClientRect().top+scrollY);
    const h=viewport.height;
    record.headingDocumentY=+y.toFixed(1);
    const go=async target=>await page.evaluate(y=>{
      document.documentElement.style.scrollBehavior='auto';
      window.scrollTo({top:Math.max(0,y),behavior:'instant'});
    },target);
    const shot=async label=>{
      const result=await page.evaluate(sampleExpr);
      record.samples.push({label,...result});
      const short={name,label,heading:result.heading,frames:result.frames.map(f=>f&&{
        opacity:f.opacity,transform:f.transform,translate:f.translate,
        dur:f.transitionDuration,delay:f.transitionDelay,
        animation:f.animation,class:f.class,
        y:f.rect?.y})};
      console.log('SECTION7_MOTION '+JSON.stringify(short));
    };
    await go(y-h*1.85);
    await page.waitForTimeout(600);
    await shot('before-entry');
    await go(y-h*0.65);
    await shot('entered-t0');
    for(const ms of [150,250,450,600]){
      await page.waitForTimeout(ms);
      await shot('entered-after-'+[150,250,450,600].slice(0,[150,250,450,600].indexOf(ms)+1).reduce((a,b)=>a+b,0)+'ms');
    }
    await go(y+220);
    await page.waitForTimeout(650);
    await shot('frames-visible');
    await go(y-h*1.85);
    await page.waitForTimeout(750);
    await shot('reversed-outside');
    await go(y-h*0.65);
    await page.waitForTimeout(600);
    await shot('reenter-after-600ms');
    record.status='captured';
  }catch(error){
    record.status='error';
    record.error=String(error);
    console.error('SECTION7_MOTION_ERROR '+name+' '+record.error);
  }finally{await context.close();}
}
try {
  await measure('reference',source);
  await measure('local',local);
}finally{
  await browser.close();
  fs.writeFileSync(out+'/measurements.json',JSON.stringify(report,null,2));
}
if(report.records.some(r=>r.status!=='captured')) process.exitCode=1;
