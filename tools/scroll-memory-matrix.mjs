// Diagnostic only: baseline and candidate are visited sequentially in one browser environment.
// This is a software/CI Chromium comparison, NOT an iPhone WebKit memory measurement.
import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const viewports = [[360,800],[375,812],[390,844],[430,932]];
const cycles = 6;
const positions = [0,.05,.1,.2,.3,.4,.5,.6,.7,.8,.9,1,.9,.8,.7,.6,.5,.4,.3,.2,.1,.05,0];
const baseline = process.env.BASELINE_URL || 'http://127.0.0.1:8111/';
const optimized = process.env.OPTIMIZED_URL || 'http://127.0.0.1:8112/';
const output = process.env.RESULT_PATH || 'perf-results/scroll-memory-matrix.json';
const mib = x => Math.round(x / 1048576 * 10) / 10;
const rounded = x => x == null ? null : Math.round(x * 100) / 100;
function processRSS(pid) {
  try {
    const content = readFileSync('/proc/' + pid + '/status', 'utf8');
    const match = content.match(/^VmRSS:\s+(\d+)\s+kB/m);
    return match ? Number(match[1]) * 1024 : 0;
  } catch { return 0; }
}
async function memorySnapshot(browserSession) {
  try {
    const info = await browserSession.send('SystemInfo.getProcessInfo');
    const renderers = info.processInfo.filter(item => item.type === 'renderer');
    const gpu = info.processInfo.filter(item => item.type === 'GPU');
    return {
      rendererMaxMiB: rounded(mib(Math.max(0,...renderers.map(p => processRSS(p.id))))),
      rendererTotalMiB: rounded(mib(renderers.reduce((sum,p) => sum + processRSS(p.id),0))),
      gpuMiB: rounded(mib(gpu.reduce((sum,p) => sum + processRSS(p.id),0))),
      rendererProcesses: renderers.length
    };
  } catch (error) { return { error: String(error).slice(0,200) }; }
}
function values(metrics) {
  return Object.fromEntries(metrics.metrics.map(m => [m.name,m.value]));
}
function percentile(values, percentile) {
  if (!values.length) return null;
  const sorted = [...values].sort((a,b) => a-b);
  return rounded(sorted[Math.min(sorted.length - 1,Math.floor((sorted.length - 1)*percentile))]);
}
async function runOne(label,url,width,height) {
  const browser = await chromium.launch({headless:true,args:['--enable-precise-memory-info']});
  const context = await browser.newContext({
    viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:3
  });
  const browserSession = await browser.newBrowserCDPSession();
  const page = await context.newPage();
  const performance = await context.newCDPSession(page);
  const result = {label,width,height,url,cycles:[]};
  try {
    await performance.send('Performance.enable');
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
    await page.getByRole('button',{name:'Open Invitation',exact:true}).click({timeout:25000});
    await page.waitForTimeout(1250);
    await page.evaluate(() => {
      window.__scrollFrameGaps = [];
      let previous = null;
      function tick(time) {
        if (previous != null && window.__scrollFrameGaps.length < 20000) {
          window.__scrollFrameGaps.push(time - previous);
        }
        previous = time;
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
    const start = values(await performance.send('Performance.getMetrics'));
    result.images = await page.evaluate(() => ({
      count: document.images.length,
      loaded: [...document.images].filter(img=>img.complete && img.naturalWidth > 0).length
    }));
    result.initial = {memory:await memorySnapshot(browserSession),jsHeapMiB:mib(start.JSHeapUsedSize||0)};
    for (let cycle = 1; cycle <= cycles; cycle++) {
      for (const fraction of positions) {
        await page.evaluate(fraction => {
          const max = Math.max(0,document.documentElement.scrollHeight-innerHeight);
          window.scrollTo({top:Math.round(max*fraction),behavior:'instant'});
        },fraction);
        await page.waitForTimeout(75);
      }
      const metrics = values(await performance.send('Performance.getMetrics'));
      result.cycles.push({
        cycle,
        memory:await memorySnapshot(browserSession),
        styleSeconds:rounded((metrics.RecalcStyleDuration||0)-(start.RecalcStyleDuration||0)),
        layoutSeconds:rounded((metrics.LayoutDuration||0)-(start.LayoutDuration||0)),
        styleCount:Math.round((metrics.RecalcStyleCount||0)-(start.RecalcStyleCount||0)),
        jsHeapMiB:mib(metrics.JSHeapUsedSize||0),
        frameP99Ms:await page.evaluate(() => {
          const data=[...window.__scrollFrameGaps].sort((a,b)=>a-b);
          return data.length ? Math.round(data[Math.floor((data.length-1)*.99)]*100)/100 : null;
        })
      });
      const last=result.cycles[result.cycles.length-1];
      console.log(label,width+'x'+height,'cycle',cycle,JSON.stringify(last));
    }
    result.finalScrollY=await page.evaluate(()=>scrollY);
    result.errors=[];
  } catch(error) {
    result.errors=[String(error)];
    console.error('Benchmark failed for',label,width,height,error);
  } finally {
    await browser.close();
  }
  return result;
}
const results={description:'Matched six-cycle local Chromium comparison, not physical-iPhone memory',baselineRef:'6fc38409a9645e18ae9557b4a9f6320a33ecc3f1',optimizedRef:process.env.GITHUB_SHA||'working-tree',createdAt:new Date().toISOString(),cases:[]};
for(const [width,height] of viewports) {
  for(const [label,url] of [['baseline',baseline],['optimized',optimized]]) {
    const trial=await runOne(label,url,width,height);
    results.cases.push(trial);
    mkdirSync(dirname(output),{recursive:true});
    writeFileSync(output,JSON.stringify(results,null,2)+'\n');
  }
}
const lines=['# Six-cycle local Chromium mobile benchmark','',
  'This is a matched CI Chromium diagnostic, not a physical iPhone/WebKit memory measurement.','',
  '| Viewport | Baseline renderer max MiB | Optimized renderer max MiB | Change | Baseline style seconds | Optimized style seconds |','|---|---:|---:|---:|---:|---:|'];
for(const [width,height] of viewports) {
  const base=results.cases.find(r=>r.width===width && r.label==='baseline');
  const next=results.cases.find(r=>r.width===width && r.label==='optimized');
  const b=base?.cycles.at(-1),o=next?.cycles.at(-1);
  const bm=b?.memory?.rendererMaxMiB,om=o?.memory?.rendererMaxMiB;
  const improvement=typeof bm==='number'&&bm>0&&typeof om==='number'
    ? rounded((1-om/bm)*100)+'%' : 'n/a';
  lines.push('| '+width+'×'+height+' | '+(bm??'n/a')+' | '+(om??'n/a')+' | '+improvement+' | '+(b?.styleSeconds??'n/a')+' | '+(o?.styleSeconds??'n/a')+' |');
}
lines.push('','Errors:', ...results.cases.filter(r=>r.errors.length).map(r=>r.label+' '+r.width+'×'+r.height+': '+r.errors.join('; ')));
writeFileSync(output.replace(/\.json$/,'.md'),lines.join('\n')+'\n');
console.log(lines.join('\n'));
if(results.cases.some(r=>r.errors.length))process.exitCode=1;
