'use strict';
// Section 3 event details. Replace blanks only when real wedding details are known.
// No directions link or made-up venue is shown in the demonstration.
(() => {
  const section = document.getElementById('eventDetails');
  const invite = document.getElementById('invitation');
  if (!section || !invite) return;

  const EVENT = Object.freeze({
    time: '',
    venueName: '',
    venueAddress: '',
    directionsUrl: ''
  });

  const label = (id, text) => {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
    return element;
  };

  label('eventTime', EVENT.time.trim() || 'To be confirmed');
  label('eventVenue', EVENT.venueName.trim() || 'Venue to be announced');
  const address = label('eventAddress', EVENT.venueAddress.trim());
  if (address) address.hidden = !EVENT.venueAddress.trim();

  // Links remain genuinely disabled until a venue and a safe Maps URL exist.
  const directions = document.getElementById('eventDirections');
  const directionsNote = document.getElementById('eventDirectionsNote');
  let safeMapUrl = '';
  if (EVENT.venueName.trim() && EVENT.directionsUrl.trim()) {
    try {
      const url = new URL(EVENT.directionsUrl);
      const host = url.hostname.toLowerCase();
      const allowed = host === 'maps.app.goo.gl' ||
        host === 'goo.gl' || host === 'waze.com' || host.endsWith('.waze.com') ||
        host === 'google.com' || host.endsWith('.google.com');
      if (url.protocol === 'https:' && allowed) safeMapUrl = url.href;
    } catch (_) {
      // Invalid or empty destinations must not become clickable.
    }
  }
  if (directions) {
    if (safeMapUrl) {
      directions.href = safeMapUrl;
      directions.hidden = false;
    } else {
      directions.hidden = true;
      directions.removeAttribute('href');
    }
  }
  if (directionsNote) directionsNote.hidden = !!safeMapUrl;

  // Mirror the first two sections' closed-cover accessibility state.
  const syncAccess = () => {
    const isClosed = invite.dataset.state !== 'opened';
    section.inert = isClosed;
    section.setAttribute('aria-hidden', String(isClosed));
  };
  syncAccess();
  const stateObserver = new MutationObserver(syncAccess);
  stateObserver.observe(invite, {attributes:true,attributeFilter:['data-state']});

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !('IntersectionObserver' in window)) return;
  section.dataset.revealReady = 'true';
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      section.classList.add('is-visible');
      observer.disconnect();
    }
  }, {threshold:0.12});
  observer.observe(section);
})();
