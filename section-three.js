'use strict';
// Section 4 Events — Tasik Kayangan reference-recreation prototype.
// Venue, couple and date are publicly observed EXAMPLE details, not user data.
// Public vendor art is hotlinked in this research prototype, never committed or licensed for commercial reuse.
(() => {
  const section = document.getElementById('eventDetails');
  const invitation = document.getElementById('invitation');
  if (!section || !invitation) return;

  const sampleDate = '2027-01-23T19:30:00+08:00'; // Example Wedding Reception, Malaysia
  const eventTime = new Date(sampleDate).getTime();
  const fields = {
    days: document.getElementById('eventCountDays'),
    hours: document.getElementById('eventCountHours'),
    minutes: document.getElementById('eventCountMinutes'),
    seconds: document.getElementById('eventCountSeconds')
  };
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  const digits = n => String(n).padStart(2, '0');
  let visible = false;
  let countdownTimer = null;
  let cameraFrame = null;
  // Initially allow one camera sync. The observer gates subsequent offscreen work.
  let cameraNear = true;

  function renderCountdown() {
    if (!Number.isFinite(eventTime)) return;
    let remaining = Math.max(0, Math.floor((eventTime - Date.now()) / 1000));
    const days = Math.floor(remaining / 86400); remaining %= 86400;
    const hours = Math.floor(remaining / 3600); remaining %= 3600;
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    if (fields.days) fields.days.textContent = digits(days);
    if (fields.hours) fields.hours.textContent = digits(hours);
    if (fields.minutes) fields.minutes.textContent = digits(minutes);
    if (fields.seconds) fields.seconds.textContent = digits(seconds);
  }
  function stopCountdown() {
    if (countdownTimer !== null) window.clearInterval(countdownTimer);
    countdownTimer = null;
  }
  function updateTimerState() {
    const active = invitation.dataset.state === 'opened' && visible && !document.hidden;
    if (!active) { stopCountdown(); return; }
    renderCountdown();
    if (countdownTimer === null) countdownTimer = window.setInterval(renderCountdown, 1000);
  }
  renderCountdown();

  function syncAccess() {
    const closed = invitation.dataset.state !== 'opened';
    section.inert = closed;
    section.setAttribute('aria-hidden', String(closed));
    updateTimerState();
    scheduleCamera();
  }
  syncAccess();
  new MutationObserver(syncAccess).observe(invitation, {
    attributes: true, attributeFilter: ['data-state']
  });

  // Reference art is identical to the source, but on mobile it is only
  // requested within the approach band of Section 4. Offscreen images
  // and CSS WebP sources are detached for WebKit memory recovery.
  section.dataset.art = 'reference';
  const paper = document.getElementById('eventSourcePaper');
  const butterfly = document.getElementById('eventSourceButterfly');
  const artRoot = 'https://undangankahwin.com/images/concierge/';
  const localPaper = './assets/reference-dev/paper.webp';
  let artworkEpoch=0;
  let probes=[];
  const trackProbe=img=>{probes.push(img);return img;};
  const current=epoch=>epoch===artworkEpoch;
  function activateReferenceArt(){
    const epoch=++artworkEpoch;
    // Restore the original CSS defaults while local reference probes resolve.
    section.style.removeProperty('--event-arch-source');
    section.style.removeProperty('--event-bfly-source');
    if(paper){
      section.dataset.referencePaper='loading';
      paper.onload=()=>{
        if(current(epoch)) section.dataset.referencePaper=paper.naturalWidth>0?'loaded':'failed';
      };
      paper.onerror=()=>{if(current(epoch)) section.dataset.referencePaper='failed';};
      const probe=trackProbe(new Image());
      probe.onload=()=>{
        if(!current(epoch))return;
        section.dataset.referencePaperSource='local';
        paper.src=localPaper;
      };
      probe.onerror=()=>{
        if(!current(epoch))return;
        section.dataset.referencePaperSource='remote';
        paper.src=artRoot+'packs/tasik-kayangan/paper.webp';
      };
      probe.src=localPaper;
    }
    if(butterfly){
      section.dataset.referenceButterfly='loading';
      butterfly.onload=()=>{
        if(current(epoch))section.dataset.referenceButterfly=butterfly.naturalWidth>0?'loaded':'failed';
      };
      butterfly.onerror=()=>{if(current(epoch))section.dataset.referenceButterfly='failed';};
      butterfly.src=artRoot+'packs/anggerik-nirmala/bfly_white.webp';
    }
    const frameProbe=trackProbe(new Image());
    frameProbe.onload=()=>{
      if(!current(epoch))return;
      section.style.setProperty('--event-arch-source','url("./assets/reference-dev/arch_event.svg")');
      section.dataset.referenceFrameSource='local';
    };
    frameProbe.onerror=()=>{if(current(epoch))section.dataset.referenceFrameSource='remote';};
    frameProbe.src='./assets/reference-dev/arch_event.svg';
    const wingProbe=trackProbe(new Image());
    wingProbe.onload=()=>{
      if(!current(epoch))return;
      section.style.setProperty('--event-bfly-source','url("./assets/reference-dev/bfly_white.webp")');
      section.dataset.referenceWingSource='local';
    };
    wingProbe.onerror=()=>{if(current(epoch))section.dataset.referenceWingSource='remote';};
    wingProbe.src='./assets/reference-dev/bfly_white.webp';
  }
  function releaseReferenceArt(){
    ++artworkEpoch;
    for(const probe of probes){
      probe.onload=null;
      probe.onerror=null;
      probe.removeAttribute('src');
    }
    probes=[];
    paper?.removeAttribute('src');
    butterfly?.removeAttribute('src');
    // These custom properties override CSS defaults ONLY when far away.
    section.style.setProperty('--event-arch-source','none');
    section.style.setProperty('--event-bfly-source','none');
    section.dataset.referencePaper='deferred';
    section.dataset.referenceButterfly='deferred';
  }
  if(window.MobileArtworkLifecycle)
    window.MobileArtworkLifecycle.register(section,{
      activate:activateReferenceArt,release:releaseReferenceArt
    });
  else activateReferenceArt();

  // Four-phone comparison mode: pin the illustrated plane within Events
  // while letting HTML cards, buttons and countdown scroll normally.
  // Camera shift is bounded and works forwards, backwards, or with JS
  // initialized after the visitor has already scrolled.
  function paintCamera() {
    cameraFrame = null;
    const rect = section.getBoundingClientRect();
    const viewport = innerHeight;
    const pinned = clamp(-rect.top, 0, Math.max(0, rect.height - viewport));
    const camera = reduced.matches ? 0 : clamp((-rect.top) * .0427, -20, 24);
    // The source paper drifts by ~0.0427px for each scroll pixel:
    // roughly -15.7px at the start, 0 at the middle, +15.7px at the end.
    // Unlike a fixed hero this remains in normal scrolling flow.
    const motionDistance = -rect.top - Math.max(0, rect.height - viewport) / 2;
    const paperShift = reduced.matches ? 0 : clamp(motionDistance * .0427, -24, 24);
    const stageY = (pinned + camera).toFixed(2) + 'px';
    const paperY = paperShift.toFixed(2) + 'px';
    const cameraValue = camera.toFixed(2);
    const paperValue = paperShift.toFixed(2);
    // Style invalidation is expensive on WebKit: keep exact reference values,
    // but do not write identical values on every scroll callback.
    if (section.style.getPropertyValue('--event-stage-y') !== stageY)
      section.style.setProperty('--event-stage-y', stageY);
    if (section.style.getPropertyValue('--event-paper-shift') !== paperY)
      section.style.setProperty('--event-paper-shift', paperY);
    if (section.dataset.eventCamera !== cameraValue) section.dataset.eventCamera = cameraValue;
    if (section.dataset.eventPaperShift !== paperValue) section.dataset.eventPaperShift = paperValue;
  }
  function scheduleCamera() {
    if (!cameraNear || document.hidden || cameraFrame !== null) return;
    cameraFrame = window.requestAnimationFrame(paintCamera);
  }
  window.addEventListener('scroll', scheduleCamera, {passive:true});
  window.addEventListener('resize', scheduleCamera, {passive:true});
  scheduleCamera();

  // Do not animate invisible text on systems requesting Reduced Motion.
  const reveals = Array.from(section.querySelectorAll('.event-reveal'));
  function syncMotion() {
    if (reduced.matches) section.removeAttribute('data-reveal-ready');
    else if ('IntersectionObserver' in window) section.dataset.revealReady = 'true';
    scheduleCamera();
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        // Match the reference: a text line enters when visible and returns
        // to its resting state when scrolled offscreen, in both directions.
        entry.target.classList.toggle('in-view', entry.isIntersecting);
      }
    }, {threshold:.08,rootMargin:'0px'});
    reveals.forEach(item => observer.observe(item));

    const sectionObserver = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      cameraNear = visible;
      if (!cameraNear && cameraFrame !== null) {
        window.cancelAnimationFrame(cameraFrame);
        cameraFrame = null;
      } else if (cameraNear) scheduleCamera();
      updateTimerState();
    }, {threshold:0,rootMargin:'100px 0px'});
    sectionObserver.observe(section);
  } else {
    visible = true;
    reveals.forEach(item => item.classList.add('in-view'));
    updateTimerState();
  }
  reduced.addEventListener?.('change', syncMotion);
  document.addEventListener('visibilitychange', updateTimerState);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && cameraFrame !== null) {
      window.cancelAnimationFrame(cameraFrame);
      cameraFrame = null;
    } else if (!document.hidden) scheduleCamera();
  });
  syncMotion();
})();
