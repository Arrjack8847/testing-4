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
      status.textContent='Preview only — submissions are not sent or stored.';}
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
  // Source art for authorized research only: never fetch vendor URLs at runtime.
  if(new URLSearchParams(location.search).get('section9Reference')==='1'){
    const art=document.getElementById('s9ReferenceArt');
    art.addEventListener('load',()=>section.classList.add('s9-reference-loaded'),{once:true});
    art.addEventListener('error',()=>{section.dataset.referenceArt='missing';},{once:true});
    art.src='./assets/reference-dev/section9/paper.webp';
    // Opt-in sprite, split into two flapping wing backgrounds by Section 9 CSS.
    // Preflight the locally supplied file so a missing download retains original CSS wings.
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
    sprite.src='./assets/reference-dev/section9/bfly_1.webp';
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
    status.textContent='This is a local preview only. Your response was not sent or saved.';
  });
  name.addEventListener('input',()=>name.setCustomValidity(''));
  copy.addEventListener('click',async()=>{
    if(!previewText)return;
    try{await navigator.clipboard.writeText(previewText);status.textContent='Preview copied. Nothing was sent.';}
    catch{status.textContent='Copy unavailable. Please select and copy your preview manually.';}
  });
})();