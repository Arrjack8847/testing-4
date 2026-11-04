// Read-only source/local Section 10 reveal-and-reverse study at 390x844.
// No source artwork is committed: the workflow stages the already uploaded WebP
// only inside the runner's Git-ignored developer preview directory.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
const SOURCE='https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en';
const LOCAL='http://127.0.0.1:8000';
const OUT='section10-motion-evidence';
await mkdir(OUT,{recursive:true});
// Use the Windows Python launcher locally and python3 on GitHub Actions/Linux.
const python=process.platform==='win32'?'py':'python3';
const server=spawn(python,['-m','http.server','8000','--bind','127.0.0.1'],{stdio:'ignore'});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const spec={
  source:{section:'.cgv-closing',frame:'.cgv-closing .cgv-tframe',
    heading:'.cgv-closing .cgv-eyebrow',message:'.cgv-closing .cgv-lead',
    rule:'.cgv-closing .cgv-rule',signoff:'.cgv-closing .cgv-eyebrow.cgv-d2',
    names:'.cgv-closing .cgv-closing-names',
    contacts:'.cgv-closing .cgv-contacts',footer:'.cgv-closing .cgv-foot',
    scene:'img[src*="tasik-kayangan/scene.webp"]'},
  local:{section:'#closingMessage',frame:'#closingMessage .closing10-frame',
    heading:'#closingHeading',message:'#closingMessage .closing10-message',
    rule:'#closingMessage .closing10-rule',signoff:'#closingMessage .closing10-signoff',
    names:'#closingMessage .closing10-names',
    contacts:'#closingMessage .closing10-contacts',footer:'#closingMessage .closing10-credit',
    scene:'#closingMessage .closing10-source-scene'}
};
const deltas=[-650,-370,-170,-30,80,180,265,180,80,-30,-170,-370,-650];
// Include a fully settled frame after the source footer's 1.05s delay + 1s opacity transition.
const delays=[100,550,1400,2300];
const reports={checkedAt:new Date().toISOString(),viewport:'390x844',deltas,delays};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
try {
  let ok=false;
  for(let i=0;i<45;i++){
    try{const r=await fetch(LOCAL); if(r.ok){ok=true;break;}}catch{}
    await wait(200);
  }
  if(!ok)throw Error('Local preview server did not start');
  for(const [kind,url] of [['source',SOURCE],['local',LOCAL]]) {
    const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'no-preference'});
    const page=await context.newPage();
    try{
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:70000});
      await wait(kind==='source'?3500:350);
      const open=page.getByRole('button',{name:'Open Invitation',exact:true});
      if(await open.count())await open.first().click({timeout:12000});
      await page.evaluate(()=>document.fonts.ready);
      if(kind==='local') await page.waitForFunction(()=>document.querySelector('#closingMessage')?.dataset.artwork==='local-reference');
      await wait(kind==='source'?2200:800);
      await page.evaluate(()=>{
        document.documentElement.style.scrollBehavior='auto';
        window.scrollTo({top:0,behavior:'instant'});
      });
      await wait(300);
      const samples=[];
      for(let idx=0;idx<deltas.length;idx++){
        const delta=deltas[idx];
        const meta=await page.evaluate(({sel,delta})=>{
          const el=document.querySelector(sel);
          if(!el)throw Error('Closing section missing: '+sel);
          const top=el.getBoundingClientRect().top+scrollY;
          const max=document.documentElement.scrollHeight-innerHeight;
          const target=Math.max(0,Math.min(max,top+delta));
          window.scrollTo({top:target,behavior:'instant'});
          return {top,max,target};
        },{sel:spec[kind].section,delta});
        let prev=0;
        for(const ms of delays){
          await wait(ms-prev);prev=ms;
          const obs=await page.evaluate(sel=>{
            const all={};
            for(const [key,q] of Object.entries(sel)){
              let el=document.querySelector(q);
              if(key==='scene'&&q.includes('tasik-kayangan/scene.webp')){
                const images=[...document.querySelectorAll(q)].filter(img=>img.naturalWidth===1080);
                const ranked=images.map(img=>{
                  const r=img.getBoundingClientRect();
                  return {img,score:(r.bottom>0&&r.top<innerHeight?0:10000)+Math.abs(r.top)};
                }).sort((a,b)=>a.score-b.score);
                el=ranked[0]?.img||null;
              }
              if(!el){all[key]=null;continue;}
              const cs=getComputedStyle(el),r=el.getBoundingClientRect();
              all[key]={cls:el.className,opacity:+cs.opacity,
                transform:cs.transform,x:+r.x.toFixed(2),y:+r.y.toFixed(2),
                w:+r.width.toFixed(2),h:+r.height.toFixed(2),
                objectFit:cs.objectFit,objectPosition:cs.objectPosition,
                naturalWidth:el instanceof HTMLImageElement?el.naturalWidth:null,
                inViewport:r.bottom>0&&r.top<innerHeight,
                transition:cs.transitionDuration,
                transitionDelay:cs.transitionDelay,
                transitionTiming:cs.transitionTimingFunction,
                animationDelay:cs.animationDelay,
                activeAnimations:el.getAnimations().filter(a=>a.playState==='running').length};
            }
            return {scrollY:window.scrollY,style:all};
          },spec[kind]);
          samples.push({index:idx,delta,elapsed:ms,meta,...obs});
          if([3,4,6,8,10,12].includes(idx)&&[100,1400,2300].includes(ms)){
            await page.screenshot({path:OUT+'/'+kind+'-'+String(idx).padStart(2,'0')+'-'+ms+'ms.png',animations:'allow'});
          }
        }
      }
      reports[kind]={url,httpStatus:response?.status(),errors,samples};
      console.log('SECTION10_MOTION_'+kind.toUpperCase()+' '+JSON.stringify(samples.map(s=>({
        n:s.index,d:s.delta,t:s.elapsed,scrollY:s.scrollY,
        h:[s.style.heading?.opacity,s.style.heading?.transform,s.style.heading?.cls],
        c:[s.style.contacts?.opacity,s.style.contacts?.transform,s.style.contacts?.cls],
        f:[s.style.footer?.opacity,s.style.footer?.transform,s.style.footer?.cls]
      }))));
    }finally{await context.close();}
  }
  if(!reports.source?.samples.length || !reports.local?.samples.length)throw Error('Motion samples incomplete');
  // Human-review aid: summarize observable differences by matched checkpoint.
  // No hard threshold until source behavior is verified and snapshots inspected.
  const keys=['frame','heading','message','rule','signoff','names','contacts','footer','scene'];
  reports.comparison=[];
  for(let i=0;i<reports.source.samples.length;i++){
    const source=reports.source.samples[i],local=reports.local.samples[i];
    if(!local || source.delta!==local.delta || source.elapsed!==local.elapsed)throw Error('Mismatched source/local motion checkpoints');
    const metrics={};
    for(const k of keys){
      const a=source.style[k],b=local.style[k];
      if(!a||!b)continue;
      metrics[k]={
        sourceOpacity:a.opacity,localOpacity:b.opacity,
        opacityError:+Math.abs(a.opacity-b.opacity).toFixed(3),
        sourceY:a.y,localY:b.y,
        yError:+Math.abs(a.y-b.y).toFixed(2),
        xError:+Math.abs(a.x-b.x).toFixed(2),
        widthError:+Math.abs(a.w-b.w).toFixed(2),
        heightError:+Math.abs(a.h-b.h).toFixed(2),
        sourceObjectPosition:a.objectPosition,localObjectPosition:b.objectPosition,
        sourceTransform:a.transform,localTransform:b.transform,
        sourceInViewport:a.inViewport,localInViewport:b.inViewport,
        sourceClass:a.cls,localClass:b.cls
      };
    }
    reports.comparison.push({delta:source.delta,time:source.elapsed,metrics});
  }
  reports.motionDiscrepancies=reports.comparison.flatMap(p=>
    Object.entries(p.metrics).filter(([_,m])=>m.opacityError>.15).map(([element,m])=>({
      element,delta:p.delta,elapsed:p.time,
      sourceOpacity:m.sourceOpacity,localOpacity:m.localOpacity,error:m.opacityError,
      sourceClass:m.sourceClass,localClass:m.localClass
    }))
  );
  reports.sceneCamera=reports.comparison.map(p=>({
    delta:p.delta,elapsed:p.time,
    yError:p.metrics.scene?.yError??null,xError:p.metrics.scene?.xError??null,
    widthError:p.metrics.scene?.widthError??null,heightError:p.metrics.scene?.heightError??null,
    sourceTransform:p.metrics.scene?.sourceTransform??null,
    localTransform:p.metrics.scene?.localTransform??null
  }));
  // Scene integrity: silently accepting a missing/invalid source or local
  // image would make a 'successful' camera audit misleading.
  const settledClosing=reports.comparison.filter(p=>p.time===2300&&p.delta>=80&&p.delta<=265);
  if(!settledClosing.length)throw Error('No settled camera checkpoints were collected');
  const cameraIssues=[];
  for(const p of settledClosing){
    const a=reports.source.samples.find(s=>s.delta===p.delta&&s.elapsed===p.time);
    const b=reports.local.samples.find(s=>s.delta===p.delta&&s.elapsed===p.time);
    if(a?.style.scene?.naturalWidth!==1080||b?.style.scene?.naturalWidth!==1080){
      cameraIssues.push({delta:p.delta,problem:'Reference scene missing or unexpected naturalWidth'});
    }
    const m=p.metrics.scene;
    if(!m||m.widthError>1||m.heightError>1||m.xError>1){
      cameraIssues.push({delta:p.delta,problem:'Source/local scene dimensions or X crop differ',metrics:m||null});
    }
  }
  reports.cameraGate={settledCheckpoints:settledClosing.length,issues:cameraIssues};
  reports.opacitySummary={
    rawSampleCount:reports.comparison.length,
    mismatchesOver015:reports.motionDiscrepancies.length,
    settledMismatchesOver015:reports.comparison
      .filter(p=>p.time===2300)
      .flatMap(p=>Object.entries(p.metrics)
        .filter(([key,m])=>key!=='scene'&&m.opacityError>.15)
        .map(([key,m])=>({delta:p.delta,element:key,error:m.opacityError})))
  };
  console.log('SECTION10_CAMERA_GATE '+JSON.stringify(reports.cameraGate));
  console.log('SECTION10_OPACITY_SUMMARY '+JSON.stringify(reports.opacitySummary));
  console.log('SECTION10_SCENE_CAMERA '+JSON.stringify(reports.sceneCamera));
  if(cameraIssues.length)throw Error('Section 10 background camera input could not be validated');
  console.log('SECTION10_MOTION_DISCREPANCIES '+JSON.stringify(reports.motionDiscrepancies));
  console.log('SECTION10_MOTION_CHECKPOINTS '+JSON.stringify({
    samples:reports.comparison.length,opacityDifferencesOver015:reports.motionDiscrepancies.length
  }));
}catch(e){
  reports.error=String(e);console.log('SECTION10_MOTION_AUDIT_ERROR '+String(e));process.exitCode=1;
}finally{
  await writeFile(OUT+'/motion.json',JSON.stringify(reports,null,2));
  await browser.close();server.kill('SIGTERM');
}
