'use strict';

// All files and geometry are for the FIRST mobile invitation scene only.
// The original artwork is used with the project owner's stated permission.
// Motion timings and sprite coordinates are independent approximations.
const REMOTE = 'https://undangankahwin.com/images/concierge/packs/tasik-kayangan/';
const query = new URLSearchParams(location.search);
const forceRemote = query.get('remote') === '1';
const debug = query.has('debug');
// Phase 21: opt-in original-art skin. The default prototype is untouched.
// Use ?skin=golden-autumn to load assets/skins/golden-autumn/*.webp.
// A non-default skin never falls back to the reference provider's artwork.
const requestedSkin = query.get('skin') || '';
const activeSkin = /^[a-z0-9][a-z0-9-]{0,39}$/.test(requestedSkin) && requestedSkin !== 'reference'
  ? requestedSkin : '';
const skinAssetBase = activeSkin ? './assets/skins/' + activeSkin + '/' : './assets/';

const invite = document.getElementById('invitation');
const art = document.getElementById('animatedScene');
const master = document.getElementById('masterArt');
const cover = document.getElementById('cover');
const opened = document.getElementById('opened');
const notification = document.getElementById('networkNote');
// The native-sticky hero has a toolbar-stable 100lvh canvas. Tie Section 1
// choreography to that scene, not the mobile browser's changing innerHeight.
const heroViewport = document.getElementById('viewport');
const heroHeight = () => Math.max(heroViewport?.clientHeight || window.innerHeight, 1);

// Render the repeated reference assets as separate DOM elements.
// Background layers retain the reference artwork's 563x1000 coordinate system.
const definitions = [
  ["sky.webp","sky-layer",{}],
  ["palace.webp","depth palace",{}],
  ["reeds.webp","depth reeds",{}],
  ["arch.webp","depth arch",{}],
  ["tree_l.webp","depth tree tree-left",{}],
  ["tree_r.webp","depth tree tree-right",{}],
  ["drape.webp","depth canopy",{}],
  ["hang_1.webp","sprite hanging",{"--x":"4","--y":"-3","--h":"36","--z":"1","--sa":"2.462268041237113","--sd":"3.4337078651685395s","--sl":"-0.92s"}],
  ["hang_2.webp","sprite hanging",{"--x":"12","--y":"-4","--h":"28","--z":"1","--sa":"2.7958762886597937","--sd":"2.89438202247191s","--sl":"-1.49s"}],
  ["hang_3.webp","sprite hanging",{"--x":"20","--y":"-5","--h":"22","--z":"1","--sa":"2.0742268041237115","--sd":"4.35505617977528s","--sl":"-2.07s"}],
  ["hang_4.webp","sprite hanging",{"--x":"28","--y":"-6","--h":"15","--z":"1","--sa":"3.352577319587629","--sd":"3.8157303370786515s","--sl":"-2.65s"}],
  ["hang_3.webp","sprite hanging flipped",{"--x":"96","--y":"-3","--h":"34","--z":"1","--sa":"1.8416494845360822","--sd":"3.2764044943820223s","--sl":"-3.23s"}],
  ["hang_4.webp","sprite hanging flipped",{"--x":"88","--y":"-4","--h":"28","--z":"1","--sa":"1.909278350515464","--sd":"2.737078651685393s","--sl":"-3.81s"}],
  ["hang_1.webp","sprite hanging flipped",{"--x":"80","--y":"-5","--h":"21","--z":"1","--sa":"3.1876288659793817","--sd":"4.1977528089887635s","--sl":"-0.39s"}],
  ["hang_2.webp","sprite hanging flipped",{"--x":"72","--y":"-6","--h":"14","--z":"1","--sa":"2.465979381443299","--sd":"3.6584269662921347s","--sl":"-0.96s"}],
  ["spike_5.webp","sprite plant front",{"--x":"5","--y":"4","--h":"44","--z":"1","--sa":"1.1199999999999999","--sd":"2.4s","--sl":"0s"}],
  ["spike_3.webp","sprite plant front",{"--x":"13","--y":"4","--h":"36","--z":"1","--sa":"2.0148453608247423","--sd":"3.8606741573033707s","--sl":"-0.58s"}],
  ["spike_4.webp","sprite plant front",{"--x":"95","--y":"4","--h":"42","--z":"1","--sa":"1.5096907216494846","--sd":"3.3213483146067415s","--sl":"-1.16s"}],
  ["spike_5.webp","sprite plant front flipped",{"--x":"87","--y":"4","--h":"35","--z":"1","--sa":"2.404536082474227","--sd":"2.7820224719101123s","--sl":"-1.73s"}],
  ["stem_1.webp","sprite plant front",{"--x":"9","--y":"2","--h":"26","--z":"2","--sa":"2.7134020618556702","--sd":"4.242696629213484s","--sl":"-2.31s"}],
  ["stem_2.webp","sprite plant front flipped",{"--x":"91","--y":"2","--h":"26","--z":"2","--sa":"1.9917525773195877","--sd":"3.703370786516854s","--sl":"-2.89s"}],
  ["leaf_5.webp","sprite leaf front still",{"--x":"36","--y":"-1","--h":"10","--z":"3","--sa":"3.270103092783505","--sd":"3.1640449438202247s","--sl":"-3.47s"}],
  ["leaf_6.webp","sprite leaf front still",{"--x":"46","--y":"-1","--h":"8","--z":"3","--sa":"2.5484536082474225","--sd":"2.6247191011235955s","--sl":"-0.05s"}],
  ["leaf_4.webp","sprite leaf front flipped still",{"--x":"55","--y":"-1","--h":"8","--z":"3","--sa":"1.8268041237113404","--sd":"4.085393258426966s","--sl":"-0.63s"}],
  ["leaf_5.webp","sprite leaf front flipped still",{"--x":"64","--y":"-1","--h":"10","--z":"3","--sa":"3.105154639175258","--sd":"3.546067415730337s","--sl":"-1.2s"}],
  ["bloom_5.webp","sprite flower front",{"--x":"39","--y":"-2","--h":"10","--z":"4","--sa":"2.3835051546391752","--sd":"3.006741573033708s","--sl":"-1.78s"}],
  ["bloom_1.webp","sprite flower front",{"--x":"47","--y":"-2","--h":"8","--z":"4","--sa":"1.6618556701030929","--sd":"2.4674157303370787s","--sl":"-2.36s"}],
  ["bloom_5.webp","sprite flower front flipped",{"--x":"53","--y":"-2","--h":"8","--z":"4","--sa":"2.9402061855670105","--sd":"3.928089887640449s","--sl":"-2.94s"}],
  ["bloom_1.webp","sprite flower front flipped",{"--x":"61","--y":"-2","--h":"10","--z":"4","--sa":"2.218556701030928","--sd":"3.3887640449438203s","--sl":"-3.52s"}],
  ["peacock.webp","sprite peacock-sprite front still",{"--x":"20","--y":"-2","--h":"40","--z":"6","--sa":"2.4478350515463916","--sd":"2.8494382022471907s","--sl":"-0.1s"}],
  ["peacock.webp","sprite peacock-sprite front flipped still",{"--x":"80","--y":"-2","--h":"40","--z":"6","--sa":"1.9426804123711339","--sd":"4.310112359550562s","--sl":"-0.67s"}],
  ["bloom_2.webp","sprite flower front",{"--x":"23","--y":"-1","--h":"8","--z":"7","--sa":"2.0536082474226807","--sd":"3.7707865168539323s","--sl":"-1.25s"}],
  ["bloom_6.webp","sprite flower front",{"--x":"31","--y":"-2","--h":"9","--z":"7","--sa":"3.331958762886598","--sd":"3.2314606741573035s","--sl":"-1.83s"}],
  ["bloom_2.webp","sprite flower front flipped",{"--x":"77","--y":"-1","--h":"8","--z":"7","--sa":"2.6103092783505155","--sd":"2.692134831460674s","--sl":"-2.41s"}],
  ["bloom_6.webp","sprite flower front flipped",{"--x":"69","--y":"-2","--h":"9","--z":"7","--sa":"1.888659793814433","--sd":"4.152808988764045s","--sl":"-2.99s"}],
];

const byFile = new Map();
for (const [filename, classes, properties] of definitions) {
  const wrapper = document.createElement('div');
  wrapper.className = classes;
  for (const [name, value] of Object.entries(properties)) wrapper.style.setProperty(name, value);
  const img = document.createElement('img');
  img.alt = '';
  img.decoding = 'async';
  img.draggable = false;
  if (filename === 'tree_l.webp' || filename === 'tree_r.webp') img.classList.add('gentle-tree');
  if (classes.includes('hanging')) img.classList.add('swing');
  if (classes.includes('plant') || classes.includes('leaf')) img.classList.add('plant-sway');
  if (classes.includes('flower')) img.classList.add('flower-sway');
  wrapper.appendChild(img);
  if (filename === 'palace.webp') {
    // Two water streams are placed against the same 1920px painting as the original.
    // The overlay scales with the building, so the falls do not drift during the camera push.
    const water = document.createElement('div');
    water.className = 'waterfalls';
    for (const [left, width, phase] of [['16%','10%','0s'], ['65.5%','12%','-.7s']]) {
      const fall = document.createElement('span');
      fall.className = 'waterfall';
      Object.assign(fall.style, {left, width, top:'64%', height:'11.5%'});
      fall.style.setProperty('--fall-delay', phase);
      for (const tag of ['i','i','b']) fall.appendChild(document.createElement(tag));
      water.appendChild(fall);
      // Floating mist is independent of the water streams. The three overlapping
      // clouds move on different long cycles and remain anchored to the falls.
      const mist = document.createElement('div');
      mist.className = 'scene-mist';
      mist.style.setProperty('--mist-x', left);
      mist.style.setProperty('--mist-width', width);
      mist.style.setProperty('--mist-delay', phase);
      for (let index = 0; index < 3; index++) mist.appendChild(document.createElement('i'));
      water.appendChild(mist);
    }
    wrapper.appendChild(water);
  }
  if (classes.includes('peacock-sprite')) {
    const sheen = document.createElement('i');
    sheen.className = 'peacock-glint';
    sheen.setAttribute('aria-hidden', 'true');
    wrapper.appendChild(sheen);
  }
  art.appendChild(wrapper);
  if (!byFile.has(filename)) byFile.set(filename, []);
  byFile.get(filename).push(img);
}
// The water highlight is an independent CSS layer in the lake area.
const glow = document.createElement('div');
glow.className = 'water-glow';
art.appendChild(glow);

// The original scene contains two stylised flying birds in front of the sky.
// Keeping them as one lightweight CSS animation avoids continuous JavaScript work.
const birds = document.createElement('div');
birds.className = 'sky-birds';
for (const [top, duration, delay, size] of [
  ['14%', '15s', '.6s', '1'],
  ['22%', '18s', '5.5s', '.8']
]) {
  const bird = document.createElement('span');
  bird.style.cssText = `top:${top};--bird-duration:${duration};--bird-delay:${delay};--bird-scale:${size}`;
  bird.innerHTML = '<svg viewBox="0 0 40 16" aria-hidden="true"><path d="M1 9 C8 2 14 3 20 10 C26 3 32 2 39 9 C32 6 26 8 20 13 C14 8 8 6 1 9Z"/></svg>';
  birds.appendChild(bird);
}
art.appendChild(birds);

// Canvas petals resemble the reference's low-density, pastel falling particles.
// Deterministic seed and capped drawing resolution give repeatable lightweight motion.
const petalCanvas = document.getElementById('petalCanvas');
const petalContext = petalCanvas.getContext('2d', {alpha:true});
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const petalPalette = [
  'rgba(122,16,97,.4)','rgba(200,170,220,.65)',
  'rgba(255,255,255,.8)','rgba(160,150,210,.5)'
];
let seed = 20270123;
function randomUnit() {
  seed = (1664525 * seed + 1013904223) >>> 0;
  return seed / 4294967296;
}
const petals = Array.from({length:16}, () => ({
  x:randomUnit(), y:randomUnit(),
  size:1.8+randomUnit()*3.7, speed:.015+randomUnit()*.020,
  drift:.006+randomUnit()*.012, spin:randomUnit()*6.283,
  phase:randomUnit()*6.283,
  tint:petalPalette[Math.floor(randomUnit()*petalPalette.length)]
}));
let petalW=0, petalH=0, lastDraw=0, prevFrame=0, petalFrame=0;
let petalDrawCount=0, sceneVisible=true, pageSuspended=false;

// One RAF loop exists only while the first invitation scene is actually on
// screen and decorative motion is allowed. Previously this loop requested
// frames indefinitely even for hidden tabs, reduced motion and frozen debug.
function ambientAllowed() {
  // The final 1H of the 4H sticky containing block is deliberately
  // overlaid by Section 2 at document 3H. The lake is no longer visible
  // once the mauve message fully covers the phone.
  return !!petalContext && sceneVisible &&
    (invite.dataset.state !== 'opened' || window.scrollY < heroHeight()*3) &&
    !pageSuspended && !document.hidden && !reduceMotion.matches &&
    !document.documentElement.classList.contains('debug-freeze');
}
// The global 26-petal field completely covers the Section 1 canvas while
// active. Keep the hero's ambient state running (CSS birds/butterflies depend
// on it), but avoid rasterizing petals into an invisible duplicate canvas.
// Debug/phone QA intentionally retain the local renderer for measurements.
function localPetalsAllowed() {
  return ambientAllowed() &&
    (debug || query.has('phoneqa') ||
     !document.documentElement.classList.contains('global-petals-active'));
}
function syncAmbient() {
  const running=ambientAllowed();
  const paintLocalPetals=localPetalsAllowed();
  invite.dataset.ambient=running ? 'running' : 'paused';
  if (paintLocalPetals && !petalFrame) {
    lastDraw=0;
    prevFrame=0;
    petalFrame=requestAnimationFrame(renderPetals);
  } else if (!paintLocalPetals) {
    if (petalFrame) cancelAnimationFrame(petalFrame);
    petalFrame=0;
    lastDraw=0;
    prevFrame=0;
    if (reduceMotion.matches) petalContext?.clearRect(0,0,petalW,petalH);
  }
}
function resizePetals() {
  const bounds = petalCanvas.getBoundingClientRect();
  const ratio=Math.min(window.devicePixelRatio||1,2);
  const physicalW=Math.round(bounds.width*ratio);
  const physicalH=Math.round(bounds.height*ratio);
  // The address bar may fire resize while the 100lvh scene stays unchanged.
  // Do not clear/reallocate the canvas in that case (it causes a flash).
  if(petalCanvas.width===physicalW && petalCanvas.height===physicalH &&
     petalW===bounds.width && petalH===bounds.height) return;
  petalW=bounds.width;petalH=bounds.height;
  petalCanvas.width=physicalW;
  petalCanvas.height=physicalH;
  petalContext?.setTransform(ratio,0,0,ratio,0,0);
}
function renderPetals(now) {
  // Mark consumed before scheduling the next frame. A visibility/observer
  // callback can always cancel the outstanding frame by its ID.
  petalFrame=0;
  if (!localPetalsAllowed()) {
    syncAmbient();
    return;
  }
  petalFrame=requestAnimationFrame(renderPetals);
  // Painting remains capped at 30 fps even on 120 Hz phones.
  if(now-lastDraw < 1000/30) return;
  const dt=prevFrame ? Math.min((now-prevFrame)/1000,.05) : 0;
  prevFrame=now;lastDraw=now;
  petalDrawCount++;
  petalContext.clearRect(0,0,petalW,petalH);
  for(const p of petals) {
    p.y += p.speed*dt;
    if(p.y>1.04) {p.y=-.04;p.x=randomUnit();}
    const x=(p.x+Math.sin(now/2800+p.phase)*p.drift)*petalW;
    const y=p.y*petalH;
    petalContext.save();
    petalContext.translate(x,y);
    petalContext.rotate(p.spin+now*.00025);
    petalContext.fillStyle=p.tint;
    petalContext.beginPath();
    petalContext.ellipse(0,0,p.size*.60,p.size*1.35,.32,0,Math.PI*2);
    petalContext.fill();
    petalContext.restore();
  }
}
resizePetals();
window.addEventListener('resize',resizePetals,{passive:true});
document.addEventListener('visibilitychange',syncAmbient);
window.addEventListener('pagehide',()=>{
  pageSuspended=true;
  syncAmbient();
});
window.addEventListener('pageshow',()=>{
  pageSuspended=false;
  syncAmbient();
});
reduceMotion.addEventListener('change',syncAmbient);
// Track the actual sticky first scene, not the 4-viewport scroll container:
// scrolling beyond the invitation suspends both canvas and ambient CSS motion.
if ('IntersectionObserver' in window) {
  const observer=new IntersectionObserver(entries=>{
    const entry=entries[0];
    // Pause once less than 7.5% of the viewport scene is visible. On some
    // phone heights a 37-47px sliver remains above the next section at the
    // maximum scroll position; animating that sliver wastes battery.
    sceneVisible=entry ? entry.isIntersecting && entry.intersectionRatio>.075 : true;
    syncAmbient();
  },{threshold:[0,.075]});
  observer.observe(document.getElementById('viewport'));
}
// Debug controls change a root class, so watch only that class rather than
// running a polling timer or an idle requestAnimationFrame.
new MutationObserver(syncAmbient).observe(document.documentElement,{
  attributes:true,attributeFilter:['class']
});
if (debug || query.has('phoneqa')) {
  Object.defineProperty(window,'__scenePerf',{
    value:Object.freeze({
      get draws(){return petalDrawCount;},
      get pendingFrame(){return petalFrame!==0;},
      get sceneVisible(){return sceneVisible;},
      get ambient(){return invite.dataset.ambient;}
    }),configurable:false
  });
}
syncAmbient();

const allNames = ['scene.webp', ...byFile.keys()];
const failed = new Set();
function loadArtwork(name) {
  // Prefer locally stored artwork, fallback to reference host when absent.
  const local = skinAssetBase + name;
  const sources = activeSkin ? [local] : (forceRemote ? [REMOTE + name] : [local, REMOTE + name]);
  return new Promise(resolve => {
    let index = 0;
    const test = new Image();
    const attempt = () => { test.src = sources[index]; };
    test.onload = () => resolve({name, src:test.src, okay:true});
    test.onerror = () => {
      index++;
      if (index < sources.length) attempt();
      else { failed.add(name); resolve({name, src:'', okay:false}); }
    };
    attempt();
  });
}
// Bound image probes at startup. A single Promise.all decoded every large
// scene layer at once, which can spike WebKit memory before the cover appears.
// Keep the full-resolution assets, their order, and every animation identical;
// only limit the number of images simultaneously loading/decoding.
async function loadSceneArtwork() {
  const batchSize=4;
  for(let start=0;start<allNames.length;start+=batchSize){
    const group=allNames.slice(start,start+batchSize);
    await Promise.all(group.map(async name=>{
      const result=await loadArtwork(name);
      if(!result.okay)return;
      if(name==='scene.webp')master.src=result.src;
      else byFile.get(name).forEach(img=>{
        img.src=result.src;
        // Share the exact same loaded source with the peacock feather mask.
        if(name==='peacock.webp'){
          const sheen=img.parentElement?.querySelector('.peacock-glint');
          if(sheen)sheen.style.setProperty('--peacock-image','url("'+result.src+'")');
        }
      });
    }));
  }
}
const artworkReady=loadSceneArtwork().then(() => {
  // Only the 24 separate layered files are essential to the moving garden.
  // If scene.webp is missing but every layer loaded, prefer the complete
  // animated scene instead of incorrectly hiding it and showing a blank page.
  const layersComplete = [...byFile.keys()].every(name => !failed.has(name));
  const masterLoaded = !failed.has('scene.webp');
  const mode = layersComplete ? 'ready' : masterLoaded ? 'failed' : 'unavailable';
  invite.dataset.layers = mode;
  notification.hidden = mode === 'ready';
  if (mode === 'failed') {
    notification.textContent =
      'Animated artwork is incomplete. Showing the still invitation image.';
  } else if (mode === 'unavailable') {
    notification.textContent =
      'Invitation artwork could not be loaded. Check your connection or run download-assets.ps1.';
  }
  return layersComplete;
});

// Mobile-only cleanup: Section 1's animated backdrop includes many
// 1080x1920 transparent WebP layers. Keep the still master as a fallback,
// but detach the animated <img> sources when the sticky hero is multiple
// viewports away. The shared lifecycle prewarms on reverse scrolling.
// This cannot force iOS to free cached textures, but removes live DOM holders.
artworkReady.then(ready => {
  if(!ready || !window.MobileArtworkLifecycle?.mobile)return;
  const layers=[...byFile.values()].flat().filter(Boolean);
  const sources=layers.map(img=>[img,img.getAttribute('src')]);
  const sheens=[...document.querySelectorAll('.peacock-glint')]
    .map(node=>[node,node.style.getPropertyValue('--peacock-image')]);
  let detached=false;
  let generation=0;
  function restoreHero(){
    if(!detached)return;
    detached=false;
    const version=++generation;
    invite.dataset.heroRehydrating='true';
    for(const [node,value] of sheens)
      if(value)node.style.setProperty('--peacock-image',value);
    const loads=sources.map(([img,url])=>new Promise(resolve=>{
      if(!url){resolve(false);return;}
      let settled=false;
      const finish=ok=>{
        if(settled)return;
        settled=true;
        img.removeEventListener('load',onLoad);
        img.removeEventListener('error',onError);
        resolve(ok);
      };
      const onLoad=()=>finish(img.naturalWidth>0);
      const onError=()=>finish(false);
      img.addEventListener('load',onLoad);
      img.addEventListener('error',onError);
      img.src=url;
      if(img.complete && img.naturalWidth>0)finish(true);
    }));
    Promise.all(loads).then(results=>{
      if(version!==generation || detached)return;
      // Never show a partially transparent animated scene in place of the
      // original master while returning rapidly from Sections 6–10.
      if(results.every(Boolean))invite.dataset.heroRehydrating='false';
    });
  }
  function releaseHero(){
    if(detached)return;
    detached=true;
    ++generation;
    invite.dataset.heroRehydrating='true';
    for(const [img] of sources)img.removeAttribute('src');
    for(const [node] of sheens)node.style.setProperty('--peacock-image','none');
  }
  window.MobileArtworkLifecycle.register(heroViewport,{
    activate:restoreHero,release:releaseHero
  });
});

// Cover is a focusable action, not a scroll-triggered trap.
let openedOnce = false;
let scrollGestureStarted = false;
// Once scrolling begins, never re-enable the 1.3–1.7s *opening*
// transitions at the first few scroll pixels. Their re-entry used to
// make the moving garden lag or "shake" on tiny reverse finger motions.
// The initial cover-to-valley entrance remains animated until a gesture.
function engageScrollMode() {
  if (!openedOnce || scrollGestureStarted) return;
  if (window.scrollY > heroHeight() * 3.1) return;
  scrollGestureStarted = true;
  invite.dataset.scrollActive = 'yes';
}
function openInvitation(event) {
  // When activated from a keyboard, the button becomes inert. Move focus to
  // the new invitation action so screen-reader and keyboard users are not
  // stranded on the document body. Touch/click activation remains unchanged.
  const keyboardActivation = event?.detail === 0 &&
    (event?.currentTarget?.id === 'openButton' || event?.currentTarget?.id === 'debugOpen');
  invite.dataset.state = 'opened';
  invite.dataset.reading = 'no';
  invite.dataset.lettering = 'idle';
  applyScrollScene(0);
  cover.inert = true;
  cover.setAttribute('aria-hidden','true');
  opened.inert = false;
  opened.setAttribute('aria-hidden','false');
  openedOnce = true;
  scrollGestureStarted = false;
  invite.dataset.scrollActive = 'no';
  // Mobile cover is fixed until deliberate activation. Release it only here,
  // not from touch/wheel/scroll events; this prevents fast swipes skipping
  // the invitation while keeping the post-open scroll choreography native.
  document.documentElement.classList.remove('invitation-cover-locked');
  document.documentElement.style.overflowY = 'auto';
  if (keyboardActivation) {
    document.querySelector('.swipe-cue')?.focus({preventScroll:true});
  }
}
function resetInvitation() {
  invite.dataset.state = 'cover';
  invite.dataset.reading = 'no';
  invite.dataset.lettering = 'idle';
  applyScrollScene(0);
  cover.inert = false;
  cover.setAttribute('aria-hidden','false');
  opened.inert = true;
  opened.setAttribute('aria-hidden','true');
  openedOnce = false;
  scrollGestureStarted = false;
  invite.dataset.scrollActive = 'no';
  document.documentElement.classList.add('invitation-cover-locked');
  document.documentElement.style.overflowY = 'hidden';
  // Clear scroll-driven parallax as well as scrolling, or reset leaves the scene displaced.
  document.documentElement.style.setProperty('--stage-parallax', '0px');
  document.documentElement.style.setProperty('--reading-progress', '0');
  window.scrollTo({top:0, behavior:'instant'});
  document.getElementById('openButton').focus({preventScroll:true});
}
document.documentElement.style.overflowY = 'hidden';
document.getElementById('openButton').addEventListener('click', openInvitation);
window.addEventListener('pageshow', () => {
  // Returning from Safari/Telegram page cache must not expose Section 2+
  // while the cover is closed, even when the browser restores old scroll.
  if (!openedOnce) {
    document.documentElement.classList.add('invitation-cover-locked');
    if (window.scrollY) window.scrollTo({top:0,behavior:'instant'});
  }
});

// Reference scroll calibration at 390x844:
// 0-.45H: unobstructed valley; .75H: flower borders return;
// .95H: hanging floral frame; 1.15H: arch and peacocks appear;
// 1.5H: arch framed, "The Wedding of" begins to fade in.
// Unlike a normal parallax webpage, the whole scenic hero stays STICKY.
let scrollTick = false;
const clamp = x => Math.max(0, Math.min(1, x));
function easeBetween(x, start, end) {
  const p = clamp((x-start)/(end-start));
  return p*p*(3-2*p);
}
function applyScrollScene(fraction) {
  const rootStyle = document.documentElement.style;
  const garden = easeBetween(fraction, .52, 1.43);
  // The reference starts retreating from the valley during the first swipe:
  // its palace roof and palm tree silhouettes move visibly lower by 0.45H.
  // Our old garden-driven scale did not change at all until 0.52H.
  const palaceRetreat = easeBetween(fraction, .22, .72);
  const skyRetreat = easeBetween(fraction, .22, .55);
  const framing = easeBetween(fraction, .84, 1.42);
  // Border flowers visibly return by .75H in reference screenshots,
  // while lower reeds recede after the opening and are gone by .45H.
  const blossoms = easeBetween(fraction, .47, .78);
  const reeds = 1-easeBetween(fraction, .12, .40);
  const peacocks = easeBetween(fraction, 1.06, 1.44);
  // Re-measured live at 390x844 after steady scroll: heading opacity
  // ~0 at 1.35H, ~.43 at 1.50H, fully visible by 1.70H.
  // The earlier 1.29-1.54H curve revealed this title too quickly.
  const greeting = easeBetween(fraction, 1.37, 1.67);
  // Large script reveals left-to-right slightly after the heading starts.
  const firstName = easeBetween(fraction, 1.28, 1.65);
  const ampersand = easeBetween(fraction, 1.64, 1.90);
  const secondName = easeBetween(fraction, 1.79, 2.08);
  const names = Math.max(firstName, secondName);
  const details = easeBetween(fraction, 2.08, 2.42);
  const set = (name,value) => {
    const next=String(value);
    if(rootStyle.getPropertyValue(name)!==next)rootStyle.setProperty(name,next);
  };
  set('--sky-scroll-scale', (1.12-.12*skyRetreat).toFixed(4));
  set('--sky-scroll-y', (-4*(1-skyRetreat)).toFixed(3)+'%');
  set('--palace-scroll-scale', (.99-.33*palaceRetreat).toFixed(4));
  set('--frame-scroll-scale', (2.6-1.6*framing).toFixed(4));
  set('--frame-scroll-opacity', framing.toFixed(4));
  set('--tree-scroll-scale', (2.1-1.1*framing).toFixed(4));
  set('--tree-scroll-shift', (14*(1-framing)).toFixed(3)+'%');
  set('--canopy-scroll-scale', (2.2-1.2*framing).toFixed(4));
  set('--canopy-scroll-shift', (-10*(1-framing)).toFixed(3)+'%');
  set('--hanging-scroll-opacity', framing.toFixed(4));
  set('--hanging-scroll-shift', (-20*(1-framing)).toFixed(3)+'lvh');
  set('--front-scroll-opacity', blossoms.toFixed(4));
  set('--front-scroll-shift', (45*(1-blossoms)).toFixed(3)+'lvh');
  set('--reed-scroll-opacity', reeds.toFixed(4));
  set('--reed-scroll-shift', (38*(1-reeds)).toFixed(3)+'lvh');
  set('--peacock-scroll-opacity', peacocks.toFixed(4));
  set('--reading-progress', greeting.toFixed(4));
  set('--names-progress', names.toFixed(4));
  set('--first-name-progress', firstName.toFixed(4));
  set('--first-name-hidden',((1-firstName)*100).toFixed(2)+'%');
  set('--amp-progress', ampersand.toFixed(4));
  set('--second-name-progress', secondName.toFixed(4));
  set('--second-name-hidden',((1-secondName)*100).toFixed(2)+'%');
  set('--details-progress', details.toFixed(4));
  // The 3H reference keeps its garden pinned while the text itself
  // scrolls upward after 2H. The mauve section covers the garden from
  // screen bottom to top during 2H–3H; no second scenery translation.
  set('--text-scroll-shift',(-Math.max(0,fraction-2)*heroHeight()).toFixed(1)+'px');
  set('--stage-parallax','0px');
  invite.dataset.swiped = fraction >= .15 ? 'yes' : 'no';
  invite.dataset.reading = fraction >= 1.37 ? 'yes' : 'no';
  // The old threshold re-enabled CSS transitions at the top on each
  // reverse swipe, introducing delayed camera motion. Stay in scroll mode
  // for the rest of the opening until reset, even at scroll position zero.
  if (fraction > .025) engageScrollMode();
  // The original invitation starts a one-time handwritten-name animation
  // when the returning garden reaches its title. Continue writing even if
  // the user stops swiping or reverses slightly. Reset starts a fresh take.
  if (fraction >= 1.29 && invite.dataset.lettering !== 'playing') {
    invite.dataset.lettering = 'playing';
  }
}
function synchronizeReading() {
  scrollTick = false;
  if(!openedOnce) return;
  applyScrollScene(window.scrollY/heroHeight());
  syncAmbient(); // The overlay can hide a still-sticky scene before IO detects exit.
}
function requestReadingSync() {
  if (!openedOnce) return;
  if (window.scrollY > 1) engageScrollMode();
  if (scrollTick) return;
  scrollTick = true;
  requestAnimationFrame(synchronizeReading);
}
window.addEventListener('scroll', requestReadingSync, {passive:true});
window.addEventListener('resize', requestReadingSync, {passive:true});
// On real touch scrolling the compositor can start moving before the
// following scroll event/rAF. Arm the no-transition mode on touchstart
// (also for wheel devices) so artwork tracks the very first frame.
window.addEventListener('touchstart', engageScrollMode, {passive:true});
window.addEventListener('wheel', engageScrollMode, {passive:true});

// The cue moves into the INTRO on the same sticky lake, never straight
// past the user to a different section. Smooth native scrolling drives all
// of the coordinated cover-return and letter-reveal effects.
document.querySelector('.swipe-cue')?.addEventListener('click', event => {
  if (!openedOnce) return;
  event.preventDefault();
  const destination = Math.max(window.scrollY, heroHeight()*1.6);
  window.scrollTo({top:destination,
    behavior:reduceMotion.matches ? 'instant' : 'smooth'});
});

if (debug) {
  const panel = document.getElementById('debugPanel');
  const mode = document.getElementById('compareMode');
  const slider = document.getElementById('blendSlider');
  const output = document.getElementById('blendValue');
  const freeze = document.getElementById('freezeMotion');
  panel.hidden = false;
  document.documentElement.classList.add('debug-freeze');
  function refresh() {
    if (mode.value === 'normal') delete invite.dataset.compare;
    else invite.dataset.compare = mode.value;
    document.getElementById('blendControl').hidden = mode.value !== 'blend';
    document.documentElement.style.setProperty('--debug-blend', Number(slider.value) / 100);
    output.textContent = slider.value + '%';
  }
  mode.addEventListener('change', refresh);
  slider.addEventListener('input', refresh);
  freeze.addEventListener('change', () => document.documentElement.classList.toggle('debug-freeze', freeze.checked));
  document.getElementById('resetButton').addEventListener('click', resetInvitation);
  document.getElementById('debugOpen').addEventListener('click', openInvitation);
  refresh();
  artworkReady.then(ready => {
    document.getElementById('debugStats').textContent = `${allNames.length - failed.size}/${allNames.length} files loaded. ${ready ? 'Layered scene ready.' : 'Using fallback.'}` +
      (failed.size ? '\nMissing: ' + [...failed].join(', ') : '');
  });
}


// Skin butterfly sprites retain the existing flight, timing and wing animation.
// They are loaded from the same skin folder as the landscape artwork.
if (activeSkin) {
  for (const butterfly of document.querySelectorAll('.butterfly.violet')) {
    butterfly.style.setProperty('--fly-image', 'url("' + skinAssetBase + 'bfly_1.webp")');
  }
  for (const butterfly of document.querySelectorAll('.butterfly.ivory')) {
    butterfly.style.setProperty('--fly-image', 'url("' + skinAssetBase + 'bfly_white.webp")');
  }
}

// Opt-in phone testing only. The diagnostics never run in a guest invitation.
// On-device results stay in this browser until the tester chooses to copy them.
if (query.has('phoneqa')) {
  const loader=document.createElement('script');
  loader.src='./phone-qa.js';
  document.body.appendChild(loader);
}
