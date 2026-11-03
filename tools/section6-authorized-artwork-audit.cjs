'use strict';
const {chromium}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const out=path.resolve(__dirname,'../artifacts/section6-authorized-artwork');
const url='https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en';
async function main(){
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const report={url,checkedAt:new Date().toISOString(),images:[],nodes:[],network:[],errors:[]};
  try{
    page.on('response',response=>{
      const u=response.url();
      if(/\.(webp|png|jpg|jpeg|gif|svg)(?:\?|$)/i.test(u)){
        report.network.push({url:u,status:response.status(),mime:response.headers()['content-type']||''});
      }
    });
    const nav=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
    report.http=nav?.status();
    const open=page.getByRole('button',{name:/open invitation/i});
    if(await open.count())await open.first().click({timeout:7500});
    await page.waitForTimeout(2300);
    const sec=page.locator('.cgv-dress');
    await sec.scrollIntoViewIfNeeded({timeout:10000});
    await page.waitForTimeout(3000);
    const result=await page.evaluate(()=>{
      const nodes=[];
      const all=[...document.querySelectorAll('*')];
      const owned=all.filter(el=>{
        const cn=typeof el.className==='string'?el.className:'';
        return el.closest('.cgv-dress')||/cgv-bf/.test(cn)||
          /butterfly|wing/.test(cn);
      });
      const cssImage=(st)=>[st.backgroundImage,st.maskImage,st.webkitMaskImage,
        st.borderImageSource,st.listStyleImage].filter(Boolean).join(';');
      const pick=(el)=>{
        const rect=el.getBoundingClientRect(),st=getComputedStyle(el);
        const pseudos=['::before','::after'].map(p=>{
          const ps=getComputedStyle(el,p);
          return {pseudo:p,image:cssImage(ps),content:ps.content,width:ps.width,height:ps.height};
        }).filter(p=>/(url\(|image-set\()/i.test(p.image));
        return {
          tag:el.tagName,className:String(el.className||'').slice(0,180),
          id:el.id||'',parentClass:String(el.parentElement?.className||'').slice(0,180),
          html:el.outerHTML.slice(0,500),
          x:+rect.x.toFixed(2),y:+rect.y.toFixed(2),w:+rect.width.toFixed(2),h:+rect.height.toFixed(2),
          position:st.position,objectFit:st.objectFit,objectPosition:st.objectPosition,
          backgroundSize:st.backgroundSize,backgroundPosition:st.backgroundPosition,
          cssImage:cssImage(st),pseudoImages:pseudos,
          src:el.tagName==='IMG'?el.currentSrc||el.src:null,
          naturalWidth:el.tagName==='IMG'?el.naturalWidth:null,
          naturalHeight:el.tagName==='IMG'?el.naturalHeight:null
        };
      };
      for(const el of owned){
        const info=pick(el);
        const interest=!!info.cssImage.match(/url\(|image-set\(/i)||info.pseudoImages.length||
           !!info.src||/cgv-bf/.test(info.className)||el===document.querySelector('.cgv-dress');
        if(interest)nodes.push(info);
      }
      const docImages=all.filter(el=>el.tagName==='IMG')
        .map(el=>({src:el.currentSrc||el.src,w:el.naturalWidth,h:el.naturalHeight,
           closestSection:el.closest('.cgv-dress')?'dress':'other'}))
        .filter(img=>/webp|dress|bfly|wing|paper/i.test(img.src));
      return {nodes:nodes.slice(0,180),images:docImages.slice(0,150),
       dressHTML:document.querySelector('.cgv-dress')?.outerHTML.slice(0,4200)||'',
       butterflyHTML:[...document.querySelectorAll('[class*="cgv-bf"]')]
         .slice(0,6).map(x=>x.outerHTML.slice(0,1200))};
    });
    Object.assign(report,result);
    report.network=report.network.filter((item,index,arr)=>
      arr.findIndex(other=>other.url===item.url)===index);
    const urls=[...new Set([
      ...report.network.map(x=>x.url),
      ...report.images.map(x=>x.src),
      ...report.nodes.flatMap(x=>[x.cssImage,...x.pseudoImages.map(y=>y.image),x.src||''])
        .flatMap(x=>(x.match(/https?:[^)'"\s,]+/g)||[]))
    ])].filter(u=>/paper|bfly|butterfly|dress|wing/i.test(u));
    report.candidates=urls;
  }catch(e){report.errors.push(String(e));process.exitCode=1}
  finally{await page.close();await browser.close()}
  fs.writeFileSync(path.join(out,'manifest-audit.json'),JSON.stringify(report,null,2));
  console.log('ASSET_AUDIT_HTTP',report.http,'nodes',report.nodes.length,
    'images',report.images.length,'network',report.network.length);
  console.log('ASSET_CANDIDATES',JSON.stringify(report.candidates));
  console.log('BUTTERFLY_DOM',JSON.stringify(report.butterflyHTML).slice(0,3500));
  console.log('IMAGE_NODES',JSON.stringify(report.nodes.filter(x=>
    /paper|bfly|butterfly|wing/i.test(x.cssImage+x.className+x.src))).slice(0,7800));
  if(report.errors.length)console.error(report.errors.join('\n'));
}
main().catch(e=>{console.error(e);process.exitCode=1});
