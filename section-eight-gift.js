'use strict';
// Section 8 interactions are isolated from all neighboring workers.
(() => {
  const section=document.getElementById('weddingGift');
  const invitation=document.getElementById('invitation');
  if(!section||!invitation)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const local=['localhost','127.0.0.1','[::1]','::1'].includes(location.hostname);
  // This named Vercel project is a reference-recreation prototype, not a
  // reusable customer invitation. Only it may auto-enable uploaded comparison art.
  const hostedPrototype=/^testing-4(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(location.hostname);
  const allowReference=local||hostedPrototype;
  if(allowReference){
    const art=new Image();
    art.onload=()=>{
      if(art.naturalWidth>0&&art.naturalHeight>0)section.dataset.giftArtwork='reference-local';
    };
    art.src='./assets/reference-dev/band_plum.webp';
  }
  // Section 8 has its own blush butterfly (not Section 9's purple one).
  // Its licensed comparison image is stored locally, never hotlinked.
  if(allowReference){
    const butterfly=new Image();
    butterfly.onload=()=>{
      if(butterfly.naturalWidth>0&&butterfly.naturalHeight>0)
        section.dataset.giftButterfly='reference-local';
    };
    butterfly.onerror=()=>{section.dataset.giftButterfly='original';};
    butterfly.src='./assets/reference-dev/bfly_blush.webp';
  }

  if(allowReference){
    const thumbs=[
      ['rice','gift-rice-cooker.jpg'],
      ['kettle','gift-kettle.webp']
    ];
    thumbs.forEach(([name,file])=>{
      const art=new Image();
      art.onload=()=>{
        if(art.naturalWidth>0&&art.naturalHeight>0)
          section.dataset['giftThumb'+name[0].toUpperCase()+name.slice(1)]='reference-local';
      };
      art.src='./assets/reference-dev/'+file;
    });
  }

  function syncAccess(){
    const closed=invitation.dataset.state!=='opened';
    section.inert=closed;
    section.setAttribute('aria-hidden',String(closed));
  }
  syncAccess();
  new MutationObserver(syncAccess).observe(invitation,{attributes:true,attributeFilter:['data-state']});

  // Customer-configured, verified account numbers only. No source demonstration
  // numbers are copied or accepted as a default for actual transfers.
  const accounts=Array.isArray(window.WEDDING_GIFT_CONFIG?.bankAccounts)
    ?window.WEDDING_GIFT_CONFIG.bankAccounts:[];
  section.querySelectorAll('[data-gift-bank]').forEach((card,index)=>{
    const data=accounts[index];
    if(!data||data.verified!==true||!/^[0-9]{8,20}$/.test(String(data.number||''))
       ||!String(data.bank||'').trim()||!String(data.holder||'').trim())return;
    const number=String(data.number);
    card.querySelector('.gift-eight-bank-name').textContent=String(data.bank);
    card.querySelector('.gift-eight-account').textContent=number.replace(/(.{4})/g,'$1 ').trim();
    card.querySelector('.gift-eight-holder').textContent=String(data.holder);
    const button=card.querySelector('.gift-eight-copy');
    const status=card.querySelector('.gift-eight-status');
    button.disabled=false;
    button.addEventListener('click',async()=>{
      if(invitation.dataset.state!=='opened')return;
      try {
        if(!navigator.clipboard?.writeText)throw Error('Clipboard not available');
        await navigator.clipboard.writeText(number);
        status.textContent='Copied ✦';
      } catch {status.textContent='Copy unavailable. Select the account number above.';}
    });
  });

  // The source shows a single cream Send Gift pill in the default scene.
  // Opening demo bank details is an accessible local disclosure, not a transfer.
  const trigger=section.querySelector('#giftEightTrigger');
  const banks=section.querySelector('#giftEightBanks');
  const wishlist=section.querySelector('#giftEightWishlist');
  const disclaimer=section.querySelector('#giftEightDisclaimer');
  if(trigger&&banks&&wishlist&&disclaimer){
    trigger.addEventListener('click',()=>{
      const expanded=trigger.getAttribute('aria-expanded')==='true';
      banks.hidden=expanded;
      wishlist.hidden=expanded;
      disclaimer.hidden=expanded;
      trigger.setAttribute('aria-expanded',String(!expanded));
    });
  }

  // The Gift background's 12-second repaint animation and the butterfly
  // retain their exact keyframes. Run them only near the viewport (prewarm
  // 256px on both sides); pause offscreen or while the invite is closed.
  let giftNearViewport=false;
  function syncGiftAmbient(){
    const enabled=giftNearViewport && invitation.dataset.state==='opened' &&
      !document.hidden && !reduced.matches;
    section.dataset.giftAmbient=enabled?'running':'paused';
  }
  if('IntersectionObserver' in window){
    const ambientObserver=new IntersectionObserver(entries=>{
      giftNearViewport=!!entries[0]?.isIntersecting;
      syncGiftAmbient();
    },{rootMargin:'256px 0px 256px 0px',threshold:0});
    ambientObserver.observe(section);
  }else{
    // Safe feature fallback: no visibility gating on legacy browsers.
    giftNearViewport=true;
  }
  new MutationObserver(syncGiftAmbient).observe(invitation,{
    attributes:true,attributeFilter:['data-state']
  });
  document.addEventListener('visibilitychange',syncGiftAmbient);
  reduced.addEventListener?.('change',syncGiftAmbient);
  syncGiftAmbient();

  let observer;
  function updateMotion(){
    observer?.disconnect();
    section.removeAttribute('data-gift-reveal-ready');
    const targets=section.querySelectorAll('.gift-eight-reveal');
    targets.forEach(el=>el.classList.remove('in'));
    if(reduced.matches||!('IntersectionObserver' in window))return;
    section.dataset.giftRevealReady='true';
    observer=new IntersectionObserver(entries=>{
      for(const entry of entries)entry.target.classList.toggle('in',entry.isIntersecting);
    },{threshold:.08});
    targets.forEach(el=>observer.observe(el));
  }
  reduced.addEventListener?.('change',updateMotion);
  updateMotion();
})();
