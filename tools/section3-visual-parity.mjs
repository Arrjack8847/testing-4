import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'artifacts/section3-parity';
await mkdir(base, {recursive:true});

const viewport = {width:390,height:844};
const sourceUrl='https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en';
const localUrl='http://127.0.0.1:8000/';
const checkpointY = [
  {name:'entry',referenceY:2743},
  {name:'groom',referenceY:3165},
  {name:'middle',referenceY:3587},
  {name:'bride',referenceY:4220},
  {name:'exit',referenceY:5134}
];
const browser=await chromium.launch({headless:true});
const results={viewport,sourceUrl,localUrl,checkpoints:[],errors:[]};
const context=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
try{
  for(const [label,url] of [['reference',sourceUrl],['prototype',localUrl]]){
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',err=>errors.push(err.message));
    page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
    try{
      await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
      await page.waitForTimeout(2200);
      const open=page.getByRole('button',{name:'Open Invitation'});
      let clicked=false;
      for(let n=0;n<await open.count();n++){
        if(await open.nth(n).isVisible()){
          await open.nth(n).click({timeout:10000});
          clicked=true;
          break;
        }
      }
      await page.waitForTimeout(1100);
      const geometry=await page.evaluate(()=>{
        const headings=[...document.querySelectorAll('h1,h2,h3')]
          .filter(el=>(el.textContent||'').toLowerCase().includes('the couple'));
        const h=headings[0]||null;
        const element=(document.getElementById('couple'))||h?.closest('section')||null;
        const box=element?.getBoundingClientRect();
        return {
          scrollY, opened:document.querySelector('#invitation')?.dataset.state||null,
          couple:element ? {selector:element.id||element.className,top:box.top+scrollY,
            height:box.height,width:box.width,outerHTML:element.outerHTML.slice(0,350)}:null,
          heading:h ? {text:h.textContent.trim(),rect:(()=>{const r=h.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};})()}:null
        };
      });
      results[label]={opened:clicked,geometry,errors};
      const localStart=geometry.couple?.top;
      for(const stop of checkpointY){
        const y=(label==='prototype' && localStart)
          ? localStart+(stop.referenceY-3294.4) : stop.referenceY;
        await page.evaluate(async y=>{
          document.documentElement.style.scrollBehavior='auto';
          window.scrollTo({top:Math.max(0,Math.round(y)),behavior:'instant'});
          await new Promise(requestAnimationFrame);
          await new Promise(requestAnimationFrame);
        },y);
        await page.waitForTimeout(400);
        const metrics=await page.evaluate(()=>{
          const targets=[...document.querySelectorAll('h1,h2,h3,button,img')]
            .filter(el=>{const t=(el.textContent||'').trim();
              return /the couple/i.test(t)||/Rayyan|Sofea/i.test(t)||
                (el.tagName==='IMG'&&/groom|bride|scene\.webp/.test(el.src));})
            .slice(0,35).map(el=>{
              const b=el.getBoundingClientRect();
              const s=getComputedStyle(el);
              return {tag:el.tagName,cls:typeof el.className==='string'?el.className:'',
                text:(el.textContent||'').trim().slice(0,60),
                src:el.tagName==='IMG'?el.currentSrc:undefined,
                loaded:el.tagName==='IMG'?el.naturalWidth>0:undefined,
                box:{x:+b.x.toFixed(1),y:+b.y.toFixed(1),
                  width:+b.width.toFixed(1),height:+b.height.toFixed(1)},
                position:s.position,z:s.zIndex,opacity:s.opacity,
                transform:s.transform,font:s.fontFamily,
                fontSize:s.fontSize});
            });
          const section=document.getElementById('couple');
          const scene=section?.querySelector('.couple-reference-scene');
          return {
            actualY:scrollY,viewport:[innerWidth,innerHeight], 
            prototype:section?{
              refSceneSource:section.dataset.referenceSceneSource,
              refWebpCount:section.dataset.referenceWebpCount,
              refWebpMissing:section.dataset.referenceWebpMissing,
              camera:section.dataset.referenceCameraOffset,
              sceneComputed:scene?.getBoundingClientRect().toJSON(),
              sceneArt:getComputedStyle(scene,'::before').backgroundImage
            }:null,
            targets
          };
        });
        await page.screenshot({path:`${base}/${label}-${stop.name}.png`,
          animations:'disabled',timeout:20000});
        results.checkpoints.push({label,checkpoint:stop.name,referenceY:stop.referenceY,
          targetY:+y.toFixed(1),metrics});
      }
    }catch(error){
      results.errors.push({site:label,message:String(error)});
    }finally{
      results[label].errors=errors;
      await page.close();
    }
  }
}finally{
  await writeFile(`${base}/measurements.json`,JSON.stringify(results,null,2));
  await browser.close();
}
if(results.errors.length)process.exitCode=1;
