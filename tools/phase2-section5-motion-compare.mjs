import {chromium} from '@playwright/test';
import fs from 'node:fs';
import {spawn} from 'node:child_process';

const folder='section5-phase2-motion-evidence';
fs.mkdirSync(folder,{recursive:true});
const server=spawn('python3',['-m','http.server','8000','--bind','127.0.0.1'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,1000));
const browser=await chromium.launch({headless:true});
const viewport={width:390,height:844};
const targets=[
 {id:'reference',url:'https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en',selector:'.cgv-timeline'},
 {id:'local',url:'http://127.0.0.1:8000/',selector:'#runningOrder'}
];
const report={checkedAt:new Date().toISOString(),viewport,targets:[],comparisons:[]};
function average(arr){return arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:null}
try{
  for(const target of targets){
    const context=await browser.newContext({viewport,isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:'no-preference'});
    const page=await context.newPage();
    const item={id:target.id,measurements:[],errors:[]};
    report.targets.push(item);
    page.on('pageerror',err=>item.errors.push(err.message));
    try{
      const response=await page.goto(target.url,{waitUntil:'domcontentloaded',timeout:60000});
      item.http=response?.status();
      await page.waitForTimeout(2200);
      const btn=page.getByRole('button',{name:'Open Invitation'});
      for(let k=0;k<await btn.count();k++){if(await btn.nth(k).isVisible()){await btn.nth(k).click();break;}}
      await page.waitForTimeout(2100);
      await page.evaluate(({selector})=>{
        document.documentElement.style.scrollBehavior='auto';
        const el=document.querySelector(selector);
        if(!el)throw Error('Timeline absent');
        el.scrollIntoView({block:'start',behavior:'instant'});
      },target);
      await page.waitForTimeout(300);
      for(const [position,offset] of [['start',0],['mid',215],['exit',470]]){
        await page.evaluate(({selector,offset})=>{
          const el=document.querySelector(selector);
          scrollTo({top:el.getBoundingClientRect().top+scrollY+offset,behavior:'instant'});
        },{selector:target.selector,offset});
        await page.waitForTimeout(300);
        for(const [moment,delay] of [['t0',0],['t1',1100],['t3',2000],['t5',2100]]){
          if(delay)await page.waitForTimeout(delay);
          const data=await page.evaluate(({selector,id})=>{
            const el=document.querySelector(selector);
            const parent=el.getBoundingClientRect();
            const rect=e=>{const r=e.getBoundingClientRect();return {x:+r.x.toFixed(2),y:+r.y.toFixed(2),w:+r.width.toFixed(2),h:+r.height.toFixed(2)}};
            const element=e=>!e?null:{
              rect:rect(e),relative:{x:+(e.getBoundingClientRect().x-parent.x).toFixed(2),y:+(e.getBoundingClientRect().y-parent.y).toFixed(2)},
              transform:getComputedStyle(e).transform,inline:e.style.transform,
              opacity:getComputedStyle(e).opacity,display:getComputedStyle(e).display,
              wings:[...e.querySelectorAll('i')].map(w=>({inline:w.style.transform,background:getComputedStyle(w).backgroundImage.slice(0,140)}))
            };
            const sprite=el.querySelector(id==='reference'?'.cgv-bf':'#orderButterflyFlight');
            const layers=[...el.querySelectorAll(id==='reference'?'.cgv-bf-layer':'.order-stage')];
            const canvas=document.querySelector(id==='reference'?'canvas.cgv-petals':'#orderPetalCanvas');
            let colored=null;
            try{
              if(canvas){
                const ctx=canvas.getContext('2d');
                if(ctx){
                  const d=ctx.getImageData(0,0,canvas.width,canvas.height).data;
                  let count=0,opacity=0;
                  for(let i=3;i<d.length;i+=4){if(d[i]){count++;opacity+=d[i]}}
                  colored={nontransparentPixels:count,averageAlpha:count?+(opacity/count).toFixed(1):0,area:canvas.width*canvas.height};
                }
              }
            }catch(e){colored={error:String(e)}}
            return {scrollY,section:rect(el),
              sprite:element(sprite),layer:layers.map(rect),
              canvas:canvas?{rect:rect(canvas),width:canvas.width,height:canvas.height,colored}:null,
              state:id==='local'?{
                petalMotion:el.dataset.petalMotion,butterflyMotion:el.dataset.butterflyMotion,
                butterflyX:sprite?.dataset.x,orderCamera:el.dataset.orderCamera
              }:null
            };
          },{selector:target.selector,id:target.id});
          item.measurements.push({position,moment,...data});
          if(moment==='t0'||moment==='t3')await page.screenshot({path:folder+'/'+target.id+'-'+position+'-'+moment+'.png',animations:'allow'});
          console.log('PHASE2_SAMPLE '+JSON.stringify({
            id:target.id,position,moment,scrollY:data.scrollY,
            sprite:data.sprite&&{relative:data.sprite.relative,rect:data.sprite.rect,transform:data.sprite.inline,opacity:data.sprite.opacity},
            petals:data.canvas?.colored,state:data.state
          }));
        }
      }
      item.status='captured';
      console.log('PHASE2_TARGET '+JSON.stringify({id:item.id,http:item.http,samples:item.measurements.length,errors:item.errors}));
    }catch(e){item.status='error';item.error=String(e);console.error('PHASE2_TARGET_ERROR',item.id,item.error)}
    await context.close();
  }
  const [reference,local]=report.targets;
  if(reference.status==='captured'&&local.status==='captured'){
    for(let i=0;i<reference.measurements.length;i++){
      const a=reference.measurements[i],b=local.measurements[i];
      if(a.position!==b.position||a.moment!==b.moment)continue;
      const sx=a.sprite?.relative?.x,lx=b.sprite?.relative?.x;
      const sy=a.sprite?.relative?.y,ly=b.sprite?.relative?.y;
      report.comparisons.push({position:a.position,moment:a.moment,
        butterflyDeltaX:sx!=null&&lx!=null?+(lx-sx).toFixed(2):null,
        butterflyDeltaY:sy!=null&&ly!=null?+(ly-sy).toFixed(2):null,
        referenceVisible:a.sprite?.display!=='none',
        localVisible:b.sprite?.display!=='none',
        petalCoverageReference:a.canvas?.colored?.nontransparentPixels??null,
        petalCoverageLocal:b.canvas?.colored?.nontransparentPixels??null});
    }
  }
  console.log('PHASE2_COMPARISON '+JSON.stringify(report.comparisons));
  fs.writeFileSync(folder+'/motion-report.json',JSON.stringify(report,null,2));
  if(report.targets.some(x=>x.status!=='captured'))process.exitCode=1;
}finally{await browser.close();server.kill('SIGTERM')}
