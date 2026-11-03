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
  new MutationObserver(syncCover).observe(invite,{attributes:true,attributeFilter:['data-state']});

  if (query.get('orderReference')==='1') {
    section.dataset.art='reference';
    const images=[
      [document.getElementById('orderSourceBand'),'bandStatus','https://undangankahwin.com/images/concierge/packs/tasik-kayangan/band_plum.webp'],
      [document.getElementById('orderSourceButterfly'),'butterflyStatus','https://undangankahwin.com/images/concierge/packs/anggerik-nirmala/bfly_blush.webp']
    ];
    for (const [img,key,url] of images) {
      if (!img) continue;
      section.dataset[key]='loading';
      img.addEventListener('load',()=>{section.dataset[key]=img.naturalWidth>0?'loaded':'failed';},{once:true});
      img.addEventListener('error',()=>{section.dataset[key]='failed';},{once:true});
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
