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
    // The live opening returns to its floral arch near 1.5 viewport scrolls.
    // This additional checkpoint tests whether we reconstruct the same frame.
    await Promise.all([ref,local].map(p=>p.evaluate(()=>{
      scrollTo({top:Math.round(innerHeight*1.5),behavior:'instant'});
    })));
    await Promise.all([ref.waitForTimeout(1000),local.waitForTimeout(1000)]);
    await ref.screenshot({path:'visual-evidence/reference-restored.png'});
    await local.screenshot({path:'visual-evidence/ours-restored.png'});
    // The vendor animates actual name visibility on a timeline after reaching
    // the ceremonial frame. Compare completed lettering after standing still.
    await Promise.all([ref.waitForTimeout(2300),local.waitForTimeout(2300)]);
    await ref.screenshot({path:'visual-evidence/reference-written.png'});
    await local.screenshot({path:'visual-evidence/ours-written.png'});
    const referenceWriting=await ref.evaluate(()=>[...document.querySelectorAll('.cgv-hero .cgv-nl-n')]
      .filter(el=>el.getBoundingClientRect().width>50 && el.getBoundingClientRect().y<window.innerHeight)
      .slice(0,2).map(el=>({text:el.textContent,mask:getComputedStyle(el).maskPosition,opacity:getComputedStyle(el).opacity})));
    const ourWriting=await local.evaluate(()=>[...document.querySelectorAll('.ceremony-names .name-line')]
      .map(el=>({text:el.textContent,mask:getComputedStyle(el).maskPosition,opacity:getComputedStyle(el).opacity})));
    console.log('WRITING_COMPARISON',JSON.stringify({referenceWriting,ourWriting}));
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
