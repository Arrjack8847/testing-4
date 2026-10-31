import {chromium} from '@playwright/test';
const browser=await chromium.launch({headless:true});
try {
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
  await page.goto('https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en',{waitUntil:'domcontentloaded',timeout:60000});
  const sample=async label=>{
    const out=await page.evaluate(label=>{
      const rect=el=>{const r=el.getBoundingClientRect();return {x:+r.x.toFixed(1),y:+r.y.toFixed(1),w:+r.width.toFixed(1),h:+r.height.toFixed(1)}};
      const specs=[...document.querySelectorAll('.cgv-dio-bf')].map((group,i)=>({
        i,classes:group.className,groupRect:rect(group),
        sprites:[...group.querySelectorAll('.cgv-bf')].map((el,j)=>({
          j,style:el.getAttribute('style'),rect:rect(el),
          opacity:getComputedStyle(el).opacity,
          transform:getComputedStyle(el).transform,
          visible:getComputedStyle(el).visibility,
          wings:[...el.children].map(x=>({transform:getComputedStyle(x).transform,opacity:getComputedStyle(x).opacity}))
        }))
      }));
      const cover=document.querySelector('.cgv-dio-cv');
      return {label,groups:specs,cover:cover?rect(cover):null,clock:Date.now()};
    },label);
    console.log('BUTTERFLY_MEASURE '+JSON.stringify(out));
  };
  for (const [delay,label] of [[500,'at_500ms'],[2000,'at_2500ms'],[2000,'at_4500ms']]){
    await page.waitForTimeout(delay);await sample(label);
  }
  const btn=page.getByRole('button',{name:'Open Invitation'});
  for(let i=0;i<await btn.count();i++)if(await btn.nth(i).isVisible()){await btn.nth(i).click();break;}
  await page.waitForTimeout(2500);await sample('after_open_2500ms');
  for(const fraction of [.15,.35,.65,.95]){
    await page.evaluate(f=>window.scrollTo({top:Math.round(innerHeight*f),behavior:'instant'}),fraction);
    await page.waitForTimeout(450);
    const state=await page.evaluate(()=>{
      const r=e=>{if(!e)return null;const b=e.getBoundingClientRect();return {x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height)};};
      const q=s=>document.querySelector(s);
      return {scrollY:scrollY,scrollWidth:document.documentElement.scrollWidth,
        hero:r(q('.cgv-dio-hero')),hint:r(q('.dio-hint')),
        main:r(q('.cgv-invite')),heroContent:r(q('.cgv-dio-hero .cgv-hero-content')),
        title:r(q('.cgv-dio-hero .cgv-t2')),
        heroPosition:q('.cgv-dio-hero')?getComputedStyle(q('.cgv-dio-hero')).position:'',
        hintPosition:q('.dio-hint')?getComputedStyle(q('.dio-hint')).position:'',
        sceneClass:q('.cgv-dio-hero .dio')?.className};
    });
    console.log('REFERENCE_SCROLL '+JSON.stringify({fraction,...state}));
  }
} finally {await browser.close();}
