import {chromium} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// Read-only reference-vs-local inspection; provider artwork is NOT committed or republished.
const REFERENCE = 'https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en';
const LOCAL = 'http://127.0.0.1:8000/';
const OUT = 'section2-four-width-evidence';
const PHONES = [
  {name:'small-320',width:320,height:568},
  {name:'android-360',width:360,height:740},
  {name:'iphone-390',width:390,height:844},
  {name:'large-430',width:430,height:932}
];
const POINTS = [2.5,2.75,3,3.25];
fs.mkdirSync(OUT,{recursive:true});

async function openInvitation(page) {
  const buttons=page.getByRole('button',{name:'Open Invitation'});
  for(let i=0;i<await buttons.count();i++) {
    if(await buttons.nth(i).isVisible()) {
      await buttons.nth(i).click({timeout:9000});
      return true;
    }
  }
  return false;
}
async function inspect(page,kind) {
  return page.evaluate(kind=>{
    const round=n=>Math.round(n*10)/10;
    const box=el=>{
      if(!el)return null;
      const b=el.getBoundingClientRect();
      return {x:round(b.x),y:round(b.y),width:round(b.width),
        height:round(b.height),bottom:round(b.bottom)};
    };
    const style=el=>{
      if(!el)return null;
      const s=getComputedStyle(el);
      return {font:s.fontFamily,fontSize:s.fontSize,lineHeight:s.lineHeight,
        color:s.color,letterSpacing:s.letterSpacing,opacity:s.opacity,
        backgroundColor:s.backgroundColor,backgroundImage:s.backgroundImage.slice(0,220)};
    };
    const visible=el=>{
      const b=el.getBoundingClientRect(),s=getComputedStyle(el);
      return b.height>5&&b.width>5&&b.bottom>0&&b.top<innerHeight&&
        s.display!=='none'&&s.visibility!=='hidden';
    };
    const selectText=regex=>[...document.querySelectorAll('p,blockquote,span,h1,h2,h3,h4')]
      .filter(el=>visible(el)&&regex.test((el.innerText||'').trim())&&
        (el.innerText||'').trim().length<500)
      .slice(0,7).map(el=>({tag:el.tagName,
        className:typeof el.className==='string'?el.className.slice(0,75):'',
        text:(el.innerText||'').trim().slice(0,160),box:box(el),style:style(el)}));
    const common={scrollY:round(scrollY),viewport:[innerWidth,innerHeight],
      overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),
      documentHeight:round(document.documentElement.scrollHeight)};
    if(kind==='local') {
      const msg=document.querySelector('#message'),frame=msg?.querySelector('.letter-frame');
      return {...common,message:box(msg),frame:box(frame),
        messageStyle:style(msg),lead:box(msg?.querySelector('.letter-lead')),
        leadStyle:style(msg?.querySelector('.letter-lead')),
        quote:box(msg?.querySelector('.letter-quote')),
        source:box(msg?.querySelector('.letter-source')),
        bismillah:box(msg?.querySelector('.letter-bismillah')),
        scene:box(document.querySelector('#viewport')),
        petalState:msg?.dataset.petalsActive||null};
    }
    const bandMatches=[...document.querySelectorAll('body *')].filter(el=>{
      if(!visible(el))return false;
      const s=getComputedStyle(el),b=el.getBoundingClientRect();
      return s.backgroundImage.includes('band.webp')||
        (s.backgroundColor!=='rgba(0, 0, 0, 0)'&&b.width>=innerWidth*.7&&b.height>=350);
    }).slice(0,15).map(el=>({
      tag:el.tagName,className:typeof el.className==='string'?el.className.slice(0,80):'',
      box:box(el),background:style(el)
    }));
    const bordered=[...document.querySelectorAll('body *')].filter(el=>{
      if(!visible(el))return false;
      const s=getComputedStyle(el),b=el.getBoundingClientRect();
      return parseFloat(s.borderTopWidth)>0&&s.borderTopStyle!=='none'&&
        b.width>240&&b.width<innerWidth;
    }).slice(0,12).map(el=>({
      tag:el.tagName,className:typeof el.className==='string'?el.className.slice(0,80):'',box:box(el)
    }));
    return {...common,bandMatches,bordered,
      leadCandidates:selectText(/With grateful hearts|pleasure of your company|celebrat/i),
      sourceCandidates:selectText(/Ar.Rum|Ar Rum|Surah/i)};
  },kind);
}

const browser=await chromium.launch({headless:true});
const report={reference:REFERENCE,local:LOCAL,capturedAt:new Date().toISOString(),
  note:'Reference screenshots are for development analysis only, not for artwork redistribution.',
  phones:[]};
let failures=0;
for(const phone of PHONES) {
  console.log('AUDIT_PHONE_START',phone.name);
  const context=await browser.newContext({
    viewport:{width:phone.width,height:phone.height},deviceScaleFactor:1,
    isMobile:true,hasTouch:true,reducedMotion:'no-preference'
  });
  const ref=await context.newPage(),local=await context.newPage();
  const current={phone,opened:{reference:false,local:false},checkpoints:[],issues:[]};
  report.phones.push(current);
  try {
    const [r,l]=await Promise.all([
      ref.goto(REFERENCE,{waitUntil:'domcontentloaded',timeout:65000}),
      local.goto(LOCAL,{waitUntil:'domcontentloaded',timeout:15000})
    ]);
    current.http={reference:r?.status(),local:l?.status()};
    await Promise.all([
      ref.waitForTimeout(2000),
      local.locator('#invitation[data-layers="ready"]').waitFor({timeout:35000})
    ]);
    current.opened.reference=await openInvitation(ref);
    current.opened.local=await openInvitation(local);
    if(!current.opened.reference||!current.opened.local)
      throw new Error('Reference or local Open Invitation button missing');
    await Promise.all([ref.waitForTimeout(2800),local.waitForTimeout(2800)]);
    for(const fraction of POINTS) {
      const target=Math.round(phone.height*fraction);
      await Promise.all([ref,local].map(page=>page.evaluate(y=>{
        document.documentElement.style.scrollBehavior='auto';
        window.scrollTo({top:y,behavior:'instant'});
      },target)));
      // Let time-triggered text reveals settle before a geometry comparison.
      await Promise.all([ref.waitForTimeout(1200),local.waitForTimeout(1200)]);
      const [reference,implementation]=await Promise.all([
        inspect(ref,'reference'),inspect(local,'local')
      ]);
      const tag=fraction.toFixed(2).replace('.','_')+'H';
      const refPath=path.join(OUT,phone.name+'-reference-'+tag+'.png');
      const localPath=path.join(OUT,phone.name+'-local-'+tag+'.png');
      await Promise.all([
        ref.screenshot({path:refPath,animations:'disabled'}),
        local.screenshot({path:localPath,animations:'disabled'})
      ]);
      current.checkpoints.push({
        fraction,targetScroll:target,reference,implementation,images:[refPath,localPath]
      });
      // Compare LIVE movement separately from frozen geometry.
      // A static diff cannot assess drifting petals or reference timing.
      if (phone.width===390 && fraction===3) {
        const motion={fpsCheckpoint:'3H',frames:[],petalTransforms:[]};
        const transforms=()=>local.locator('#message .letter-petal').evaluateAll(nodes=>
          nodes.map(node=>getComputedStyle(node).transform));
        for(const moment of ['start','after-900ms']) {
          const first=path.join(OUT,phone.name+'-reference-motion-'+moment+'.png');
          const second=path.join(OUT,phone.name+'-local-motion-'+moment+'.png');
          motion.petalTransforms.push(await transforms());
          await Promise.all([
            ref.screenshot({path:first,animations:'allow'}),
            local.screenshot({path:second,animations:'allow'})
          ]);
          motion.frames.push(first,second);
          if(moment==='start')
            await Promise.all([ref.waitForTimeout(900),local.waitForTimeout(900)]);
        }
        motion.changed=motion.petalTransforms[0].some((t,i)=>t!==motion.petalTransforms[1][i]);
        motion.active=(await local.locator('#message').getAttribute('data-petals-active'))==='true';
        current.motion=motion;
        if(!motion.active || !motion.changed)
          current.issues.push('Live petal animation inactive or static at 390px/3H');
        console.log('AUDIT_PETAL_MOTION',JSON.stringify({
          active:motion.active,changed:motion.changed,samples:motion.petalTransforms.length
        }));
      }
      console.log('AUDIT_CHECKPOINT',JSON.stringify({
        width:phone.width,fraction,target,refY:reference.scrollY,
        localY:implementation.scrollY,localFrame:implementation.frame,
        localMessage:implementation.message,localOverflow:implementation.overflow,
        referenceBands:reference.bandMatches.map(x=>x.box).slice(0,3)
      }));
      if(Math.abs(reference.scrollY-target)>3||Math.abs(implementation.scrollY-target)>3)
        current.issues.push('Scroll checkpoint '+tag+' clamped or missed');
      if(implementation.overflow>1)
        current.issues.push('Horizontal overflow at '+tag);
    }
  } catch(error) {
    failures++;
    current.error=String(error);
    console.error('AUDIT_PHONE_ERROR',phone.name,String(error));
  } finally {
    await context.close();
    fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
  }
}
await browser.close();
let md='# Four-width Section 2 reference audit\n\n';
md+='Reference screenshots are for development review only. Exact visual matching is not certified.\n\n';
md+='| Phone | Reference opened | Local opened | Captures | Issues |\n|---|---|---|---|---|\n';
for(const p of report.phones) {
  md+='| '+p.phone.name+' | '+p.opened.reference+' | '+p.opened.local+
    ' | '+p.checkpoints.length+'/4 | '+(p.error||p.issues.join('; ')||'None detected')+' |\n';
}
md+='\nEach capture uses the same CSS viewport and 2.5H, 2.75H, 3H, 3.25H scroll target.\n';
fs.writeFileSync(path.join(OUT,'SUMMARY.md'),md);
console.log('AUDIT_COMPLETE',JSON.stringify({
  phones:report.phones.length,
  captures:report.phones.reduce((n,p)=>n+p.checkpoints.length*2,0),
  failures
}));
if(failures)process.exitCode=1;
