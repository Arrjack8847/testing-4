'use strict';
// Section 6 — Dress Code: local original-reference WebP wing artwork,
// scroll-calibrated paper, accessible reveals, and reduced-motion fallback.
(() => {
  const invitation=document.getElementById('invitation');
  const section=document.getElementById('dressCode');
  const flight=document.getElementById('dressFlight');
  if(!invitation || !section)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  // Use the approved artwork as real repository files, never external URLs.
  // paper.webp is exactly the source 1080x1920 artwork.
  section.dataset.art='local-webp';
  const paper=document.getElementById('dressSourceScene');
  let artworkActive=false;
  const activateArtwork=()=>{
    if(!paper)return;
    artworkActive=true;
    section.dataset.sceneStatus='loading';
    paper.onload=()=>{
      if(artworkActive)section.dataset.sceneStatus=paper.naturalWidth>0?'loaded':'failed';
    };
    paper.onerror=()=>{
      if(artworkActive)section.dataset.sceneStatus='failed';
    };
    paper.src='./assets/section6/paper.webp';
  };
  const releaseArtwork=()=>{
    artworkActive=false;
    if(paper){
      paper.onload=null;
      paper.onerror=null;
      paper.removeAttribute('src');
    }
    section.dataset.sceneStatus='deferred';
  };
  section.dataset.sceneStatus='deferred';
  if(window.MobileArtworkLifecycle)
    window.MobileArtworkLifecycle.register(section,{
      activate:activateArtwork,release:releaseArtwork
    });
  else activateArtwork();

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
    const travel=17,rest=.8,passLength=travel+rest,cycle=passLength*4;
    if(seconds<initialDelay){
      section.removeAttribute('data-flight-ready');
    }else{
      const p=(seconds-initialDelay)%cycle;
      const pass=Math.floor(p/passLength);
      const t=p-pass*passLength;
      const scale=1; // Source butterfly uses a fixed 52×41px wrapper.
      // The reference alternates high flights (~50px from the top) and
      // low flights (~600–625px at 390/320 widths), with either direction.
      const lowerLane=pass===0||pass===3;
      const rightToLeft=pass%2===0;
      let x,y,angle;
      if(t<travel){
        if(rightToLeft){
          x=rect.width+36-(rect.width+101)*t/travel;
          angle=-67+6*Math.sin(t*.85);
        }else{
          x=-85+(rect.width+143)*t/travel;
          angle=69+7*Math.sin(t*.8);
        }
        y=lowerLane
          ?rect.height-81+7*Math.sin(t*1.9)+.35*t
          :55-1.4*t+6*Math.sin(t*2.1);
      }else{
        x=rightToLeft?-100:rect.width+80;
        y=lowerLane?rect.height-78:45;
        angle=rightToLeft?-67:69;
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
