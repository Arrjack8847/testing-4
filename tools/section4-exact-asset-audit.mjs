// Section 4 original asset inventory. Read-only inspection of the public
// reference and localhost prototype, at all four supported phone sizes.
// Does not copy, download, redistribute or embed artwork from the provider.
// Usage: node tools/section4-exact-asset-audit.mjs
// Requires: npm install; npx playwright install chromium; localhost:8000 running.
// Files written only under the gitignored section4-exact-audit/ directory.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const referenceUrl = process.env.SECTION4_REFERENCE_URL ||
  'https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en';
const localUrl = process.env.SECTION4_LOCAL_URL || 'http://127.0.0.1:8000/';
const outDir = 'section4-exact-audit';
const sizes = [[320,568], [360,740], [390,844], [430,932]];
const sites = [
  {name:'reference', url:referenceUrl, selector:'#cgv-events'},
  {name:'local', url:localUrl, selector:'#eventDetails'}
];
const report = {
  generatedAt:new Date().toISOString(),
  methodology:'Live computed image URLs, resource responses, and visible fonts at four phone sizes',
  note:'URL/filename matches are not byte-identity proofs; this audit does not establish 1:1 raster parity or asset permission.',
  entries:[], differences:[], errors:[]
};
const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
try {
  for (const [width,height] of sizes) {
    const results = {};
    for (const site of sites) {
      const context = await browser.newContext({
        viewport:{width,height},deviceScaleFactor:1,isMobile:true,
        hasTouch:true,reducedMotion:'reduce'
      });
      const page = await context.newPage();
      const responses = new Map();
      const failures = [];
      page.on('response',res=>responses.set(res.url(),{status:res.status(),type:res.request().resourceType()}));
      page.on('requestfailed',req=>failures.push({
        url:req.url(),error:req.failure()?.errorText||'failed'
      }));
      try {
        await page.goto(site.url,{waitUntil:'domcontentloaded',timeout:60000});
        const open = page.getByRole('button',{name:'Open Invitation',exact:true}).first();
        if(await open.count()){
          try {await open.click({timeout:12000});}
          catch(error){failures.push({url:'open invitation',error:String(error).slice(0,180)});}
        }
        await page.evaluate(selector=>{
          const el=document.querySelector(selector);
          if(!el)throw Error('Events section missing: '+selector);
          document.documentElement.style.scrollBehavior='auto';
          el.scrollIntoView({block:'start',behavior:'instant'});
        },site.selector);
        await page.waitForTimeout(1300);
        await page.evaluate(()=>document.fonts.ready);
        const inventory = await page.evaluate(selector=>{
          const section=document.querySelector(selector);
          if(!section)return {error:'missing Events section'};
          const origin=location.href;
          const assetMap=new Map();
          const fontMap=new Map();
          const cssDrawing=[];
          let canvasCount=0;
          let inlineSvgCount=0;
          let animatedElementCount=0;
          const visited=[section,...section.querySelectorAll('*')];
          const urlPattern=/url\(\s*['"]?([^"')]+)['"]?\s*\)/gi;
          function addAsset(raw,role,tag,pseudo){
            if(!raw)return;
            const cleaned=String(raw).trim();
            if(cleaned.startsWith('data:')){
              const key='inline:'+cleaned.slice(0,45);
              const asset=assetMap.get(key)||{url:'[inline data URI]',filename:'[inline]',roles:[],occurrences:0};
              asset.occurrences++;
              if(asset.roles.length<8)asset.roles.push({role,tag,pseudo});
              assetMap.set(key,asset);return;
            }
            let url;
            try{url=new URL(cleaned,origin).href;}catch{return;}
            const filename=url.split('/').pop().split('?')[0];
            const asset=assetMap.get(url)||{url,filename,roles:[],occurrences:0};
            asset.occurrences++;
            if(asset.roles.length<8)asset.roles.push({role,tag,pseudo});
            assetMap.set(url,asset);
          }
          function scanStyle(el,pseudo){
            const style=getComputedStyle(el,pseudo);
            for(const field of ['backgroundImage','borderImageSource','maskImage','webkitMaskImage','listStyleImage','content']){
              const val=style[field]||'';
              urlPattern.lastIndex=0;
              for(let match;(match=urlPattern.exec(val));)addAsset(match[1],field,el.tagName,pseudo||'element');
            }
            if(!pseudo && style.display!=='none' && style.visibility!=='hidden'){
              const text=(el.textContent||'').trim();
              if(text && el.children.length<2){
                const key=[style.fontFamily,style.fontWeight,style.fontSize].join(' | ');
                fontMap.set(key,(fontMap.get(key)||0)+1);
              }
              if(el.tagName==='I' && style.backgroundImage==='none' &&
                 style.animationName!=='none' && el.getBoundingClientRect().width>0){
                cssDrawing.push({className:el.className,animation:style.animationName,
                  width:style.width,height:style.height,borderRadius:style.borderRadius});
              }
            }
          }
          for(const el of visited){
            if(['SCRIPT','STYLE','NOSCRIPT'].includes(el.tagName))continue;
            if(el.tagName==='CANVAS')canvasCount++;
            if(el.tagName.toLowerCase()==='svg')inlineSvgCount++;
            const motion=getComputedStyle(el).animationName;
            if(motion && motion!=='none')animatedElementCount++;
            if(el.tagName==='IMG')addAsset(el.currentSrc||el.src,'image src',el.tagName,'element');
            if(el.tagName==='SOURCE')addAsset(el.src,'source src',el.tagName,'element');
            if(el.tagName==='VIDEO')addAsset(el.poster,'video poster',el.tagName,'element');
            if(['image','use'].includes(el.localName)) {
              const href=el.getAttribute('href')||el.getAttribute('xlink:href');
              if(href && !href.startsWith('#'))addAsset(href,'svg href',el.tagName,'element');
            }
            scanStyle(el,null);
            scanStyle(el,'::before');
            scanStyle(el,'::after');
          }
          return {
            sectionHeight:Math.round(section.getBoundingClientRect().height*10)/10,
            elementCount:visited.length,
            assets:[...assetMap.values()].sort((a,b)=>a.url.localeCompare(b.url)),
            visibleFonts:[...fontMap].map(([name,count])=>({name,count})),
            cssDrawnMovingElements:cssDrawing.slice(0,50),
            cssDrawingTotal:cssDrawing.length,
            canvasCount,inlineSvgCount,animatedElementCount
          };
        },site.selector);
        for(const asset of inventory.assets||[]){
          asset.httpStatus=responses.get(asset.url)?.status??null;
          asset.requestFailure=failures.find(x=>x.url===asset.url)?.error||null;
        }
        inventory.fontNetworkResources=[...responses].filter(([,value])=>value.type==='font').map(([url,value])=>({url,status:value.status}));
        results[site.name]=inventory;
        report.entries.push({site:site.name,width,height,inventory,
          requestFailures:failures.slice(0,30)});
        console.log('SECTION4_ASSET_INVENTORY '+JSON.stringify({
          site:site.name,width,height,assets:inventory.assets?.map(a=>a.filename),
          fonts:inventory.visibleFonts,drawn:inventory.cssDrawingTotal,
          inlineSvg:inventory.inlineSvgCount,canvas:inventory.canvasCount,
          animated:inventory.animatedElementCount,
          error:inventory.error
        }));
      }catch(error){
        const message=String(error).slice(0,750);
        results[site.name]={error:message};
        report.errors.push({site:site.name,width,height,error:message});
        console.error('SECTION4_AUDIT_ERROR '+site.name+' '+width+' '+message);
      }finally{
        await context.close();
      }
    }
    const original=results.reference.assets||[];
    const local=results.local.assets||[];
    const localNames=new Set(local.map(x=>x.filename));
    const sourceNames=new Set(original.map(x=>x.filename));
    report.differences.push({
      width,height,
      referenceAssetsNotMatchedByFilename:original.filter(x=>!localNames.has(x.filename)),
      localAssetsNotFoundInReference:local.filter(x=>!sourceNames.has(x.filename)),
      referenceFontVariants:results.reference.visibleFonts||[],
      localFontVariants:results.local.visibleFonts||[],
      referenceCssDrawnElements:results.reference.cssDrawingTotal??null,
      referenceInlineSvgs:results.reference.inlineSvgCount??null,
      localInlineSvgs:results.local.inlineSvgCount??null,
      referenceCanvasElements:results.reference.canvasCount??null,
      localCanvasElements:results.local.canvasCount??null,
      referenceFontNetworkResources:results.reference.fontNetworkResources||[],
      localFontNetworkResources:results.local.fontNetworkResources||[],
      localCssDrawnElements:results.local.cssDrawingTotal??null,
      referenceError:results.reference.error||null,
      localError:results.local.error||null
    });
  }
}finally{
  await browser.close();
  await mkdir(outDir,{recursive:true});
  await writeFile(outDir+'/section4-original-assets.json',JSON.stringify(report,null,2)+'\n');
}
console.log('Section 4 asset report: '+outDir+'/section4-original-assets.json');
if(report.errors.length){
  console.error('Incomplete source/local inspection: '+report.errors.length+' issue(s). No exact-match claim.');
  process.exitCode=2;
} else if(report.differences.some(x=>x.referenceAssetsNotMatchedByFilename.length)){
  console.error('Reference assets remain unmatched. Compare JSON inventory before modifying artwork.');
  process.exitCode=1;
} else{
  console.log('All observed asset filenames matched. Verify byte hashes and screenshots separately.');
}
