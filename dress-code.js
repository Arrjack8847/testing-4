'use strict';
// Section 6 — Dress Code: independently illustrated time-driven butterfly,
// scroll-calibrated paper, accessible reveals, and reduced-motion fallback.
(() => {
  const invitation=document.getElementById('invitation');
  const section=document.getElementById('dressCode');
  const flight=document.getElementById('dressFlight');
  if(!invitation || !section)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const query=new URLSearchParams(location.search);

  // Opt-in source paper for developer-side visual comparison only.
  // The default invitation ships with assets/dress-paper-original.svg.
  if(query.get('dressReference')==='1'){
    section.dataset.art='reference';
    const img=document.getElementById('dressSourceScene');
    if(img){
      section.dataset.sceneStatus='loading';
      img.addEventListener('load',()=>{
        section.dataset.sceneStatus=img.naturalWidth>0?'loaded':'failed';
      },{once:true});
      img.addEventListener('error',()=>{section.dataset.sceneStatus='failed'},{once:true});
      img.src='https://undangankahwin.com/images/concierge/packs/tasik-kayangan/paper.webp';
    }
  }

  let cameraFrame=0,flightFrame=0,flightStart=0;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function setFlight(x,y,angle,scale){
    if(!flight)return;
    section.style.setProperty('--dress-flight-x',x.toFixed(2)+'px');
    section.style.setProperty('--dress-flight-y',y.toFixed(2)+'px');
    section.style.setProperty('--dress-flight-rotate',angle.toFixed(2)+'deg');
    section.style.setProperty('--dress-flight-scale',scale.toFixed(3));
    section.dataset.flightReady='true';
  }

  // The reference's butterfly uses a time-based autonomous flight, not a
  // scroll-tied path. Fixed-scroll telemetry found ~30px/s from either
  // direction. Recreate that motion with two alternating original trajectories.
  function frameFlight(now){
    flightFrame=0;
    if(!flight || reduced.matches || invitation.dataset.state!=='opened')return;
    const rect=section.getBoundingClientRect();
    if(rect.bottom < -80 || rect.top > innerHeight+80){
      flightStart=0;
      section.removeAttribute('data-flight-ready');
      return;
    }
    if(!flightStart)flightStart=now;
    const seconds=(now-flightStart)/1000;
    const initialDelay=.7;
    const rightDuration=17,leftDuration=17,rest=.8,cycle=rightDuration+leftDuration+rest*2;
    if(seconds<initialDelay){
      section.removeAttribute('data-flight-ready');
    }else{
      const p=(seconds-initialDelay)%cycle;
      const scale=clamp(.82*rect.width/390,.65,.94);
      let x,y,angle;
      if(p<rightDuration){
        // First pass: fly in from the upper-right toward the left.
        x=rect.width+36-(rect.width+101)*p/rightDuration;
        y=38+(.7*p)+5*Math.sin(p*1.9);
        angle=-67+6*Math.sin(p*.85);
      }else if(p<rightDuration+rest){
        x=-100;y=42;angle=-67;
      }else if(p<rightDuration+rest+leftDuration){
        // Second pass: return from the left, slightly higher at the end.
        const t=p-(rightDuration+rest);
        x=-85+(rect.width+143)*t/leftDuration;
        y=62-3.1*t+6*Math.sin(t*2.1);
        angle=69+7*Math.sin(t*.8);
      }else{
        x=rect.width+80;y=36;angle=69;
      }
      setFlight(x,y,angle,scale);
    }
    flightFrame=requestAnimationFrame(frameFlight);
  }
  function startFlight(){
    if(!flight || flightFrame || reduced.matches || invitation.dataset.state!=='opened')return;
    flightFrame=requestAnimationFrame(frameFlight);
  }
  function stopFlight(){
    if(flightFrame)cancelAnimationFrame(flightFrame);
    flightFrame=0;flightStart=0;
  }
  function paintCamera(){
    cameraFrame=0;
    if(invitation.dataset.state!=='opened')return;
    const rect=section.getBoundingClientRect();
    if(rect.bottom<0 || rect.top>innerHeight)return;
    if(!reduced.matches){
      // Independently measured paper parallax: section-top coefficient .0427.
      const offset=clamp(3.5-rect.top*.0427,-45,45);
      section.style.setProperty('--dress-camera-y',offset.toFixed(2)+'px');
    }
    startFlight();
  }
  function scheduleCamera(){
    if(!cameraFrame)cameraFrame=requestAnimationFrame(paintCamera);
    startFlight();
  }
  function syncCover(){
    const closed=invitation.dataset.state!=='opened';
    section.inert=closed;
    section.setAttribute('aria-hidden',String(closed));
    if(closed){
      section.style.setProperty('--dress-camera-y','0px');
      section.removeAttribute('data-flight-ready');
      stopFlight();
    }else{
      if(reduced.matches){
        const rect=section.getBoundingClientRect();
        setFlight(Math.max(0,rect.width-64),58,0,1);
      }
      scheduleCamera();
    }
  }
  syncCover();
  new MutationObserver(syncCover).observe(invitation,{
    attributes:true,attributeFilter:['data-state']
  });

  const reveals=[...section.querySelectorAll('.dress-reveal')];
  const observer='IntersectionObserver' in window
    ?new IntersectionObserver(entries=>{
      for(const entry of entries)
        entry.target.classList.toggle('dress-in-view',entry.isIntersecting);
    },{threshold:.02,rootMargin:'0px'})
    :null;
  if(observer)reveals.forEach(el=>observer.observe(el));
  else reveals.forEach(el=>el.classList.add('dress-in-view'));

  function onMotionChange(){
    if(reduced.matches){
      section.removeAttribute('data-reveal-ready');
      section.style.setProperty('--dress-camera-y','0px');
      stopFlight();
      const rect=section.getBoundingClientRect();
      if(invitation.dataset.state==='opened')
        setFlight(Math.max(0,rect.width-64),58,0,1);
    }else{
      if(observer)section.dataset.revealReady='true';
      section.removeAttribute('data-flight-ready');
      stopFlight();
      scheduleCamera();
    }
  }
  addEventListener('scroll',scheduleCamera,{passive:true});
  addEventListener('resize',scheduleCamera,{passive:true});
  reduced.addEventListener?.('change',onMotionChange);
  onMotionChange();
})();
