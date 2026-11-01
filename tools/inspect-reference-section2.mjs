import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'reference-section2-evidence';
fs.mkdirSync(OUT, {recursive:true});
const url='https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en';
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'no-preference'});
const page=await ctx.newPage();
const report={reference:url,viewport:{width:390,height:844},opened:false,checkpoints:[]};
try {
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForTimeout(1800);
  report.status=response?.status()??null;
  report.initial=await page.evaluate(()=>({
    title:document.title,scrollHeight:document.documentElement.scrollHeight,viewport:innerHeight,
    candidateSections:[...document.querySelectorAll('section,article,[class*="intro"],[class*="invite"],[class*="couple"]')].slice(0,65).map(el=>({
      tag:el.tagName,cls:typeof el.className==='string'?el.className.slice(0,130):'',
      top:Math.round(el.getBoundingClientRect().top+scrollY),
      height:Math.round(el.getBoundingClientRect().height),
      text:(el.innerText||'').trim().replace(/\\s+/g,' ').slice(0,100)
    }))
  }));
  await page.screenshot({path:path.join(OUT,'00-cover.png')});
  const btn=page.getByRole('button',{name:'Open Invitation'});
  for(let i=0;i<await btn.count();i++){
    if(await btn.nth(i).isVisible()){
      await btn.nth(i).click({timeout:7000});
      report.opened=true;
      break;
    }
  }
  if(!report.opened) throw new Error('No visible Open Invitation button');
  await page.waitForTimeout(2700);
  const sizes=await page.evaluate(()=>({
    maxScroll:Math.max(0,document.documentElement.scrollHeight-innerHeight),
    height:document.documentElement.scrollHeight,
    viewport:innerHeight
  }));
  report.afterOpen=sizes;
  const checkpoints=[0,1.25,2,2.75,3.25,3.75,4.25,4.75,5.25,5.75,6.25,6.75,7.25,8,9,10,12];
  const visited=new Set();
  for(const fraction of checkpoints){
    const target=Math.min(Math.round(sizes.maxScroll),Math.round(fraction*sizes.viewport));
    if(visited.has(target))continue;
    visited.add(target);
    await page.evaluate(y=>{
      document.documentElement.style.scrollBehavior='auto';
      window.scrollTo({top:y,behavior:'instant'});
    },target);
    await page.waitForTimeout(720);
    const state=await page.evaluate(()=>{
      const rect=el=>{
        const b=el.getBoundingClientRect();
        return {x:+b.x.toFixed(1),y:+b.y.toFixed(1),w:+b.width.toFixed(1),h:+b.height.toFixed(1)};
      };
      const visible=el=>{
        const b=el.getBoundingClientRect(),s=getComputedStyle(el);
        return b.width>8&&b.height>8&&b.bottom>0&&b.top<innerHeight&&s.visibility!=='hidden'&&s.display!=='none'&&Number(s.opacity)>.07;
      };
      const leafText=[...document.querySelectorAll('h1,h2,h3,h4,p,button,a,span,blockquote')]
        .filter(el=>{
          if(!visible(el))return false;
          const t=(el.innerText||'').trim();
          return t.length>2&&t.length<250&&[...el.children].every(c=>!(/H[1-6]|P|BUTTON|SPAN|A|BLOCKQUOTE/).test(c.tagName));
        }).slice(0,60).map(el=>{
          const s=getComputedStyle(el);
          return {tag:el.tagName,cls:typeof el.className==='string'?el.className.slice(0,65):'',
            text:(el.innerText||'').trim().slice(0,140),box:rect(el),
            font:s.fontFamily,size:s.fontSize,weight:s.fontWeight,
            color:s.color,spacing:s.letterSpacing,align:s.textAlign,
            transform:s.transform,animation:s.animationName,duration:s.animationDuration};
        });
      const visibleElements=[...document.querySelectorAll('section,article,[class*="cgv-"],[class*="scene"],[class*="panel"],[class*="card"]')]
        .filter(el=>visible(el)&&el.getBoundingClientRect().width>180&&el.getBoundingClientRect().height>150)
        .slice(0,45).map(el=>{
          const s=getComputedStyle(el);
          return {tag:el.tagName,cls:typeof el.className==='string'?el.className.slice(0,105):'',
            box:rect(el),position:s.position,background:s.backgroundImage.slice(0,180),
            radius:s.borderRadius,opacity:s.opacity,transform:s.transform,
            animation:s.animationName,duration:s.animationDuration};
        });
      const visibleImages=[...document.images].filter(el=>visible(el)).slice(0,24).map(el=>({
        filename:(el.currentSrc||el.src||'').split('/').pop().split('?')[0],
        cls:el.className,box:rect(el),natural:[el.naturalWidth,el.naturalHeight],
        opacity:getComputedStyle(el).opacity}));
      return {scrollY,scrollHeight:document.documentElement.scrollHeight,
        leafText,visibleElements,visibleImages};
    });
    report.checkpoints.push({fraction,target,...state});
    const label=String(fraction).replace('.','_').padStart(5,'0');
    await page.screenshot({path:path.join(OUT,'scroll-'+label+'.png'),animations:'disabled'});
    console.log('SECTION2_SCAN '+JSON.stringify({
      fraction,scrollY:state.scrollY,text:state.leafText.map(x=>x.text),
      visualClasses:state.visibleElements.slice(0,13).map(x=>x.cls),
      imageNames:state.visibleImages.slice(0,8).map(x=>x.filename)
    }));
    if(target>=sizes.maxScroll)break;
  }
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
  console.log('REFERENCE_SECTION2_REPORT '+JSON.stringify({
    opened:report.opened,status:report.status,afterOpen:report.afterOpen,
    sections:report.initial.candidateSections.slice(0,25),
    checkpoints:report.checkpoints.length
  }));
} catch(error) {
  report.error=String(error);
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
  console.error('SECTION2_AUDIT_ERROR',error);
  process.exitCode=1;
} finally {
  await browser.close();
}
