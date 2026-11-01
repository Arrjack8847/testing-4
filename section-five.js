'use strict';
// Original Section 5 gallery. The five slots are local-only and have no
// real photographs yet. Supply licensed/consented images and accurate alt text.
(() => {
  const section = document.getElementById('gallery');
  const invitation = document.getElementById('invitation');
  const dialog = document.getElementById('galleryDialog');
  if (!section || !invitation || !dialog) return;

  const PHOTOS = Object.freeze([
    {src:'./assets/gallery/photo-01.webp', alt:'Gallery photo 1', caption:'Photo 01'},
    {src:'./assets/gallery/photo-02.webp', alt:'Gallery photo 2', caption:'Photo 02'},
    {src:'./assets/gallery/photo-03.webp', alt:'Gallery photo 3', caption:'Photo 03'},
    {src:'./assets/gallery/photo-04.webp', alt:'Gallery photo 4', caption:'Photo 04'},
    {src:'./assets/gallery/photo-05.webp', alt:'Gallery photo 5', caption:'Photo 05'}
  ]);
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

  // No remote images, no inferred couple photos and no silent external fallback.
  function safeLocalUrl(src) {
    return /^\.\/assets\/gallery\/[a-z0-9_-]+\.(webp|png|jpe?g)$/i.test(src) ? src : '';
  }
  function loadPhotos() {
    if (assetsRequested) return;
    assetsRequested = true;
    PHOTOS.forEach((photo,index) => {
      const button = buttons.find(b => Number(b.dataset.gallerySlot) === index);
      const local = safeLocalUrl(photo.src);
      if (!button || !local) return;
      const image = document.createElement('img');
      image.className = 'gallery-image';
      image.loading = 'lazy';
      image.decoding = 'async';
      image.alt = photo.alt;
      image.onload = () => {
        if (!image.naturalWidth) return;
        button.classList.add('has-image');
        button.disabled = false;
        button.setAttribute('aria-label','View photo ' + (index+1));
        const placeholder = button.querySelector('.gallery-photo-placeholder');
        if (placeholder) placeholder.hidden = true;
        available.add(index);
        disclaimer.textContent = available.size === PHOTOS.length
          ? 'Tap any photograph to view it in full.'
          : 'Tap an available photograph to view it. Other images are awaiting approval.';
      };
      image.onerror = () => {
        image.remove();
      };
      button.prepend(image);
      image.src = local;
    });
  }

  function navigation() {
    return [...available].sort((a,b)=>a-b);
  }
  function updateViewer(index) {
    if (!available.has(index)) return;
    const choices = navigation();
    active = index;
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
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
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
    section.dataset.revealReady = 'true';
  }
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
