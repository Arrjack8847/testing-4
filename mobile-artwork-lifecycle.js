'use strict';
/*
 * Mobile-only artwork lifecycle for the 10-section reference prototype.
 * No assets are resized or substituted. Prewarm about 1.5 viewport heights
 * before a section enters; retain about 2.75 heights beyond it, then release
 * selected DOM images. These margins are capped to prevent wide overlap.
 * Hysteresis avoids load/unload thrashing at section boundaries.
 *
 * A "released" state means DOM image sources have been detached; browser
 * caches may still retain decoded memory until WebKit elects to reclaim it.
 */
(() => {
  const mobile = matchMedia('(max-width:600px), (pointer:coarse)').matches;
  const invitation = document.getElementById('invitation');
  function register(section, handlers) {
    if (!section || !handlers || typeof handlers.activate !== 'function') return;
    const activate = handlers.activate;
    const release = handlers.release || (() => {});
    // Keep the desktop prototype unchanged, and fail open if observers are absent.
    if (!mobile || !invitation || !('IntersectionObserver' in window)) {
      activate();
      return;
    }
    // Some callers (the hero) already contain loaded image layers when
    // registration begins. Treat those as live so a delayed registration,
    // after a fast swipe, still releases them when far from the viewport.
    let near = false, retain = false, retainKnown = false;
    let live = handlers.initiallyActive === true;
    const setState = state => { section.dataset.assetLifecycle = state; };
    setState(live ? 'near' : 'deferred');
    const reconcile = () => {
      const opened = invitation.dataset.state === 'opened';
      // Do not wait for a cover click when the guest has deep-linked, or
      // when a section is needed for accessibility before an observer fires.
      if (opened && near && !live) {
        live = true;
        setState('near');
        activate();
      } else if (live && retainKnown && !retain && !near) {
        live = false;
        setState('released');
        release();
      }
    };
    // Fixed 1700px/3100px bands overlapped multiple artwork-heavy sections
    // on short iPhones. Bound the bands to the initial viewport height, without
    // sacrificing hysteresis or changing the source image quality.
    const viewportH = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 800);
    const nearMargin = Math.max(1000, Math.min(1700, Math.round(viewportH * 1.5)));
    const retainMargin = Math.max(nearMargin + 650, Math.min(3100, Math.round(viewportH * 2.75)));
    const nearObserver = new IntersectionObserver(entries => {
      near = !!entries[0]?.isIntersecting;
      reconcile();
    }, {rootMargin:`${nearMargin}px 0px ${nearMargin}px 0px`, threshold:0});
    const retainObserver = new IntersectionObserver(entries => {
      retainKnown = true;
      retain = !!entries[0]?.isIntersecting;
      reconcile();
    }, {rootMargin:`${retainMargin}px 0px ${retainMargin}px 0px`, threshold:0});
    nearObserver.observe(section);
    retainObserver.observe(section);
    new MutationObserver(reconcile).observe(invitation,{
      attributes:true,attributeFilter:['data-state']
    });
    // BFCache returns need the same lifecycle despite Safari restoring scroll.
    window.addEventListener('pageshow', reconcile);
  }
  Object.defineProperty(window,'MobileArtworkLifecycle',{
    value:Object.freeze({register, get mobile(){return mobile;}}),
    configurable:false
  });
})();
