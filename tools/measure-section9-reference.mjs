// Section 9 read-only research. Executes in ephemeral GitHub Actions Chromium.
// No vendor assets are downloaded to, or committed in, the repository.
import {chromium} from '@playwright/test';
import fs from 'node:fs';
const OUT='section9-evidence';
fs.mkdirSync(OUT,{recursive:true});
const url='https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const evidence={reference:url,viewport:{width:390,height:844},checkedAt:new Date().toISOString(),errors:[],samples:[]};
const context=await browser.newContext({viewport:evidence.viewport,deviceScaleFactor:1,isMobile:true,hasTouch:true,locale:'en-MY',reducedMotion:'no-preference'});
const page=await context.newPage();
page.on('pageerror',e=>evidence.errors.push(e.message));
const wait=t=>page.waitForTimeout(t);
const snap=async(name)=>page.screenshot({path:OUT+'/'+name+'.png',animations:'allow',timeout:15000});
try{
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:65000});
  evidence.status=response?.status();
  await page.evaluate(()=>document.fonts.ready);
  await wait(1700);
  const open=page.getByRole('button',{name:'Open Invitation'});
  if(await open.count() && await open.first().isVisible()){
    await open.first().click({timeout:10000});
    evidence.opened=true;
    await wait(1000);
  }
  const headings=page.getByRole('heading',{name:/RSVP\s*&\s*Wishes/i});
  if(!await headings.count())throw new Error('RSVP & Wishes heading not found');
  evidence.headingCount=await headings.count();
  const h=headings.first();
  const geom=await h.evaluate(el=>{
    const r=el.getBoundingClientRect();
    return {top:r.top+scrollY,height:r.height,tag:el.tagName,html:el.outerHTML.slice(0,500)};
  });
  evidence.heading=geom;
  const info=await h.evaluate(el=>{
    const nodePath=n=>{
      if(!n)return '';
      let a=[];for(let t=n,i=0;t&&i<7;t=t.parentElement,i++)
        a.push(t.tagName.toLowerCase()+(t.id?'#'+t.id:'')+(t.className&&typeof t.className==='string'?'.'+t.className.trim().split(/\s+/).slice(0,2).join('.'):''));
      return a.join(' < ');
    };
    const nearby=[...document.querySelectorAll('section')].map(s=>({id:s.id,classes:s.className,headings:[...s.querySelectorAll('h2,h3')].map(x=>x.textContent.trim().slice(0,80)),rect:s.getBoundingClientRect().height})).filter(s=>s.headings.some(t=>/Wedding Gift|RSVP|Until we meet|Wishes/.test(t)));
    const parent=el.closest('section')||el.parentElement?.parentElement;
    return {headingPath:nodePath(el),sectionPath:nodePath(parent),nearby,sectionHTML:parent?.outerHTML.slice(0,20000)};
  });
  evidence.structure=info;
  // Observe the section from entrance, center, exit at multiple animation ages.
  const motion=async(label,scrollOffset)=>{
    const target=Math.max(0,Math.floor(geom.top+scrollOffset));
    await page.evaluate(y=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo({top:y,behavior:'instant'});},target);
    await wait(100);
    const start=Date.now();
    for (const delay of [0,1000,3000,5000]){
      const elapsed=Date.now()-start;
      if(delay>elapsed)await wait(delay-elapsed);
      const sample=await page.evaluate(()=>{
        const heading=[...document.querySelectorAll('h1,h2,h3,h4')].find(el=>/^\s*RSVP\s*&\s*Wishes\s*$/i.test((el.textContent||'').trim()));
        const root=heading?.closest('section')||heading?.parentElement?.parentElement;
        const f=el=>{
          if(!el)return null;
          const c=getComputedStyle(el),r=el.getBoundingClientRect();
          return {tag:el.tagName,id:el.id,className:typeof el.className==='string'?el.className.slice(0,120):'',text:(el.innerText||'').trim().slice(0,85),
            rect:{x:+r.x.toFixed(1),y:+r.y.toFixed(1),w:+r.width.toFixed(1),h:+r.height.toFixed(1)},
            font:c.fontFamily,fontSize:c.fontSize,fontWeight:c.fontWeight,lineHeight:c.lineHeight,letterSpacing:c.letterSpacing,
            color:c.color,bg:c.backgroundColor,bgImage:c.backgroundImage.slice(0,400),border:c.border,borderRadius:c.borderRadius,
            padding:c.padding,margin:c.margin,opacity:c.opacity,transform:c.transform,position:c.position,
            animation:c.animationName,duration:c.animationDuration,transition:c.transitionDuration};
        };
        const leaves=[...root?.querySelectorAll('*')||[]].filter(el=>el.children.length===0 && (el.textContent||'').trim().length>0);
        const select=(re)=>leaves.find(el=>re.test((el.textContent||'').trim()));
        const images=[...root?.querySelectorAll('img,svg,canvas')||[]].map(el=>({...f(el),src:el.currentSrc||el.src||'',natural:el.tagName==='IMG'?[el.naturalWidth,el.naturalHeight]:null}));
        const sampleElements=['input','select','textarea','button','form'].map(s=>({selector:s,items:[...root?.querySelectorAll(s)||[]].slice(0,8).map(f)}));
        const sectionNodes=[...document.querySelectorAll('section')];
        const idx=sectionNodes.indexOf(root);
        return {scrollY:+scrollY.toFixed(1),viewport:[innerWidth,innerHeight],overflow:document.documentElement.scrollWidth-innerWidth,
          heading:f(heading),section:f(root),parent:f(root?.parentElement),previous:f(sectionNodes[idx-1]),next:f(sectionNodes[idx+1]),
          deadline:f(select(/Kindly respond by/i)),formTitle:f(select(/RSVP\s*&\s*Wishes/i)),nameLabel:f(select(/Your name/i)),
          attendanceLabel:f(select(/^Attendance$/i)),guestsLabel:f(select(/^Guests$/i)),wishLabel:f(select(/Your wish for the couple/i)),
          firstWish:f(select(/So proud of you both/i)),wishesNote:f(select(/Wishes appear on the wall/i)),
          images,formElements:sampleElements,
          animated:[...root?.querySelectorAll('*')||[]].map(el=>({e:el,c:getComputedStyle(el)})).filter(x=>x.c.animationName!=='none').slice(0,30).map(({e,c})=>({tag:e.tagName,className:typeof e.className==='string'?e.className.slice(0,70):'',animation:c.animationName,duration:c.animationDuration,transform:c.transform})),
          htmlHead:(root?.innerText||'').slice(0,1800)};
      });
      evidence.samples.push({checkpoint:label,tSeconds:delay/1000,metrics:sample});
      console.log('S9_SAMPLE '+JSON.stringify({checkpoint:label,t:delay/1000,scroll:sample.scrollY,heading:sample.heading,section:sample.section,previous:sample.previous,next:sample.next,deadline:sample.deadline,name:sample.nameLabel,attendance:sample.attendanceLabel,guests:sample.guestsLabel,wish:sample.wishLabel,imgs:sample.images.map(i=>({src:i.src,rect:i.rect})),animated:sample.animated,overflow:sample.overflow}));
      await snap('reference-'+label+'-'+delay);
    }
  };
  await motion('entry',-450);
  await motion('middle',250);
  await motion('exit',1100);
} catch(e){evidence.failure=String(e);console.error('S9_ERROR '+String(e));process.exitCode=1}
finally {
  fs.writeFileSync(OUT+'/reference-measurements.json',JSON.stringify(evidence,null,2));
  console.log('S9_STRUCTURE '+JSON.stringify({reference:evidence.reference,heading:evidence.heading,structure:evidence.structure?{headingPath:evidence.structure.headingPath,sectionPath:evidence.structure.sectionPath,nearby:evidence.structure.nearby,sectionHTML:evidence.structure.sectionHTML}:null}).slice(0,22000));
  await browser.close();
}