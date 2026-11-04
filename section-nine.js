'use strict';
// Section 9 interaction is independent of Section 6. No backend, network, storage or write operations.
(() => {
  const section=document.getElementById('rsvp');
  const invitation=document.getElementById('invitation');
  const form=document.getElementById('s9RsvpForm');
  if(!section||!invitation||!form)return;
  const name=document.getElementById('s9Name'),attendance=document.getElementById('s9Attendance'),
    guests=document.getElementById('s9Guests'),wish=document.getElementById('s9Wish'),
    status=document.getElementById('s9FormStatus'),preview=document.getElementById('s9Preview'),
    copy=document.getElementById('s9Copy');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const fields={name:document.getElementById('s9PreviewName'),attendance:document.getElementById('s9PreviewAttendance'),
    guests:document.getElementById('s9PreviewGuests'),wish:document.getElementById('s9PreviewWish')};
  let inView=false,previewText='';
  const stop=()=>!inView||motion.matches||document.hidden||invitation.dataset.state!=='opened';
  const syncMotion=()=>{
    section.classList.toggle('s9-active',!stop());
    section.classList.toggle('s9-reveal-ready',!motion.matches);
    if(motion.matches)section.querySelectorAll('.s9-reveal').forEach(e=>e.classList.add('s9-in'));
  };
  const syncCover=()=>{
    const closed=invitation.dataset.state!=='opened';
    section.inert=closed;section.setAttribute('aria-hidden',String(closed));
    if(closed){form.reset();guests.disabled=false;preview.hidden=true;previewText='';
      status.classList.remove('s9-feedback-visible');status.textContent='Preview only — submissions are not sent or stored.';}
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
  // Reference files are optional and remain Git-ignored. At localhost the developer
  // preview automatically uses locally staged artwork; public sites keep the original
  // CSS illustration. ?section9Reference=0 disables auto mode when comparing designs.
  const referenceMode=new URLSearchParams(location.search).get('section9Reference');
  const localPreview=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  const tryReference=referenceMode==='1'||(localPreview&&referenceMode!=='0');
  if(tryReference){
    const paperUrl='./assets/reference-dev/section9/paper.webp';
    const butterflyUrl='./assets/reference-dev/section9/bfly_1.webp';
    const art=document.getElementById('s9ReferenceArt');
    const loadPaper=()=>{
      if(!art)return;
      art.addEventListener('load',()=>{
        if(art.naturalWidth>0)section.classList.add('s9-reference-loaded');
      },{once:true});
      art.addEventListener('error',()=>{section.dataset.referenceArt='missing';},{once:true});
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
      },{once:true});
      sprite.src=butterflyUrl;
    };
    if(referenceMode==='1'){
      // Explicit mode is useful when testing missing-image fallback.
      loadPaper();
      loadButterfly();
    }else{
      // HEAD preflight means an absent file never replaces the CSS fallback
      // with a broken <img>. The server is local; no vendor URL is fetched.
      const loadIfPresent=async(url,onPresent)=>{
        try{
          const response=await fetch(url,{method:'HEAD',cache:'no-store'});
          if(response.ok)onPresent();
        }catch(_){/* Local server unavailable; CSS artwork remains visible. */}
      };
      void loadIfPresent(paperUrl,loadPaper);
      void loadIfPresent(butterflyUrl,loadButterfly);
    }
  }
  form.addEventListener('submit',event=>{
    event.preventDefault();
    const clean=name.value.trim().replace(/\s+/g,' ');
    if(!clean){name.setCustomValidity('Please enter your name.');name.reportValidity();return;}
    name.setCustomValidity('');
    if(!form.reportValidity())return;
    const yes=attendance.value==='yes';
    if(!yes&&attendance.value!=='no')return;
    fields.name.textContent=clean;fields.attendance.textContent=yes?'Joyfully attending':'Sending love from afar';
    fields.guests.textContent=yes?guests.value:'Not attending';
    fields.wish.textContent=wish.value.trim()||'No wish entered';
    previewText=['Wedding RSVP — not submitted','Name: '+clean,'Attendance: '+fields.attendance.textContent,
      'Guests: '+fields.guests.textContent,'Wish: '+fields.wish.textContent].join('\n');
    preview.hidden=false;
    status.classList.add('s9-feedback-visible');status.textContent='This is a local preview only. Your response was not sent or saved.';
  });
  name.addEventListener('input',()=>name.setCustomValidity(''));
  copy.addEventListener('click',async()=>{
    if(!previewText)return;
    try{await navigator.clipboard.writeText(previewText);status.classList.add('s9-feedback-visible');status.textContent='Preview copied. Nothing was sent.';}
    catch{status.classList.add('s9-feedback-visible');status.textContent='Copy unavailable. Please select and copy your preview manually.';}
  });
})();