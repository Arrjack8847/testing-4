'use strict';
// Section 7 uses downloaded WebP files only: no remote image hosts or silent fallback.
// Production mode uses licensed couple photos. Local development (localhost / 127.0.0.1)
// prefers locally downloaded reference WebPs when present, with a licensed-photo fallback.
// ?galleryReference=1 is a strict reference-only QA mode. Reference files are Git-ignored.
(() => {
  const section = document.getElementById('gallery');
  const invitation = document.getElementById('invitation');
  const dialog = document.getElementById('galleryDialog');
  if (!section || !invitation || !dialog) return;

  const PHOTOS = Object.freeze([
    {src:'./assets/gallery/photo-01.webp', alt:'Wedding couple together', caption:'Together'},
    {src:'./assets/gallery/photo-02.webp', alt:'The bride', caption:'The Bride'},
    {src:'./assets/gallery/photo-03.webp', alt:'The groom', caption:'The Groom'},
    {src:'./assets/gallery/photo-04.webp', alt:'The wedding garden', caption:'The Garden'},
    {src:'./assets/gallery/photo-05.webp', alt:'The lakeside scene', caption:'The Lake'}
  ]);
  const referenceMode = new URLSearchParams(window.location.search).get('galleryReference') === '1';
  // Auto-comparison is deliberately limited to loopback addresses: on Vercel, custom
  // domains and published previews, the guest Gallery never requests vendor photos.
  const autoLocalReference = !referenceMode &&
    ['localhost','127.0.0.1','[::1]','::1'].includes(window.location.hostname);
  const REFERENCE_FILES = Object.freeze([
    './assets/gallery/reference/moody.webp',
    './assets/gallery/reference/moody-bride.webp',
    './assets/gallery/reference/moody-groom.webp',
    './assets/gallery/reference/moody-garden.webp',
    './assets/gallery/reference/moody-lake.webp'
  ]);
  section.dataset.galleryArt = referenceMode ? 'reference-comparison' : 'local';
  const referenceNote = section.querySelector('.gallery-reference-note');
  if (referenceNote) referenceNote.hidden = !referenceMode;
  const buttons = Array.from(section.querySelectorAll('[data-gallery-slot]'));
  const viewImage = document.getElementById('galleryViewImage');
  const viewCaption = document.getElementById('galleryViewCaption');
  const position = document.getElementById('galleryPosition');
  const previous = document.getElementById('galleryPrevious');
  const next = document.getElementById('galleryNext');
  const close = document.getElementById('galleryClose');
  const disclaimer = section.querySelector('.gallery-disclaimer');
  const available = new Set();
  let assetsRequested = false;
  let active = -1;
  let returnFocus = null;
  let touchStart = null;

  function syncAccess() {
    const closed = invitation.dataset.state !== 'opened';
    section.inert = closed;
    section.setAttribute('aria-hidden', String(closed));
    if (closed && dialog.open) dialog.close();
  }
  syncAccess();
  new MutationObserver(syncAccess).observe(invitation,{
    attributes:true,attributeFilter:['data-state']
  });

  // Local relative URLs only. Reject absolute, root-relative, data:, and external schemes.
  function safeLocalUrl(src) {
    return /^\.\/assets\/gallery\/(?:reference\/)?[a-z0-9_-]+\.webp$/i.test(src) ? src : '';
  }
  function loadPhotos() {
    if (assetsRequested) return;
    assetsRequested = true;
    PHOTOS.forEach((photo,index) => {
      const button = buttons.find(b => Number(b.dataset.gallerySlot) === index);
      const local = safeLocalUrl(photo.src);
      const photoUrl = safeLocalUrl((referenceMode || autoLocalReference) ? REFERENCE_FILES[index] : local);
      if (!button || !photoUrl) return;
      const image = document.createElement('img');
      image.className = 'gallery-image';
      image.loading = (referenceMode || autoLocalReference) ? 'eager' : 'lazy';
      image.decoding = 'async';
      image.alt = photo.alt;
      image.onload = () => {
        if (!image.naturalWidth) return;
        // The downloaded WebPs are for local visual comparison only.
        // Show no extra reference banner so localhost resembles the source Gallery.
        if (autoLocalReference && image.getAttribute('src') === REFERENCE_FILES[index]) {
          section.dataset.galleryArt = 'local-reference-preview';
        }
        button.classList.add('has-image');
        button.disabled = false;
        button.setAttribute('aria-label','View photo ' + (index+1));
        const placeholder = button.querySelector('.gallery-photo-placeholder');
        if (placeholder) placeholder.hidden = true;
        available.add(index);
        // When all five local WebPs are present, suppress the development-only
        // placeholder message so the guest Gallery keeps the source's exact
        // bottom spacing. The "Tap a frame to view" hint stays visible.
        const complete = available.size === PHOTOS.length;
        disclaimer.hidden = complete;
        if (!complete) {
          disclaimer.textContent = referenceMode
            ? 'Local reference WebPs are still missing. Check assets/gallery/reference/.'
            : 'Tap an available photograph to view it. Other images are awaiting approval.';
        }
      };
      image.onerror = () => {
        // In normal localhost mode, prefer original comparison artwork if authorized
        // copies exist; otherwise keep the standard owned/consented photo fallback.
        // The strict ?galleryReference=1 QA mode never falls back.
        if (autoLocalReference && image.getAttribute('src') === REFERENCE_FILES[index]) {
          image.src = local;
          return;
        }
        image.remove();
        if (referenceMode && available.size === 0) {
          disclaimer.textContent = 'Local reference WebP missing. Add the files in assets/gallery/reference/ to compare.';
        }
      };
      button.prepend(image);
      image.src = photoUrl;
    });
  }

  function navigation() {
    return [...available].sort((a,b)=>a-b);
  }
  function updateViewer(index) {
    if (!available.has(index)) return;
    const choices = navigation();
    active = index;
    // The reference uses tall 3:4 photo frames for Together/Bride/Groom,
    // but a shorter landscape frame for Garden/Lake. Switch frame geometry
    // with the active image, including keyboard and swipe navigation.
    dialog.dataset.galleryOrientation = index >= 3 ? 'landscape' : 'portrait';
    viewImage.src = buttons[index].querySelector('.gallery-image').src;
    viewImage.alt = PHOTOS[index].alt;
    viewCaption.textContent = PHOTOS[index].caption;
    position.textContent = (choices.indexOf(index)+1) + ' / ' + choices.length;
    previous.disabled = choices.length < 2;
    next.disabled = choices.length < 2;
  }
  function moveBy(direction) {
    const choices = navigation();
    if (!choices.length || active < 0) return;
    const current = choices.indexOf(active);
    updateViewer(choices[(current+direction+choices.length)%choices.length]);
  }
  function openViewer(index) {
    if (!available.has(index) || invitation.dataset.state !== 'opened') return;
    returnFocus = buttons[index];
    updateViewer(index);
    if (!dialog.open) dialog.showModal();
    close.focus({preventScroll:true});
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    openViewer(Number(button.dataset.gallerySlot));
  }));
  close.addEventListener('click', () => dialog.close());
  previous.addEventListener('click', () => moveBy(-1));
  next.addEventListener('click', () => moveBy(1));
  // The full-screen viewer fills the dialog's content box. Treat a tap
  // on its empty surface as an overlay dismissal, but not a tap on a photo
  // or a viewer control.
  dialog.addEventListener('click', event => {
    if (event.target === dialog || event.target.classList.contains('gallery-viewer')) {
      dialog.close();
    }
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); moveBy(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); moveBy(1); }
  });
  dialog.addEventListener('touchstart',event => {
    if (event.touches.length !== 1) { touchStart=null; return; }
    touchStart={x:event.touches[0].clientX,y:event.touches[0].clientY};
  },{passive:true});
  dialog.addEventListener('touchend',event => {
    if (!touchStart || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX-touchStart.x;
    const dy = event.changedTouches[0].clientY-touchStart.y;
    touchStart = null;
    if (Math.abs(dx)>=55 && Math.abs(dx)>Math.abs(dy)*1.3) moveBy(dx<0?1:-1);
  },{passive:true});
  dialog.addEventListener('close',() => {
    active = -1;
    viewImage.removeAttribute('src');
    if (returnFocus && !returnFocus.disabled && invitation.dataset.state==='opened') {
      returnFocus.focus({preventScroll:true});
    }
    returnFocus = null;
  });

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!reduced.matches && 'IntersectionObserver' in window) {
    // The source observes each heading/frame independently, rather than
    // revealing the entire Gallery once. Entries reset when they leave view,
    // so scrolling back up produces a fresh entrance.
    section.dataset.revealReady = 'true';
    const revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        entry.target.classList.toggle('in', entry.isIntersecting);
      }
    }, {threshold:0.08});
    section.querySelectorAll('.gallery-reveal').forEach(node => revealObserver.observe(node));
  }
  // Image loading remains lazy and independent of reveal/reverse motion.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry=>entry.isIntersecting)) return;
      section.classList.add('is-visible');
      loadPhotos();
      observer.disconnect();
    },{threshold:.08,rootMargin:'130px 0px'});
    observer.observe(section);
  } else {
    section.classList.add('is-visible');
    loadPhotos();
  }
})();
