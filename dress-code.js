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
  // Third-party artwork is loaded only for an explicit comparison flag.
  // The butterfly itself is independently illustrated with 3D CSS wings.
  if(source.get('dressReference')==='1'){
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
  const flight=document.getElementById('dressFlight');
  // Reference butterfly coordinates from seven scroll-state comparisons at 390px.
  // X is the left wing's screen x; Y is relative to the section top.
  const samples=[
    {top:-240,x:323.16,y:67.45},
    {top:0,x:352.21,y:57.83},
    {top:240,x:381.89,y:46.51},
    {top:580,x:413.66,y:46.05}
  ];
  function interpolate(top,key){
    let a=samples[0],b=samples[1];
    if(top>samples[0].top){
      let i=1;
      while(i<samples.length-1&&top>samples[i].top)i++;
      a=samples[i-1];b=samples[i];
    }
    return a[key]+(top-a.top)*(b[key]-a[key])/(b.top-a.top);
  }
  function positionFlight(rect){
    if(!flight)return;
    const x=reduced.matches?Math.max(0,rect.width-64):
      Math.max(-56,Math.min(rect.width+56,interpolate(rect.top,'x')*rect.width/390));
    const y=reduced.matches?58:interpolate(rect.top,'y');
    section.style.setProperty('--dress-flight-x',x.toFixed(2)+'px');
    section.style.setProperty('--dress-flight-y',y.toFixed(2)+'px');
    section.dataset.flightReady='true';
  }

  let frame=0;
  function paint(){
    frame=0;
    if(invitation.dataset.state!=='opened')return;
    const rect=section.getBoundingClientRect();
    if(rect.bottom<0 || rect.top>innerHeight)return;
    positionFlight(rect);
    if(reduced.matches)return;
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
    if(closed){
      section.style.setProperty('--dress-camera-y','0px');
      section.removeAttribute('data-flight-ready');
    }else schedule();
  }
  syncAccess();
  new MutationObserver(syncAccess).observe(invitation,{attributes:true,attributeFilter:['data-state']});

  const reveals=[...section.querySelectorAll('.dress-reveal')];
  const observer='IntersectionObserver' in window
    ? new IntersectionObserver(entries=>{
        entries.forEach(entry=>entry.target.classList.toggle('dress-in-view',entry.isIntersecting));
      },{threshold:.02,rootMargin:'0px'})
    : null;
  if(observer)reveals.forEach(el=>observer.observe(el));
  else reveals.forEach(el=>el.classList.add('dress-in-view'));

  function motionChanged(){
    if(reduced.matches){
      section.removeAttribute('data-reveal-ready');
      section.style.setProperty('--dress-camera-y','0px');
      if(invitation.dataset.state==='opened')positionFlight(section.getBoundingClientRect());
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
