'use strict';
// Section 3: original Couple portrait scene inspired by the reference composition.
// Scene is an accessible sample, not photographs of real people.
(() => {
  const section=document.getElementById('couple');
  const invite=document.getElementById('invitation');
  if(!section||!invite)return;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const syncAccess=()=>{
    const closed=invite.dataset.state!=='opened';
    section.inert=closed;
    section.setAttribute('aria-hidden',String(closed));
  };
  syncAccess();
  new MutationObserver(syncAccess).observe(invite,{
    attributes:true,attributeFilter:['data-state']
  });

  let visible=false;
  const syncPetals=()=>{
    section.dataset.petalsActive=String(
      visible && invite.dataset.state==='opened'&&!document.hidden&&!motion.matches
    );
  };
  new MutationObserver(syncPetals).observe(invite,{
    attributes:true,attributeFilter:['data-state']
  });
  document.addEventListener('visibilitychange',syncPetals);
  // The live reference drifts its composite garden by about -45px to +20px
  // while the Couple section scrolls. Apply a bounded, rAF-throttled shift to
  // our own illustration, never moving the actual content or arch.
  let parallaxTick=false;
  const updateParallax=()=>{
    parallaxTick=false;
    if(!visible||motion.matches)return;
    const rect=section.getBoundingClientRect();
    const progress=Math.max(0,Math.min(1,(innerHeight-rect.top)/(rect.height+innerHeight)));
    section.style.setProperty('--couple-bg-y',((progress-.5)*128).toFixed(1)+'px');
  };
  const onScroll=()=>{
    if(parallaxTick||!visible||motion.matches)return;
    parallaxTick=true;
    requestAnimationFrame(updateParallax);
  };
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll,{passive:true});
  // A user can toggle Reduced Motion after the page has already scrolled.
  // Clear any previously painted camera offset instead of leaving it frozen.
  const syncMotion=()=>{
    syncPetals();
    if(motion.matches){
      section.style.removeProperty('--couple-bg-y');
    } else if(visible){
      onScroll();
    }
  };
  motion.addEventListener?.('change',syncMotion);
  if(!('IntersectionObserver' in window)){
    const check=()=>{
      const box=section.getBoundingClientRect();
      visible=box.bottom>0&&box.top<innerHeight;
      syncPetals();
      section.classList.add('is-visible');
    };
    window.addEventListener('scroll',check,{passive:true});
    window.addEventListener('resize',check,{passive:true});
    check();
    return;
  }
  new IntersectionObserver(entries=>{
    visible=entries.some(e=>e.isIntersecting && e.intersectionRatio>.01);
    syncPetals();
    if(visible)onScroll();
  },{threshold:[0,.01,.1]}).observe(section);

  if(motion.matches){
    section.classList.add('is-visible');
    return;
  }
  section.dataset.revealReady='true';
  const reveal=new IntersectionObserver(entries=>{
    for(const item of entries){
      if(!item.isIntersecting)continue;
      item.target.classList.add('in-view');
      reveal.unobserve(item.target);
    }
  },{rootMargin:'0px 0px -8% 0px',threshold:.08});
  section.querySelectorAll('.couple-reveal').forEach(element=>reveal.observe(element));
})();