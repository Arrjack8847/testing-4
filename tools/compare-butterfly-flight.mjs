import { chromium } from '@playwright/test';
const browser = await chromium.launch({headless:true});
const pages = [];
try {
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const reference=await context.newPage(), local=await context.newPage();
 pages.push(reference,local);
 // Both are started together for a fair animation timeline.
 await Promise.all([
   reference.goto('https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en',{waitUntil:'domcontentloaded',timeout:60000}),
   local.goto('http://127.0.0.1:8000',{waitUntil:'domcontentloaded',timeout:20000})
 ]);
 await local.locator('#invitation[data-layers="ready"]').waitFor({timeout:30000});
 const sample=async(label,t)=> {
   const inspect=async(page,selector)=>{
    return page.evaluate(sel=>[...document.querySelectorAll(sel)].slice(0,2).map(el=>{
      const r=el.getBoundingClientRect(),s=getComputedStyle(el);
      return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),
       center:[Math.round(r.x+r.width/2),Math.round(r.y+r.height/2)],
       opacity:+Number(s.opacity).toFixed(2),transform:s.transform.slice(0,110),
       animationName:s.animationName,animationDelay:s.animationDelay};
    }),selector);
   };
   const [a,b]=await Promise.all([inspect(reference,'.cgv-dio-bf:not(.cgv-dio-bf-hero) .cgv-bf'),inspect(local,'.butterfly-cover .butterfly')]);
   console.log('FLIGHT_SNAPSHOT '+JSON.stringify({label,t,reference:a,ours:b}));
 };
 const t0=Date.now();
 const targets=[0,800,1600,2200,2800,3400,4000,4600,5200,6000,7000,8000,9500];
 for(const t of targets) {
   const delay=Math.max(0,t-(Date.now()-t0));
   if(delay)await reference.waitForTimeout(delay);
   await sample(t+'ms',t);
 }
}finally{await browser.close();}
