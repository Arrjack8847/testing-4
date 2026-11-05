'use strict';
/*
 * Mobile-only artwork lifecycle for the 10-section reference prototype.
 * No assets are resized or substituted. Load 1700px before a section enters,
 * keep decoded imagery for 3100px beyond it, then release selected DOM images.
 * Hysteresis avoids load/unload thrashing at section boundaries.
 *
 * A "released" state means DOM image sources have been detached; browser
 * caches may still retain decoded memory until WebKit elects to reclaim it.
 */
(() => {
  const mobile = matchMedia('(max-width:600px)').matches;
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
    let near = false, retain = false, retainKnown = false, live = false;
    const setState = state => { section.dataset.assetLifecycle = state; };
    setState('deferred');
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
    const nearObserver = new IntersectionObserver(entries => {
      near = !!entries[0]?.isIntersecting;
      reconcile();
    }, {rootMargin:'1700px 0px 1700px 0px', threshold:0});
    const retainObserver = new IntersectionObserver(entries => {
      retainKnown = true;
      retain = !!entries[0]?.isIntersecting;
      reconcile();
    }, {rootMargin:'3100px 0px 3100px 0px', threshold:0});
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
