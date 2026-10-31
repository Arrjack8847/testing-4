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
  ['sky.webp','sky-layer',{}],
  ['palace.webp','depth palace reveal',{'--delay':'0ms'}],
  ['reeds.webp','depth reeds reveal',{'--delay':'210ms'}],
  ['arch.webp','depth arch reveal',{'--delay':'160ms'}],
  ['tree_l.webp','depth tree tree-left reveal',{'--delay':'230ms'}],
  ['tree_r.webp','depth tree tree-right reveal',{'--delay':'290ms'}],
  ['drape.webp','depth canopy reveal',{'--delay':'320ms'}],
  ['hang_1.webp','sprite hanging reveal',{'--x':'2%','--y':'-3%','--w':'18%','--delay':'380ms','--motion-delay':'-1.2s'}],
  ['hang_2.webp','sprite hanging reveal alternate',{'--x':'15%','--y':'-1%','--w':'14%','--delay':'440ms','--motion-delay':'-3.6s'}],
  ['hang_3.webp','sprite hanging reveal',{'--x':'29%','--y':'-2%','--w':'15%','--delay':'460ms','--motion-delay':'-2.1s'}],
  ['hang_4.webp','sprite hanging reveal alternate',{'--x':'43%','--y':'-4%','--w':'14%','--delay':'490ms','--motion-delay':'-1.8s'}],
  ['hang_3.webp','sprite hanging reveal',{'--x':'55%','--y':'-2%','--w':'15%','--delay':'530ms','--motion-delay':'-3.1s'}],
  ['hang_4.webp','sprite hanging reveal alternate',{'--x':'68%','--y':'-2%','--w':'14%','--delay':'550ms','--motion-delay':'-2.8s'}],
  ['hang_1.webp','sprite hanging reveal',{'--x':'80%','--y':'-4%','--w':'17%','--delay':'570ms','--motion-delay':'-1.7s'}],
  ['peacock.webp','depth peacock peacock-left reveal',{'--delay':'510ms'}],
  ['peacock.webp','depth peacock peacock-right reveal',{'--delay':'580ms'}],
  ['spike_5.webp','sprite plant reveal',{'--x':'1%','--bottom':'0%','--w':'17%','--delay':'620ms'}],
  ['spike_3.webp','sprite plant reveal alternate',{'--x':'14%','--bottom':'-1%','--w':'14%','--delay':'670ms'}],
  ['spike_4.webp','sprite plant reveal',{'--x':'83%','--bottom':'-1%','--w':'16%','--delay':'710ms'}],
  ['spike_5.webp','sprite plant reveal alternate',{'--x':'91%','--bottom':'0%','--w':'16%','--delay':'700ms'}],
  ['stem_1.webp','sprite plant reveal',{'--x':'24%','--bottom':'-3%','--w':'12%','--delay':'680ms'}],
  ['stem_2.webp','sprite plant reveal alternate',{'--x':'73%','--bottom':'-3%','--w':'11%','--delay':'730ms'}],
  ['leaf_5.webp','sprite plant reveal',{'--x':'36%','--bottom':'-1%','--w':'18%','--delay':'770ms'}],
  ['leaf_6.webp','sprite plant reveal alternate',{'--x':'58%','--bottom':'-1%','--w':'17%','--delay':'750ms'}],
  ['leaf_4.webp','sprite plant reveal',{'--x':'4%','--bottom':'-2%','--w':'15%','--delay':'720ms'}],
  ['leaf_5.webp','sprite plant reveal alternate',{'--x':'86%','--bottom':'-2%','--w':'16%','--delay':'750ms'}],
  ['bloom_5.webp','sprite flower reveal',{'--x':'15%','--bottom':'-2%','--w':'13%','--delay':'770ms'}],
  ['bloom_1.webp','sprite flower reveal alternate',{'--x':'30%','--bottom':'-1%','--w':'14%','--delay':'810ms'}],
  ['bloom_5.webp','sprite flower reveal',{'--x':'54%','--bottom':'-1%','--w':'14%','--delay':'780ms'}],
  ['bloom_1.webp','sprite flower reveal alternate',{'--x':'73%','--bottom':'-2%','--w':'14%','--delay':'820ms'}],
  ['bloom_2.webp','sprite flower reveal',{'--x':'-2%','--bottom':'-3%','--w':'17%','--delay':'840ms'}],
  ['bloom_6.webp','sprite flower reveal alternate',{'--x':'41%','--bottom':'-2%','--w':'15%','--delay':'850ms'}],
  ['bloom_2.webp','sprite flower reveal',{'--x':'87%','--bottom':'-3%','--w':'17%','--delay':'860ms'}]
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
  if (classes.includes('plant')) img.classList.add('plant-sway');
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
