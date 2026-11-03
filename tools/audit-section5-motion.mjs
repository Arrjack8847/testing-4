import { chromium } from '@playwright/test';
import fs from 'node:fs';
const out='section5-motion-evidence';
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
const page=await context.newPage();
const result={target:'https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en',viewport:'390x844',screens:[],samples:[],errors:[]};
page.on('pageerror',err=>result.errors.push(String(err)));
try{
  const response=await page.goto(result.target,{waitUntil:'domcontentloaded',timeout:55000});
  result.status=response?.status()??null;
  await page.waitForTimeout(2000);
  const btn=page.getByRole('button',{name:'Open Invitation'});
  for(let i=0;i<await btn.count();i++){
    if(await btn.nth(i).isVisible()) {await btn.nth(i).click();break;}
  }
  await page.waitForTimeout(2200);
  const heading=page.getByText('Order of the Day',{exact:true}).first();
  await heading.waitFor({state:'attached',timeout:12000});
  const loc=await heading.evaluate(el=>el.getBoundingClientRect().top+scrollY);
  result.headingY=loc;
  for(const stage of [{label:'entry',offset:-390},{label:'center',offset:60},{label:'exit',offset:400}]){
    await page.evaluate(y=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo({top:y,behavior:'instant'})},Math.max(0,Math.round(loc+stage.offset)));
    await page.waitForTimeout(260);
    for(const [label,delay] of [['immediate',0],['after1s',1000],['after3s',2000]]){
      if(delay)await page.waitForTimeout(delay);
      const measurement=await page.evaluate(()=>{
        const short=(v,n=140)=>String(v??'').slice(0,n);
        const rect=el=>{const r=el.getBoundingClientRect();return {x:+r.x.toFixed(1),y:+r.y.toFixed(1),w:+r.width.toFixed(1),h:+r.height.toFixed(1)}};
        const visible=el=>{const r=el.getBoundingClientRect();const s=getComputedStyle(el);return r.width>2&&r.height>2&&r.bottom>0&&r.top<innerHeight&&s.visibility!=='hidden'&&s.display!=='none'&&Number(s.opacity)>0.02};
        const section=[...document.querySelectorAll('*')].find(el=>el.classList?.contains('cgv-timeline'));
        const descendants=section?[...section.querySelectorAll('*')]:[];
        const animated=[...document.querySelectorAll('*')].filter(el=>{
          if(!visible(el))return false;
          const st=getComputedStyle(el);
          return st.animationName!=='none'||st.transitionDuration!=='0s'
            ||/(petal|butter|bfly|particle|flutter|float|wind)/i.test((typeof el.className==='string'?el.className:'')+' '+(el.getAttribute('style')||''));
        }).slice(0,95).map(el=>{
          const st=getComputedStyle(el),r=rect(el);
          return {tag:el.tagName,cl:short(el.className,100),id:el.id||'',
            text:short(el.textContent?.trim().replace(/\s+/g,' '),45),rect:r,
            animation:st.animationName,duration:st.animationDuration,delay:st.animationDelay,play:st.animationPlayState,
            transform:st.transform,opacity:st.opacity,filter:st.filter,
            background:short(st.backgroundImage,180),position:st.position};
        });
        const images=[...document.images].filter(el=>{
          const src=el.currentSrc||el.src||'';
          return /bfly|petal|leaf|flower|plum|particle/i.test(src) || visible(el)&&/(butter|bfly|float)/i.test(el.className+'');
        }).slice(0,50).map(el=>{
          const st=getComputedStyle(el);
          return {src:short(el.currentSrc||el.src,220),cl:short(el.className,90),
            natural:[el.naturalWidth,el.naturalHeight],rect:rect(el),
            animation:st.animationName,transform:st.transform,opacity:st.opacity,
            display:st.display,position:st.position};
        });
        const keyframes=[...document.getAnimations()].filter(anim=>{
          const target=anim.effect?.target;
          if(!target)return false;
          const cl=typeof target.className==='string'?target.className:'';
          return visible(target)&&(/butter|bfly|petal|leaf|float|particle/i.test(cl)||descendants.includes(target));
        }).slice(0,18).map(anim=>({
          name:anim.animationName||'',state:anim.playState,progress:anim.effect?.getComputedTiming().progress,
          target:short(anim.effect?.target?.className,80),
          timing:anim.effect?.getTiming(),keyframes:anim.effect?.getKeyframes()?.slice(0,9).map(f=>({offset:f.offset,opacity:f.opacity,transform:f.transform,filter:f.filter}))
        }));
        const timeline=section?{rect:rect(section),style:{background:getComputedStyle(section).backgroundImage,position:getComputedStyle(section).position},
          nodeClasses:descendants.slice(0,65).map(el=>short(el.className,70)).filter(Boolean)}:null;
        const canvases=[...document.querySelectorAll('canvas')].filter(visible).slice(0,10).map(el=>({className:short(el.className,80),rect:rect(el),width:el.width,height:el.height}));
        return {scrollY,now:Math.round(performance.now()),timeline,animated,images,keyframes,canvases};
      });
      result.samples.push({stage:stage.label,label,...measurement});
      const path=out+'/'+stage.label+'-'+label+'.png';
      await page.screenshot({path,animations:'allow'});
      result.screens.push(path);
      console.log('MOTION_SAMPLE '+JSON.stringify({
        stage:stage.label,label,scrollY:measurement.scrollY,timeline:measurement.timeline?.rect,
        animated:measurement.animated.slice(0,10).map(x=>({cl:x.cl,animation:x.animation,rect:x.rect})),
        images:measurement.images.map(x=>({src:x.src,cl:x.cl,rect:x.rect,transform:x.transform,opacity:x.opacity})).slice(0,12),
        keyframes:measurement.keyframes.length,canvases:measurement.canvases.length
      }));
    }
  }
  fs.writeFileSync(out+'/measurements.json',JSON.stringify(result,null,2));
  console.log('MOTION_AUDIT_SUMMARY '+JSON.stringify({http:result.status,headingY:result.headingY,
    samples:result.samples.length, errors:result.errors,images:[...new Set(result.samples.flatMap(s=>s.images.map(i=>i.src)))].slice(0,30),
    animationNames:[...new Set(result.samples.flatMap(s=>s.animated.map(a=>a.animation)))].slice(0,40)}));
} catch(err) {
  result.fatal=String(err);
  fs.writeFileSync(out+'/measurements.json',JSON.stringify(result,null,2));
  console.error('MOTION_AUDIT_FAILED',result.fatal);
  process.exitCode=1;
} finally {await browser.close();}
