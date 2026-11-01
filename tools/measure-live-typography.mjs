import {chromium} from '@playwright/test';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 await page.goto('https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForTimeout(1400);
 const btn=page.getByRole('button',{name:'Open Invitation'});
 for(let i=0;i<await btn.count();i++){if(await btn.nth(i).isVisible()){await btn.nth(i).click();break;}}
 await page.waitForTimeout(2100);
 for(const fraction of [0,1.3,1.5,1.7,1.9,2.1,2.3]){
   await page.evaluate(fraction=>{document.documentElement.style.scrollBehavior='auto';scrollTo({top:Math.round(innerHeight*fraction),behavior:'instant'});},fraction);
   await page.waitForTimeout(600);
   const data=await page.evaluate(()=>{
     const sel=['.cgv-hero-content','.cgv-t1','.cgv-t2','.cgv-t2 .cgv-nl','.cgv-nl-n','.cgv-nl-amp','.cgv-t3'];
     const info={scroll:scrollY,items:[]};
     for(const selector of sel){
       for(const el of [...document.querySelectorAll(selector)].slice(0,6)){
         const s=getComputedStyle(el),r=el.getBoundingClientRect();
         info.items.push({selector,tag:el.tagName,cls:String(el.className),text:(el.textContent||'').trim().slice(0,45),
           html:el.outerHTML.slice(0,430),
           x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),
           opacity:s.opacity,transform:s.transform,
           font:s.fontFamily,fontSize:s.fontSize,lineHeight:s.lineHeight,fontWeight:s.fontWeight,letterSpacing:s.letterSpacing,
           animation:s.animationName,animationDuration:s.animationDuration,visibility:s.visibility
         });
       }
     }
     return info;
   });
   console.log('TYPE_MEASURE '+JSON.stringify({fraction,...data}));
 }
}finally{await browser.close();}
