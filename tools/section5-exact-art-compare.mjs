/**
 * Read-only visual audit: live Tasik Kayangan Section 5 vs locally staged
 * permission-cleared source WebPs. Does not download or copy vendor binaries.
 * Requires local http://localhost:8000/ and exact local WebP assets already
 * staged under assets/reference-dev/ with rights to use them.
 *
 * node tools/section5-exact-art-compare.mjs
 * Screenshots and measured positions land in artifacts/section5-exact-compare/.
 */
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

const viewport={width:390,height:844};
const directory='artifacts/section5-exact-compare';
const sites=[
  {id:'reference',url:'https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en',selector:'.cgv-timeline'},
  {id:'local',url:'http://localhost:8000/',selector:'#runningOrder'}
];
const checkpoints=[
  {name:'entry',offset:-380},
  {name:'middle',offset:185},
  {name:'exit',offset:530}
];
await mkdir(directory,{recursive:true});
const browser=await chromium.launch({headless:true});
const report={viewport,checkedAt:new Date().toISOString(),sites:[],checkpoints};
let failure;
try{
  for(const site of sites){
    const page=await browser.newPage({viewport,deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'no-preference'});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    try{
      const response=await page.goto(site.url,{waitUntil:'domcontentloaded',timeout:60000});
      if(!response?.ok())throw Error('HTTP '+response?.status()+' at '+site.url);
      await page.getByRole('button',{name:'Open Invitation'}).first().click({timeout:15000});
      await page.locator(site.selector).first().waitFor({state:'attached',timeout:15000});
      await page.evaluate(()=>document.fonts.ready);
      if(site.id==='local'){
        await page.waitForFunction(()=>{
          const section=document.getElementById('runningOrder');
          return ['ready','partial','missing'].includes(section?.dataset.artworkStatus);
        },{timeout:15000});
        const status=await page.locator(site.selector).getAttribute('data-artwork-status');
        if(status!=='ready'){
          const message=await page.locator('#orderArtworkNotice').textContent();
          throw Error('Exact local WebPs NOT READY: '+status+'. '+message+
            ' Stage licensed assets via download-section5-reference.ps1 -IHavePermission, then retry.');
        }
      }
      const initial=await page.locator(site.selector).evaluate(el=>{
        const r=el.getBoundingClientRect();
        const st=getComputedStyle(el);
        return {
          top:r.top+scrollY,height:r.height,width:r.width,
          background:st.backgroundImage,
          backgroundPosition:st.backgroundPosition,
          backgroundSize:st.backgroundSize,
          backgroundRepeat:st.backgroundRepeat,
          artworkStatus:el.dataset.artworkStatus||null
        };
      });
      // Inventory every image-bearing CSS layer in the visible section
      // (including split-wing sprite layers), not just the outer background.
      // This reads CSS only and never saves vendor files.
      const artwork=await page.locator(site.selector).evaluate(el=>{
        const out=[];
        for(const node of [el,...el.querySelectorAll('*')]){
          for(const pseudo of ['', '::before','::after']){
            const st=getComputedStyle(node,pseudo||null);
            if(!st.backgroundImage.includes('url('))continue;
            const r=node.getBoundingClientRect();
            out.push({
              tag:node.tagName,cls:typeof node.className==='string'?node.className:'',
              pseudo,background:st.backgroundImage,backgroundSize:st.backgroundSize,
              backgroundPosition:st.backgroundPosition,backgroundRepeat:st.backgroundRepeat,
              opacity:st.opacity,zIndex:st.zIndex,position:st.position,
              rect:{x:r.x,y:r.y,width:r.width,height:r.height}
            });
          }
        }
        return out.slice(0,70);
      });
      const record={site:site.id,url:site.url,initial,artwork,images:[],samples:[],errors};
      const urls=[...new Set(artwork.flatMap(layer=>
        [...layer.background.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(match=>match[1])))];
      for(const url of urls){
        const dimensions=await page.evaluate(async url=>{
          const image=new Image();
          image.src=url;
          try{await image.decode();return{width:image.naturalWidth,height:image.naturalHeight,loaded:true};}
          catch{return{width:0,height:0,loaded:false};}
        },url);
        record.images.push({url,...dimensions});
      }
      for(const point of checkpoints){
        // Match relative section positions rather than absolute document Y.
        const y=initial.top+point.offset;
        await page.evaluate(async y=>{
          document.documentElement.style.scrollBehavior='auto';
          scrollTo({top:Math.max(0,Math.round(y)),behavior:'instant'});
          await new Promise(requestAnimationFrame);
          await new Promise(requestAnimationFrame);
        },y);
        await page.waitForTimeout(650);
        const data=await page.locator(site.selector).evaluate(el=>{
          const rect=n=>{const r=n.getBoundingClientRect();return{
            x:+r.x.toFixed(2),y:+r.y.toFixed(2),
            w:+r.width.toFixed(2),h:+r.height.toFixed(2)};};
          const target=[
            ...el.querySelectorAll('.order-eyebrow,.order-heading,.order-entry,.cgv-tl-kicker,.cgv-tl-title,.cgv-tl-row,.cgv-timeline li')
          ].slice(0,30);
          const butterfly=el.querySelector('.cgv-bf,#orderButterflyFlight');
          const style=getComputedStyle(el);
          return {
            scrollY,box:rect(el),backgroundImage:style.backgroundImage,
            backgroundSize:style.backgroundSize,
            backgroundPosition:style.backgroundPosition,
            computedElements:target.map(n=>({cls:n.className,text:n.textContent.trim().slice(0,75),box:rect(n)})),
            butterfly:butterfly?{box:rect(butterfly),transform:getComputedStyle(butterfly).transform}:null,
            source:el.dataset.artworkStatus||null,
            overflow:document.documentElement.scrollWidth-innerWidth
          };
        });
        await page.screenshot({path:directory+'/'+site.id+'-'+point.name+'.png',animations:'disabled'});
        record.samples.push({checkpoint:point.name,requestedY:y,...data});
      }
      report.sites.push(record);
      await page.close();
    }catch(e){failure=e;report.sites.push({site:site.id,url:site.url,error:String(e),errors});await page.close();break;}
  }
}finally{
  await writeFile(directory+'/report.json',JSON.stringify(report,null,2));
  await browser.close();
}
if(failure){console.error(failure.message);process.exitCode=1;}
else console.log('Section 5 reference and local comparison saved in '+directory+
  '. Review the six screenshots; measurements alone cannot prove pixel-perfect parity.');
