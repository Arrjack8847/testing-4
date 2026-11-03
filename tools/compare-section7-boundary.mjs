// Read-only Gallery-to-next-section audit. No vendor photos saved.
import {chromium} from '@playwright/test';
import fs from 'node:fs';
const output='section7-boundary-evidence';
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const records=[];
const sites=[
  ['reference','https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en'],
  ['local','http://127.0.0.1:8000/']
];
const viewports=[{width:390,height:844},{width:320,height:568}];
async function check(name,url,viewport){
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true,reducedMotion:'reduce',locale:'en-MY'});
  const page=await context.newPage();
  const result={name,url,viewport,status:'started',errors:[]};
  records.push(result);
  page.on('pageerror',e=>result.errors.push(String(e.message).slice(0,250)));
  try{
    const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:55000});
    result.httpStatus=response?.status()??null;
    await page.waitForTimeout(1000);
    const open=page.getByRole('button',{name:'Open Invitation'});
    for(let i=0;i<await open.count();i++){
      if(await open.nth(i).isVisible()){
        await open.nth(i).click({timeout:8000});result.opened=true;break;
      }
    }
    await page.waitForTimeout(1250);
    const heading=page.getByRole('heading',{name:'Our Gallery',exact:true}).first();
    await heading.waitFor({state:'attached',timeout:16000});
    result.data=await heading.evaluate(h=>{
      const section=h.closest('section');
      const prev=section?.previousElementSibling, next=section?.nextElementSibling;
      const box=e=>{if(!e)return null;const r=e.getBoundingClientRect();
        return {top:+(r.top+scrollY).toFixed(1),bottom:+(r.bottom+scrollY).toFixed(1),
          width:+r.width.toFixed(1),height:+r.height.toFixed(1)};};
      const info=e=>{
        if(!e)return null;
        const s=getComputedStyle(e);
        return {tag:e.tagName,id:e.id,class:String(e.className||'').slice(0,90),
          section:e.getAttribute('data-section'),
          box:box(e),background:s.backgroundColor,backgroundImage:s.backgroundImage.slice(0,350),
          borderTop:s.borderTop,borderBottom:s.borderBottom,
          padding:s.padding,color:s.color,
          headings:[...e.querySelectorAll('h1,h2,h3')].slice(0,5).map(x=>({text:(x.textContent||'').trim(),box:box(x)})),
          text:(e.innerText||'').replace(/\s+/g,' ').trim().slice(0,220)};
      };
      const before=prev?.getBoundingClientRect().bottom;
      const after=next?.getBoundingClientRect().top;
      const sbox=section.getBoundingClientRect();
      const hint=[...section.querySelectorAll('p,span')]
        .find(e=>(e.textContent||'').trim()==='Tap a frame to view');
      return {previous:info(prev),gallery:info(section),next:info(next),hint:box(hint),
        beforeGap:before===undefined?null:+(sbox.top-before).toFixed(2),
        afterGap:after===undefined?null:+(after-sbox.bottom).toFixed(2),
        overflow:document.documentElement.scrollWidth-innerWidth};
    });
    const bottom=result.data.gallery.box.bottom;
    for(const entry of [['ending',-viewport.height*.65],['handoff',-viewport.height*.2],['next',viewport.height*.1]]){
      const y=Math.round(Math.max(0,bottom+entry[1]));
      await page.evaluate(pos=>{document.documentElement.style.scrollBehavior='auto';scrollTo({top:pos,behavior:'instant'});},y);
      await page.waitForTimeout(450);
      await page.screenshot({path:output+'/'+name+'-'+viewport.width+'-'+entry[0]+'.png',animations:'disabled'});
    }
    result.status='complete';
    console.log('SECTION7_BOUNDARY '+JSON.stringify({name,width:viewport.width,...result.data}));
  }catch(e){result.status='error';result.error=String(e);console.error('SECTION7_BOUNDARY_ERROR '+name+' '+result.error);}
  finally{await context.close();}
}
try{for(const viewport of viewports)for(const site of sites)await check(site[0],site[1],viewport);}
finally{await browser.close();fs.writeFileSync(output+'/measurements.json',JSON.stringify(records,null,2));}
if(records.some(r=>r.status!=='complete'))process.exitCode=1;
