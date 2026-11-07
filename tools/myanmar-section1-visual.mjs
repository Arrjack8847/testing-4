// Section 1-only visual capture; deliberately does not change or submit app data.
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const dir=path.resolve('visual-myanmar');
await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
const results=[];
let failures=0;
for (const [name,width,height] of [['iphone-390',390,844],['small-phone',320,568]]) {
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const errors=[];const requests=[];
 page.on('pageerror',err=>errors.push(err.message));
 page.on('response',res=>{if(res.status()>=400 && res.url().includes('/assets/skins/myanmar-luxury/'))requests.push(res.url())});
 await page.goto('http://127.0.0.1:8000/?skin=myanmar-luxury',{waitUntil:'domcontentloaded'});
 await page.waitForFunction("document.querySelector('#invitation')?.dataset.layers === 'ready'",null,{timeout:25000});
 await page.waitForTimeout(750);
 async function shoot(state) {
   const file=path.join(dir,`${name}-${state}.png`);
   await page.screenshot({path:file,animations:'disabled'});
   const geometry=await page.evaluate(()=>{
      const pos=sel=>{
        const el=document.querySelector(sel);
        if(!el)return null;
        const r=el.getBoundingClientRect(),s=getComputedStyle(el);
        return {x:+r.x.toFixed(1),y:+r.y.toFixed(1),w:+r.width.toFixed(1),h:+r.height.toFixed(1),opacity:s.opacity};
      };
      return {scroll:Math.round(scrollY),data:document.querySelector('#invitation').dataset,
       width:innerWidth, overflow:document.documentElement.scrollWidth-innerWidth,
       pavilion:pos('.depth.palace img'),path:pos('.myanmar-stone-path img'),
       arch:pos('.depth.arch'),name:pos('.cover-copy'),btn:pos('#openButton'),
       openedName:pos('.opened-copy')};
   });
   results.push({name,state,geometry});
 }
 await shoot('cover');
 await page.getByRole('button',{name:'Open Invitation'}).click();
 await page.waitForTimeout(1800);await shoot('opened');
 for(const [label,fract] of [['scroll-045',.45],['scroll-150',1.5],['scroll-215',2.15]]){
   await page.evaluate(f=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo({top:Math.round(innerHeight*f),behavior:'instant'})},fract);
   await page.waitForTimeout(350);await shoot(label);
 }
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(350);await shoot('reverse-cover');
 if(errors.length||requests.length){failures++;results.push({name,errors,requests});}
 await page.close();
}
await browser.close();
await fs.writeFile(path.join(dir,'metrics.json'),JSON.stringify(results,null,2));
console.log('MYANMAR_SECTION1_METRICS='+JSON.stringify(results));
if(failures) process.exitCode=1;
