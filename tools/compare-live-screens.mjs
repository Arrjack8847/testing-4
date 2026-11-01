import { chromium } from '@playwright/test';
import fs from 'node:fs';
fs.mkdirSync('visual-evidence', {recursive:true});
const viewport={width:390,height:844};
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:true,hasTouch:true});
const ref=await ctx.newPage();
const local=await ctx.newPage();
let launched=false;
try{
  await Promise.all([
    ref.goto('https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en',{waitUntil:'domcontentloaded',timeout:50000}),
    local.goto('http://127.0.0.1:8000',{waitUntil:'domcontentloaded',timeout:15000})
  ]);
  await Promise.all([ref.waitForTimeout(2800),local.locator('#invitation[data-layers="ready"]').waitFor({timeout:25000})]);
  // Capture the reference and implementation in the same mobile viewport.
  await ref.screenshot({path:'visual-evidence/reference-closed.png'});
  await local.screenshot({path:'visual-evidence/ours-closed.png'});
  const liveButtons=ref.getByRole('button',{name:'Open Invitation'});
  for(let i=0;i<await liveButtons.count();i++){
    if(await liveButtons.nth(i).isVisible()){
      await liveButtons.nth(i).click();launched=true;break;
    }
  }
  await local.getByRole('button',{name:'Open Invitation'}).click();
  if(launched){
    await Promise.all([ref.waitForTimeout(2600),local.waitForTimeout(2600)]);
    await ref.screenshot({path:'visual-evidence/reference-opened.png'});
    await local.screenshot({path:'visual-evidence/ours-opened.png'});
    // Compare a genuine mid-swipe state, not only the instant after opening.
    await Promise.all([ref,local].map(p=>p.evaluate(()=>{
      document.documentElement.style.scrollBehavior='auto';
      scrollTo({top:Math.round(innerHeight*.45),behavior:'instant'});
    })));
    await Promise.all([ref.waitForTimeout(1100),local.waitForTimeout(1100)]);
    await ref.screenshot({path:'visual-evidence/reference-scrolled.png'});
    await local.screenshot({path:'visual-evidence/ours-scrolled.png'});
    for (const [label,p] of [['reference',ref],['ours',local]]) {
      const v=await p.evaluate(()=>({
        scrollY:window.scrollY,
        heroY:(document.querySelector('#viewport')||document.querySelector('.cgv-dio-hero'))?.getBoundingClientRect().y,
        reading:document.querySelector('#invitation')?.dataset.reading||null,
        titleOpacity:document.querySelector('.opened-copy')?getComputedStyle(document.querySelector('.opened-copy')).opacity:null
      }));
      console.log('SCROLLED_STATE',label,JSON.stringify(v));
    }
  }
  console.log('Reference interaction succeeded:',launched);
  console.log('Reference viewport',JSON.stringify(viewport));
}finally{await browser.close();}
