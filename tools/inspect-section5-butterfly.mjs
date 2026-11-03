import {chromium} from '@playwright/test';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
try{
 await page.goto('https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en',{waitUntil:'domcontentloaded',timeout:50000});
 await page.waitForTimeout(1500);
 const b=page.getByRole('button',{name:'Open Invitation'});
 for(let i=0;i<await b.count();i++){if(await b.nth(i).isVisible()){await b.nth(i).click();break;}}
 await page.waitForTimeout(1500);
 await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo({top:6750,behavior:'instant'})});
 await page.waitForTimeout(1000);
 const data=await page.evaluate(()=>{
  const area=document.querySelector('.cgv-timeline');
  const all=area?[...area.querySelectorAll('*')]:[];
  const bf=all.find(el=>el.classList?.contains('cgv-bf'));
  const petals=document.querySelector('canvas.cgv-petals');
  const rect=el=>{if(!el)return null;const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};
  const css=el=>{const c=getComputedStyle(el);return {background:c.backgroundImage,backgroundSize:c.backgroundSize,
   transform:c.transform,position:c.position,width:c.width,height:c.height,opacity:c.opacity,filter:c.filter,
   animation:c.animation,transformOrigin:c.transformOrigin,mask:c.maskImage}};
  const nodes=bf?[bf,...bf.querySelectorAll('*')].map(el=>({tag:el.tagName,cl:typeof el.className==='string'?el.className:'',rect:rect(el),style:css(el),
   outer:el.outerHTML.slice(0,400)})):[];
  const canvasses=[...document.querySelectorAll('canvas')].map(el=>({cls:el.className,rect:rect(el),style:css(el),width:el.width,height:el.height}));
  const butterflies=all.filter(el=>el.classList?.contains('cgv-bf-layer')).map(el=>({cls:el.className,rect:rect(el),html:el.outerHTML.slice(0,950)}));
  return {url:location.href,area:rect(area),butterflies,nodes,canvasses,scrollY};
 });
 console.log('SECTION5_BUTTERFLY_DOM '+JSON.stringify(data));
} catch(e){console.error(String(e));process.exitCode=1}finally{await browser.close();}
