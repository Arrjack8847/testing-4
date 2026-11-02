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

  // A reference image occupies a single viewport, pinned over Section 3.
  // The absolute scene is translated inside the section, matching a sticky
  // scene without inserting height or shifting the existing HTML portraits.
  let pending = false;
  function syncScene() {
    pending = false;
    const rect = section.getBoundingClientRect();
    const scrollWithin = Math.max(0, Math.min(
      Math.max(0, rect.height - window.innerHeight),
      -rect.top
    ));
    section.style.setProperty('--couple-reference-y',scrollWithin.toFixed(2)+'px');
  }
  function scheduleSync() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(syncScene);
  }
  window.addEventListener('scroll',scheduleSync,{passive:true});
  window.addEventListener('resize',scheduleSync,{passive:true});
  syncScene();
})();
