'use strict';
// Section 6 — Dress Code. No guest data, backend, or network request by default.
(() => {
  const invitation=document.getElementById('invitation');
  const section=document.getElementById('dressCode');
  if(!invitation || !section)return;

  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const source=new URLSearchParams(location.search);
  // Explicit opt-in visual comparison only. Never bundle third-party artwork
  // as part of the original invitation or imply commercial redistribution rights.
  if(source.get('dressReference')==='1'){
    section.dataset.art='reference';
    const sources=[
      [document.getElementById('dressSourceScene'),'sceneStatus',
       'https://undangankahwin.com/images/concierge/packs/tasik-kayangan/paper.webp'],
      [document.getElementById('dressSourceButterfly'),'butterflyStatus',
       'https://undangankahwin.com/images/concierge/packs/serambi-ungu/bfly_1.webp']
    ];
    sources.forEach(([img,status,url])=>{
      if(!img)return;
      section.dataset[status]='loading';
      img.addEventListener('load',()=>{
        section.dataset[status]=img.naturalWidth>0?'loaded':'failed';
      },{once:true});
      img.addEventListener('error',()=>{
        section.dataset[status]='failed';
      },{once:true});
      img.src=url;
    });
  }

  let frame=0;
  function paint(){
    frame=0;
    if(reduced.matches || invitation.dataset.state!=='opened')return;
    const rect=section.getBoundingClientRect();
    if(rect.bottom<0 || rect.top>innerHeight)return;
    // Source-measured paper offset = -12% of section height plus
    // approximately (3.5px - 0.0427 * section screen-top). Keep the
    // illustration's movement bounded outside visible scroll positions.
    const offset=Math.max(-45,Math.min(45,3.5-rect.top*.0427));
    section.style.setProperty('--dress-camera-y',offset.toFixed(2)+'px');
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(paint)}
  function syncAccess(){
    const closed=invitation.dataset.state!=='opened';
    section.inert=closed;
    section.setAttribute('aria-hidden',String(closed));
    if(closed)section.style.setProperty('--dress-camera-y','0px');
    else schedule();
  }
  syncAccess();
  new MutationObserver(syncAccess).observe(invitation,{attributes:true,attributeFilter:['data-state']});

  const reveals=[...section.querySelectorAll('.dress-reveal')];
  const observer='IntersectionObserver' in window
    ? new IntersectionObserver(entries=>{
        entries.forEach(entry=>entry.target.classList.toggle('dress-in-view',entry.isIntersecting));
      },{threshold:.02,rootMargin:'24px 0px 0px 0px'})
    : null;
  if(observer)reveals.forEach(el=>observer.observe(el));
  else reveals.forEach(el=>el.classList.add('dress-in-view'));

  function motionChanged(){
    if(reduced.matches){
      section.removeAttribute('data-reveal-ready');
      section.style.setProperty('--dress-camera-y','0px');
      if(frame){cancelAnimationFrame(frame);frame=0}
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
