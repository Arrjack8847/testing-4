'use strict';
// Section 2 — scroll reveal and visible-only decorative petals.
// The mauve scene overlaps the pinned lake between 2H and 3H.
// The frame becomes readable only as its content enters the viewport.
(() => {
  const section = document.getElementById('message');
  const invitation = document.getElementById('invitation');
  const frame = section?.querySelector('.letter-frame');
  if (!section || !frame || !invitation) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let onScreen = false;
  function syncPetals() {
    section.dataset.petalsActive = String(
      onScreen && invitation.dataset.state === 'opened' && !document.hidden && !reduced.matches
    );
  }
  syncPetals();

  // Avoid running infinite petal motion behind the closed cover, or after the
  // guest leaves Section 2. This also handles pages opened from bfcache.
  new MutationObserver(syncPetals).observe(invitation, {
    attributes:true,attributeFilter:['data-state']
  });
  document.addEventListener('visibilitychange',syncPetals);
  reduced.addEventListener('change',syncPetals);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      // Edge-touching sections are sometimes reported as intersecting with
      // zero actual area; require a visible slice of the mauve band.
      onScreen = entries.some(entry=>entry.isIntersecting && entry.intersectionRatio>.01);
      syncPetals();
    },{threshold:[0,.01]}).observe(section);
  } else {
    // Browser fallback: still respect reduced motion and cover state.
    const check = () => {
      const box=section.getBoundingClientRect();
      onScreen = box.bottom > -40 && box.top < innerHeight+40;
      syncPetals();
    };
    window.addEventListener('scroll',check,{passive:true});
    window.addEventListener('resize',check,{passive:true});
    check();
  }

  if (reduced.matches || !('IntersectionObserver' in window)) {
    section.classList.add('is-visible');
    return;
  }
  section.dataset.revealReady='true';
  const revealObserver = new IntersectionObserver(entries => {
    if (!entries.some(entry=>entry.isIntersecting)) return;
    section.classList.add('is-visible');
    revealObserver.disconnect();
  },{threshold:.12});
  revealObserver.observe(frame);
})();
