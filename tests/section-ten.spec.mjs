import { test, expect } from '@playwright/test';
const HEIGHTS={'small-phone':568,'android-360':740,'iphone-390':844,'large-phone':932};

async function openInvitation(page) {
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button',{name:'Open Invitation',exact:true}).click();
  await expect(page.locator('#invitation')).toHaveAttribute('data-state','opened');
  await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';});
  return errors;
}
// Progressive mobile artwork is requested only shortly before Section 10
// enters. Stage it explicitly before tests that assert WebP dimensions.
async function warmClosingArtwork(page) {
  if(await page.locator('#invitation').getAttribute('data-state')!=='opened')
    await page.getByRole('button',{name:'Open Invitation',exact:true}).click();
  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    const closing=document.getElementById('closingMessage');
    window.scrollTo({top:closing.getBoundingClientRect().top+scrollY,behavior:'instant'});
  });
  await expect(page.locator('#closingMessage')).toHaveAttribute('data-asset-lifecycle','near');
}
async function sectionY(page,id) {
  return page.locator('#'+id).evaluate(e=>e.getBoundingClientRect().top+scrollY);
}
test('Section 10 stays last, content matches reference, and never pretends contact links work',async({page})=>{
  await page.goto('/');
  const closing=page.locator('#closingMessage');
  await expect(closing).toHaveAttribute('aria-hidden','true');
  await expect(closing).toHaveJSProperty('inert',true);
  const errors=await openInvitation(page);
  await expect(closing).toHaveAttribute('aria-hidden','false');
  await expect(closing).toHaveJSProperty('inert',false);
  await expect(closing).toHaveAttribute('data-section','10');
  await warmClosingArtwork(page);
  await expect(closing).toHaveAttribute('data-artwork','local-reference');
  await expect(closing.locator('.closing10-source-scene')).toHaveJSProperty('naturalWidth',1080);
  await expect(closing.locator('h2')).toHaveText('Until we meet');
  await expect(closing.locator('.closing10-message')).toHaveText(
    'It would be the greatest honour of our lives to have you beside us as two families become one. Thank you — for every prayer, every wish, and every mile travelled.'
  );
  await expect(closing.locator('.closing10-signoff')).toHaveText('With love & gratitude,');
  await expect(closing.locator('.closing10-names')).toHaveText('Rayyan&Sofea');
  await expect(closing.getByRole('button',{name:'Call',includeHidden:true})).toBeDisabled();
  await expect(closing.getByRole('button',{name:'WhatsApp',includeHidden:true})).toBeDisabled();
  const structure=await page.evaluate(()=>{
    const c=document.getElementById('closingMessage');
    return {prev:c.previousElementSibling?.id,next:c.nextElementSibling?.id||null,
      last:document.querySelector('#invitation > section:last-of-type')===c};
  });
  expect(structure).toEqual({prev:'rsvp',next:null,last:true});
  expect(errors).toEqual([]);
});

test('Section 9→10 seam, measured closing geometry and layout on every phone',async({page},testInfo)=>{
  const errors=await openInvitation(page);
  const closing=page.locator('#closingMessage');
  const pos=await closing.evaluate(e=>{
    const r=e.getBoundingClientRect(),p=e.previousElementSibling.getBoundingClientRect();
    const inner=e.querySelector('.closing10-inner').getBoundingClientRect();
    return {width:r.width,left:r.left,right:r.right,height:r.height,gap:r.top-p.bottom,
      innerWidth:inner.width,overflow:document.documentElement.scrollWidth-innerWidth,
      bg:getComputedStyle(e).backgroundColor,padding:getComputedStyle(e).padding};
  });
  expect(pos.left).toBeGreaterThanOrEqual(-1);
  expect(pos.right).toBeLessThanOrEqual(page.viewportSize().width+1);
  expect(Math.abs(pos.gap)).toBeLessThanOrEqual(1);
  expect(pos.overflow).toBeLessThanOrEqual(1);
  expect(pos.height).toBeGreaterThanOrEqual(1108);
  expect(pos.innerWidth).toBeLessThanOrEqual(334.5);
  if(testInfo.project.name==='iphone-390') {
    expect(Math.abs(pos.height-1109.4)).toBeLessThan(20);
    expect(pos.bg).toBe('rgb(242, 236, 243)');
    expect(pos.padding).toBe('215px 28px 230px');
  }
  const top=await sectionY(page,'closingMessage');
  await page.evaluate(top=>scrollTo({top:top+115,behavior:'instant'}),top);
  await expect(closing).toBeInViewport();
  await expect(closing).toHaveAttribute('data-revealed','true');
  await page.waitForTimeout(1250);
  await expect(closing.locator('#closingHeading')).toBeVisible();
  const blocks=await closing.locator('.closing10-label,.closing10-message,.closing10-rule,.closing10-names,.closing10-contacts').evaluateAll(els=>
    els.map(e=>{const r=e.getBoundingClientRect();return {name:e.className,left:r.left,right:r.right}}));
  blocks.forEach(r=>{expect(r.left).toBeGreaterThanOrEqual(-1);expect(r.right).toBeLessThanOrEqual(page.viewportSize().width+1);});
  if(testInfo.project.name==='iphone-390'){
    await page.screenshot({path:testInfo.outputPath('section10-final-390x844.png'),animations:'disabled'});
    await page.evaluate(top=>scrollTo({top:top+20,behavior:'instant'}),top);
    await page.screenshot({path:testInfo.outputPath('section10-entry-390x844.png'),animations:'disabled'});
  }
  expect(errors).toEqual([]);
});

test('Section 10 camera reverses and decorative animation stops outside the viewport',async({page})=>{
  await openInvitation(page);
  const top=await sectionY(page,'closingMessage'),closing=page.locator('#closingMessage');
  await page.evaluate(top=>scrollTo({top:top+70,behavior:'instant'}),top);
  await expect(closing).toHaveAttribute('data-active','true');
  await page.waitForTimeout(100);
  const start=await closing.evaluate(e=>parseFloat(e.style.getPropertyValue('--closing10-sticky-y'))||0);
  await page.evaluate(top=>scrollTo({top:top+215,behavior:'instant'}),top);
  await page.waitForTimeout(100);
  const advanced=await closing.evaluate(e=>parseFloat(e.style.getPropertyValue('--closing10-sticky-y'))||0);
  await page.evaluate(top=>scrollTo({top:top+70,behavior:'instant'}),top);
  await page.waitForTimeout(100);
  const again=await closing.evaluate(e=>parseFloat(e.style.getPropertyValue('--closing10-sticky-y'))||0);
  expect(advanced-start).toBeGreaterThan(40);
  expect(Math.abs(again-start)).toBeLessThan(2);
  const prev=await sectionY(page,'rsvp');
  await page.evaluate(y=>scrollTo({top:y+150,behavior:'instant'}),prev);
  await expect(closing).toHaveAttribute('data-active','false');
});

test('Section 10 respects Reduced Motion including when toggled while visible',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await openInvitation(page);
  const closing=page.locator('#closingMessage'),top=await sectionY(page,'closingMessage');
  await page.evaluate(top=>scrollTo({top:top+125,behavior:'instant'}),top);
  const before=await closing.evaluate(e=>({motionReady:e.dataset.motionReady,
    opacity:getComputedStyle(e.querySelector('.closing10-message')).opacity,
    animation:getComputedStyle(e.querySelector('.ref-vine')).animationName,
    camera:e.style.getPropertyValue('--closing10-sticky-y')}));
  expect(before.motionReady).toBeUndefined();
  expect(before.opacity).toBe('1');
  expect(before.animation).toBe('none');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await expect(closing).toHaveAttribute('data-motion-ready','true');
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(closing).not.toHaveAttribute('data-motion-ready');
  await expect(closing.locator('.closing10-message')).toBeVisible();
});


test('Section 10 uses the locally staged reference scene when the WebP endpoint is available',async({page})=>{
  // Use an original SVG fixture served at the same local path; do not upload
  // or copy any third-party vendor image into GitHub Actions.
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"><rect width="1080" height="1920" fill="#d7c1dd"/></svg>';
  await page.route('**/assets/section10/scene.webp',route=>route.fulfill({
    status:200,contentType:'image/svg+xml',body:svg
  }));
  await page.goto('/');
  const section=page.locator('#closingMessage');
  await warmClosingArtwork(page);
  await expect(section).toHaveAttribute('data-artwork','local-reference');
  const image=section.locator('.closing10-source-scene');
  await expect(image).toHaveJSProperty('naturalWidth',1080);
  await expect(image).toBeVisible();
  await expect(section.locator('.closing10-message')).toContainText('greatest honour');
  await page.evaluate(()=>document.getElementById('closingMessage').scrollIntoView({block:'center',behavior:'instant'}));
  await expect(image).toBeInViewport();
  await expect(section).toHaveAttribute('data-artwork','local-reference');
});


test('Section 10 contact pills and footer follow the measured source geometry',async({page},testInfo)=>{
  await openInvitation(page);
  const closing=page.locator('#closingMessage');
  await page.evaluate(()=>{
    const el=document.querySelector('#closingMessage');
    window.scrollTo({top:el.getBoundingClientRect().top+scrollY+90,behavior:'instant'});
  });
  await expect(closing).toHaveAttribute('data-revealed','true');
  await page.waitForTimeout(1300);
  const m=await closing.evaluate(el=>{
    // Layout measurements must ignore reveal transforms: an out-of-view
    // block is intentionally translated +52px and scaled to 95.5%.
    const box=n=>{
      const x=n.offsetLeft,y=n.offsetTop,width=n.offsetWidth,height=n.offsetHeight;
      return {x,y,width,height,bottom:y+height,
        radius:getComputedStyle(n).borderTopLeftRadius,
        transform:getComputedStyle(n).textTransform,
        opacity:getComputedStyle(n).opacity};
    };
    const contact=el.querySelector('.closing10-contacts');
    const label=el.querySelector('.closing10-contacts-title');
    const row=el.querySelector('.closing10-contact-row');
    const buttons=[...row.querySelectorAll('button')];
    const credit=el.querySelector('.closing10-credit');
    const rule=el.querySelector('.closing10-rule');
    return {contact:box(contact),label:box(label),row:box(row),
      buttons:buttons.map(box),credit:box(credit),rule:box(rule)};
  });
  expect(Math.abs(m.contact.height-94.14)).toBeLessThan(1.5);
  expect(Math.abs(m.row.height-64)).toBeLessThan(1);
  expect(m.label.transform).toBe('uppercase');
  expect(m.buttons).toHaveLength(2);
  for(const b of m.buttons){
    expect(Math.abs(b.height-44)).toBeLessThan(1);
    expect(b.transform).toBe('uppercase');
    expect(parseFloat(b.radius)).toBeGreaterThanOrEqual(20);
    expect(b.opacity).toBe('1');
  }
  expect(Math.abs((m.buttons[1].x-(m.buttons[0].x+m.buttons[0].width))-9)).toBeLessThan(1);
  expect(Math.abs(m.credit.y-m.contact.bottom-56)).toBeLessThan(1.5);
  if(testInfo.project.name==='iphone-390'){
    expect(Math.abs(m.buttons[0].width-83)).toBeLessThan(3);
    expect(Math.abs(m.buttons[1].width-128)).toBeLessThan(3);
    expect(Math.abs(m.label.width-99.81)).toBeLessThan(2);
    expect(Math.abs(m.rule.width-80)).toBeLessThan(1);
  }
});


test('Section 10 reveals and hides individual blocks on forward and reverse scrolling',async({page})=>{
  await openInvitation(page);
  const closing=page.locator('#closingMessage');
  const heading=closing.locator('#closingHeading');
  const footer=closing.locator('.closing10-credit');
  const go=async(delta)=>{
    await page.evaluate(delta=>{
      const e=document.querySelector('#closingMessage');
      const top=e.getBoundingClientRect().top+window.scrollY;
      window.scrollTo({top:top+delta,behavior:'instant'});
    },delta);
  };
  const opacity=async(node)=>Number(await node.evaluate(e=>getComputedStyle(e).opacity));

  // Near the top of the closing section the heading is exposed but footer is
  // still below the viewport. This is the source's staggered reveal behavior.
  await go(-200);
  await expect(heading).toHaveAttribute('data-in-view','true');
  await expect(footer).toHaveAttribute('data-in-view','false');
  await page.waitForTimeout(1350);
  expect(await opacity(heading)).toBeGreaterThan(0.98);
  expect(await opacity(footer)).toBeLessThan(0.03);

  // At the final scroll stop the heading has left above the viewport, while
  // the contact/footer region has entered. The headline must animate OUT.
  // The actual final scroll offset depends on screen height. On a 430px
  // phone the headline still fits in view at the bottom, unlike smaller phones.
  await page.evaluate(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
  await expect(footer).toHaveAttribute('data-in-view','true');
  const headlineExposedAtBottom=await heading.evaluate(el=>{
    const base=el.closest('.closing10-inner').getBoundingClientRect().top;
    const top=base+el.offsetTop;
    return top+el.offsetHeight>0&&top<innerHeight*0.85;
  });
  await expect(heading).toHaveAttribute('data-in-view',String(headlineExposedAtBottom));
  // Source footer waits 1.05s before its 1.0s fade; allow the full 2.05s.
  await page.waitForTimeout(2250);
  if(headlineExposedAtBottom)expect(await opacity(heading)).toBeGreaterThan(0.98);
  else expect(await opacity(heading)).toBeLessThan(0.03);
  expect(await opacity(footer)).toBeGreaterThan(0.98);

  // Reversing must re-expose the heading, and hide the footer again.
  await go(-200);
  await expect(heading).toHaveAttribute('data-in-view','true');
  await expect(footer).toHaveAttribute('data-in-view','false');
  // On reverse scroll the source uses the same footer transition delay.
  await page.waitForTimeout(2250);
  expect(await opacity(heading)).toBeGreaterThan(0.98);
  expect(await opacity(footer)).toBeLessThan(0.03);
  await expect(closing).toHaveAttribute('data-revealed','true');
});


test('Section 10 reference trigger boundaries match the source at 390x844',async({page},testInfo)=>{
  if(testInfo.project.name!=='iphone-390')return;
  await openInvitation(page);
  const c=page.locator('#closingMessage');
  const goto=async(delta)=>page.evaluate(delta=>{
    const e=document.querySelector('#closingMessage');
    window.scrollTo({top:e.getBoundingClientRect().top+window.scrollY+delta,behavior:'instant'});
  },delta);
  const check=async(selector,expected)=>{
    await expect(c.locator(selector)).toHaveAttribute('data-in-view',String(expected));
  };
  // Confirmed reference source '.in' activation checkpoints from the 390x844
  // read-only motion.json measurements, not arbitrary design preferences.
  await goto(-370);
  await check('.closing10-message',true);
  await check('.closing10-rule',false);
  await goto(-170);
  await check('.closing10-rule',true);
  await check('.closing10-signoff',true);
  await goto(-30);
  await check('.closing10-contacts',false);
  await goto(80);
  await check('.closing10-contacts',true);
  await check('.closing10-credit',false);
  await goto(180);
  await check('.closing10-credit',true);
  await goto(80);
  await check('.closing10-credit',false);
  await goto(-30);
  await check('.closing10-contacts',false);
  await goto(-370);
  await check('.closing10-rule',false);
});


test('Section 10 CSS matches measured reference stagger and duration',async({page})=>{
  await openInvitation(page);
  const measured=await page.locator('#closingMessage').evaluate(section=>{
    const selectors=['.closing10-frame','#closingHeading','.closing10-message',
      '.closing10-rule','.closing10-signoff','.closing10-names',
      '.closing10-contacts','.closing10-credit'];
    return selectors.map(q=>{
      const style=getComputedStyle(section.querySelector(q));
      return {delay:style.transitionDelay,duration:style.transitionDuration,
        timing:style.transitionTimingFunction};
    });
  });
  const expected=['0s','0.15s','0.3s','0.45s','0.6s','0.75s','0.9s','1.05s'];
  measured.forEach((m,i)=>{
    expect(m.delay).toBe(expected[i]);
    expect(m.duration).toBe('1s, 1.1s');
    expect(m.timing).toContain('cubic-bezier(0.22, 0.9, 0.24, 1)');
  });
});


test('Section 10 artwork camera pins through the Section 9 seam and reverses at four widths',async({page})=>{
  // This is a neutral local fixture. Third-party WebPs are never committed to QA.
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"><rect width="1080" height="1920" fill="#d7c1dd"/></svg>';
  await page.route('**/assets/section10/scene.webp',route=>route.fulfill({
    status:200,contentType:'image/svg+xml',body:svg
  }));
  await openInvitation(page);
  const section=page.locator('#closingMessage');
  const scene=section.locator('.closing10-source-scene');
  await warmClosingArtwork(page);
  await expect(section).toHaveAttribute('data-artwork','local-reference');
  await expect(scene).toHaveJSProperty('naturalWidth',1080);
  const params=await section.evaluate(el=>{
    const prev=el.previousElementSibling;
    const a=el.getBoundingClientRect(),b=prev.getBoundingClientRect();
    return {sectionTop:a.top+scrollY,travel:Math.max(0,el.offsetHeight-innerHeight),
      gap:a.top-b.bottom};
  });
  expect(Math.abs(params.gap)).toBeLessThanOrEqual(1);
  expect(params.travel).toBeGreaterThan(50);
  const camera=section.locator('.closing10-sticky-art');

  const checkAt=async(fraction)=>{
    const offset=params.travel*fraction;
    await page.evaluate(({top,offset})=>{
      scrollTo({top:top+offset,behavior:'instant'});
    },{top:params.sectionTop,offset});
    await expect.poll(async()=>{
      return camera.evaluate(el=>Math.abs(el.getBoundingClientRect().top));
    },{timeout:3000,intervals:[50,100,150]}).toBeLessThan(2);
    // CSS sticky positioning can already be correct before the next
    // intersection-observer/requestAnimationFrame paint. Await the actual
    // camera-active state rather than sampling a transient false in CI.
    await expect(section).toHaveAttribute('data-active','true');
    const state=await section.evaluate(el=>({
      art:el.dataset.artwork,
      active:el.dataset.active,
      cameraOffset:parseFloat(el.style.getPropertyValue('--closing10-sticky-y'))||0
    }));
    expect(state.art).toBe('local-reference');
    expect(state.active).toBe('true');
    expect(Math.abs(state.cameraOffset-offset)).toBeLessThan(2);
    await expect(scene).toBeInViewport();
  };

  // Pin the same scene on entry, midway and exit, including a reverse traversal.
  for(const fraction of [0.05,0.5,0.95,0.5,0.05]) await checkAt(fraction);
});


test('Section 9→10 visual seam has no blank frame, overlap, or camera jump on reversal',async({page},testInfo)=>{
  // Isolated original 1080×1920 fixture, never distributes vendor artwork.
  const sceneFixture='<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"><rect width="1080" height="1920" fill="#ddd0e7"/><circle cx="540" cy="900" r="280" fill="#9c8cbd"/></svg>';
  await page.route('**/assets/section10/scene.webp',route=>route.fulfill({
    status:200,contentType:'image/svg+xml',body:sceneFixture
  }));
  const errors=await openInvitation(page);
  const closing=page.locator('#closingMessage'),previous=page.locator('#rsvp');
  const scene=closing.locator('.closing10-source-scene');
  await warmClosingArtwork(page);
  await expect(closing).toHaveAttribute('data-artwork','local-reference');
  await expect(scene).toHaveJSProperty('naturalWidth',1080);
  const seam=await page.evaluate(()=>{
    const prev=document.getElementById('rsvp').getBoundingClientRect();
    const last=document.getElementById('closingMessage').getBoundingClientRect();
    return {y:scrollY+last.top,gap:last.top-prev.bottom,
      closingWidth:last.width,viewport:innerWidth};
  });
  expect(Math.abs(seam.gap)).toBeLessThanOrEqual(1);
  expect(seam.closingWidth).toBeLessThanOrEqual(seam.viewport+1);
  const snapshots=[];
  for(const fraction of [-0.70,-0.30,0,0.25,0.75,0.25,0,-0.30]){
    await page.evaluate(({y,offset})=>{
      window.scrollTo({top:y+offset*innerHeight,behavior:'instant'});
    },{y:seam.y,offset:fraction});
    await page.waitForTimeout(80);
    const snapshot=await page.evaluate(()=>{
      const a=document.getElementById('rsvp').getBoundingClientRect();
      const b=document.getElementById('closingMessage').getBoundingClientRect();
      const art=document.querySelector('#closingMessage .closing10-sticky-art').getBoundingClientRect();
      const pic=document.querySelector('#closingMessage .closing10-source-scene');
      const img=pic.getBoundingClientRect();
      const overlap=a.bottom>b.top+1;
      const gap=a.bottom<b.top-1;
      return {
        scrollY,sectionTop:b.top,previousBottom:a.bottom,
        overlap,gap,sceneReady:pic.complete&&pic.naturalWidth===1080,
        sceneX:img.x,sceneWidth:img.width,artTop:art.top,
        active:document.getElementById('closingMessage').dataset.active
      };
    });
    snapshots.push(snapshot);
    expect(snapshot.overlap).toBe(false);
    expect(snapshot.gap).toBe(false);
    expect(snapshot.sceneReady).toBe(true);
    expect(Math.abs(snapshot.sceneX)).toBeLessThanOrEqual(1);
    expect(Math.abs(snapshot.sceneWidth-seam.viewport)).toBeLessThanOrEqual(1);
  }
  // Once Section 10 has entered the viewport the image remains pinned.
  const entering=snapshots.filter(x=>x.sectionTop<=0 && x.active==='true');
  expect(entering.length).toBeGreaterThanOrEqual(2);
  for(const s of entering)expect(Math.abs(s.artTop)).toBeLessThanOrEqual(2);
  if(testInfo.project.name==='iphone-390'){
    await page.evaluate(y=>window.scrollTo({top:y+innerHeight*.25,behavior:'instant'}),seam.y);
    await page.waitForTimeout(2300);
    await page.screenshot({path:testInfo.outputPath('section9-to10-seam-390x844.png'),animations:'disabled'});
  }
  expect(errors).toEqual([]);
});


test('Section 10 reveal state does not thrash DOM on stationary scroll frames',async({page})=>{
  await openInvitation(page);
  await page.evaluate(()=>{
    const el=document.querySelector('#closingMessage');
    window.scrollTo({top:el.getBoundingClientRect().top+scrollY+125,behavior:'instant'});
  });
  await expect(page.locator('#closingHeading')).toHaveAttribute('data-in-view','true');
  await page.waitForTimeout(120);
  const changes=await page.evaluate(async()=>{
    const els=[...document.querySelectorAll('#closingMessage .closing10-reveal')];
    const changes=[];
    const observer=new MutationObserver(records=>changes.push(...records));
    for(const el of els)observer.observe(el,{attributes:true,attributeFilter:['data-in-view']});
    try{
      for(let i=0;i<12;i++){
        dispatchEvent(new Event('scroll'));
        await new Promise(resolve=>requestAnimationFrame(resolve));
      }
      await new Promise(resolve=>requestAnimationFrame(resolve));
      return changes.length;
    }finally{observer.disconnect();}
  });
  expect(changes).toBe(0);
});


test('Section 10 staged scene follows measured camera drift and stops under Reduced Motion',async({page},testInfo)=>{
  const fixture='<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"><rect width="1080" height="1920" fill="#d7c1dd"/></svg>';
  await page.route('**/assets/section10/scene.webp',route=>route.fulfill({
    status:200,contentType:'image/svg+xml',body:fixture
  }));
  await openInvitation(page);
  const closing=page.locator('#closingMessage');
  const scene=closing.locator('.closing10-source-scene');
  await warmClosingArtwork(page);
  await expect(closing).toHaveAttribute('data-artwork','local-reference');
  await expect(scene).toHaveJSProperty('naturalWidth',1080);
  const positions=[-170,-30,80,265,80,-30];
  const referencePixels=new Map([[-170,-13],[-30,-7],[80,-2],[265,6]]);
  for(const delta of positions){
    await page.evaluate(delta=>{
      const el=document.querySelector('#closingMessage');
      window.scrollTo({top:el.getBoundingClientRect().top+scrollY+delta,behavior:'instant'});
    },delta);
    await expect(closing).toHaveAttribute('data-active','true');
    const measure=()=>closing.evaluate(el=>{
      const rect=el.getBoundingClientRect();
      return {actual:parseFloat(el.style.getPropertyValue('--closing10-scene-y')),
        expected:Math.max(-24,Math.min(16,-5.587-rect.top*.043788)),
        computed:getComputedStyle(el.querySelector('.closing10-source-scene')).transform};
    });
    await expect.poll(async()=>Number.isFinite((await measure()).actual)).toBe(true);
    const m=await measure();
    expect(Math.abs(m.actual-m.expected)).toBeLessThan(.3);
    expect(m.computed).not.toBe('none');
    if(testInfo.project.name==='iphone-390' && referencePixels.has(delta)){
      // Grounded in edge correlation of actual source/local exit screenshots.
      expect(Math.abs(m.actual-referencePixels.get(delta))).toBeLessThan(1.2);
    }
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(closing).not.toHaveAttribute('data-motion-ready');
  await expect.poll(()=>scene.evaluate(el=>getComputedStyle(el).transform)).toBe('none');
});

test('Section 10 approved production artwork loads at the ordinary URL and degrades safely',async({page})=>{
  await page.goto('/');
  const scene=page.locator('#closingMessage .closing10-source-scene');
  const section=page.locator('#closingMessage');
  await warmClosingArtwork(page);
  await expect(section).toHaveAttribute('data-artwork','local-reference');
  await expect(scene).toHaveJSProperty('naturalWidth',1080);
  const response=await page.request.get('/assets/section10/scene.webp');
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toContain('image/webp');
  await page.route('**/assets/section10/scene.webp',route=>route.abort());
  await page.reload();
  await warmClosingArtwork(page);
  await expect(section).toHaveAttribute('data-artwork','original');
  await expect(section.locator('#closingHeading')).toHaveText('Until we meet');
});


test('Section 10 native sticky holds the garden without JavaScript counter-scroll on four phones',async({page},testInfo)=>{
  const errors=await openInvitation(page);
  const closing=page.locator('#closingMessage');
  const anchor=await closing.evaluate(el=>({
    start:el.getBoundingClientRect().top+scrollY,
    travel:Math.max(0,el.offsetHeight-innerHeight)
  }));
  expect(anchor.travel).toBeGreaterThan(50);
  let middle=null;
  for(const fraction of [.06,.35,.7,.95,.35,.06]){
    await page.evaluate(async y=>{
      window.scrollTo({top:Math.round(y),behavior:'instant'});
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
    },anchor.start+anchor.travel*fraction);
    const data=await closing.evaluate(el=>{
      const art=el.querySelector('.closing10-sticky-art');
      const track=el.querySelector('.ref-environment');
      const root=el.getBoundingClientRect();
      const scene=art.getBoundingClientRect();
      const trackBox=track.getBoundingClientRect();
      const pinned=Math.max(0,Math.min(root.height-innerHeight,-root.top));
      return {
        position:getComputedStyle(art).position,
        sectionOverflow:getComputedStyle(el).overflow,
        trackOverflow:getComputedStyle(track).overflow,
        computedTransform:getComputedStyle(art).transform,
        artTop:scene.top,
        visualHeight:scene.height,
        sourceDrift:parseFloat(el.style.getPropertyValue('--closing10-scene-y')),
        legacyPin:parseFloat(el.style.getPropertyValue('--closing10-sticky-y')),
        pinned,rootTop:root.top,trackTop:trackBox.top,
        seam:root.top-el.previousElementSibling.getBoundingClientRect().bottom,
        overflow:document.documentElement.scrollWidth-innerWidth
      };
    });
    expect(data.position).toBe('sticky');
    expect(data.sectionOverflow).toBe('clip');
    expect(data.trackOverflow).toBe('clip');
    expect(data.computedTransform).toBe('none');
    expect(Math.abs(data.artTop)).toBeLessThan(2);
    expect(Math.abs(data.trackTop-data.rootTop)).toBeLessThan(1);
    expect(Math.abs(data.legacyPin-data.pinned)).toBeLessThan(2);
    expect(Number.isFinite(data.sourceDrift)).toBe(true);
    expect(Math.abs(data.seam)).toBeLessThanOrEqual(1);
    expect(data.overflow).toBeLessThanOrEqual(1);
    if(fraction===.35 && middle===null)middle=data.sourceDrift;
    else if(fraction===.35)expect(Math.abs(data.sourceDrift-middle)).toBeLessThan(.15);
    if(fraction===.7)await page.screenshot({path:testInfo.outputPath('section10-native-sticky-'+testInfo.project.name+'.png'),animations:'disabled'});
  }
  expect(errors).toEqual([]);
});
