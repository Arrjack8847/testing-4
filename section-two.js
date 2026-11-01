'use strict';
// Section 2 reveals once it approaches the phone viewport.
// No timers or animation work while the visitor remains in Section 1.
(() => {
  const section = document.getElementById('message');
  if (!section || !('IntersectionObserver' in window)) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches) return; // Keep all content readable immediately.
  section.dataset.revealReady = 'true';
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      section.classList.add('is-visible');
      observer.disconnect();
    }
  }, { threshold: 0.12 });
  observer.observe(section);
})();
