'use strict';
// Section 9 saves RSVP through same-origin /api/rsvp and only displays approved, consented wishes.
(() => {
  const section=document.getElementById('rsvp');
  const invitation=document.getElementById('invitation');
  const form=document.getElementById('s9RsvpForm');
  if(!section||!invitation||!form)return;
  const name=document.getElementById('s9Name'),attendance=document.getElementById('s9Attendance'),
    guests=document.getElementById('s9Guests'),wish=document.getElementById('s9Wish'),
    status=document.getElementById('s9FormStatus'),preview=document.getElementById('s9Preview'),
    copy=document.getElementById('s9Copy'),shareWish=document.getElementById('s9ShareWish'),
    button=form.querySelector('.s9-submit'),receiptStatus=document.getElementById('s9ReceiptState');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const fields={name:document.getElementById('s9PreviewName'),attendance:document.getElementById('s9PreviewAttendance'),
    guests:document.getElementById('s9PreviewGuests'),wish:document.getElementById('s9PreviewWish')};
  let inView=false,previewText='',requestId=null,busy=false;
  const stop=()=>!inView||motion.matches||document.hidden||invitation.dataset.state!=='opened';
  const syncMotion=()=>{
    section.classList.toggle('s9-active',!stop());
    section.classList.toggle('s9-reveal-ready',!motion.matches);
    if(motion.matches)section.querySelectorAll('.s9-reveal').forEach(e=>e.classList.add('s9-in'));
  };
  const syncCover=()=>{
    const closed=invitation.dataset.state!=='opened';
    section.inert=closed;section.setAttribute('aria-hidden',String(closed));
    if(closed){form.reset();guests.disabled=false;shareWish.closest('label').hidden=true;preview.hidden=true;previewText='';
      status.classList.remove('s9-feedback-visible');status.textContent='Submit your RSVP to save it privately.';}
    syncMotion();
  };
  syncCover();
  new MutationObserver(syncCover).observe(invitation,{attributes:true,attributeFilter:['data-state']});
  attendance.addEventListener('change',()=>{
    guests.disabled=attendance.value==='no';
    if(guests.disabled)guests.value='1';
    preview.hidden=true;previewText='';
  });
  const observer='IntersectionObserver' in window?
    new IntersectionObserver(entries=>{
      for(const entry of entries){if(entry.target===section){inView=entry.intersectionRect.height>0;syncMotion();}
        else entry.target.classList.toggle('s9-in',entry.isIntersecting&&invitation.dataset.state==='opened');}
    },{threshold:0,rootMargin:'0px'}):null;
  if(observer){observer.observe(section);section.querySelectorAll('.s9-reveal').forEach(e=>observer.observe(e));}
  else{inView=true;section.querySelectorAll('.s9-reveal').forEach(e=>e.classList.add('s9-in'));}
  document.addEventListener('visibilitychange',syncMotion);
  motion.addEventListener?.('change',syncMotion);
  // The purple sprite has already been uploaded for the named testing-4
  // reference-recreation prototype. On that Vercel host load only the butterfly
  // by default; keep the optional paper art scoped to localhost or explicit QA.
  // Never auto-enable third-party comparison art on a customer's invitation.
  // ?section9Reference=1 opts in to both; =0 opts out of both.
  const referenceMode=new URLSearchParams(location.search).get('section9Reference');
  const localPreview=['localhost','127.0.0.1','[::1]','::1'].includes(location.hostname);
  const hostedPrototype=/^testing-4(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(location.hostname);
  const shouldLoadPaper=referenceMode==='1'||(localPreview&&referenceMode!=='0');
  const shouldLoadButterfly=referenceMode==='1'||
    ((localPreview||hostedPrototype)&&referenceMode!=='0');
  if(shouldLoadPaper||shouldLoadButterfly){
    const paperUrl='./assets/reference-dev/section9/paper.webp';
    const butterflyUrl='./assets/reference-dev/section9/bfly_1.webp';
    const art=document.getElementById('s9ReferenceArt');
    const loadPaper=()=>{
      if(!art)return;
      art.addEventListener('load',()=>{
        if(art.naturalWidth>0){section.classList.add('s9-reference-loaded');section.dataset.referenceArt='loaded';}
      },{once:true});
      art.addEventListener('error',()=>{section.dataset.referenceArt='missing';if(localPreview)console.warn('Section 9 paper.webp is unavailable. Run ensure-section9-art.ps1 in the local folder.');},{once:true});
      art.src=paperUrl;
    };
    const loadButterfly=()=>{
      const sprite=new Image();
      sprite.addEventListener('load',()=>{
        if(sprite.naturalWidth>0&&sprite.naturalHeight>0){
          section.classList.add('s9-reference-butterfly-loaded');
          section.dataset.referenceButterfly='loaded';
        }
      },{once:true});
      sprite.addEventListener('error',()=>{
        section.dataset.referenceButterfly='missing';
        if(localPreview)console.warn('Section 9 bfly_1.webp is unavailable. Run ensure-section9-art.ps1 in the local folder.');
      },{once:true});
      sprite.src=butterflyUrl;
    };
    if(referenceMode==='1'){
      // Explicit mode is useful when testing missing-image fallback.
      if(shouldLoadPaper)loadPaper();
      if(shouldLoadButterfly)loadButterfly();
    }else{
      // HEAD preflight means an absent file never replaces the CSS fallback
      // with a broken <img>. The server is local; no vendor URL is fetched.
      const loadIfPresent=async(url,onPresent,kind)=>{
        try{
          const response=await fetch(url,{method:'HEAD',cache:'no-store'});
          if(response.ok || response.status===405){onPresent();return;}
          if(kind==='paper')section.dataset.referenceArt='missing';
          else section.dataset.referenceButterfly='missing';
          const hint=localPreview?' Run ensure-section9-art.ps1 locally.':' Verify the hosted artwork asset.';
          console.warn('Section 9 '+kind+' is missing (HTTP '+response.status+').'+hint);
        }catch(error){
          if(kind==='paper')section.dataset.referenceArt='unavailable';
          else section.dataset.referenceButterfly='unavailable';
          console.warn('Section 9 '+kind+' could not be checked.',error);
        }
      };
      if(shouldLoadPaper)void loadIfPresent(paperUrl,loadPaper,'paper');
      if(shouldLoadButterfly)void loadIfPresent(butterflyUrl,loadButterfly,'butterfly');
    }
  }
  const makeId=()=>{
    if(typeof crypto.randomUUID==='function')return crypto.randomUUID();
    const a=crypto.getRandomValues(new Uint8Array(16));a[6]=(a[6]&15)|64;a[8]=(a[8]&63)|128;
    const hex=[...a].map(v=>v.toString(16).padStart(2,'0')).join('');
    return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
  };
  const feedback=(message)=>{
    status.classList.add('s9-feedback-visible');
    status.textContent=message;
  };
  const renderApproved=(wishes)=>{
    if(!Array.isArray(wishes)||!wishes.length)return;
    const wall=document.getElementById('wishesWall');
    if(!wall)return;
    const fragment=document.createDocumentFragment();
    for(const item of wishes.slice(0,20)){
      if(typeof item.name!=='string'||typeof item.wish!=='string')continue;
      const article=document.createElement('article');article.className='s9-wish s9-in';
      const who=document.createElement('div');who.className='s9-who';
      const strong=document.createElement('strong');strong.textContent=item.name.slice(0,60);
      const label=document.createElement('span');label.textContent='Wedding guest';
      const message=document.createElement('p');message.textContent=item.wish.slice(0,300);
      who.append(strong,label);article.append(who,message);fragment.append(article);
    }
    if(!fragment.childNodes.length)return;
    wall.replaceChildren(fragment);wall.setAttribute('aria-label','Approved guest wishes');
  };
  const refreshWishes=async()=>{
    try{
      const response=await fetch('/api/wishes',{cache:'no-store'});
      if(response.ok){
        const payload=await response.json();
        renderApproved(payload.wishes);
      }
    }catch(_){/* Static preview: keep clearly labeled example wishes. */}
  };
  void refreshWishes();
  const consentLabel=shareWish.closest('label');
  const syncConsent=()=>{
    const hasWish=Boolean(wish.value.trim());
    consentLabel.hidden=!hasWish;
    if(!hasWish)shareWish.checked=false;
  };
  wish.addEventListener('input',syncConsent);
  syncConsent();
  // Vercel production requires a human-verification token; local SQLite
  // preview does not. Site key is public, secret stays on the server.
  let captchaToken='',captchaWidget=null;
  const setupCaptcha=async()=>{
    try{
      const response=await fetch('/api/rsvp/status',{cache:'no-store'});
      if(!response.ok)return;
      const info=await response.json();
      if(!info.accepting||!info.captchaSiteKey)return;
      const area=document.createElement('div');area.id='s9CaptchaArea';
      area.setAttribute('aria-label','Anti-spam verification');
      button.before(area);
      const script=document.createElement('script');
      script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async=true;script.defer=true;
      script.onload=()=>{
        if(!window.turnstile)return;
        captchaWidget=window.turnstile.render(area,{
          sitekey:info.captchaSiteKey,
          callback:token=>{captchaToken=token;},
          'expired-callback':()=>{captchaToken='';}
        });
      };
      script.onerror=()=>feedback('Verification is unavailable. RSVPs cannot be sent right now.');
      document.head.append(script);
    }catch(_){/* Static preview or offline: do not claim a working backend. */}
  };
  void setupCaptcha();
  const markEdited=()=>{
    if(!busy){requestId=null;preview.hidden=true;previewText='';}
  };
  for(const el of [name,attendance,guests,wish,shareWish]){
    el.addEventListener('input',markEdited);
    el.addEventListener('change',markEdited);
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(busy)return;
    const clean=name.value.trim().replace(/\s+/g,' ');
    if(!clean){name.setCustomValidity('Please enter your name.');name.reportValidity();return;}
    name.setCustomValidity('');
    if(!form.reportValidity())return;
    if(attendance.value!=='yes'&&attendance.value!=='no')return;
    const payload={
      requestId:requestId||makeId(),name:clean,attendance:attendance.value,
      guests:attendance.value==='yes'?Number(guests.value):0,
      wish:wish.value.trim(),shareWish:Boolean(shareWish.checked&&wish.value.trim()),captchaToken
    };
    requestId=payload.requestId;
    busy=true;button.disabled=true;button.textContent='Sending…';
    feedback('Saving your RSVP…');
    try{
      const response=await fetch('/api/rsvp',{
        method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',
        body:JSON.stringify(payload)
      });
      const data=await response.json().catch(()=>null);
      if(!response.ok||!data||data.saved!==true)throw new Error(data?.error||'RSVP service unavailable. No response was saved.');
      fields.name.textContent=clean;
      fields.attendance.textContent=payload.attendance==='yes'?'Joyfully attending':'Sending love from afar';
      fields.guests.textContent=payload.attendance==='yes'?String(payload.guests):'Not attending';
      fields.wish.textContent=payload.wish||'No wish entered';
      receiptStatus.textContent='Saved privately. Your wish will appear publicly only if you opted in and it is approved.';
      previewText=['RSVP received','Receipt: '+data.receipt,'Name: '+clean,
        'Attendance: '+fields.attendance.textContent,'Guests: '+fields.guests.textContent,
        'Wish: '+fields.wish.textContent].join('\n');
      preview.hidden=false;
      feedback('RSVP received and saved. Thank you!');
      void refreshWishes();
      requestId=null;
      if(captchaWidget!==null&&window.turnstile?.reset){
        window.turnstile.reset(captchaWidget);captchaToken='';
      }
    }catch(error){
      preview.hidden=true;
      feedback(error.message||'Unable to save your RSVP. Please try again.');
    }finally{
      busy=false;button.disabled=false;button.textContent='Send RSVP';
    }
  });
  name.addEventListener('input',()=>name.setCustomValidity(''));
  copy.addEventListener('click',async()=>{
    if(!previewText)return;
    try{
      await navigator.clipboard.writeText(previewText);
      feedback('Confirmation copied. Your RSVP remains saved.');
    }catch{
      feedback('Copy unavailable. You can select and copy the confirmation above.');
    }
  });
})();
