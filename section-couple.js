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
  motion.addEventListener?.('change',syncPetals);
  document.addEventListener('visibilitychange',syncPetals);
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