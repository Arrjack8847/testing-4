// Read-only source/local Gallery viewer comparison. Records geometry and UI semantics only.
// No downloaded vendor photographs, source screenshots, or source JS are committed.
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const urls=[
  ['reference','https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en'],
  ['local','http://127.0.0.1:8000/?galleryReference=1']
];
const viewports=[{width:390,height:844},{width:320,height:568}];
const output={runAt:new Date().toISOString(),readOnly:true,records:[]};
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const round=n=>Number.isFinite(n)?Math.round(n*100)/100:null;
const inspect=()=>{
  const gallery=[...document.querySelectorAll('h1,h2,h3')]
    .find(el=>el.textContent.trim()==='Our Gallery')?.closest('section');
  const fmt=el=>{
    if(!el)return null;
    const s=getComputedStyle(el),r=el.getBoundingClientRect();
    return {tag:el.tagName,id:el.id,cls:String(el.className||'').slice(0,120),
      label:el.getAttribute('aria-label')||'',role:el.getAttribute('role')||'',
      visible:s.display!=='none'&&s.visibility!=='hidden'&&+s.opacity>.01&&r.width>0&&r.height>0,
      text:(el.innerText||'').slice(0,160),
      rect:{x:+r.x.toFixed(1),y:+r.y.toFixed(1),w:+r.width.toFixed(1),h:+r.height.toFixed(1)},
      position:s.position,z:s.zIndex,display:s.display,opacity:s.opacity,
      background:s.backgroundColor,backgroundImage:s.backgroundImage.slice(0,140),
      border:s.border,borderRadius:s.borderRadius,padding:s.padding,boxShadow:s.boxShadow,
      font:s.fontFamily,fontSize:s.fontSize,color:s.color,objectFit:s.objectFit,
      objectPosition:s.objectPosition,overflow:s.overflow,transform:s.transform};
  };
  const visible=el=>fmt(el)?.visible;
  const dialogs=[...document.querySelectorAll('dialog,[role="dialog"],[aria-modal="true"],[class*="lightbox"],[id*="lightbox"],[class*="modal"],[id*="modal"],[class*="viewer"],[id*="viewer"]')].filter(visible).slice(0,32).map(el=>({
    ...fmt(el),children:[...el.children].slice(0,12).map(fmt),
    imgs:[...el.querySelectorAll('img')].slice(0,6).map(im=>({
      ...fmt(im),natural:[im.naturalWidth,im.naturalHeight],srcKind:im.src.includes('/couples/')?'source-couple':im.src.includes('/gallery/')?'local-gallery':'other'})),
    buttons:[...el.querySelectorAll('button,[role="button"]')].slice(0,16).map(fmt)
  }));
  const fixed=[...document.querySelectorAll('body *')].filter(el=>{
    const s=getComputedStyle(el);
    return (s.position==='fixed'||s.position==='sticky')&&visible(el)&&el.getBoundingClientRect().width>80;
  }).slice(-32).map(fmt);
  const mainImgs=[...document.images].filter(el=>{
    const r=el.getBoundingClientRect();
    return visible(el)&&r.width>100&&r.height>100&&r.y<innerHeight&&r.bottom>0;
  }).slice(-15).map(el=>({
    ...fmt(el),natural:[el.naturalWidth,el.naturalHeight],
    srcKind:el.src.includes('/couples/')?'source-couple':el.src.includes('/gallery/')?'local-gallery':'other'
  }));
  return {
    scrollY:Math.round(scrollY*100)/100,scrollHeight:document.documentElement.scrollHeight,
    gallery:fmt(gallery),dialogs,fixed,mainImgs,focused:fmt(document.activeElement),
    openDialogs:[...document.querySelectorAll('dialog')].filter(el=>el.open).length
  };
};

for(const [site,url] of urls)for(const viewport of viewports){
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true,deviceScaleFactor:1,
    reducedMotion:'reduce',locale:'en-MY'});
  const page=await context.newPage();
  const record={site,viewport,status:'started'};
  output.records.push(record);
  try{
    // Temporary WebPs are pre-staged in the private CI runner and remain local.
    // Do not use synthetic pixels: the viewer must open real decoded images.
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForTimeout(1050);
    const button=page.getByRole('button',{name:'Open Invitation'});
    if(await button.count()&&await button.first().isVisible())await button.first().click({timeout:12000});
    await page.waitForTimeout(5400);
    const heading=page.getByRole('heading',{name:'Our Gallery',exact:true}).first();
    await heading.waitFor({state:'attached',timeout:15000});
    const top=await heading.evaluate(el=>el.getBoundingClientRect().top+scrollY);
    await page.evaluate(y=>{document.documentElement.style.scrollBehavior='auto';scrollTo({top:y,behavior:'instant'});},top-viewport.height*.3);
    await page.waitForTimeout(1400);
    record.before=await page.evaluate(inspect);
    // The live source images have no accessible alt/role name, so selecting
    // getByRole('img', {name:'Together'}) silently misses them. Target the
    // real first Gallery photograph by its source path, then inspect its
    // ancestors and the overlay produced by an actual tap.
    const referenceBtn=page.locator('#cgv-gallery img[src*="/couples/"]').first();
    const localBtn=page.locator('#gallery [data-gallery-slot="0"]').first();
    const buttonToClick=site==='reference'?referenceBtn:localBtn;
    record.buttonCount=await buttonToClick.count();
    record.clickSelector=site==='reference'?'#cgv-gallery img[src*="/couples/"]':'#gallery [data-gallery-slot="0"]';
    if(site==='reference'&&record.buttonCount){
      record.sourceImageAncestors=await buttonToClick.evaluate(el=>{
        const chain=[];
        for(let i=0;el&&i<6;i++,el=el.parentElement){
          const st=getComputedStyle(el);
          chain.push({tag:el.tagName,id:el.id,cls:String(el.className||'').slice(0,150),
            role:el.getAttribute('role'),tabindex:el.getAttribute('tabindex'),
            cursor:st.cursor,onClickAttribute:el.getAttribute('onclick'),
            text:(el.innerText||'').slice(0,90)});
        }
        return chain;
      });
    }
    if(record.buttonCount){
      const state=await buttonToClick.evaluate(el=>({
        disabled:el.disabled??false,html:el.outerHTML.slice(0,460),
        text:(el.innerText||'').slice(0,200)}));
      record.buttonBefore=state;
      if(!state.disabled){
        await buttonToClick.click({force:true,timeout:10000});
        await page.waitForTimeout(900);
        record.after=await page.evaluate(inspect);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(250);
        record.afterEscape=await page.evaluate(inspect);
      }else record.issue='Clicked photo button disabled';
    }else {
      record.issue='No matching actual gallery photograph to inspect';
      throw new Error(record.issue);
    }
    // Inspect every actual reference photo, not just the first portrait.
    // Especially important for Garden/Lake landscape crops in the full-screen viewer.
    if(site==='reference'&&record.buttonCount){
      record.additionalPhotoViewers=[];
      const closeViewer=page.locator('.cgv-lightbox button').first();
      // At 320px the live source header's EN control overlays the viewer
      // close button. Invoke its native click handler directly for this
      // measurement-only audit so we can inspect the other photo frames.
      // Keep this obstruction recorded as a separate source UX issue.
      if(await closeViewer.isVisible()){
        record.sourceCloseObstructedAt320=viewport.width===320;
        await closeViewer.evaluate(el=>el.click());
      }
      const photoSelector='#cgv-gallery img[src*="/couples/"]';
      const total=await page.locator(photoSelector).count();
      record.sourcePhotoCount=total;
      if(total<5)throw new Error('Expected five Gallery source photographs, found '+total);
      for(let n=1;n<5;n++){
        const photo=page.locator(photoSelector).nth(n);
        await photo.scrollIntoViewIfNeeded();
        await photo.click({timeout:12000});
        await page.waitForTimeout(300);
        const measured=await page.evaluate(()=>{
          const lightbox=document.querySelector('.cgv-lightbox');
          const image=lightbox?.querySelector('img');
          const close=lightbox?.querySelector('button');
          const rect=el=>{
            if(!el)return null;
            const r=el.getBoundingClientRect(),s=getComputedStyle(el);
            return {x:+r.x.toFixed(2),y:+r.y.toFixed(2),
              w:+r.width.toFixed(2),h:+r.height.toFixed(2),
              position:s.position,objectFit:s.objectFit,
              border:s.border,borderRadius:s.borderRadius,
              background:s.backgroundColor,boxShadow:s.boxShadow};
          };
          return {opened:Boolean(lightbox&&getComputedStyle(lightbox).display!=='none'),
            overlay:rect(lightbox),image:rect(image),close:rect(close),
            photoNatural:image?[image.naturalWidth,image.naturalHeight]:null,
            frame:rect(image?.parentElement),
            alt:image?.getAttribute('alt')||''};
        });
        record.additionalPhotoViewers.push({index:n,...measured});
        if(!measured.opened)throw new Error('Reference photo '+n+' did not open viewer');
        await closeViewer.evaluate(el=>el.click());
      }
    }
    record.status='captured';
    console.log('SECTION7_VIEWER_AUDIT '+JSON.stringify(record).slice(0,27000));
  }catch(error){record.status='error';record.error=String(error);
    console.log('SECTION7_VIEWER_AUDIT_ERROR '+site+' '+viewport.width+' '+record.error);
  }finally{await context.close();}
}
await browser.close();
fs.mkdirSync('section7-viewer-evidence',{recursive:true});
fs.writeFileSync('section7-viewer-evidence/viewer.json',JSON.stringify(output,null,2));
if(output.records.some(x=>x.status!=='captured'))process.exitCode=1;
