import {chromium} from '@playwright/test';
import fs from 'node:fs';
const out='section1-motion-evidence';
fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({headless:true});
const context=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
const reference=await context.newPage();
const ours=await context.newPage();
const metrics={viewport:'390x844',reference:'https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en',checkpoints:[]};

async function read(page,kind){
  return page.evaluate(kind=>{
    const visible=(el)=>{
      const b=el.getBoundingClientRect(),s=getComputedStyle(el);
      return b.width>0&&b.height>0&&b.bottom>0&&b.top<innerHeight&&s.visibility!=='hidden'&&s.display!=='none'&&Number(s.opacity)>.025;
    };
    const selectors=kind==='ref'?
      ['.cgv-dio-hero','.cgv-hero','.cgv-hero-content','.cgv-t1','.cgv-t2','.cgv-hero .cgv-nl-n','.cgv-hero img','.cgv-hero [class*="butterfly"]','.cgv-hero [class*="petal"]']:
      ['#viewport','.opened-copy','.opened-copy .eyebrow','.ceremony-names','.name-first','.name-amp','.name-second','.butterfly-hero .butterfly','.butterfly-cover .butterfly','.sprite.hanging','.sprite.front'];
    const found={};
    for(const selector of selectors) {
      const els=[...document.querySelectorAll(selector)].slice(0,35);
      found[selector]={
        count:els.length,visible:els.filter(visible).length,
        samples:els.slice(0,5).map(el=>{
          const s=getComputedStyle(el),r=el.getBoundingClientRect();
          return {text:(el.innerText||'').trim().slice(0,32),y:Math.round(r.y),x:Math.round(r.x),
            w:Math.round(r.width),h:Math.round(r.height),opacity:s.opacity,
            visibility:s.visibility,transform:s.transform,animation:s.animationName,
            animationState:s.animationPlayState,maskPosition:s.maskPosition,
            clipPath:s.clipPath};
        })
      };
    }
    const wing=[...document.querySelectorAll('[class*="butterfly"],[class*="bf-"]')].filter(visible).slice(0,15).map(el=>({
      cls:typeof el.className==='string'?el.className.slice(0,80):'',
      y:Math.round(el.getBoundingClientRect().y),
      animation:getComputedStyle(el).animationName
    }));
    const attrs=kind==='our'?document.querySelector('#invitation')?.dataset:null;
    return {scrollY,selectors:found,butterflyCandidates:wing,
      artworkVisible:document.querySelector('#viewport')?.getBoundingClientRect().top,
      invitationState:attrs?{state:attrs.state,reading:attrs.reading,lettering:attrs.lettering,ambient:attrs.ambient}:null};
  },kind);
}
try {
  await Promise.all([
    reference.goto(metrics.reference,{waitUntil:'domcontentloaded',timeout:60000}),
    ours.goto('http://127.0.0.1:8000',{waitUntil:'domcontentloaded',timeout:30000})
  ]);
  await ours.locator('#invitation[data-layers="ready"]').waitFor({timeout:30000});
  await reference.waitForTimeout(1800);
  const bRef=reference.getByRole('button',{name:'Open Invitation'});
  let opened=false;
  for(let i=0;i<await bRef.count();i++)if(await bRef.nth(i).isVisible()) {
    await bRef.nth(i).click();opened=true;break;
  }
  if(!opened)throw Error('Reference invitation did not expose a visible Open Invitation button');
  await ours.getByRole('button',{name:'Open Invitation'}).click();
  await Promise.all([reference.waitForTimeout(2300),ours.waitForTimeout(2300)]);

  const positions=[0.45,0.75,0.95,1.15,1.35,1.50,1.7,1.9,2.15];
  for(const fraction of positions){
    await Promise.all([reference,ours].map(page=>page.evaluate(f=>{
      document.documentElement.style.scrollBehavior='auto';
      window.scrollTo({top:Math.round(innerHeight*f),behavior:'instant'});
    },fraction)));
    await Promise.all([reference.waitForTimeout(430),ours.waitForTimeout(430)]);
    const [ref,our]=await Promise.all([read(reference,'ref'),read(ours,'our')]);
    metrics.checkpoints.push({fraction,ref,our});
    console.log('MOTION_CHECK '+JSON.stringify({
      f:fraction,
      refTitle:ref.selectors['.cgv-t1'],
      refNames:ref.selectors['.cgv-hero .cgv-nl-n'],
      ourTitle:our.selectors['.opened-copy .eyebrow'],
      ourNames:our.selectors['.name-first'],
      refButterfly:ref.butterflyCandidates.slice(0,4),
      ourButterfly:our.selectors['.butterfly-hero .butterfly'].visible,
      ourFlora:our.selectors['.sprite.hanging'].visible,
      state:our.invitationState
    }));
    if([.45,.95,1.5,1.7,2.15].includes(fraction)){
      const label=String(fraction).replace('.','_');
      await reference.screenshot({path:out+'/reference-'+label+'.png'});
      await ours.screenshot({path:out+'/ours-'+label+'.png'});
    }
    if(fraction===1.5){
      await Promise.all([reference.waitForTimeout(1900),ours.waitForTimeout(1900)]);
      const [refWritten,ourWritten]=await Promise.all([read(reference,'ref'),read(ours,'our')]);
      metrics.writingHold={ref:refWritten,our:ourWritten};
      console.log('WRITING_HOLD '+JSON.stringify({
        ref:refWritten.selectors['.cgv-hero .cgv-nl-n'],
        ours:ourWritten.selectors['.name-first'],
        second:ourWritten.selectors['.name-second']
      }));
      await reference.screenshot({path:out+'/reference-written-1_5.png'});
      await ours.screenshot({path:out+'/ours-written-1_5.png'});
    }
  }
  fs.writeFileSync(out+'/report.json',JSON.stringify(metrics,null,2));
  console.log('MOTION_AUDIT_COMPLETE '+metrics.checkpoints.length);
}catch(e){
  fs.writeFileSync(out+'/report.json',JSON.stringify({...metrics,error:String(e)},null,2));
  console.error('MOTION_AUDIT_FAILED',e);
  process.exitCode=1;
}finally{await b.close();}
