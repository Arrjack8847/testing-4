// Read-only investigation of Gallery's shared scenery and floating UI shell.
// No vendor image copies or screenshots are committed.
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const reference='https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en';
const local='http://127.0.0.1:8000/';
const out='section7-shell-evidence';
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const results=[];

function snapshot(){
  const gallery=[...document.querySelectorAll('h1,h2,h3')].find(x=>x.textContent.trim()==='Our Gallery')?.closest('section');
  const fmt=x=>{
    if(!x)return null;
    const c=getComputedStyle(x),r=x.getBoundingClientRect();
    return {tag:x.tagName,id:x.id,cls:String(x.className||'').slice(0,140),
      rect:{x:+r.x.toFixed(1),y:+r.y.toFixed(1),w:+r.width.toFixed(1),h:+r.height.toFixed(1)},
      position:c.position,z:c.zIndex,opacity:c.opacity,visibility:c.visibility,display:c.display,
      overflow:c.overflow,background:c.backgroundColor,
      image:c.backgroundImage.slice(0,200),transform:c.transform,
      mask:c.maskImage,objectFit:c.objectFit,objectPosition:c.objectPosition,
      pointerEvents:c.pointerEvents};
  };
  const tree=x=>{
    const nodes=[];
    for(let i=0;x&&i<9;i++,x=x.parentElement)nodes.push(fmt(x));
    return nodes;
  };
  const backgroundImgs=[...document.querySelectorAll('img')]
    .filter(x=>(x.src||'').includes('scene.webp')||(x.src||'').includes('arch.webp')||
      (x.src||'').includes('peacock.webp')||(x.alt||'').includes('Gallery'));
  const fixed=[...document.querySelectorAll('body *')].filter(x=>{
    const s=getComputedStyle(x);
    return s.position==='fixed'||s.position==='sticky';
  }).slice(0,90).map(fmt);
  const rgbaPoints=[[10,20],[195,20],[10,420],[195,420],[380,420],[195,750]].map(([x,y])=>{
    const el=document.elementFromPoint(Math.min(innerWidth-2,x),Math.min(innerHeight-2,y));
    return {x,y,hit:fmt(el),chain:tree(el).slice(0,5)};
  });
  const galleryImages=[...gallery?.querySelectorAll('img')||[]].map(el=>({
    src:el.currentSrc||el.src,alt:el.alt,natural:[el.naturalWidth,el.naturalHeight],
    chain:tree(el).slice(0,5)}));
  const cover=[...document.querySelectorAll('body *')].filter(x=>{
    const c=String(x.className||'').toLowerCase();
    return (c.includes('frame')||c.includes('ornament')||c.includes('overlay')||
      c.includes('scene')||c.includes('gate')||c.includes('nav')||
      c.includes('shell')||c.includes('float')||c.includes('order')) &&
      !['BODY','HTML'].includes(x.tagName);
  }).slice(0,120).map(fmt);
  return {scrollY,documentHeight:document.documentElement.scrollHeight,
    scene:backgroundImgs.map(x=>({src:x.src,complete:x.complete,natural:[x.naturalWidth,x.naturalHeight],ancestors:tree(x)})),
    gallery:fmt(gallery),galleryImages,fixed,notable:cover,points:rgbaPoints};
}
for(const [site,url] of [['reference',reference],['local',local]]){
  const ctx=await browser.newContext({viewport:{width:390,height:844},
    deviceScaleFactor:1,locale:'en-MY',isMobile:true,hasTouch:true,
    reducedMotion:'reduce'});
  const page=await ctx.newPage();
  const record={site,status:'started',snapshots:[]};
  results.push(record);
  try{
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForTimeout(1250);
    const opener=page.getByRole('button',{name:'Open Invitation'});
    for(let i=0;i<await opener.count();i++){
      if(await opener.nth(i).isVisible()){await opener.nth(i).click({timeout:8000});break;}
    }
    // Let gate, reveal and fixed cinematic shell settle before comparing.
    await page.waitForTimeout(5200);
    const h=page.getByRole('heading',{name:'Our Gallery',exact:true}).first();
    await h.waitFor({state:'attached',timeout:15000});
    const rect=await h.evaluate(el=>{
      const sec=el.closest('section').getBoundingClientRect();
      return {start:sec.y+scrollY,end:sec.bottom+scrollY};
    });
    const stages=[['top',rect.start+140],['middle',rect.start+600],['end',rect.end-360],['reverse',rect.start+280]];
    for(const [stage,y] of stages){
      await page.evaluate(y=>{document.documentElement.style.scrollBehavior='auto';scrollTo({top:Math.max(0,y),behavior:'instant'});},y);
      await page.waitForTimeout(1250);
      const snap=await page.evaluate(snapshot);
      record.snapshots.push({stage,...snap});
      console.log('SECTION7_SHELL '+JSON.stringify({site,stage,
        scrollY:snap.scrollY, gallery:snap.gallery,
        scene:snap.scene.map(x=>({src:x.src,natural:x.natural,ancestors:x.ancestors.slice(0,5)})),
        fixed:snap.fixed.filter(x=>x.rect.w>0&&x.rect.h>0).slice(0,25),
        points:snap.points.map(x=>({x:x.x,y:x.y,hit:x.hit,
           parents:x.chain.slice(1,3).map(y=>({cls:y.cls,id:y.id,position:y.position,z:y.z}))})),
        mediaCount:snap.galleryImages.length}).slice(0,28000));
    }
    record.status='captured';
  }catch(error){record.status='error';record.error=String(error);
    console.log('SECTION7_SHELL_ERROR '+site+' '+record.error);}
  finally{await ctx.close();}
}
await browser.close();
fs.writeFileSync(out+'/shell.json',JSON.stringify(results,null,2));
if(results.some(x=>x.status!=='captured'))process.exitCode=1;
