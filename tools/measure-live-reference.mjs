import { chromium } from '@playwright/test';

const url = 'https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en';
const browser = await chromium.launch({headless:true});
const context = await browser.newContext({
  viewport: {width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true
});
const page = await context.newPage();

async function inspect(label) {
  const data = await page.evaluate((label) => {
    const rect = el => {
      const r = el.getBoundingClientRect();
      return {x:+r.x.toFixed(1),y:+r.y.toFixed(1),w:+r.width.toFixed(1),h:+r.height.toFixed(1)};
    };
    const fmtStyle = el => {
      const s=getComputedStyle(el);
      return {
        position:s.position,opacity:s.opacity,transform:s.transform,
        z:s.zIndex,objectFit:s.objectFit,font:s.fontFamily,
        fontSize:s.fontSize,lineHeight:s.lineHeight,weight:s.fontWeight,
        letterSpacing:s.letterSpacing,animation:s.animationName,
        duration:s.animationDuration,delay:s.animationDelay
      };
    };
    const paths = new Map();
    for(const el of document.querySelectorAll('img[src]')) {
      const filename = (el.getAttribute('src')||'').split('/').pop();
      if(!/\.webp(\?|$)/.test(filename))continue;
      const prior=paths.get(filename) || [];
      if(prior.length<3) prior.push({
        rect:rect(el), style:fmtStyle(el), cls:el.className,
        parent:el.parentElement?.className,
        parentRect:el.parentElement ? rect(el.parentElement):null,
        parentStyle:el.parentElement ? {
          transform:getComputedStyle(el.parentElement).transform,
          position:getComputedStyle(el.parentElement).position,
          animation:getComputedStyle(el.parentElement).animationName
        }:null,
        natural:[el.naturalWidth,el.naturalHeight]
      });
      paths.set(filename,prior);
    }
    // Find heading/button and monogram nodes without depending on private class names.
    const targets=[...document.querySelectorAll('button,h1,h2,h3,p,[class*="cover"],[class*="monogram"],[class*="name"],[class*="open"]')]
      .filter(el=>{
        const txt=(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,100);
        return (/Open Invitation|Rayyan|Sofea|Wedding of|Specially inviting|^R\s*S$|Swipe up/).test(txt)
          && el.children.length<9;
      }).slice(0,35).map(el=>({
        tag:el.tagName,cls:typeof el.className==='string'?el.className:'',text:(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,55),
        rect:rect(el),style:fmtStyle(el)
      }));
    return {
      label, url:location.href, viewport:[innerWidth,innerHeight],
      pageScrollY:window.scrollY,
      artwork:[...paths].map(([name,nodes])=>({name,nodes})),
      targets
    };
  },label);
  console.log('LIVE_REFERENCE_MEASUREMENT_START '+label);
  console.log(JSON.stringify(data,null,2));
  console.log('LIVE_REFERENCE_MEASUREMENT_END '+label);
}
try {
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForTimeout(3500);
  await inspect('BEFORE_OPEN');
  const candidates=page.getByRole('button',{name:'Open Invitation'});
  const count=await candidates.count();
  console.log('Open Invitation buttons:',count);
  let clicked=false;
  for(let i=0;i<count;i++) {
    if(await candidates.nth(i).isVisible()) {
      await candidates.nth(i).click({timeout:5000});
      clicked=true;break;
    }
  }
  console.log('Clicked visible opening button:',clicked);
  if(clicked){ await page.waitForTimeout(2800);await inspect('AFTER_OPEN_2800MS'); }
} finally {
  await browser.close();
}
