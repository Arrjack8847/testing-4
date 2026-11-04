'use strict';
// Reference-continuation prototype: independently drawn layers and sample-only data.
// Never record, submit or invent guest/gift transactions.
(() => {
  const invite = document.getElementById('invitation');
  const sections = [...document.querySelectorAll('.reference-continuation')];
  if (!invite || !sections.length) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const syncAccess = () => {
    const closed = invite.dataset.state !== 'opened';
    sections.forEach(section => {
      section.inert = closed;
      section.setAttribute('aria-hidden', String(closed));
    });
    if (closed) {
      sections.forEach(section => section.style.setProperty('--ref-camera-y','0px'));
    }
  };
  syncAccess();
  new MutationObserver(syncAccess).observe(invite,{attributes:true,attributeFilter:['data-state']});

  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) entry.target.classList.add('ref-in-view');
      }
    }, {threshold:.05,rootMargin:'0px 0px -25px 0px'});
    sections.forEach(section => {
      const elements = [...section.querySelectorAll('.ref-reveal')];
      if (!reduced.matches) section.dataset.revealReady = 'true';
      elements.forEach(el=>reveal.observe(el));
    });
  } else {
    sections.forEach(section=>section.querySelectorAll('.ref-reveal').forEach(el=>el.classList.add('ref-in-view')));
  }

  let raf = 0;
  function paint() {
    raf = 0;
    if (reduced.matches || invite.dataset.state !== 'opened') return;
    for(const section of sections){
      const rect=section.getBoundingClientRect();
      if(rect.bottom<0 || rect.top>innerHeight)continue;
      const middle=rect.top+rect.height/2;
      const displacement=Math.max(-20,Math.min(20,(innerHeight/2-middle)*.035));
      section.style.setProperty('--ref-camera-y',displacement.toFixed(2)+'px');
    }
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(paint);}
  function toggleReduced(){
    if (reduced.matches) {
      if (raf) cancelAnimationFrame(raf);
      raf=0;
      sections.forEach(section=>{
        section.style.setProperty('--ref-camera-y','0px');
        section.removeAttribute('data-reveal-ready');
      });
    } else {
      if ('IntersectionObserver' in window) sections.forEach(section=>{
        section.dataset.revealReady='true';
      });
      schedule();
    }
  }
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
  if(reduced.addEventListener)reduced.addEventListener('change',toggleReduced);
  toggleReduced();
})();