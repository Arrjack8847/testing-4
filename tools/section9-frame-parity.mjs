// Read-only time-aligned source/local Section 9 visual comparison.
// It does not copy vendor scripts, publish source images or claim exact parity.
import {chromium} from '@playwright/test';
import fs from 'node:fs';
const output='section9-frame-audit';fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const sourceUrl='https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en';
const localUrl='http://127.0.0.1:8000/';
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,locale:'en-MY'});
const original=await context.newPage(), local=await context.newPage();
const metrics={source:sourceUrl,local:localUrl,viewport:[390,844],frames:[],checkedAt:new Date().toISOString()};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const open=async(page)=>{
  await page.evaluate(()=>document.fonts.ready);
  const button=page.getByRole('button',{name:'Open Invitation'});
  if(await button.count()&&await button.first().isVisible()){
    await button.first().click({timeout:12000});
  }
};
// The reference's .cgv-bf element can be offscreen with opacity 0 while
// a different animation is visible. Record candidates rather than treating
// that hidden element as the source's visible butterfly.
const pose=async(page,root,butterfly)=>{
  return page.evaluate(({root,butterfly})=>{
    const section=document.querySelector(root);
    const bf=document.querySelector(butterfly);
    const box=element=>{
      if(!element)return null;
      const r=element.getBoundingClientRect(),style=getComputedStyle(element);
      return {
        x:Number(r.x.toFixed(1)),y:Number(r.y.toFixed(1)),
        width:Number(r.width.toFixed(1)),height:Number(r.height.toFixed(1)),
        transform:style.transform,opacity:style.opacity
      };
    };
    const candidates=[];
    const viewportWidth=innerWidth,viewportHeight=innerHeight;
    for(const element of document.querySelectorAll('*')){
      const identity=[
        element.tagName,element.getAttribute('id')||'',
        element.getAttribute('class')||'',element.getAttribute('src')||'',
        element.getAttribute('alt')||'',element.getAttribute('style')||''
      ].join(' ');
      // Skip unrelated elements without requiring expensive computed styles.
      if(!/bfly|butterfly|flutter|wing/i.test(identity))continue;
      const rect=element.getBoundingClientRect(),style=getComputedStyle(element);
      const visible=rect.width>0&&rect.height>0&&
        rect.right>0&&rect.bottom>0&&rect.left<viewportWidth&&rect.top<viewportHeight&&
        style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)>0.04;
      candidates.push({
        selector:(element.id?'#'+element.id:element.tagName.toLowerCase()+
          (typeof element.className==='string'&&element.className?
            '.'+element.className.trim().split(/\s+/).slice(0,2).join('.') :'')),
        image:element.getAttribute('src')||style.backgroundImage.slice(0,160),
        visible,rect:box(element),
        animation:style.animationName,animationState:style.animationPlayState
      });
    }
    candidates.sort((left,right)=>Number(right.visible)-Number(left.visible));
    const visibleButterflyCandidates=candidates.filter(item=>item.visible).slice(0,8);
    return {
      section:box(section),
      // Preserve the old field so prior frame stats can compare old/new audits.
      butterfly:box(bf),
      referenceSelectorWasVisible:candidates.some(item=>item.visible&&
        item.rect?.x===box(bf)?.x&&item.rect?.y===box(bf)?.y),
      visibleButterflyCandidates,
      butterflyCandidates:candidates.slice(0,12),
      // An absent candidate means "unmeasured", not "no butterfly exists".
      visibleButterflyMeasurement:visibleButterflyCandidates.length?
        'visible-dom-candidate':'not-observed'
    };
  },{root,butterfly});
};
try{
  await Promise.all([
    original.goto(sourceUrl,{waitUntil:'domcontentloaded',timeout:60000}),
    local.goto(localUrl,{waitUntil:'domcontentloaded',timeout:30000})
  ]);
  await Promise.all([open(original),open(local)]);
  await Promise.all([original.waitForSelector('#cgv-rsvp'),local.waitForSelector('#rsvp')]);
  await local.waitForFunction(()=>{
    const s=document.querySelector('#rsvp');
    return s.classList.contains('s9-reference-loaded')&&s.classList.contains('s9-reference-butterfly-loaded');
  },null,{timeout:20000});
  for(const [label,offset] of [['entry',100],['middle',-355],['exit',-775]]){
    const scroll=async(page,id)=>{
      await page.evaluate(({id,offset})=>{
        document.documentElement.style.scrollBehavior='auto';
        const el=document.querySelector(id);
        const y=el.getBoundingClientRect().top+scrollY-offset;
        window.scrollTo({top:Math.round(y),behavior:'instant'});
      },{id,offset});
    };
    await Promise.all([scroll(original,'#cgv-rsvp'),scroll(local,'#rsvp')]);
    // The reference's opening choreography can continue scrolling for ~1.8s;
    // avoid comparing Section 8 on one page against Section 9 on the other.
    await wait(1800);
    await Promise.all([scroll(original,'#cgv-rsvp'),scroll(local,'#rsvp')]);
    await wait(250);
    const t0=Date.now();
    for(const ms of [0,600,1200,1800,2400,3600,4800]){
      const elapsed=Date.now()-t0;
      if(ms>elapsed)await wait(ms-elapsed);
      const name=label+'-'+String(ms).padStart(4,'0');
      const [o,l,op,lp]=await Promise.all([
        original.screenshot({path:output+'/reference-'+name+'.png',animations:'allow',timeout:25000}),
        local.screenshot({path:output+'/local-'+name+'.png',animations:'allow',timeout:25000}),
        pose(original,'#cgv-rsvp','.cgv-bf'),
        pose(local,'#rsvp','.s9-butterfly')
      ]);
      metrics.frames.push({checkpoint:label,elapsedMs:Date.now()-t0,
        files:['reference-'+name+'.png','local-'+name+'.png'],
        original:op,local:lp});
    }
  }
}catch(error){
  metrics.failure=String(error);
  console.error('S9_FRAME_AUDIT_ERROR',String(error));
  process.exitCode=1;
  const countVisible=key=>metrics.frames.filter(frame=>
    frame[key]?.visibleButterflyMeasurement==='visible-dom-candidate').length;
  console.log('S9_BUTTERFLY_CANDIDATES '+JSON.stringify({
    totalFrames:metrics.frames.length,
    referenceVisibleSamples:countVisible('original'),
    localVisibleSamples:countVisible('local'),
    legacyReferenceSelectorMayBeOffscreen:true,
    note:'No visible candidate does not prove that a canvas or CSS pseudo-element is absent.'
  }));
}finally{
  fs.writeFileSync(output+'/frames.json',JSON.stringify(metrics,null,2));
  await browser.close();
}
