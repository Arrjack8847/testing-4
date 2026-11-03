import { chromium } from '@playwright/test';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
const out='section5-geometry-evidence';
fs.mkdirSync(out,{recursive:true});
const server=spawn('python3',['-m','http.server','8000','--bind','127.0.0.1'],{stdio:'ignore'});
await new Promise(resolve=>setTimeout(resolve,1000));
const browser=await chromium.launch({headless:true});
const pages=[
 {id:'reference',url:'https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en',sel:'.cgv-timeline'},
 {id:'original',url:'http://127.0.0.1:8000',sel:'#runningOrder'},
 {id:'art-preview',url:'http://127.0.0.1:8000/?orderReference=1',sel:'#runningOrder'}
];
const report={checkedAt:new Date().toISOString(),viewport:{width:390,height:844},pages:[]};
try {
  for(const spec of pages){
    const context=await browser.newContext({viewport:report.viewport,isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});
    const page=await context.newPage();
    const part={id:spec.id,status:'error'};
    report.pages.push(part);
    try {
      const res=await page.goto(spec.url,{waitUntil:'domcontentloaded',timeout:60000});
      part.http=res?.status();
      await page.waitForTimeout(2000);
      const button=page.getByRole('button',{name:'Open Invitation'});
      for(let n=0;n<await button.count();n++){if(await button.nth(n).isVisible()){await button.nth(n).click();break;}}
      await page.waitForTimeout(1300);
      await page.locator(spec.sel).first().evaluate(el=>{document.documentElement.style.scrollBehavior='auto';el.scrollIntoView({block:'start',behavior:'instant'});});
      await page.waitForTimeout(1250);
      part.stats=await page.evaluate(({sel,id})=>{
        const main=document.querySelector(sel);
        if(!main)return {error:'Section element missing'};
        const box=el=>{if(!el)return null;const r=el.getBoundingClientRect();return {x:+r.x.toFixed(2),y:+r.y.toFixed(2),w:+r.width.toFixed(2),h:+r.height.toFixed(2)}};
        const relative=el=>{const r=box(el);const m=box(main);return r?{x:+(r.x-m.x).toFixed(2),y:+(r.y-m.y).toFixed(2),w:r.w,h:r.h}:null};
        const style=el=>{
          if(!el)return null;
          const s=getComputedStyle(el);
          return {font:s.fontFamily,size:s.fontSize,weight:s.fontWeight,lineHeight:s.lineHeight,letterSpacing:s.letterSpacing,color:s.color,
          opacity:s.opacity,transform:s.transform,display:s.display,padding:s.padding,margin:s.margin,border:s.border,
          background:s.backgroundImage.slice(0,300),backgroundColor:s.backgroundColor};
        };
        const node=el=>el?{tag:el.tagName,cl:typeof el.className==='string'?el.className:'',text:(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,95),relative:relative(el),style:style(el)}:null;
        const textNode=t=>[...main.querySelectorAll('h1,h2,h3,h4,p,span,strong,small,time,li,div')]
          .find(el=>el.children.length<4&&(el.textContent||'').trim().replace(/\s+/g,' ')===t);
        const heading=textNode('Order of the Day');
        const eyebrow=textNode('Running order')||textNode('RUNNING ORDER');
        const referenceRows=[...main.querySelectorAll('.cgv-tl-row')];
        const localRows=[...main.querySelectorAll('.order-entry')];
        const rows=(id==='reference'?referenceRows:localRows).map(el=>({
          container:node(el),
          descendants:[...el.querySelectorAll('*')].filter(e=>e.children.length<=1).slice(0,12).map(node)
        }));
        const inner=[...main.children].map(node).filter(x=>x&&x.relative&&x.relative.w>100&&x.relative.h>10);
        const framed=[...main.querySelectorAll('*')].filter(el=>{
          const s=getComputedStyle(el);
          return (parseFloat(s.borderTopWidth)>0||parseFloat(s.borderBottomWidth)>0)
            && el.getBoundingClientRect().width>250;
        }).slice(0,10).map(node);
        const pseudo=['::before','::after'].map(p=>{
          const s=getComputedStyle(main,p);return {pseudo:p,content:s.content,border:s.border,background:s.backgroundImage,
          opacity:s.opacity,inset:s.inset,position:s.position};
        });
        return {section:node(main),sectionDocumentY:Math.round(box(main).y+scrollY),heading:node(heading),eyebrow:node(eyebrow),
          rows,framed,inner,pseudo,bodyOverflow:document.documentElement.scrollWidth-innerWidth,
          artAssetStatus:main.dataset?.bandStatus||null};
      },{sel:spec.sel,id:spec.id});
      await page.locator(spec.sel).screenshot({path:out+'/'+spec.id+'-section-390.png',animations:'disabled'});
      part.status='captured';
      console.log('SECTION5_GEOMETRY '+JSON.stringify({id:spec.id,http:part.http,stats:part.stats}));
    }catch(err){part.error=String(err);console.error('SECTION5_GEOMETRY_ERROR',spec.id,String(err));}
    await context.close();
  }
  const [ref,loc]=report.pages;
  if(ref?.stats?.heading && loc?.stats?.heading){
    const comparison={};
    for(const key of ['heading','eyebrow']){
      const a=ref.stats[key]?.relative,b=loc.stats[key]?.relative;
      if(a&&b)comparison[key]={dx:+(b.x-a.x).toFixed(2),dy:+(b.y-a.y).toFixed(2),dw:+(b.w-a.w).toFixed(2),dh:+(b.h-a.h).toFixed(2)};
    }
    comparison.rows=(ref.stats.rows||[]).map((row,i)=>{
      const a=row.container.relative,b=loc.stats.rows[i]?.container.relative;
      return a&&b?{n:i+1,dy:+(b.y-a.y).toFixed(2),dh:+(b.h-a.h).toFixed(2),dx:+(b.x-a.x).toFixed(2)}:null;
    });
    comparison.sectionHeightDelta=+(loc.stats.section.relative.h-ref.stats.section.relative.h).toFixed(2);
    report.comparison=comparison;
    console.log('SECTION5_GEOMETRY_DIFF '+JSON.stringify(comparison));
  }
  fs.writeFileSync(out+'/measurements.json',JSON.stringify(report,null,2));
  if(report.pages.some(p=>p.status!=='captured'))process.exitCode=1;
}finally{await browser.close();server.kill('SIGTERM');}
