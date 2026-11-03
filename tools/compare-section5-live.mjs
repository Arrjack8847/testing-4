import {chromium} from '@playwright/test';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
const OUT='section5-live-evidence';
fs.mkdirSync(OUT,{recursive:true});
// Serve the checked-out commit while comparing it with the public source.
const server=spawn('python3',['-m','http.server','8000','--bind','127.0.0.1'],{stdio:'ignore'});
await new Promise(resolve=>setTimeout(resolve,900));
const browser=await chromium.launch({headless:true});
const config={viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'no-preference'};
const pages=[
 {name:'reference',url:'https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en'},
 {name:'local-original',url:'http://127.0.0.1:8000/'},
 {name:'local-art-comparison',url:'http://127.0.0.1:8000/?orderReference=1'}
];
const report={timestamp:new Date().toISOString(),viewport:config.viewport,source:pages[0].url,results:[]};
function simplifyRect(r){return {x:Math.round(r.x*10)/10,y:Math.round(r.y*10)/10,width:Math.round(r.width*10)/10,height:Math.round(r.height*10)/10}}
async function gather(page,name){
  return await page.evaluate((name)=>{
    const fmtRect=el=>{const b=el.getBoundingClientRect();return {x:+b.x.toFixed(1),y:+b.y.toFixed(1),width:+b.width.toFixed(1),height:+b.height.toFixed(1)}};
    const heading=[...document.querySelectorAll('h1,h2,h3,h4')].find(el=>el.textContent.trim()==='Order of the Day');
    if(!heading)return {name,found:false,title:document.title,currentURL:location.href,scrollY,scrollHeight:document.documentElement.scrollHeight};
    let parent=heading;
    for(let i=0;i<8 && parent?.parentElement;i++){
      const t=parent.innerText||'';
      if(t.includes('Guests arrive')&&t.includes('Celebration ends')&&parent.getBoundingClientRect().height>300)break;
      parent=parent.parentElement;
    }
    const headingAbs=fmtRect(heading), parentAbs=fmtRect(parent);
    const sampleNodes=[...parent.querySelectorAll('h2,h3,h4,li,time,strong,small,p,span')].filter(el=>{
      const t=(el.innerText||el.textContent||'').trim().replace(/\s+/g,' ');
      const r=el.getBoundingClientRect();
      return t && t.length<90 && r.height>6 && r.width>6 && r.height<150
    }).slice(0,48).map(el=>{
      const style=getComputedStyle(el),r=fmtRect(el);
      return {tag:el.tagName,class:typeof el.className==='string'?el.className.slice(0,105):'',text:(el.innerText||el.textContent||'').trim().replace(/\s+/g,' ').slice(0,85),
        box:r,font:style.fontFamily,fontSize:style.fontSize,lineHeight:style.lineHeight,weight:style.fontWeight,
        color:style.color,background:style.backgroundImage.slice(0,300),transform:style.transform,opacity:style.opacity,letterSpacing:style.letterSpacing};
    });
    const backgrounds=[...document.querySelectorAll('*')].flatMap(el=>{
      const vals=[];
      for(const pseudo of ['', '::before', '::after']){
        const st=getComputedStyle(el,pseudo||null);
        if(!st.backgroundImage.includes('band_plum'))continue;
        vals.push({tag:el.tagName,class:typeof el.className==='string'?el.className.slice(0,120):'',pseudo,
          box:fmtRect(el),backgroundImage:st.backgroundImage,backgroundSize:st.backgroundSize,
          backgroundPosition:st.backgroundPosition,backgroundRepeat:st.backgroundRepeat,
          transform:st.transform,opacity:st.opacity});
      }
      return vals;
    }).slice(0,12);
    const matches=[...document.images].filter(img=>(img.currentSrc||img.src).includes('band_plum')||(img.currentSrc||img.src).includes('bfly_blush')).map(img=>({
      src:img.currentSrc||img.src,natural:[img.naturalWidth,img.naturalHeight],box:fmtRect(img),opacity:getComputedStyle(img).opacity,
      visible:getComputedStyle(img).display!=='none'}));
    const styles=[parent,heading].map(el=>{const st=getComputedStyle(el);return {class:el.className,background:st.backgroundImage,
      backgroundColor:st.backgroundColor,position:st.position,transform:st.transform,font:st.fontFamily}});
    return {name,found:true,title:document.title,scrollY,scrollHeight:document.documentElement.scrollHeight,
      headingAbs,parentAbs,headingDocumentY:+(headingAbs.y+scrollY).toFixed(1),
      parentDocumentY:+(parentAbs.y+scrollY).toFixed(1),nodes:sampleNodes,art:matches,backgrounds,styles};
  },name);
}
try{
  for(const spec of pages) {
    const context=await browser.newContext(config);
    const page=await context.newPage();
    const one={name:spec.name,url:spec.url,opened:false};
    report.results.push(one);
    try{
      const response=await page.goto(spec.url,{waitUntil:'domcontentloaded',timeout:55000});
      one.httpStatus=response?.status()??null;
      await page.waitForTimeout(2200);
      const buttons=page.getByRole('button',{name:'Open Invitation'});
      for(let i=0;i<await buttons.count();i++){
        if(await buttons.nth(i).isVisible()){
          await buttons.nth(i).click({timeout:6500});
          one.opened=true;break;
        }
      }
      if(!one.opened)throw Error('No visible Open Invitation button');
      await page.waitForTimeout(1500);
      const heading=page.getByText('Order of the Day',{exact:true}).first();
      await heading.waitFor({state:'attached',timeout:10000});
      const top=await heading.evaluate(el=>el.getBoundingClientRect().top+scrollY);
      one.headingDocTop=top;
      if(spec.name==='local-art-comparison'){
        one.referenceAssets=await page.evaluate(()=>{
          const el=document.getElementById('runningOrder');
          return {mode:el?.dataset.assetSource||'not-configured',
            plum:el?.dataset.bandStatus||'not-requested',
            butterfly:el?.dataset.butterflyStatus||'not-requested'};
        });
        if(one.referenceAssets.plum!=='loaded'){
          one.note='Local reference WebP unavailable; screenshot is FALLBACK ART, not a source-art parity result.';
          console.warn('REFERENCE_ART_UNAVAILABLE',JSON.stringify(one.referenceAssets));
        }
      }
      for(const [key,delta] of [['start',-130],['middle',180],['exit',380]]){
        const y=Math.max(0,Math.round(top+delta));
        await page.evaluate(y=>{document.documentElement.style.scrollBehavior='auto';scrollTo({top:y,behavior:'instant'});},y);
        await page.waitForTimeout(950);
        one[key]=await gather(page,spec.name);
        await page.screenshot({path:OUT+'/'+spec.name+'-'+key+'.png',animations:'disabled'});
      }
      one.status='captured';
      console.log('CAPTURED',spec.name,'status',one.httpStatus,'heading',top, 'elements',one.middle.nodes.length);
    }catch(err){one.status='error';one.error=String(err);console.error('VISUAL_COMPARE_ERROR',spec.name,String(err));}
    await context.close();
  }
  fs.writeFileSync(OUT+'/measurements.json',JSON.stringify(report,null,2));
  if(report.results.some(r=>r.status!=='captured'))process.exitCode=1;
}finally{await browser.close();server.kill('SIGTERM');}
