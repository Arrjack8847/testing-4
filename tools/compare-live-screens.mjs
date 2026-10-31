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
  }
  console.log('Reference interaction succeeded:',launched);
  console.log('Reference viewport',JSON.stringify(viewport));
}finally{await browser.close();}
