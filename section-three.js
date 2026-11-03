'use strict';
// Section 4 Events — Tasik Kayangan reference-recreation prototype.
// Venue, couple and date are publicly observed EXAMPLE details, not user data.
// Source art is hotlinked only in the explicit ?eventsReference=1 preview.
(() => {
  const section = document.getElementById('eventDetails');
  const invitation = document.getElementById('invitation');
  if (!section || !invitation) return;

  const sampleDate = '2027-01-23T10:00:00+08:00'; // Example Akad Nikah, Malaysia
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

  // The sole reference-asset switch is explicit and independently scoped.
  const referenceMode = new URLSearchParams(location.search).get('eventsReference') === '1';
  if (referenceMode) {
    section.dataset.art = 'reference';
    const paper = document.getElementById('eventSourcePaper');
    const butterfly = document.getElementById('eventSourceButterfly');
    const artRoot = 'https://undangankahwin.com/images/concierge/';
    if (paper) {
      section.dataset.referencePaper = 'loading';
      paper.addEventListener('load', () => {
        section.dataset.referencePaper = paper.naturalWidth > 0 ? 'loaded' : 'failed';
      }, {once:true});
      paper.addEventListener('error', () => { section.dataset.referencePaper = 'failed'; }, {once:true});
      paper.src = artRoot + 'packs/tasik-kayangan/paper.webp';
    }
    if (butterfly) {
      section.dataset.referenceButterfly = 'loading';
      butterfly.addEventListener('load', () => {
        section.dataset.referenceButterfly = butterfly.naturalWidth > 0 ? 'loaded' : 'failed';
      }, {once:true});
      butterfly.addEventListener('error', () => {
        section.dataset.referenceButterfly = 'failed';
      }, {once:true});
      butterfly.src = artRoot + 'packs/anggerik-nirmala/bfly_white.webp';
    }
  }

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
    section.style.setProperty('--event-stage-y', (pinned + camera).toFixed(2) + 'px');
    section.dataset.eventCamera = camera.toFixed(2);
  }
  function scheduleCamera() {
    if (cameraFrame !== null) return;
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
        if (entry.isIntersecting) entry.target.classList.add('in-view');
      }
    }, {threshold:.10,rootMargin:'30px 0px'});
    reveals.forEach(item => observer.observe(item));

    const sectionObserver = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
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
  syncMotion();
})();
