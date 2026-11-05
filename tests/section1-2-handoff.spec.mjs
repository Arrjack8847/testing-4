import {test,expect} from '@playwright/test';

// Geometry checks complement visual reference screenshots; they do not
// imply that independently authored artwork is pixel-identical.
const RATIOS=[2.25,2.5,2.75,2.95,3.0];
async function ready(page) {
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#invitation')).toHaveAttribute('data-layers','ready',{timeout:30000});
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(page.locator('#invitation')).toHaveAttribute('data-state','opened');
  await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';});
  return errors;
}
async function at(page,ratio) {
  await page.evaluate(f=>{
    window.scrollTo({top:Math.round(window.innerHeight*f),behavior:'instant'});
  },ratio);
  await expect.poll(()=>page.evaluate(()=>scrollY/innerHeight),{timeout:5000})
    .toBeCloseTo(ratio,2);
  // Scroll-driven variables are set on requestAnimationFrame.
  await expect.poll(()=>page.evaluate(()=>{
    const shift=parseFloat(document.documentElement.style.getPropertyValue('--text-scroll-shift'));
    return Math.abs(shift+(scrollY-innerHeight*2));
  }),{timeout:5000}).toBeLessThanOrEqual(1);
  return page.evaluate(()=>{
    const toRect=el=>{
      const b=el.getBoundingClientRect();
      return {top:b.top,bottom:b.bottom,left:b.left,right:b.right,width:b.width,height:b.height};
    };
    const track=document.querySelector('#sceneTrack');
    const viewport=document.querySelector('#viewport');
    const band=document.querySelector('#message');
    const next=document.querySelector('#couple');
    const invitation=document.querySelector('#invitation');
    const stage=document.querySelector('#stage');
    const style=getComputedStyle(band);
    return {
      y:scrollY,h:innerHeight,w:innerWidth,
      track:toRect(track),lake:toRect(viewport),scene:toRect(stage),
      band:toRect(band),next:toRect(next),
      zLake:+getComputedStyle(viewport).zIndex,zMessage:+style.zIndex,
      textShift:parseFloat(document.documentElement.style.getPropertyValue('--text-scroll-shift')),
      overflow:document.documentElement.scrollWidth-innerWidth,
      ambient:invitation.dataset.ambient,
      petalsActive:band.dataset.petalsActive,
      sectionBackground:style.backgroundColor
    };
  });
}
test('Section 1→2 stays pinned with continuous coverage through forward AND reverse swipes',async({page},testInfo)=>{
  const errors=await ready(page);
  const initial=await page.evaluate(()=>{
    const track=document.querySelector('#sceneTrack');
    const band=document.querySelector('#message');
    return {
      h:innerHeight, trackHeight:track.getBoundingClientRect().height,
      negativeMargin:parseFloat(getComputedStyle(track).marginBottom),
      bandStart:band.getBoundingClientRect().top+scrollY
    };
  });
  expect(initial.trackHeight/initial.h).toBeCloseTo(4,2);
  expect(initial.negativeMargin/initial.h).toBeCloseTo(-1,2);
  expect(initial.bandStart/initial.h).toBeCloseTo(3,2);
  for(const ratio of [...RATIOS,2.75,2.25,3.0]){
    const sample=await at(page,ratio);
    expect(sample.overflow).toBeLessThanOrEqual(1);
    expect(sample.lake.top).toBeCloseTo(0,0);
    expect(sample.lake.bottom).toBeCloseTo(sample.h,0);
    expect(sample.band.top).toBeCloseTo((3-ratio)*sample.h,0);
    expect(sample.zMessage).toBeGreaterThan(sample.zLake);
    expect(sample.textShift).toBeCloseTo(-(ratio-2)*sample.h,0);
    expect(sample.sectionBackground).not.toBe('rgba(0, 0, 0, 0)');
    const name=ratio.toFixed(2).replace('.','_')+'H';
    await page.screenshot({path:testInfo.outputPath('handoff-'+testInfo.project.name+'-'+name+'.png'),animations:'disabled'});
  }
  // At 3H, the opaque mauve panel completely covers the still-sticky lake.
  const end=await at(page,3);
  expect(end.band.top).toBeCloseTo(0,0);
  expect(end.ambient).toBe('paused');
  expect(errors).toEqual([]);
});
test('Section 2→3 flow has no geometry gap or overlapping horizontal edges',async({page},testInfo)=>{
  const errors=await ready(page);
  const dims=await page.evaluate(()=>{
    const message=document.querySelector('#message').getBoundingClientRect();
    const next=document.querySelector('#couple').getBoundingClientRect();
    // The frame is still in its entrance transform at scroll=0. Use its
    // layout box, not the temporary scale(.985) visual bounding box.
    const frame=document.querySelector('#message .letter-frame');
    return {
      vh:innerHeight,vw:innerWidth,
      messageTop:message.top+scrollY,
      messageBottom:message.bottom+scrollY,
      nextTop:next.top+scrollY,
      frameX:frame.offsetLeft,frameRight:frame.offsetLeft+frame.offsetWidth,
      messageHeight:message.height,
      overflow:document.documentElement.scrollWidth-innerWidth
    };
  });
  expect(dims.messageTop/dims.vh).toBeCloseTo(3,2);
  expect(Math.abs(dims.messageBottom-dims.nextTop)).toBeLessThanOrEqual(1);
  expect(dims.frameX).toBeCloseTo(22,0);
  expect(dims.frameRight).toBeCloseTo(dims.vw-22,0);
  expect(dims.overflow).toBeLessThanOrEqual(1);
  await page.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),
    Math.round(dims.messageBottom-dims.vh*.6));
  await page.screenshot({path:testInfo.outputPath('section2-to-3-couple-edge.png'),animations:'disabled'});
  // The scene immediately after this seam is the original Couple portrait scene.
  expect(errors).toEqual([]);
});


test('Section 1 native sticky artwork uses a stable mobile viewport on four phones',async({page},testInfo)=>{
  const errors=await ready(page);
  const geom=await page.evaluate(()=>{
    const lake=document.getElementById('viewport');
    const track=document.getElementById('sceneTrack');
    const probe=document.createElement('div');
    probe.style.cssText='position:absolute;visibility:hidden;height:100lvh;width:0';
    document.body.appendChild(probe);
    const largeHeight=probe.getBoundingClientRect().height;
    probe.remove();
    return {
      supported:CSS.supports('height','100lvh'),
      viewportHeight:lake.getBoundingClientRect().height,
      largeHeight,trackHeight:track.getBoundingClientRect().height,
      trackMargin:parseFloat(getComputedStyle(track).marginBottom),
      position:getComputedStyle(lake).position
    };
  });
  expect(geom.supported).toBe(true);
  expect(geom.position).toBe('sticky');
  expect(Math.abs(geom.viewportHeight-geom.largeHeight)).toBeLessThanOrEqual(1);
  expect(geom.trackHeight/geom.viewportHeight).toBeCloseTo(4,2);
  expect(geom.trackMargin/geom.viewportHeight).toBeCloseTo(-1,2);
  for(const fraction of [.15,.75,1.5,2.3,2.9,2.3,.75]){
    await page.evaluate(async ({y})=>{
      window.scrollTo({top:Math.round(y),behavior:'instant'});
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
    },{y:geom.viewportHeight*fraction});
    const reading=await page.evaluate(()=>{
      const hero=document.getElementById('viewport');
      const root=document.documentElement;
      return {
        top:hero.getBoundingClientRect().top,
        height:hero.getBoundingClientRect().height,
        y:scrollY,
        textShift:parseFloat(root.style.getPropertyValue('--text-scroll-shift')),
        units:['--hanging-scroll-shift','--front-scroll-shift','--reed-scroll-shift']
          .map(key=>root.style.getPropertyValue(key)),
        overflow:root.scrollWidth-innerWidth
      };
    });
    expect(Math.abs(reading.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(reading.height-geom.viewportHeight)).toBeLessThanOrEqual(1);
    expect(Math.abs(reading.textShift+Math.max(0,reading.y-geom.viewportHeight*2))).toBeLessThanOrEqual(1);
    expect(reading.units.every(value=>value.endsWith('lvh'))).toBe(true);
    expect(reading.overflow).toBeLessThanOrEqual(1);
    if(fraction===2.9)await page.screenshot({path:testInfo.outputPath('section1-stable-viewport-'+testInfo.project.name+'.png'),animations:'disabled'});
  }
  expect(errors).toEqual([]);
});

test('Section 1 synthetic address bar resize does not reset an unchanged petal canvas',async({page})=>{
  await ready(page);
  const result=await page.evaluate(async()=>{
    const canvas=document.getElementById('petalCanvas');
    const width=Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype,'width');
    const height=Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype,'height');
    const writes={width:0,height:0};
    Object.defineProperty(canvas,'width',{configurable:true,
      get(){return width.get.call(this);},
      set(value){writes.width++;width.set.call(this,value);}});
    Object.defineProperty(canvas,'height',{configurable:true,
      get(){return height.get.call(this);},
      set(value){writes.height++;height.set.call(this,value);}});
    const sceneHeight=document.getElementById('viewport').clientHeight;
    window.dispatchEvent(new Event('resize'));
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    return {writes,sceneHeight,afterHeight:document.getElementById('viewport').clientHeight};
  });
  expect(result.writes).toEqual({width:0,height:0});
  expect(result.afterHeight).toBe(result.sceneHeight);
});


test('Section 1 never re-enables long camera transitions during a reverse finger swipe',async({page},testInfo)=>{
  const errors=await ready(page);
  const invite=page.locator('#invitation');
  await expect(invite).toHaveAttribute('data-scroll-active','no');
  const initial=await page.evaluate(()=>{
    const art=document.getElementById('stage').getBoundingClientRect();
    return {x:art.x,y:art.y,width:art.width,height:art.height,
      viewportHeight:document.getElementById('viewport').getBoundingClientRect().height};
  });
  // Gesture arrives before compositor scrolling or the first rAF. The long
  // (1.35-1.7s) cinematic opening easing must immediately become scroll sync.
  await page.evaluate(()=>window.dispatchEvent(new Event('touchstart')));
  await expect(invite).toHaveAttribute('data-scroll-active','yes');
  for(const fraction of [.01,.2,.65,1.5,.65,.03,0,.4,0]){
    await page.evaluate(async y=>{
      window.scrollTo({top:Math.round(y),behavior:'instant'});
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
    },initial.viewportHeight*fraction);
    const state=await page.evaluate(()=>{
      const stage=document.getElementById('stage');
      const box=stage.getBoundingClientRect();
      const lake=document.getElementById('viewport').getBoundingClientRect();
      const first=document.querySelector('.sky-layer');
      const tree=document.querySelector('.depth.tree');
      const arch=document.querySelector('.depth.arch');
      const t=(e)=>getComputedStyle(e).transitionDuration;
      const matrix=new DOMMatrix(getComputedStyle(stage).transform);
      return {
        x:box.x,y:box.y,width:box.width,height:box.height,
        stickyTop:lake.top,
        stageZ:matrix.m43,stageY:matrix.m42,
        skyTransition:t(first),treeTransition:t(tree),archTransition:t(arch),
        scrollActive:document.getElementById('invitation').dataset.scrollActive,
        parallax:document.documentElement.style.getPropertyValue('--stage-parallax'),
        overflow:document.documentElement.scrollWidth-innerWidth
      };
    });
    expect(state.scrollActive).toBe('yes');
    expect(state.skyTransition).toBe('0s');
    expect(state.treeTransition).toBe('0s');
    expect(state.archTransition).toBe('0s');
    expect(Math.abs(state.x-initial.x)).toBeLessThanOrEqual(.75);
    expect(Math.abs(state.y-initial.y)).toBeLessThanOrEqual(.75);
    expect(Math.abs(state.width-initial.width)).toBeLessThanOrEqual(.75);
    expect(Math.abs(state.height-initial.height)).toBeLessThanOrEqual(.75);
    expect(Math.abs(state.stickyTop)).toBeLessThanOrEqual(.75);
    expect(Math.abs(state.stageZ)).toBeLessThanOrEqual(.01);
    expect(Math.abs(state.stageY)).toBeLessThanOrEqual(.75);
    expect(state.parallax.trim()).toBe('0px');
    expect(state.overflow).toBeLessThanOrEqual(1);
    if(fraction===.65)await page.screenshot({path:testInfo.outputPath('section1-no-shake-'+testInfo.project.name+'.png'),animations:'disabled'});
  }
  expect(errors).toEqual([]);
});
