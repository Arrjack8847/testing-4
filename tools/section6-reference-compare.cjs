'use strict';
/**
 * Section 6 screenshot/geometry comparison for the Tasik Kayangan research prototype.
 * Runs only on the developer's own computer; screenshots of the commercial source
 * remain private in ignored artifacts/ and must not be committed or redistributed.
 *
 * npm run compare:section6
 * npm run compare:section6 -- --local http://127.0.0.1:8001
 */
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('@playwright/test');

const WIDTHS=[320,360,390,430];
const HEIGHT=844;
const OUTPUT=path.resolve(__dirname,'../artifacts/section6-compare');
const args=process.argv.slice(2);
const arg=(name,fallback)=>{
  const i=args.indexOf(name);
  return i>=0 && args[i+1]?args[i+1]:fallback;
};
const localUrl=arg('--local','http://127.0.0.1:8000/');
const referenceUrl=arg('--reference','https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en');
const localOnly=args.includes('--local-only');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[ch]));

async function readMetrics(page,isLocal){
  return page.evaluate(isLocal=>{
    const header=[...document.querySelectorAll('h1,h2,h3,h4')]
      .find(el=>(el.textContent||'').trim().toLowerCase()==='dress code');
    if(!header)return {error:'Dress Code heading not present',url:location.href};
    // Match the reference cgv-inner content box, not the padded SECTION.
    let root=isLocal?document.querySelector('#dressCode .dress-body'):null;
    if(!root){
      for(let p=header.parentElement;p&&p!==document.body;p=p.parentElement){
        const text=p.textContent||'';
        const height=p.getBoundingClientRect().height;
        // Smallest region containing both palette labels, but not the Gallery.
        if(text.includes("Groom's Side")&&text.includes("Bride's Side")&&
           !text.includes('Our Gallery')&&height>=250&&height<=1400){
          root=p;break;
        }
      }
    }
    const anchor=root||header;
    const aRect=anchor.getBoundingClientRect();
    const headerRect=header.getBoundingClientRect();
    const top=Math.max(0,scrollY+(root?aRect.top:headerRect.top-102));
    const height=root?aRect.height:679;
    const box=el=>{
      if(!el)return null;
      const r=el.getBoundingClientRect(),s=getComputedStyle(el);
      return {
        text:(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,145),
        x:+r.left.toFixed(2),
        y:+(r.top+scrollY-top).toFixed(2),
        width:+r.width.toFixed(2),
        height:+r.height.toFixed(2),
        fontFamily:s.fontFamily,fontSize:s.fontSize,fontWeight:s.fontWeight,
        lineHeight:s.lineHeight,letterSpacing:s.letterSpacing,color:s.color,
        background:s.backgroundColor,borderRadius:s.borderRadius,
        opacity:s.opacity,transform:s.transform
      };
    };
    const findText=needle=>[...document.querySelectorAll('h1,h2,h3,h4,p,strong,small,span')]
      .find(el=>(el.textContent||'').trim()===needle);
    const ownText=el=>[...el.childNodes].filter(n=>n.nodeType===3)
      .map(n=>n.textContent).join(' ').replace(/\s+/g,' ').trim();
    const exactLeaf=needle=>[...document.querySelectorAll('*')].find(el=>ownText(el)===needle);
    const styleOf=el=>{
      if(!el)return null;
      const st=getComputedStyle(el),rect=el.getBoundingClientRect();
      const pseudo=target=>{
        const p=getComputedStyle(el,target);
        return {content:p.content,background:p.backgroundImage?.slice(0,360),
          width:p.width,height:p.height,opacity:p.opacity,border:p.border,
          borderRadius:p.borderRadius,boxShadow:p.boxShadow};
      };
      return {
        tag:el.tagName,class:typeof el.className==='string'?el.className.slice(0,135):'',
        box:{x:+rect.x.toFixed(2),y:+(rect.y+scrollY-top).toFixed(2),
          w:+rect.width.toFixed(2),h:+rect.height.toFixed(2)},
        style:{position:st.position,display:st.display,padding:st.padding,margin:st.margin,
          backgroundColor:st.backgroundColor,backgroundImage:st.backgroundImage.slice(0,520),
          backgroundSize:st.backgroundSize,backgroundPosition:st.backgroundPosition,
          border:st.border,borderRadius:st.borderRadius,boxShadow:st.boxShadow,
          backdropFilter:st.backdropFilter,opacity:st.opacity,filter:st.filter,
          overflow:st.overflow,transform:st.transform,
          animationName:st.animationName,animationDuration:st.animationDuration,
          animationTimingFunction:st.animationTimingFunction,animationDelay:st.animationDelay,
          transition:st.transition},
        before:pseudo('::before'),after:pseudo('::after')
      };
    };
    const ancestors=(el,cap=6)=>{
      const result=[];for(let i=0;el&&i<cap;i++,el=el.parentElement)result.push(styleOf(el));
      return result;
    };
    const groom=exactLeaf("Groom's Side"),bride=exactLeaf("Bride's Side");
    const cards=[groom,bride].map(el=>{
      const cardsUp=ancestors(el,5);
      return {label:ownText(el),ancestors:cardsUp};
    });
    const rootParents=ancestors(root||header,6);
    const visualCandidates=[...new Set([...(root?.parentElement?.querySelectorAll('*')||[]),
      ...(root?.parentElement?.parentElement?.querySelectorAll('img')||[])])]
      .filter(el=>{
        const st=getComputedStyle(el),bg=st.backgroundImage,rect=el.getBoundingClientRect();
        return (el.tagName==='IMG'||bg.includes('url('))&&rect.height>16&&rect.width>16;
      }).slice(0,28).map(el=>{
        const st=styleOf(el);
        return {...st,image:el.tagName==='IMG'?{src:el.currentSrc||el.src,
          loaded:el.complete&&el.naturalWidth>0,naturalWidth:el.naturalWidth,
          naturalHeight:el.naturalHeight}:undefined};
      });
    const swatchNodes=root?[...root.querySelectorAll('*')].filter(el=>{
      const s=getComputedStyle(el),r=el.getBoundingClientRect();
      return r.width>=23&&r.width<=110&&r.height>=23&&r.height<=110&&
        Math.abs(r.width-r.height)<=10&&
        (s.borderRadius.includes('50%')||parseFloat(s.borderRadius)>20)&&
        s.backgroundColor!=='rgba(0, 0, 0, 0)'&&s.backgroundColor!=='transparent';
    }).slice(0,14):[];
    return {
      url:location.href,
      viewport:{width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth},
      headingDocumentTop:+(headerRect.top+scrollY).toFixed(2),
      section:{top:+top.toFixed(2),height:+height.toFixed(2),
        rootTag:root?.tagName??null,rootClass:root?.className??null},
      heading:box(header),
      introduction:box(findText('We would be delighted if you could dress along with our chosen palette.')),
      groomLabel:box(findText("Groom's Side")),
      groomTitle:box(findText('Sage Green & Cream')),
      groomColours:box(findText('Sage, soft sage, cream')),
      brideLabel:box(findText("Bride's Side")),
      brideTitle:box(findText('Terracotta & Blush')),
      brideColours:box(findText('Terracotta, blush, sand')),
      swatches:swatchNodes.map(el=>({position:box(el),background:getComputedStyle(el).backgroundColor})),
      surface:{rootAncestors:rootParents,cards,visualCandidates},
      selectedImages:root?[...root.querySelectorAll('img')].map(el=>({
        source:el.currentSrc||el.src,loaded:el.complete&&el.naturalWidth>0
      })):[],
      // Compare leaf-level typography even if reference labels differ in
      // capitalization, apostrophe choice, or HTML nesting.
      textSamples:root?[...root.querySelectorAll('*')].map(el=>{
        const ownText=[...el.childNodes].filter(node=>node.nodeType===3)
          .map(node=>node.textContent).join(' ').replace(/\s+/g,' ').trim();
        if(!ownText||ownText.length>100)return null;
        const rect=el.getBoundingClientRect();
        if(rect.width<3||rect.height<3)return null;
        const data=box(el);
        return {ownText,className:String(el.className||'').slice(0,100),
          ...data};
      }).filter(Boolean).slice(0,75):[],
      state:isLocal?document.getElementById('invitation')?.dataset.state:null
    };
  },isLocal);
}
async function openInvitation(page){
  const button=page.getByRole('button',{name:/open invitation/i});
  if(await button.count()){
    try{await button.first().click({timeout:6500});await delay(1250)}
    catch(error){console.warn('  Opening button was not clickable:',error.message.slice(0,130))}
  }
}
async function takePage(browser,width,label,url,isLocal){
  const page=await browser.newPage({
    viewport:{width,height:HEIGHT},deviceScaleFactor:1,
    isMobile:true,hasTouch:true,reducedMotion:'reduce'
  });
  try{
    const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:40000});
    if(response&&response.status()>=400)throw Error('HTTP '+response.status());
    await page.evaluate(()=>document.fonts?.ready).catch(()=>{});
    await openInvitation(page);
    let metrics=await readMetrics(page,isLocal);
    if(metrics.error)throw Error(metrics.error);
    // Align the SAME visible anchor in both pages. Their enclosing DOM elements
    // are different, so scrolling to each root's top misaligns comparisons.
    await page.evaluate(top=>scrollTo({top:Math.max(0,top-126),behavior:'instant'}),metrics.headingDocumentTop);
    await delay(1100);
    metrics=await readMetrics(page,isLocal);
    // Lazy images can shift the document; re-anchor after they settle.
    await page.evaluate(top=>scrollTo({top:Math.max(0,top-126),behavior:'instant'}),metrics.headingDocumentTop);
    await delay(650);
    metrics=await readMetrics(page,isLocal);
    const file=label+'-'+width+'.png';
    await page.screenshot({path:path.join(OUTPUT,file),animations:'disabled'});
    console.log('  '+label+' '+width+'px section='+metrics.section.height+
      'px headingY='+metrics.heading?.y+'px -> '+file);
    return {ok:true,file,metrics};
  }catch(error){
    console.error('  '+label+' '+width+'px failed: '+error.message.slice(0,300));
    return {ok:false,error:error.message};
  }finally{await page.close()}
}
function comparison(ref,local){
  if(!ref?.ok||!local?.ok)return null;
  const fields=['heading','introduction','groomLabel','groomTitle',
    'groomColours','brideLabel','brideTitle','brideColours'];
  const differences={sectionHeight:Math.round((local.metrics.section.height-
    ref.metrics.section.height)*100)/100};
  for(const field of fields){
    const a=ref.metrics[field],b=local.metrics[field];
    if(a&&b)differences[field]={
      y:Math.round((b.y-a.y)*100)/100,
      height:Math.round((b.height-a.height)*100)/100,
      fontSize:{reference:a.fontSize,local:b.fontSize},
      color:{reference:a.color,local:b.color}
    };
  }
  return differences;
}
function reportHtml(report){
  const cards=WIDTHS.map(width=>{
    const entry=report.screens[width],reference=entry.reference,local=entry.local;
    const errors=[reference,local].filter(item=>!item?.ok).map(item=>escapeHtml(item?.error||'Not captured'));
    const imageBlock=(name,item)=>item?.ok
      ?'<figure><figcaption>'+name+'</figcaption><img src="'+item.file+'" alt="'+name+' '+width+'px viewport screenshot"></figure>'
      :'<div class="missing">'+name+' unavailable</div>';
    const overlay=reference?.ok&&local?.ok?'<div class="overlay"><img src="'+reference.file+
      '" alt="Source screenshot"><img class="over" style="opacity:.5" src="'+local.file+
      '" alt="Local screenshot overlay"></div><label>Local opacity <input type="range" min="0" max="100" value="50" oninput="this.closest(\'.panel\').querySelector(\'.over\').style.opacity=this.value/100"></label>':'';
    return '<section class="panel"><h2>'+width+' × '+HEIGHT+'</h2><div class="pair">'+
      imageBlock('Reference',reference)+imageBlock('Local',local)+'</div>'+
      overlay+'<p class="error">'+errors.join(' | ')+'</p><details><summary>Measured geometry</summary><pre>'+
      escapeHtml(JSON.stringify(entry.differences,null,2))+'</pre></details></section>';
  }).join('');
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>Section 6 • Visual comparison</title>'+
    '<style>body{margin:0;background:#eee6ef;color:#362e3c;font:16px system-ui;padding:24px}'+
    'main{max-width:1100px;margin:auto}h1{font-size:26px}p{line-height:1.5}'+
    '.panel{background:white;padding:24px;border-radius:16px;margin:24px 0}'+
    '.pair{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:24px}'+
    'figure{margin:0}figcaption{font-weight:600;margin-bottom:10px}'+
    'img{max-width:100%;width:100%;height:auto;border-radius:8px}'+
    '.overlay{position:relative;width:min(100%,390px);margin:20px auto 8px}'+
    '.overlay .over{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}'+
    'label{display:block;text-align:center}.missing{padding:35px;background:#f4edf1}'+
    '.error{color:#923d3d}pre{overflow:auto;white-space:pre-wrap;font-size:12px}'+
    '</style><main><h1>Section 6 — Dress Code visual audit</h1>'+
    '<p>Reference and local pages captured at matching viewport sizes. Drag the opacity slider to see alignment. '+
    'All screenshots are development-only research artifacts; do not redistribute reference imagery.</p>'+
    cards+'</main></html>';
}
async function main(){
  fs.mkdirSync(OUTPUT,{recursive:true});
  console.log('Section 6 reference comparison — saved to '+OUTPUT);
  console.log('Local '+localUrl+' | Reference '+(localOnly?'skipped':referenceUrl));
  const browser=await chromium.launch({headless:true});
  const screens={};
  try{
    for(const width of WIDTHS){
      const reference=localOnly?{ok:false,error:'--local-only'}:
        await takePage(browser,width,'reference',referenceUrl,false);
      const local=await takePage(browser,width,'local',localUrl,true);
      screens[width]={reference,local,differences:comparison(reference,local)};
    }
  }finally{await browser.close()}
  const report={
    generatedAt:new Date().toISOString(),
    referenceUrl:localOnly?null:referenceUrl,localUrl,
    viewportHeight:HEIGHT,screens
  };
  console.log('\\nMEASURED DIFFERENCES (local minus reference, pixels):');
  for(const width of WIDTHS){
    const row=screens[width];
    const d=row.differences;
    if(!d){console.log('  '+width+'px: comparison unavailable');continue}
    console.log('  '+width+'px: section height '+d.sectionHeight+
      ', heading y '+(d.heading?.y??'unavailable')+
      ', groom title y '+(d.groomTitle?.y??'unavailable')+
      ', bride title y '+(d.brideTitle?.y??'unavailable'));
  }
  fs.writeFileSync(path.join(OUTPUT,'measurements.json'),JSON.stringify(report,null,2));
  fs.writeFileSync(path.join(OUTPUT,'comparison.html'),reportHtml(report));
  console.log('\nOpen artifacts/section6-compare/comparison.html in Chrome.');
  console.log('Measurements: artifacts/section6-compare/measurements.json');
  if(Object.values(screens).some(s=>!s.local.ok||(!localOnly&&!s.reference.ok))){
    console.error('Some screenshots could not be captured; see errors in measurements.json.');
    process.exitCode=1;
  }
}
main().catch(error=>{console.error(error);process.exitCode=1});
