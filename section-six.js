'use strict';
// Section 6: local-only RSVP preview. No network requests, backend, or storage.
// Until an authorized RSVP collection service exists, do NOT show "sent" states.
(() => {
  const section = document.getElementById('rsvp');
  const invitation = document.getElementById('invitation');
  const form = document.getElementById('rsvpForm');
  if (!section || !invitation || !form) return;

  const nameInput = document.getElementById('rsvpName');
  const guestCount = document.getElementById('rsvpGuests');
  const attendanceSelect = document.getElementById('rsvpAttendance');
  const messageInput = document.getElementById('rsvpMessage');
  const preview = document.getElementById('rsvpPreview');
  const copyButton = document.getElementById('rsvpCopyButton');
  const copyStatus = document.getElementById('rsvpCopyStatus');
  const previewFields = {
    name: document.getElementById('rsvpPreviewName'),
    attendance: document.getElementById('rsvpPreviewAttendance'),
    guests: document.getElementById('rsvpPreviewGuests'),
    message: document.getElementById('rsvpPreviewMessage')
  };
  let previewText = '';

  function choice() {
    return attendanceSelect.value;
  }
  function hidePreview() {
    preview.hidden = true;
    previewText = '';
    copyStatus.textContent = '';
  }
  function syncGuestCount() {
    const accepting = choice() === 'yes';
    guestCount.disabled = !accepting;
    if (!accepting) guestCount.value = '1';
  }
  function synchronizeCover() {
    const closed = invitation.dataset.state !== 'opened';
    section.inert = closed;
    section.setAttribute('aria-hidden', String(closed));
    if (closed) {
      form.reset();
      nameInput.setCustomValidity('');
      syncGuestCount();
      hidePreview();
    }
  }
  synchronizeCover();
  new MutationObserver(synchronizeCover).observe(invitation,{
    attributes:true,attributeFilter:['data-state']
  });

  attendanceSelect.addEventListener('change', () => {syncGuestCount();hidePreview();});
  nameInput.addEventListener('input', () => {
    nameInput.setCustomValidity('');
    hidePreview();
  });
  guestCount.addEventListener('change',hidePreview);
  messageInput.addEventListener('input',hidePreview);

  form.addEventListener('submit', event => {
    event.preventDefault();
    // Native required validation handles an unselected attendance option.
    const cleanName = nameInput.value.trim().replace(/\s+/g,' ');
    if (!cleanName) {
      nameInput.setCustomValidity('Please enter your name.');
      nameInput.reportValidity();
      nameInput.focus({preventScroll:true});
      hidePreview();
      return;
    }
    nameInput.setCustomValidity('');
    if (!form.reportValidity()) {hidePreview();return;}
    const attending = choice();
    if (attending !== 'yes' && attending !== 'no') {hidePreview();return;}
    const count = guestCount.disabled ? 0 : Number(guestCount.value);
    if (attending === 'yes' && (!Number.isInteger(count) || count < 1 || count > 5)) {
      hidePreview();
      guestCount.focus({preventScroll:true});
      return;
    }
    const message = messageInput.value.trim();
    const answer = attending === 'yes' ? 'Joyfully accepts' : 'Regretfully declines';
    const guests = attending === 'yes' ? String(count) : 'Not attending';
    previewFields.name.textContent = cleanName;
    previewFields.attendance.textContent = answer;
    previewFields.guests.textContent = guests;
    previewFields.message.textContent = message || 'No message';
    previewText = [
      'Wedding RSVP (not submitted)',
      'Name: ' + cleanName,
      'Response: ' + answer,
      'Guests: ' + guests,
      'Message: ' + (message || 'No message'),
      'This response has not been sent to the couple.'
    ].join('\n');
    preview.hidden = false;
    copyStatus.textContent = '';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    preview.scrollIntoView({block:'nearest',behavior:reduced?'instant':'smooth'});
  });

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {await navigator.clipboard.writeText(text);return true;} catch (_) {}
    }
    // Local Wi-Fi HTTP often blocks the modern clipboard API. This fallback
    // only runs after a deliberate Copy button click and never uploads data.
    const temp=document.createElement('textarea');
    temp.value=text;
    temp.setAttribute('readonly','');
    temp.style.cssText='position:fixed;left:-9999px;top:0;opacity:0';
    document.body.appendChild(temp);
    temp.select();
    let copied=false;
    try {copied=document.execCommand('copy');} catch (_) {}
    temp.remove();
    return copied;
  }
  copyButton.addEventListener('click',async () => {
    if (!previewText || preview.hidden) return;
    const copied = await copyText(previewText);
    copyStatus.textContent = copied
      ? 'Copied. You can paste this response into your own message; it has not been sent.'
      : 'Automatic copying is unavailable in this browser. Select and copy the preview above manually.';
  });

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced && 'IntersectionObserver' in window) section.dataset.revealReady='true';
  if ('IntersectionObserver' in window) {
    const observer=new IntersectionObserver(entries=>{
      if (!entries.some(entry=>entry.isIntersecting)) return;
      section.classList.add('is-visible');
      observer.disconnect();
    },{threshold:.08,rootMargin:'120px 0px'});
    observer.observe(section);
  } else section.classList.add('is-visible');
})();
