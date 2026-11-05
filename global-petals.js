/* One continuous, mobile-first petal field for all ten invitation sections.
   Canvas stays fixed to the viewport: scrolling never restarts the particles.
   No third-party images, DOM particles, or section-specific listeners. */
(() => {
  'use strict';
  const canvas = document.getElementById('globalPetalCanvas');
  if (!canvas || !canvas.getContext) return;
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const COUNT = 26; // Rich: 20–30 petals visible at once.
  const TAU = Math.PI * 2;
  const colors = ['#e9bed8', '#f2d8e6', '#d5a6cf', '#f6e6ed', '#bfa0d5'];
  const petals = [];
  let width = 0, height = 0, dpr = 1, frame = 0, previous = 0;
  let enabled = false;
  // Stable, deterministic distribution avoids synchronized resets.
  const rand = (seed) => {
    const n = Math.sin(seed * 127.1 + 78.233) * 43758.5453;
    return n - Math.floor(n);
  };
  function makePetal(i) {
    return {
      x: rand(i + 1) * width,
      y: rand(i + 71) * height,
      radius: 2.8 + rand(i + 121) * 3.6,
      speed: 11 + rand(i + 171) * 19,
      drift: 5 + rand(i + 221) * 14,
      phase: rand(i + 271) * TAU,
      frequency: .35 + rand(i + 321) * .5,
      rotation: rand(i + 371) * TAU,
      spin: (rand(i + 421) - .5) * 1.2,
      opacity: .42 + rand(i + 471) * .37,
      color: colors[i % colors.length]
    };
  }
  function resize() {
    const oldWidth = width, oldHeight = height;
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!petals.length) {
      for (let i = 0; i < COUNT; i++) petals.push(makePetal(i));
    } else {
      for (const p of petals) {
        p.x = p.x / oldWidth * width;
        p.y = p.y / oldHeight * height;
      }
    }
  }
  function draw(p, time) {
    const sway = Math.sin(time * p.frequency + p.phase) * p.drift;
    const x = p.x + sway;
    const y = p.y;
    const turn = p.rotation + time * p.spin;
    context.save();
    context.translate(x, y);
    context.rotate(turn);
    context.globalAlpha = p.opacity;
    context.fillStyle = p.color;
    context.beginPath();
    context.moveTo(0, -p.radius * 1.65);
    context.bezierCurveTo(p.radius * 1.1, -p.radius * 1.2,
      p.radius * 1.15, p.radius * .75, 0, p.radius * 1.5);
    context.bezierCurveTo(-p.radius * 1.4, p.radius * .65,
      -p.radius * 1.1, -p.radius * 1.1, 0, -p.radius * 1.65);
    context.fill();
    context.restore();
  }
  function tick(now) {
    if (!enabled) return;
    const delta = previous ? Math.min((now - previous) / 1000, .05) : 0;
    previous = now;
    const time = now / 1000;
    context.clearRect(0, 0, width, height);
    for (const p of petals) {
      p.y += p.speed * delta;
      if (p.y > height + p.radius * 2) {
        p.y = -p.radius * 2;
        p.x = rand(p.phase + now) * width;
      }
      draw(p, time);
    }
    frame = window.requestAnimationFrame(tick);
  }
  function sync() {
    const shouldRun = !motion.matches && !document.hidden;
    if (shouldRun === enabled) return;
    enabled = shouldRun;
    if (enabled) {
      document.documentElement.classList.add('global-petals-active');
      previous = 0;
      frame = window.requestAnimationFrame(tick);
    } else {
      window.cancelAnimationFrame(frame);
      context.clearRect(0, 0, width, height);
      document.documentElement.classList.remove('global-petals-active');
    }
  }
  resize();
  sync();
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', sync);
  if (motion.addEventListener) motion.addEventListener('change', sync);
  else if (motion.addListener) motion.addListener(sync);
})();
