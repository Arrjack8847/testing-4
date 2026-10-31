'use strict';

// All files and geometry are for the FIRST mobile invitation scene only.
// The original artwork is used with the project owner's stated permission.
// Motion timings and sprite coordinates are independent approximations.
const REMOTE = 'https://undangankahwin.com/images/concierge/packs/tasik-kayangan/';
const query = new URLSearchParams(location.search);
const forceRemote = query.get('remote') === '1';
const debug = query.has('debug');
const invite = document.getElementById('invitation');
const art = document.getElementById('animatedScene');
const master = document.getElementById('masterArt');
const cover = document.getElementById('cover');
const opened = document.getElementById('opened');
const notification = document.getElementById('networkNote');

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
  art.appendChild(wrapper);
  if (!byFile.has(filename)) byFile.set(filename, []);
  byFile.get(filename).push(img);
}
// The water highlight is an independent CSS layer in the lake area.
const glow = document.createElement('div');
glow.className = 'water-glow';
art.appendChild(glow);

const allNames = ['scene.webp', ...byFile.keys()];
const failed = new Set();
function loadArtwork(name) {
  // Prefer locally stored artwork, fallback to reference host when absent.
  const local = './assets/' + name;
  const sources = forceRemote ? [REMOTE + name] : [local, REMOTE + name];
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
const artworkReady = Promise.all(allNames.map(async name => {
  const result = await loadArtwork(name);
  if (result.okay) {
    if (name === 'scene.webp') master.src = result.src;
    else byFile.get(name).forEach(img => { img.src = result.src; });
  }
  return result;
})).then(() => {
  invite.dataset.layers = failed.size === 0 ? 'ready' : 'failed';
  if (failed.size) {
    notification.hidden = false;
    notification.textContent = failed.has('scene.webp')
      ? 'Original scene image could not be loaded. Run download-assets.ps1 to store artwork locally.'
      : 'Some animated layers are unavailable. Displaying the original static scene.';
  }
  return failed.size === 0;
});

// Cover is a focusable action, not a scroll-triggered trap.
let openedOnce = false;
function openInvitation() {
  invite.dataset.state = 'opened';
  cover.inert = true;
  opened.inert = false;
  openedOnce = true;
  document.documentElement.style.overflowY = 'auto';
}
function resetInvitation() {
  invite.dataset.state = 'cover';
  cover.inert = false;
  opened.inert = true;
  openedOnce = false;
  document.documentElement.style.overflowY = 'hidden';
  // Clear scroll-driven parallax as well as scrolling, or reset leaves the scene displaced.
  document.documentElement.style.setProperty('--stage-parallax', '0px');
  window.scrollTo({top:0, behavior:'instant'});
  document.getElementById('openButton').focus({preventScroll:true});
}
document.documentElement.style.overflowY = 'hidden';
document.getElementById('openButton').addEventListener('click', openInvitation);
window.addEventListener('pageshow', () => {
  if (!openedOnce && window.scrollY) window.scrollTo(0, 0);
});

// Scroll modifies depth only; no animation frame is wasted when idle.
let scheduled = false;
window.addEventListener('scroll', () => {
  if (!openedOnce || scheduled || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  scheduled = true;
  requestAnimationFrame(() => {
    const amount = Math.min(window.scrollY, window.innerHeight);
    document.documentElement.style.setProperty('--stage-parallax', (-amount * .075).toFixed(1) + 'px');
    scheduled = false;
  });
}, {passive:true});

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
