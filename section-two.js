'use strict';
// Section 2 — animate the framed message itself, not the empty top padding.
// Measured from the mobile reference: message begins after the lake hero,
// frame enters later within the mauve textured band.
(() => {
  const section = document.getElementById('message');
  const frame = section?.querySelector('.letter-frame');
  if (!section || !frame || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  section.dataset.revealReady='true';
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry=>entry.isIntersecting)) return;
    section.classList.add('is-visible');
    observer.disconnect();
  },{threshold:.12});
  observer.observe(frame);
})();
