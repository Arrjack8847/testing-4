'use strict';
// Tasik Kayangan reference Section 5: Order of the Day.
// The default illustration is original; source-hosted comparison art is opt-in only.
(() => {
  const invite=document.getElementById('invitation');
  const section=document.getElementById('runningOrder');
  if (!invite || !section) return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const query=new URLSearchParams(location.search);
  const legacy=document.getElementById('saveTheDate');
  // Existing date-only countdown duplicates the second-accurate Events clock.
  // Keep it in the DOM for past demonstrations, hidden in reference sequence.
  if (legacy && query.get('legacySaveDate')==='1') legacy.hidden=false;

  function syncCover(){
    const closed=invite.dataset.state!=='opened';
    section.inert=closed;
    section.setAttribute('aria-hidden',String(closed));
    if(closed)section.style.setProperty('--order-stage-y','0px');
    else schedule();
  }
  syncCover();
  new MutationObserver(()=>{syncCover();updateAmbient();}).observe(invite,{attributes:true,attributeFilter:['data-state']});

  if (query.get('orderReference')==='1') {
    // Development preview only. Reference artwork must be supplied locally by
    // a user with permission. Never hotlink or silently fetch vendor images.
    section.dataset.art='reference';
    section.dataset.assetSource='local-webp';
    const assetRoot='./assets/reference-dev/';
    const images=[
      [document.getElementById('orderSourceBand'),'bandStatus',assetRoot+'band_plum.webp'],
      [document.getElementById('orderSourceButterfly'),'butterflyStatus',assetRoot+'bfly_blush.webp']
    ];
    for (const [img,key,url] of images) {
      if (!img) continue;
      section.dataset[key]='loading';
      img.addEventListener('load',()=>{section.dataset[key]=img.naturalWidth>0?'loaded':'failed';updateAmbient();},{once:true});
      img.addEventListener('error',()=>{section.dataset[key]='failed';updateAmbient();},{once:true});
      img.src=url;
    }
  }

  const reveals=[...section.querySelectorAll('.order-reveal')];
  const observer='IntersectionObserver' in window
    ? new IntersectionObserver(entries=>{
        for(const entry of entries){
          entry.target.classList.toggle('order-in-view',entry.isIntersecting);
        }
      },{threshold:0.02,rootMargin:'20px 0px 0px 0px'})
    : null;
  if(observer)reveals.forEach(el=>observer.observe(el));
  else reveals.forEach(el=>el.classList.add('order-in-view'));

  // Source observation: the timeline butterfly is a 46×35px paired-wing
  // WebP with two 23px halves. It traverses left-to-right (~44px/second),
  // then returns. The source's petals are drawn on a fixed 300px-wide canvas.
  // This is an independent implementation, not copied vendor animation code.
  const butterfly=section.querySelector('#orderButterflyFlight');
  const wings=butterfly ? [...butterfly.querySelectorAll('.order-bf-wing')] : [];
  const canvas=section.querySelector('#orderPetalCanvas');
  const ctx=canvas?.getContext('2d', {alpha:true}) || null;
  let petalVisible=false;
  let petalFrame=0;
  let lastFrame=0;
  let elapsed=0;
  let canvasWidth=0;
  let canvasHeight=0;
  const colors=['#e4cadd','#f5e4e9','#ac8baa','#d7b0cb','#ead8e6'];
  // Each petal has a fixed deterministic seed; no random jitter or
  // new particle allocation is performed on individual animation frames.
  const particles=Array.from({length:8},(_,i)=>({
    x:((i*0.61803398875+.13)%1),y:((i*.38196601125+.26)%1),
    speed:11+(i%4)*5,phase:i*2.17,size:1.8+(i%3)*.55,
    color:colors[i%colors.length]
  }));
  if(ctx)section.dataset.petalRenderer='canvas';

  function resizeCanvas(){
    if(!canvas || !ctx)return;
    const w=Math.min(300,Math.max(1,Math.round(innerWidth)));
    const h=Math.max(1,Math.round(innerHeight));
    const ratio=Math.min(devicePixelRatio||1,2);
    if(w===canvasWidth && h===canvasHeight && canvas.width===Math.round(w*ratio))return;
    canvasWidth=w;canvasHeight=h;
    canvas.style.width=w+'px';canvas.style.height=h+'px';
    canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);
    ctx.clearRect(0,0,w,h);
  }
  function paintPetals(t){
    if(!ctx)return;
    ctx.clearRect(0,0,canvasWidth,canvasHeight);
    const range=canvasHeight+90;
    for(const petal of particles){
      const x=petal.x*canvasWidth+Math.sin(t*.85+petal.phase)*14;
      const y=((petal.y*range+t*petal.speed)%range)-40;
      const a=.16+.15*(.5+.5*Math.sin(t*1.25+petal.phase));
      ctx.save();
      ctx.translate(x,y);
      ctx.rotate(Math.sin(t*1.8+petal.phase)*1.1+petal.phase*.3);
      ctx.globalAlpha=a;
      ctx.fillStyle=petal.color;
      ctx.beginPath();
      ctx.moveTo(0,-petal.size*2.0);
      ctx.bezierCurveTo(petal.size*2,-petal.size*.7,petal.size*1.4,petal.size*1.3,0,petal.size*2.3);
      ctx.bezierCurveTo(-petal.size*1.5,petal.size*.7,-petal.size*1.8,-petal.size*.5,0,-petal.size*2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
  function paintButterfly(t){
    if(!butterfly)return;
    // Source measurements: x=-68 -> -30 -> +44 over ~3s while entering,
    // then near the far-right edge later; use a smooth reversing traversal.
    const left=-70;
    const right=section.clientWidth+70;
    const span=right-left;
    const travel=(t*44)%(span*2);
    const outbound=travel<=span;
    const x=outbound?left+travel:right-(travel-span);
    const y=54+Math.sin(t*1.18)*7+Math.sin(t*2.6)*3;
    const rotation=(outbound?1.27:-1.43)+Math.sin(t*2.05)*.16;
    butterfly.style.transform='translate3d('+x.toFixed(2)+'px,'+y.toFixed(2)+'px,0) translate(-50%,-50%) rotate('+rotation.toFixed(4)+'rad) scale(.82)';
    butterfly.dataset.x=x.toFixed(2);
    butterfly.dataset.direction=outbound?'right':'left';
    const flap=17+54*Math.abs(Math.sin(t*17.5));
    if(wings[0])wings[0].style.transform='perspective(110px) rotateY('+flap.toFixed(2)+'deg)';
    if(wings[1])wings[1].style.transform='perspective(110px) rotateY('+(-flap).toFixed(2)+'deg)';
  }
  function animateAmbient(now){
    petalFrame=0;
    if(!canAnimateAmbient())return;
    const dt=lastFrame?Math.min((now-lastFrame)/1000,.06):0;
    lastFrame=now;
    elapsed+=dt;
    paintPetals(elapsed);
    paintButterfly(elapsed);
    petalFrame=requestAnimationFrame(animateAmbient);
  }
  function canAnimateAmbient(){
    return petalVisible && invite.dataset.state==='opened'
      && !document.hidden && !reduced.matches;
  }
  function updateAmbient(){
    const active=canAnimateAmbient();
    section.classList.toggle('order-visible',petalVisible && invite.dataset.state==='opened');
    section.dataset.petalMotion=active?'running':(reduced.matches?'still':'paused');
    section.dataset.butterflyMotion=section.dataset.butterflyStatus==='loaded'
      ? (active?'running':'paused') : 'unavailable';
    if(active){
      if(!petalFrame){
        lastFrame=0;
        petalFrame=requestAnimationFrame(animateAmbient);
      }
    }else{
      if(petalFrame){cancelAnimationFrame(petalFrame);petalFrame=0;}
      lastFrame=0;
      if(ctx){
        if(reduced.matches && petalVisible && invite.dataset.state==='opened')paintPetals(elapsed);
        else ctx.clearRect(0,0,canvasWidth,canvasHeight);
      }
    }
  }
  resizeCanvas();
  paintButterfly(0);
  if('IntersectionObserver' in window){
    const ambientObserver=new IntersectionObserver(entries=>{
      petalVisible=entries.some(entry=>entry.isIntersecting);
      updateAmbient();
    },{threshold:0,rootMargin:'80px 0px'});
    ambientObserver.observe(section);
  }else{petalVisible=true;}
  addEventListener('resize',()=>{resizeCanvas();updateAmbient();},{passive:true});
  document.addEventListener('visibilitychange',updateAmbient);
  reduced.addEventListener?.('change',updateAmbient);
  updateAmbient();

  let frame=0;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function paint(){
    frame=0;
    const rect=section.getBoundingClientRect();
    const travel=clamp(-rect.top,0,Math.max(0,rect.height-innerHeight));
    const camera=reduced.matches?0:clamp(-rect.top*.0427,-20,24);
    if (invite.dataset.state!=='opened')return;
    section.style.setProperty('--order-stage-y',(travel+camera).toFixed(2)+'px');
    section.dataset.orderCamera=camera.toFixed(2);
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(paint)}
  function motionChanged(){
    if(reduced.matches){
      section.removeAttribute('data-reveal-ready');
      section.style.setProperty('--order-stage-y','0px');
      if(frame){cancelAnimationFrame(frame);frame=0;}
    }else{
      if(observer)section.dataset.revealReady='true';
      schedule();
    }
  }
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  reduced.addEventListener?.('change',motionChanged);
  motionChanged();
})();
