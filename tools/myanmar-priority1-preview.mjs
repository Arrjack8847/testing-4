import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const prefix=process.argv[2]||'baseline';
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
await fs.mkdir('candidate-screens',{recursive:true});
for(const [name,w,h] of [['iphone',390,844],['short-iphone',390,675],['small',320,568]]){
  const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const failures=[];
  page.on('pageerror',e=>failures.push('JS:'+e.message));
  page.on('response',res=>{if(res.status()>=400 && res.url().includes('/assets/skins/myanmar-luxury/'))failures.push('HTTP:'+res.url())});
  await page.goto('http://127.0.0.1:8000/?skin=myanmar-luxury',{waitUntil:'domcontentloaded'});
  await page.waitForFunction("document.getElementById('invitation')?.dataset.layers === 'ready'",null,{timeout:25000});
  await page.waitForTimeout(900);
  for(const state of ['cover','opened','scroll150']){
    if(state==='opened'){await page.getByRole('button',{name:'Open Invitation'}).click();await page.waitForTimeout(1800)}
    if(state==='scroll150'){await page.evaluate(()=>window.scrollTo({top:Math.round(innerHeight*1.5),behavior:'instant'}));await page.waitForTimeout(500)}
    const path='candidate-screens/'+prefix+'-'+name+'-'+state+'.png';
    await page.screenshot({path,animations:'disabled'});
    const stateData=await page.evaluate(()=>({scrollY,overflow:document.documentElement.scrollWidth-innerWidth,mode:document.getElementById('invitation').dataset.layers,viewport:[innerWidth,innerHeight]}));
    console.log('MYANMAR_CANDIDATE_VISUAL '+path+' '+JSON.stringify(stateData));
  }
  await page.close();
  if(failures.length)throw Error(name+' '+failures.join(';'));
}
await browser.close();
