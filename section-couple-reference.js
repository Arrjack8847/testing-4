'use strict';
/**
 * Optional reference-art visual comparison only (?coupleReference=1).
 *
 * This mirrors the existing Section 1 approach by loading source artwork
 * from the reference provider, but ONLY on explicit opt-in, without saving
 * third-party artwork, altering the default original-art template, or
 * redistributing another site's example portrait photographs.
 *
 * The URL flag is for private development comparison, not commercial use.
 */
(() => {
  if (new URLSearchParams(window.location.search).get('coupleReference') !== '1') return;
  const section = document.getElementById('couple');
  if (!section) return;

  const artRoot = 'https://undangankahwin.com/images/concierge/';
  const portraitData = [
    {
      selector: '#groomPortrait',
      url: artRoot + 'couples/moody-groom.webp',
      name: 'Muhammad Rayyan bin Bujang',
      role: 'Beloved son of',
      family: 'Tuan Haji Bujang bin Rahman & Puan Hajah Salmah binti Yaakob',
      alt: 'Reference website example groom portrait (development comparison only)'
    },
    {
      selector: '#bridePortrait',
      url: artRoot + 'couples/moody-bride.webp',
      name: 'Nur Sofea binti Dzulkharnain',
      role: 'Beloved daughter of',
      family: 'Tuan Haji Dzulkharnain bin Ismail & Puan Hajah Rosnah binti Hamzah',
      alt: 'Reference website example bride portrait (development comparison only)'
    }
  ];

  section.dataset.art = 'reference';
  for (const item of portraitData) {
    const img = section.querySelector(item.selector);
    if (!img) continue;
    const fallback = img.getAttribute('src');
    img.addEventListener('error', () => {
      // Network / hotlink restrictions do not leave a broken-image box.
      if (img.getAttribute('src') !== fallback) {
        img.src = fallback;
        section.dataset.referencePhotoFallback = 'true';
      }
    });
    img.dataset.referenceUrl = item.url;
    img.src = item.url;
    img.alt = item.alt;
    const profile = img.closest('.couple-profile');
    if (!profile) continue;
    profile.querySelector('.couple-name').textContent = item.name;
    profile.querySelector('.couple-role').textContent = item.role;
    profile.querySelector('.couple-family').textContent = item.family;
  }

  // Reference measurements at 390×844, with absolute document Y:
  // 2743 => image offset -44.8px; 3165 => -26.8px;
  // 3587 => -8.8px; 4220 => +18.2px.
  // Unlike a simple sticky image, its camera drifts by ~0.0427 px per
  // document scroll pixel. Preserve normal section boundaries at all sizes.
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  let pending = false;
  function syncScene() {
    pending = false;
    const box = section.getBoundingClientRect();
    const viewport = window.innerHeight;
    const start = box.top + window.scrollY;
    const pinned = clamp(-box.top, 0, Math.max(0, box.height - viewport));
    // Reference y=2743 corresponds to ~0.653 viewport before Section 3.
    // This conversion is independent of the phone height.
    const referenceAnchor = start - 0.653 * viewport;
    const camera = motion.matches ? 0 :
      clamp(-44.8 + (window.scrollY - referenceAnchor) * 0.0427, -44.8, 20);
    const displacement = pinned + camera;
    section.style.setProperty('--couple-reference-y',displacement.toFixed(2)+'px');
    section.dataset.referenceCameraOffset = camera.toFixed(2);
  }
  function scheduleSync() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(syncScene);
  }
  window.addEventListener('scroll',scheduleSync,{passive:true});
  window.addEventListener('resize',scheduleSync,{passive:true});
  motion.addEventListener?.('change',scheduleSync);
  syncScene();
})();
