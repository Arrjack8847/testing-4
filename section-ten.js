'use strict';
// Section 10 only. Never touches other sections' DOM, motion clocks or cameras.
(() => {
  const section=document.getElementById('closingMessage');
  const invitation=document.getElementById('invitation');
  if(!section||!invitation)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible=false,raf=0,revealed=false;
  const ready=()=>invitation.dataset.state==='opened'&&!document.hidden;
  const stop=()=>{
    if(raf){cancelAnimationFrame(raf);raf=0;}
    section.dataset.active='false';
  };
  const paint=()=>{
    raf=0;
    if(!visible||!ready()){stop();return;}
    section.dataset.active=reduced.matches?'false':'true';
    if(reduced.matches){section.style.setProperty('--closing10-sticky-y','0px');return;}
    const rect=section.getBoundingClientRect();
    const travel=Math.max(0,section.offsetHeight-window.innerHeight);
    const offset=Math.max(0,Math.min(travel,-rect.top));
    section.style.setProperty('--closing10-sticky-y',offset.toFixed(2)+'px');
  };
  const schedule=()=>{if(!raf&&visible&&ready())raf=requestAnimationFrame(paint);};
  const syncMotion=()=>{
    if(reduced.matches){
      section.removeAttribute('data-motion-ready');
      section.dataset.revealed='true';
      stop();
      section.style.setProperty('--closing10-sticky-y','0px');
    }else{
      section.dataset.motionReady='true';
      if(revealed)section.dataset.revealed='true';
      schedule();
    }
  };
  const observer='IntersectionObserver' in window
    ?new IntersectionObserver(entries=>{
      for(const entry of entries){
        if(entry.target!==section)continue;
        visible=entry.isIntersecting&&entry.intersectionRect.height>0;
        if(visible&&ready()){
          if(!revealed){revealed=true;section.dataset.revealed='true';}
          schedule();
        }else stop();
      }
    },{threshold:0,rootMargin:'0px'})
    :null;
  if(observer)observer.observe(section);
  else{visible=true;revealed=true;section.dataset.revealed='true';}
  const onScroll=()=>{if(visible)schedule();};
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else schedule();});
  const stateObserver=new MutationObserver(()=>{
    if(!ready())stop();
    else if(visible){revealed=true;section.dataset.revealed='true';schedule();}
  });
  stateObserver.observe(invitation,{attributes:true,attributeFilter:['data-state']});
  if(reduced.addEventListener)reduced.addEventListener('change',syncMotion);
  else if(reduced.addListener)reduced.addListener(syncMotion);
  // Third-party artwork must only be used in this developer-only mode after
  // obtaining appropriate permission and staging the WebP in Git-ignored
  // assets/reference-dev. The public prototype always uses original artwork.
  section.dataset.artwork='original';
  if(new URLSearchParams(location.search).get('section10LicensedArt')==='1'){
    const img=section.querySelector('.closing10-source-scene');
    if(img){
      img.onload=()=>{section.dataset.artwork='licensed-local';};
      img.onerror=()=>{section.dataset.artwork='original';};
      img.src='./assets/reference-dev/scene.webp';
    }
  }
  syncMotion();
})();
