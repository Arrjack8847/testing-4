'use strict';
/**
 * Section 3 reference-art prototype is the default on every URL, including /.
 * The old ?coupleReference=1 switch is no longer needed or evaluated.
 *
 * Source artwork is requested from the provider for private development
 * comparison. These externally hosted images are not distributed here and
 * must not be used commercially without the appropriate permission.
 */
(() => {
  const section = document.getElementById('couple');
  if (!section) return;

  const artRoot = 'https://undangankahwin.com/images/concierge/';
  const portraitData = [
    {
      key: 'groom',
      selector: '#groomPortrait',
      url: artRoot + 'couples/moody-groom.webp',
      name: 'Muhammad Rayyan bin Bujang',
      role: 'Beloved son of',
      family: 'Tuan Haji Bujang bin Rahman & Puan Hajah Salmah binti Yaakob',
      alt: 'Reference website example groom portrait (development comparison only)'
    },
    {
      key: 'bride',
      selector: '#bridePortrait',
      url: artRoot + 'couples/moody-bride.webp',
      name: 'Nur Sofea binti Dzulkharnain',
      role: 'Beloved daughter of',
      family: 'Tuan Haji Dzulkharnain bin Ismail & Puan Hajah Rosnah binti Hamzah',
      alt: 'Reference website example bride portrait (development comparison only)'
    }
  ];

  section.dataset.art = 'reference';
  // Report whether the three known WebPs actually loaded, rather than
  // confusing CSS/HTML URLs with successful network image responses.
  // This diagnostic runs on the default prototype and never downloads
  // third-party files into the repository.
  const webpStatus = {scene:'loading',groom:'loading',bride:'loading'};
  const syncWebpStatus = () => {
    const states = Object.values(webpStatus);
    section.dataset.referenceWebpCount = String(states.filter(state => state === 'loaded').length);
    section.dataset.referenceWebpState = states.every(state => state === 'loaded')
      ? 'ready' : states.some(state => state === 'loading') ? 'loading' : 'partial';
    section.dataset.referenceWebpMissing = Object.entries(webpStatus)
      .filter(([,state]) => state === 'failed' || state === 'fallback')
      .map(([name]) => name).join(',');
  };
  // Section 1 already resolves the SAME reference scene.webp from the local
  // artwork pack. Reuse that local asset in Section 3 rather than making the
  // browser depend on a second cross-origin scene request. Keep the provider
  // URL as a fallback for environments without locally installed artwork.
  const sceneSources = [
    './assets/scene.webp',
    artRoot + 'packs/tasik-kayangan/scene.webp'
  ];
  const sceneProbe = new Image();
  let sceneSourceIndex = 0;
  sceneProbe.onload = () => {
    const imageUrl = sceneProbe.currentSrc || sceneProbe.src;
    section.style.setProperty('--couple-reference-image', 'url("' + imageUrl + '")');
    section.dataset.referenceSceneSource = sceneSourceIndex === 0 ? 'local' : 'remote';
    webpStatus.scene = 'loaded';
    syncWebpStatus();
  };
  sceneProbe.onerror = () => {
    sceneSourceIndex++;
    if (sceneSourceIndex < sceneSources.length) {
      sceneProbe.src = sceneSources[sceneSourceIndex];
      return;
    }
    section.dataset.referenceSceneSource = 'unavailable';
    webpStatus.scene = 'failed';
    syncWebpStatus();
  };
  syncWebpStatus();
  sceneProbe.src = sceneSources[sceneSourceIndex];
  for (const item of portraitData) {
    const img = section.querySelector(item.selector);
    if (!img) continue;
    const fallback = img.getAttribute('src');
    img.addEventListener('load', () => {
      webpStatus[item.key] = img.currentSrc === item.url ? 'loaded' : 'fallback';
      syncWebpStatus();
    });
    img.addEventListener('error', () => {
      // If the provider blocks a photo, show only the neutral transparent
      // placeholder: never substitute the retired illustrated portraits.
      if (img.getAttribute('src') !== fallback) {
        webpStatus[item.key] = 'fallback';
        syncWebpStatus();
        img.src = fallback;
        img.alt = 'Reference portrait unavailable in this preview';
        img.dataset.referencePhotoFallback = 'true';
        section.dataset.referencePhotoFallback = 'true';
      } else {
        webpStatus[item.key] = 'failed';
        syncWebpStatus();
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
  const portraitCards = [...section.querySelectorAll('.couple-portrait')];
  // The live reference zooms a portrait only while the guest is looking at
  // its central focal area. Returning toward either end of the section
  // restores the unzoomed crop; this is NOT a permanent groom-only scale.
  function syncPortraitFocus() {
    const viewportHeight = Math.max(window.innerHeight, 1);
    for (const card of portraitCards) {
      const rect = card.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const withinFocalBand =
        midpoint >= viewportHeight * .28 &&
        midpoint <= viewportHeight * .78;
      card.classList.toggle('is-focal', !motion.matches && withinFocalBand);
    }
  }
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
    syncPortraitFocus();
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
