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
