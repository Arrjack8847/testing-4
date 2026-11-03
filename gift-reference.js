'use strict';
// Section 5 reference feature: Wedding Gift.
// No fabricated account, transfer, gift reservation, or transaction is enabled.
// Third-party item thumbnails load only with the explicit ?giftsReference=1 comparison flag.
(() => {
  const section = document.getElementById('weddingGift');
  const invitation = document.getElementById('invitation');
  if (!section || !invitation) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let raf = 0;

  function syncAccess() {
    const closed = invitation.dataset.state !== 'opened';
    section.inert = closed;
    section.setAttribute('aria-hidden', String(closed));
    if (closed) section.style.setProperty('--gift-camera-y','0px');
    else requestPaint();
  }
  syncAccess();
  new MutationObserver(syncAccess).observe(invitation,{
    attributes:true,attributeFilter:['data-state']
  });

  // Enable external thumbnails for a non-commercial, opt-in visual comparison only.
  if (new URLSearchParams(location.search).get('giftsReference') === '1') {
    const urls = [
      'https://down-my.img.susercontent.com/file/3ec07fce7759a329a17cd0dc411fef2a_tn',
      'https://img.lazcdn.com/g/p/99683b91c2b2cfcd5ce838a7a7a0d711.jpg_200x200q80.jpg_.webp'
    ];
    section.querySelectorAll('[data-gift-thumb]').forEach((frame,index) => {
      if (index >= urls.length) return;
      const image = document.createElement('img');
      image.alt = ''; image.loading = 'lazy'; image.decoding = 'async';
      frame.dataset.imageState = 'requested';
      image.onload = () => { frame.replaceChildren(image); frame.dataset.imageState='loaded'; };
      image.onerror = () => { frame.dataset.imageState='unavailable'; image.remove(); };
      image.src = urls[index];
    });
  }

  const observed = [...section.querySelectorAll('.gift-reveal')];
  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) entry.target.classList.add('gift-in-view');
        else entry.target.classList.remove('gift-in-view');
      }
    },{threshold:0.01,rootMargin:'80px 0px 30px 0px'})
    : null;
  if (observer) observed.forEach(item => observer.observe(item));
  else observed.forEach(item => item.classList.add('gift-in-view'));

  function paint() {
    raf=0;
    if (reduced.matches || invitation.dataset.state !== 'opened') return;
    const rect=section.getBoundingClientRect();
    if (rect.bottom < -30 || rect.top > innerHeight + 30) return;
    const progression=(innerHeight/2-(rect.top+rect.height/2))*0.032;
    const displacement=Math.max(-20,Math.min(20,progression));
    section.style.setProperty('--gift-camera-y',displacement.toFixed(2)+'px');
  }
  function requestPaint() {if (!raf) raf=requestAnimationFrame(paint);}
  function motionPreferenceChanged() {
    if (reduced.matches) {
      if (raf) cancelAnimationFrame(raf);
      raf=0;
      section.removeAttribute('data-reveal-ready');
      section.style.setProperty('--gift-camera-y','0px');
    } else {
      if (observer) section.dataset.revealReady='true';
      requestPaint();
    }
  }
  addEventListener('scroll',requestPaint,{passive:true});
  addEventListener('resize',requestPaint,{passive:true});
  if (reduced.addEventListener) reduced.addEventListener('change',motionPreferenceChanged);
  motionPreferenceChanged();
})();
