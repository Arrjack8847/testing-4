'use strict';
// Functional mobile section shortcuts. No invented music or contact links.
(() => {
  const nav = document.getElementById('inviteNavigation');
  const invitation = document.getElementById('invitation');
  if (!nav || !invitation) return;
  const buttons = [...nav.querySelectorAll('button[data-invite-target]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  const active = () => {
    frame = 0;
    if (nav.hidden) return;
    let nearest = null;
    const marker = innerHeight * .35;
    for (const button of buttons) {
      const target = document.getElementById(button.dataset.inviteTarget);
      if (!target) continue;
      const r = target.getBoundingClientRect();
      if (r.top <= marker && r.bottom >= marker) {
        nearest = button;
        break;
      }
      if (r.top < marker) nearest = button;
    }
    for (const button of buttons) {
      if (button === nearest) button.setAttribute('aria-current','location');
      else button.removeAttribute('aria-current');
    }
  };
  const schedule = () => {if (!frame) frame=requestAnimationFrame(active);};
  const cover = () => {
    const closed = invitation.dataset.state !== 'opened';
    nav.hidden = closed;
    nav.inert = closed;
    nav.setAttribute('aria-hidden',String(closed));
    if (!closed) schedule();
  };
  cover();
  new MutationObserver(cover).observe(invitation,{attributes:true,attributeFilter:['data-state']});
  for (const button of buttons) button.addEventListener('click',() => {
    if (nav.hidden || invitation.dataset.state !== 'opened') return;
    const target = document.getElementById(button.dataset.inviteTarget);
    if (target) target.scrollIntoView({block:'start',behavior:reduced.matches?'instant':'smooth'});
    schedule();
  });
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
})();
