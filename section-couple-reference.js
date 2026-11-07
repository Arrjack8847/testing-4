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
  // Keep the source's 28%-78% entry band. Once a portrait is focused,
  // give it a narrow 3%-of-viewport release margin. This avoids rapidly
  // retriggering the 600ms zoom while a finger hovers near either threshold.
  // Neither the zoom magnitude nor the measured camera timeline changes.
  function portraitFocusTargets(viewportHeight) {
    if (motion.matches) return portraitCards.map(() => false);
    return portraitCards.map(card => {
      const rect = card.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const focused = card.classList.contains('is-focal');
      const lower = viewportHeight * (focused ? .25 : .28);
      const upper = viewportHeight * (focused ? .81 : .78);
      return midpoint >= lower && midpoint <= upper;
    });
  }

  // Request at most one paint per frame; all geometry is read before changing
  // styles/classes so portrait focus cannot force extra layouts mid-frame.
  let pending = false;
  let bounds = null;
  function leaveCameraBand() {
    if(section.dataset.cameraNear!=='false')section.dataset.cameraNear='false';
    portraitCards.forEach(card=>{
      if(card.classList.contains('is-focal'))card.classList.remove('is-focal');
    });
  }
  function syncScene() {
    pending = false;
    const viewport = Math.max(window.innerHeight, 1);
    const scroll = window.scrollY;
    // Cached document bounds permit an offscreen check without flushing
    // styles written by other scroll controllers earlier in this frame.
    // Keep the existing two-viewport approach / one-viewport exit band.
    if(bounds && (bounds.bottom-scroll < -viewport || bounds.top-scroll > viewport*2)){
      leaveCameraBand();
      return;
    }
    const box = section.getBoundingClientRect();
    const start = box.top + scroll;
    bounds={top:start,bottom:box.bottom+scroll};
    const pinned = clamp(-box.top, 0, Math.max(0, box.height - viewport));
    // Preserve the four archived 390px checkpoints and camera speed exactly.
    // y=2743 -> -44.8; y=3165 -> -26.8; y=3587 -> -8.8; y=4220 -> +18.2.
    const referenceAnchor = start - 0.653 * viewport;
    const camera = motion.matches ? 0 :
      clamp(-44.8 + (scroll - referenceAnchor) * 0.0427, -44.8, 20);
    // Keep the legacy total for diagnostics and fallback browsers, but
    // on native-sticky browsers NEVER cancel full-speed scrolling in JS.
    // The compositor owns the pin; JS applies only the 4.27% camera drift.
    const displacement = (pinned + camera).toFixed(2) + 'px';
    const cameraValue = camera.toFixed(2);
    const cameraDisplacement = cameraValue + 'px';
    // The garden can be 7+ screens away on this page. Only evaluate each
    // portrait rectangle and retain GPU compositing layers while near it.
    // Start warming the layers two viewports before entry for quick swipes.
    const near = box.bottom >= -viewport && box.top <= viewport * 2;
    const focus = near ? portraitFocusTargets(viewport) : null;

    // Suppress identical writes on coalesced scroll/resize events. Keep the
    // calibrated camera tied directly to scroll (no trailing easing).
    if (section.style.getPropertyValue('--couple-reference-y') !== displacement)
      section.style.setProperty('--couple-reference-y', displacement);
    if (section.style.getPropertyValue('--couple-camera-y') !== cameraDisplacement)
      section.style.setProperty('--couple-camera-y', cameraDisplacement);
    if (section.dataset.referenceCameraOffset !== cameraValue)
      section.dataset.referenceCameraOffset = cameraValue;
    const nearValue = String(near && !motion.matches);
    if (section.dataset.cameraNear !== nearValue)
      section.dataset.cameraNear = nearValue;
    portraitCards.forEach((card, index) => {
      const shouldFocus = focus ? focus[index] : false;
      if (card.classList.contains('is-focal') !== shouldFocus)
        card.classList.toggle('is-focal', shouldFocus);
    });
  }
  function scheduleSync() {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(syncScene);
  }
  function layoutChanged() {
    bounds=null;
    scheduleSync();
  }
  window.addEventListener('scroll', scheduleSync, {passive:true});
  window.addEventListener('resize', layoutChanged, {passive:true});
  window.visualViewport?.addEventListener('resize', layoutChanged, {passive:true});
  window.addEventListener('pageshow', layoutChanged);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) layoutChanged();
  });
  motion.addEventListener?.('change', scheduleSync);
  // A font load or portrait reveal can change the section's measured layout
  // without a scroll event. Re-anchor on layout shifts, not via a smoothing
  // timer that would drift from the reference path.
  if ('ResizeObserver' in window) {
    const observer=new ResizeObserver(layoutChanged);
    observer.observe(section);
    observer.observe(document.body);
  }
  document.fonts?.ready.then(layoutChanged).catch(() => {});
  syncScene();
})();
