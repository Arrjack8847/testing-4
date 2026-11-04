'use strict';
// Section 10 only. Never touches other sections' DOM, motion clocks or cameras.
(() => {
  const section=document.getElementById('closingMessage');
  const invitation=document.getElementById('invitation');
  if(!section||!invitation)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible=false,raf=0,revealed=false,revealRaf=0;
  const ready=()=>invitation.dataset.state==='opened'&&!document.hidden;
  const revealEls=[...section.querySelectorAll('.closing10-reveal')];
  const inner=section.querySelector('.closing10-inner');
  // Compare untransformed layout positions, not animated bounding boxes.
  // Otherwise the 52px reveal translation can re-trigger a hidden element
  // when it crosses the top of the viewport, producing reverse-scroll flicker.
  const syncReveals=()=>{
    revealRaf=0;
    const baseY=inner.getBoundingClientRect().top;
    const viewing=ready();
    // Source activates elements when they reach roughly 85% of viewport height.
    // Read all geometry before changing any attributes to avoid forced relayout
    // between each reveal element on every scroll frame.
    const bottomGate=innerHeight*0.85;
    const visibility=revealEls.map(el=>{
      const top=baseY+el.offsetTop;
      return reduced.matches||(viewing&&top+el.offsetHeight>0&&top<bottomGate);
    });
    for(let i=0;i<revealEls.length;i++){
      const next=String(visibility[i]);
      if(revealEls[i].dataset.inView!==next)revealEls[i].dataset.inView=next;
    }
  };
  const scheduleReveals=()=>{
    if(!revealRaf)revealRaf=requestAnimationFrame(syncReveals);
  };
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
    // Matched 390x844 screenshot measurements show the original scene moves
    // ~4.38% of the closing section's scroll travel while the frame is pinned.
    // This affects only locally staged reference artwork, not the fallback art.
    const sceneY=Math.max(-24,Math.min(16,-5.587-rect.top*0.043788));
    section.style.setProperty('--closing10-scene-y',sceneY.toFixed(2)+'px');
  };
  const schedule=()=>{if(!raf&&visible&&ready())raf=requestAnimationFrame(paint);};
  const syncMotion=()=>{
    if(reduced.matches){
      section.removeAttribute('data-motion-ready');
      section.dataset.revealed='true';
      stop();
      section.style.setProperty('--closing10-sticky-y','0px');
      section.style.setProperty('--closing10-scene-y','0px');
      scheduleReveals();
    }else{
      section.dataset.motionReady='true';
      if(revealed)section.dataset.revealed='true';
      schedule();
      scheduleReveals();
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
        scheduleReveals();
      }
    },{threshold:0,rootMargin:'0px'})
    :null;
  if(observer)observer.observe(section);
  else{visible=true;revealed=true;section.dataset.revealed='true';}
  const onScroll=()=>{if(visible)schedule();scheduleReveals();};
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else schedule();scheduleReveals();});
  const stateObserver=new MutationObserver(()=>{
    if(!ready())stop();
    else if(visible){revealed=true;section.dataset.revealed='true';schedule();}
    scheduleReveals();
  });
  stateObserver.observe(invitation,{attributes:true,attributeFilter:['data-state']});
  if(reduced.addEventListener)reduced.addEventListener('change',syncMotion);
  else if(reduced.addListener)reduced.addListener(syncMotion);
  // The owner-approved 1080x1920 closing artwork is bundled with Section 10
  // so ordinary public URLs render the correct scene without a debug flag.
  // An optional ignored local image remains available for explicit comparison.
  section.dataset.artwork='original';
  const img=section.querySelector('.closing10-source-scene');
  const previewHost=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  const explicitPreview=new URLSearchParams(location.search).get('section10LicensedArt')==='1';
  const candidates=previewHost&&explicitPreview
    ? ['./assets/reference-dev/scene.webp','./assets/section10/scene.webp']
    : ['./assets/section10/scene.webp'];
  let nextImage=0;
  const loadNextImage=()=>{
    if(!img)return;
    if(nextImage>=candidates.length){
      section.dataset.artwork='original';
      img.removeAttribute('src');
      return;
    }
    img.src=candidates[nextImage++];
  };
  if(img){
    img.onload=()=>{
      section.dataset.artwork=img.naturalWidth===1080?'local-reference':'original';
    };
    img.onerror=loadNextImage;
    loadNextImage();
  }
  syncMotion();
  scheduleReveals();
})();
