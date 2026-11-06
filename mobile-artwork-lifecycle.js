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
  // Native iOS momentum scroll can travel several viewports before a newly
  // activated image finishes decoding. Prewarm artwork farther ahead ONLY on
  // upward travel; do not expand the eager downward loading band.
  let scrollDirection='down';
  let lastScrollY=window.scrollY;
  const directionSubscribers=new Set();
  if(mobile){
    window.addEventListener('scroll',()=>{
      const next=window.scrollY;
      const delta=next-lastScrollY;
      lastScrollY=next;
      if(Math.abs(delta)<8)return;
      const direction=delta<0?'up':'down';
      if(direction===scrollDirection)return;
      scrollDirection=direction;
      for(const notify of directionSubscribers)notify();
    },{passive:true});
    window.addEventListener('pageshow',()=>{lastScrollY=window.scrollY;});
  }
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
    let near = false, reverseNear = false, retain = false, retainKnown = false;
    let live = handlers.initiallyActive === true;
    const setState = state => { section.dataset.assetLifecycle = state; };
    setState(live ? 'near' : 'deferred');
    const reconcile = () => {
      const opened = invitation.dataset.state === 'opened';
      const approaching = near || (scrollDirection==='up' && reverseNear);
      // Do not wait for a cover click when the guest has deep-linked, or
      // when a section is needed for accessibility before an observer fires.
      if (opened && approaching && !live) {
        live = true;
        setState('near');
        activate();
      } else if (live && retainKnown && !retain && !approaching) {
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
    // Upward-only lead is larger than the standard near band but limited
    // to roughly three phone screens. It activates at most nearby sections,
    // not every released scene on the page.
    const reverseMargin = Math.max(1700, Math.min(2900, Math.round(viewportH * 3.25)));
    const nearObserver = new IntersectionObserver(entries => {
      near = !!entries[0]?.isIntersecting;
      reconcile();
    }, {rootMargin:`${nearMargin}px 0px ${nearMargin}px 0px`, threshold:0});
    const retainObserver = new IntersectionObserver(entries => {
      retainKnown = true;
      retain = !!entries[0]?.isIntersecting;
      reconcile();
    }, {rootMargin:`${retainMargin}px 0px ${retainMargin}px 0px`, threshold:0});
    const reverseObserver = new IntersectionObserver(entries => {
      reverseNear = !!entries[0]?.isIntersecting;
      if(scrollDirection==='up')reconcile();
    }, {rootMargin:`${reverseMargin}px 0px 0px 0px`, threshold:0});
    nearObserver.observe(section);
    retainObserver.observe(section);
    reverseObserver.observe(section);
    directionSubscribers.add(reconcile);
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
