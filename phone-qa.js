/* Phase 16: entirely local, opt-in phone QA. Nothing is uploaded. */
(() => {
  'use strict';
  if (!new URLSearchParams(location.search).has('phoneqa')) return;

  const byId = id => document.getElementById(id);
  const root = document.documentElement;
  const invitation = byId('invitation');
  const launcher = document.createElement('button');
  launcher.id = 'phoneQaLaunch';
  launcher.type = 'button';
  launcher.textContent = 'Phone QA';
  launcher.setAttribute('aria-controls', 'phoneQaPanel');
  launcher.setAttribute('aria-expanded', 'false');

  const panel = document.createElement('section');
  panel.id = 'phoneQaPanel';
  panel.className = 'phone-qa-panel';
  panel.setAttribute('aria-label', 'On-device invitation testing');
  panel.hidden = true;
  panel.innerHTML = `
    <header class="phone-qa-header">
      <strong>Section 1 · phone QA</strong>
      <button type="button" id="phoneQaClose" aria-label="Close phone QA">Close</button>
    </header>
    <p class="phone-qa-info">Runs on this phone only. No results are sent anywhere.</p>
    <dl id="phoneQaTelemetry" class="phone-qa-stats" aria-live="off"></dl>
    <button type="button" id="phoneQaMeasure">Measure 5 seconds</button>
    <p id="phoneQaMeasureResult" role="status" aria-live="polite">No performance sample yet.</p>
    <fieldset id="phoneQaChecks">
      <legend>Check on this actual phone</legend>
      <label><input type="checkbox" value="cover"> Cover fits; tap Open Invitation</label>
      <label><input type="checkbox" value="opening"> Camera opens smoothly without horizontal drift</label>
      <label><input type="checkbox" value="scroll"> Swiping rebuilds the garden and writes names</label>
      <label><input type="checkbox" value="back"> Scrolling away and back restores animations</label>
      <label><input type="checkbox" value="rotate"> Portrait → landscape → portrait works</label>
    </fieldset>
    <label class="phone-qa-notes-label" for="phoneQaNotes">Issues observed</label>
    <textarea id="phoneQaNotes" rows="3" placeholder="Describe visual or touch problems…"></textarea>
    <button type="button" id="phoneQaCopy">Copy test report</button>
    <p id="phoneQaFeedback" role="status" aria-live="polite"></p>
    <textarea id="phoneQaReport" rows="6" readonly hidden aria-label="Phone QA report to copy manually"></textarea>
  `;
  document.body.append(launcher, panel);

  const telemetry = byId('phoneQaTelemetry');
  const measureButton = byId('phoneQaMeasure');
  const result = byId('phoneQaMeasureResult');
  const report = byId('phoneQaReport');
  const feedback = byId('phoneQaFeedback');
  const checks = byId('phoneQaChecks');
  let sample = null;
  let measuring = false;
  let panelOpen = false;

  function fields() {
    const scene = byId('viewport');
    const rect = scene.getBoundingClientRect();
    const nav = performance.getEntriesByType('navigation')[0];
    return {
      viewport: `${innerWidth}×${innerHeight}`,
      cssScreen: `${screen.width}×${screen.height}`,
      dpr: devicePixelRatio,
      orientation: innerWidth > innerHeight ? 'landscape' : 'portrait',
      browser: navigator.userAgent,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      horizontalOverflow: Math.max(0,document.documentElement.scrollWidth - innerWidth),
      scrollY: Math.round(scrollY),
      sceneVisiblePercent: Math.round(Math.max(0,Math.min(rect.bottom,innerHeight)-Math.max(rect.top,0))/Math.max(rect.height,1)*100),
      artwork: invitation.dataset.layers || 'loading',
      state: invitation.dataset.state || 'unknown',
      animation: invitation.dataset.ambient || 'unknown',
      domReadyMs: nav ? Math.round(nav.domContentLoadedEventEnd) : null
    };
  }

  function drawStats() {
    if (!panelOpen) return;
    const f = fields();
    const items = [
      ['Viewport',f.viewport],['Screen',f.cssScreen],['Pixel ratio',f.dpr],
      ['Orientation',f.orientation],['Artwork',f.artwork],['Scene',f.state],
      ['Animation',f.animation],['Visible scene',f.sceneVisiblePercent+'%'],
      ['Horizontal overflow',f.horizontalOverflow+'px'],
      ['Reduced motion',f.reducedMotion?'On':'Off'],
      ['DOM ready',f.domReadyMs===null?'Unknown':f.domReadyMs+'ms']
    ];
    telemetry.replaceChildren();
    for(const [name,value] of items) {
      const dt=document.createElement('dt');
      const dd=document.createElement('dd');
      dt.textContent=name;
      dd.textContent=String(value);
      telemetry.append(dt,dd);
    }
  }

  function show(open) {
    panelOpen=open;
    panel.hidden=!open;
    launcher.setAttribute('aria-expanded',String(open));
    if(open) {drawStats();byId('phoneQaClose').focus();}
    else launcher.focus();
  }
  launcher.addEventListener('click',()=>show(!panelOpen));
  byId('phoneQaClose').addEventListener('click',()=>show(false));
  window.addEventListener('resize',drawStats,{passive:true});
  window.addEventListener('scroll',drawStats,{passive:true});
  new MutationObserver(drawStats).observe(invitation,{
    attributes:true,attributeFilter:['data-layers','data-state','data-ambient']
  });

  measureButton.addEventListener('click',async()=>{
    if(measuring) return;
    measuring=true;
    sample=null;
    measureButton.disabled=true;
    result.textContent='Sampling on this phone… keep this tab visible.';
    const start=performance.now();
    const readDraws=()=>window.__scenePerf?.draws ?? null;
    const startDraws=readDraws();
    let frames=0,longTasks=0;
    let observer;
    if('PerformanceObserver' in window && PerformanceObserver.supportedEntryTypes?.includes('longtask')) {
      observer=new PerformanceObserver(list=>{longTasks+=list.getEntries().length;});
      observer.observe({entryTypes:['longtask']});
    }
    let cancelled=false;
    const timer=window.setTimeout(()=>{cancelled=true;},5000);
    while(!cancelled && !document.hidden) {
      await new Promise(resolve=>requestAnimationFrame(resolve));
      frames++;
    }
    clearTimeout(timer);
    observer?.disconnect();
    const elapsed=(performance.now()-start)/1000;
    const endDraws=readDraws();
    const complete=cancelled && !document.hidden;
    sample={
      seconds:+elapsed.toFixed(2),
      frameCallbackHz:+(frames/Math.max(elapsed,.01)).toFixed(1),
      petalPaintHz:startDraws===null||endDraws===null?null:+((endDraws-startDraws)/Math.max(elapsed,.01)).toFixed(1),
      longTasks:observer?longTasks:null,
      complete
    };
    result.textContent=complete
      ? `Sample: ${sample.frameCallbackHz} screen frames/s; ${sample.petalPaintHz===null?'petal paint unavailable':sample.petalPaintHz+' petal paints/s'}; ${sample.longTasks===null?'long-task API unavailable':sample.longTasks+' long tasks'}.`
      : 'Sample interrupted; keep this tab active and try again.';
    measureButton.disabled=false;
    measuring=false;
    drawStats();
  });

  function makeReport() {
    const checkItems=[...checks.querySelectorAll('input[type="checkbox"]')].map(x=>
      `${x.checked?'PASS':'NOT VERIFIED'} — ${x.parentElement.textContent.trim()}`);
    const f=fields();
    return [
      'Celestial Lake — Section 1 real-device report',
      'Local browser test only; user-reported results',
      'Captured: '+new Date().toISOString(),
      ...Object.entries(f).map(([key,value])=>`${key}: ${value}`),
      'Performance sample: '+(sample?JSON.stringify(sample):'not measured'),
      'Checks:',...checkItems,
      'Notes: '+(byId('phoneQaNotes').value.trim()||'none')
    ].join('\n');
  }

  byId('phoneQaCopy').addEventListener('click',async()=>{
    const text=makeReport();
    try {
      if(!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable over HTTP');
      await navigator.clipboard.writeText(text);
      feedback.textContent='Report copied. Paste it into ChatGPT.';
      report.hidden=true;
    } catch {
      report.hidden=false;
      report.value=text;
      report.focus();
      report.select();
      feedback.textContent='Clipboard blocked by this browser. Select the report and copy it manually.';
    }
  });
  // Expose read-only diagnostics to browser automation without transmitting data.
  Object.defineProperty(window,'__phoneQa',{value:Object.freeze({
    get telemetry(){return fields();},
    get sample(){return sample;},
    get report(){return makeReport();}
  })});
})();
