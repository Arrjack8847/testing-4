import { chromium } from '@playwright/test';
import fs from 'node:fs';
fs.mkdirSync('scroll-evidence',{recursive:true});
const b=await chromium.launch({headless:true});
try {
 const page=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 await page.goto('https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForTimeout(1500);
 const btn=page.getByRole('button',{name:'Open Invitation'});
 for(let n=0;n<await btn.count();n++)if(await btn.nth(n).isVisible()){await btn.nth(n).click();break;}
 await page.waitForTimeout(2400);
 const fractions=[1.5,1.7,1.9,2.15,2.5,2.9];
 for(const frac of fractions){
   await page.evaluate(frac=>{
     document.documentElement.style.scrollBehavior='auto';
     window.scrollTo({top:Math.round(innerHeight*frac),behavior:'instant'});
   },frac);
   await page.waitForTimeout(400);
   const data=await page.evaluate(()=>{
     const select=['.cgv-dio-hero','.dio-hint','.cgv-hero-content','.cgv-t1','.cgv-t2','.cgv-hero',
       '.cgv-intro','.cgv-couple','.cgv-hero .cgv-t2','.cgv-dio-cv','.cgv-invite'];
     const results=[];
     for(const sel of select){
       for(const el of [...document.querySelectorAll(sel)].slice(0,2)){
         const rect=el.getBoundingClientRect(),st=getComputedStyle(el);
         results.push({selector:sel,cls:String(el.className).slice(0,80),y:Math.round(rect.y),w:Math.round(rect.width),h:Math.round(rect.height),opacity:st.opacity,vis:st.visibility,display:st.display,text:(el.textContent||'').trim().slice(0,50)})
       }
     }
     return {scroll:scrollY,viewport:[innerWidth,innerHeight],results};
   });
   console.log('REFERENCE_SCROLL_VISIBILITY '+JSON.stringify({fraction:frac,...data}));
   await page.screenshot({path:'scroll-evidence/ref-'+String(frac).replace('.','_')+'.png'});
 }
} finally {await b.close();}
