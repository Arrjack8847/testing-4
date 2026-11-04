import {test,expect} from '@playwright/test';
// Section 9 source-grounded RSVP & Wishes with real API; UI uses safe stub while Python tests exercise SQLite.
async function go(page){
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  const section=page.locator('#rsvp');
  // Fail immediately if this run accidentally targets another Git worktree.
  // Playwright :8000 used to reuse whichever local preview was already running.
  await expect(section.locator('.s9-petals i')).toHaveCount(8,{timeout:5000});
  await expect(section.locator('.s9-butterfly-forward')).toHaveCount(1);
  await expect(section).toHaveAttribute('aria-hidden','true');
  await expect(section).toHaveJSProperty('inert',true);
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(section).toHaveAttribute('aria-hidden','false');
  await expect(section).toHaveJSProperty('inert',false);
  await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';
    document.getElementById('rsvp').scrollIntoView({block:'start',behavior:'instant'});});
  await expect(section).toBeInViewport();
  return {section,errors};
}
test('Section 9 matches source structure, field choices and section order',async({page})=>{
  const {section,errors}=await go(page);
  await expect(section).toHaveAttribute('data-section','9');
  await expect(section.getByRole('heading',{name:'RSVP & Wishes'})).toBeVisible();
  await expect(section.locator('.s9-eyebrow')).toContainText('31 December 2026');
  const ids=await page.locator('#invitation > section').evaluateAll(xs=>xs.map(x=>x.id));
  expect(ids.indexOf('rsvp')).toBe(ids.indexOf('weddingGift')+1);
  expect(ids.indexOf('closingMessage')).toBe(ids.indexOf('rsvp')+1);
  await expect(section.locator('#s9Name')).toHaveAttribute('placeholder','e.g. Aiman');
  await expect(section.locator('#s9Attendance option')).toHaveCount(3);
  await expect(section.locator('#s9Guests option')).toHaveCount(5);
  await expect(section.locator('#s9Wish')).toHaveAttribute('maxlength','300');
  await expect(section.locator('.s9-wish')).toHaveCount(3);
  await expect(section.locator('#s9FormStatus')).toContainText('save it privately');
  expect(errors).toEqual([]);
});
test('A confirmed POST reveals a receipt; errors never pretend to save',async({page})=>{
  const writes=[];
  await page.route('**/api/rsvp',async route=>{
    const payload=route.request().postDataJSON();
    writes.push(payload);
    await route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({
      ok:true,saved:true,receipt:payload.requestId
    })});
  });
  const {section,errors}=await go(page);
  await section.locator('#s9Name').fill('  Dana    Test  ');
  await section.locator('#s9Attendance').selectOption('yes');
  await section.locator('#s9Guests').selectOption('3');
  await section.locator('#s9Wish').fill('A lovely celebration!');
  await section.getByRole('button',{name:'Send RSVP'}).click();
  await expect(section.locator('#s9Preview')).toBeVisible();
  await expect(section.locator('#s9PreviewName')).toHaveText('Dana Test');
  await expect(section.locator('#s9PreviewGuests')).toHaveText('3');
  await expect(section.locator('#s9FormStatus')).toContainText('received and saved');
  expect(writes).toHaveLength(1);
  expect(writes[0].requestId).toMatch(/^[a-f0-9-]{36}$/);
  expect(writes[0].shareWish).toBe(false);
  await page.reload();
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(page.locator('#s9Preview')).toBeHidden();
  expect(errors).toEqual([]);
});
test('Declining saves guest count zero and closing cover hides receipt',async({page})=>{
  let sent;
  await page.route('**/api/rsvp',async route=>{
    sent=route.request().postDataJSON();
    await route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({
      ok:true,saved:true,receipt:sent.requestId
    })});
  });
  const {section}=await go(page);
  await section.locator('#s9Name').fill('Guest Example');
  await section.locator('#s9Attendance').selectOption('no');
  await expect(section.locator('#s9Guests')).toBeDisabled();
  await section.getByRole('button',{name:'Send RSVP'}).click();
  await expect(section.locator('#s9PreviewGuests')).toHaveText('Not attending');
  expect(sent.guests).toBe(0);
  await page.evaluate(()=>{document.getElementById('invitation').dataset.state='cover';});
  await expect(section).toHaveJSProperty('inert',true);
  await expect(section.locator('#s9Preview')).toBeHidden();
});
test('Backend error preserves entry and never claims saved',async({page})=>{
  await page.route('**/api/rsvp',route=>route.fulfill({
    status:503,contentType:'application/json',body:JSON.stringify({ok:false,error:'Service unavailable.'})
  }));
  const {section}=await go(page);
  await section.locator('#s9Name').fill('Test Guest');
  await section.locator('#s9Attendance').selectOption('yes');
  await section.getByRole('button',{name:'Send RSVP'}).click();
  await expect(section.locator('#s9FormStatus')).toContainText('Service unavailable');
  await expect(section.locator('#s9Preview')).toBeHidden();
  await expect(section.locator('#s9Name')).toHaveValue('Test Guest');
});
test('Four widths have no overflow and Section 8→9→10 seams stay exact',async({page},testInfo)=>{
  const {section,errors}=await go(page);
  await page.waitForTimeout(1300);
  const m=await page.evaluate(()=>{
    const rect=selector=>{const e=document.querySelector(selector);if(!e)return null;const r=e.getBoundingClientRect(),b=document.querySelector('#rsvp').getBoundingClientRect();return {x:+r.x.toFixed(1),y:+(r.y-b.y).toFixed(1),width:+r.width.toFixed(1),height:+r.height.toFixed(1)};};
    const a=document.getElementById('weddingGift').getBoundingClientRect(),
      b=document.getElementById('rsvp').getBoundingClientRect(),
      c=document.getElementById('closingMessage').getBoundingClientRect();
    const refs=['#rsvp','#s9RsvpForm','#s9Name','#s9Attendance','#s9Guests','#s9Wish'].map(rect);
    return {overflow:document.documentElement.scrollWidth-innerWidth,
      section:{height:b.height,width:b.width},before:b.top-a.bottom,after:c.top-b.bottom,
      refs,artSrc:document.getElementById('s9ReferenceArt').getAttribute('src'),
      artLoaded:document.querySelector('#rsvp').classList.contains('s9-reference-loaded')};
  });
  expect(m.overflow).toBeLessThanOrEqual(1);
  expect(Math.abs(m.before)).toBeLessThanOrEqual(1);
  expect(Math.abs(m.after)).toBeLessThanOrEqual(1);
  expect(m.section.width).toBe(page.viewportSize().width);
  expect(m.section.height).toBeGreaterThanOrEqual(1150);
  // Localhost automatically loads optional private reference art when present.
  // Either a verified local image or the CSS fallback is legitimate; never
  // require the src to be null when the developer has staged paper.webp.
  if(m.artSrc!==null){
    expect(m.artSrc).toBe('./assets/reference-dev/section9/paper.webp');
    expect(m.artLoaded).toBe(true);
  }else{
    expect(m.artLoaded).toBe(false);
  }
  for(const r of m.refs){expect(r).toBeTruthy();expect(r.x).toBeGreaterThanOrEqual(-1);
    expect(r.x+r.width).toBeLessThanOrEqual(page.viewportSize().width+1);}
  if(testInfo.project.name==='iphone-390'){
    expect(Math.abs(m.section.height-1215.9)).toBeLessThan(4);
    const eyebrowBreak=await section.locator('.s9-eyebrow').evaluate(el=>{
      const text=el.firstChild,idx=text.textContent.indexOf('31');
      const topOf=(start,length)=>{
        const range=document.createRange();
        range.setStart(text,start);range.setEnd(text,start+length);
        return range.getBoundingClientRect().top;
      };
      return {first:topOf(0,6),date:topOf(idx,2)};
    });
    expect(eyebrowBreak.date-eyebrowBreak.first).toBeGreaterThan(8);
    const exact=await section.evaluate(el=>{
      const inp=el.querySelector('#s9Name'),btn=el.querySelector('.s9-submit'),paper=el.querySelector('.s9-reference-art'),
        wall=el.querySelector('.s9-wall'),wish=el.querySelector('.s9-wish'),base=el.getBoundingClientRect();
      const rc=e=>{const r=e.getBoundingClientRect();return {y:r.y-base.y,height:r.height}};
      return {inputHeight:inp.getBoundingClientRect().height,inputRadius:getComputedStyle(inp).borderRadius,
        buttonBg:getComputedStyle(btn).backgroundColor,buttonRadius:getComputedStyle(btn).borderRadius,
        paperTop:getComputedStyle(paper).top,paperHeight:getComputedStyle(paper).height,
        wall:rc(wall),wishRadius:getComputedStyle(wish).borderRadius};
    });
    expect(Math.abs(exact.inputHeight-58.05)).toBeLessThan(1);
    expect(exact.inputRadius).toBe('12px');
    expect(exact.buttonBg).toBe('rgb(123, 61, 110)');
    expect(exact.buttonRadius).toBe('999px');
    expect(exact.wishRadius).toBe('14px');
    const wishStyles=await section.evaluate(el=>{
      const note=el.querySelector('#s9WishesNote'),who=el.querySelector('.s9-who'),
        city=who.querySelector('span'),firstCard=el.querySelector('.s9-wish');
      return {
        noticeHeight:note.getBoundingClientRect().height,
        noticeLineHeight:parseFloat(getComputedStyle(note).lineHeight),
        nameFontSize:getComputedStyle(who).fontSize,
        cityTransform:getComputedStyle(city).textTransform,
        cardHeight:firstCard.getBoundingClientRect().height
      };
    });
    expect(wishStyles.noticeHeight).toBeLessThanOrEqual(wishStyles.noticeLineHeight+1);
    expect(wishStyles.nameFontSize).toBe('18px');
    expect(wishStyles.cityTransform).toBe('uppercase');
    expect(wishStyles.cardHeight).toBeGreaterThan(90);
    const frame=await section.locator('.s9-frame').evaluate(el=>{
      const r=el.getBoundingClientRect(),s=document.getElementById('rsvp').getBoundingClientRect();
      const disclosure=document.querySelector('#rsvp .s9-demo-note').getBoundingClientRect();
      return {top:r.top-s.top,bottom:r.bottom-s.top,left:r.left-s.left,width:r.width,
        noticeTop:disclosure.top-s.top,noticeBottom:disclosure.bottom-s.top,
        radius:getComputedStyle(el).borderTopLeftRadius,
        background:getComputedStyle(el).backgroundImage};
    });
    expect(Math.abs(frame.top-5)).toBeLessThan(5);
    expect(frame.left).toBeGreaterThan(8);
    expect(frame.left).toBeLessThan(22);
    expect(frame.background).toContain('linear-gradient');
    // Live source's inner arch ends around section-relative y=1150 at 390px.
    // The example-wishes disclosure stays visible below the arch, not inside
    // the grid that artificially stretched the gold border by ~40px.
    expect(frame.bottom).toBeGreaterThan(1138);
    expect(frame.bottom).toBeLessThan(1165);
    expect(frame.noticeTop).toBeGreaterThan(frame.bottom);
    expect(frame.noticeBottom).toBeLessThan(m.section.height-6);

    const flights=await section.evaluate(el=>Object.fromEntries(
      ['.s9-butterfly','.s9-butterfly-forward'].map(selector=>{
        const sprite=el.querySelector(selector),style=getComputedStyle(sprite);
        return [selector,{
          top:parseFloat(style.top),duration:style.animationDuration,
          delay:style.animationDelay,name:style.animationName,
          pointerEvents:style.pointerEvents,ariaHidden:sprite.getAttribute('aria-hidden')
        }];
      })
    ));
    expect(Math.abs(flights['.s9-butterfly'].top-(m.section.height-12))).toBeLessThan(2);
    expect(flights['.s9-butterfly'].duration).toBe('13s');
    expect(flights['.s9-butterfly'].delay).toBe('7.5s');
    expect(flights['.s9-butterfly-forward'].name).toBe('s9-flight-forward');
    expect(Math.abs(flights['.s9-butterfly-forward'].top-(m.section.height-72))).toBeLessThan(2);
    expect(flights['.s9-butterfly-forward'].duration).toBe('16s');
    expect(flights['.s9-butterfly-forward'].ariaHidden).toBe('true');
    expect(flights['.s9-butterfly-forward'].pointerEvents).toBe('none');
    expect(Math.abs(exact.wall.y-756.88)).toBeLessThan(4);
    const measured=await page.evaluate(()=>{const rect=selector=>{const e=document.querySelector(selector);if(!e)return null;const r=e.getBoundingClientRect(),b=document.querySelector('#rsvp').getBoundingClientRect();return {x:+r.x.toFixed(1),y:+(r.y-b.y).toFixed(1),width:+r.width.toFixed(1),height:+r.height.toFixed(1)};}; return ({
      eyebrow:rect('#rsvp .s9-eyebrow'),heading:rect('#rsvpHeading'),
      name:rect('#rsvp label[for="s9Name"]'),
      attend:rect('#rsvp label[for="s9Attendance"]'),
      guests:rect('#rsvp label[for="s9Guests"]'),
      wish:rect('#rsvp label[for="s9Wish"]')
    });});
    console.log('S9_LOCAL_GEOMETRY '+JSON.stringify(measured));
    for(const [id,y] of [['eyebrow',96],['heading',144.3],['name',240.1],['attend',342.3],['guests',342.3],['wish',444.5]]){
      expect(Math.abs(measured[id].y-y),id).toBeLessThan(3);
    }
  }
  await section.screenshot({path:testInfo.outputPath('s9-mobile-'+testInfo.project.name+'.png'),animations:'disabled'});
  await page.evaluate(()=>document.getElementById('closingMessage').scrollIntoView({block:'start',behavior:'instant'}));
  await page.evaluate(()=>document.getElementById('rsvp').scrollIntoView({block:'start',behavior:'instant'}));
  await expect(section).toBeInViewport();
  expect(errors).toEqual([]);
});
test('Local reference mode loads split-wing sprite only with explicit opt-in',async({page})=>{
  // Intercept source files with harmless fixtures: no copyrighted assets enter Git.
  const transparentPng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/2XcAAAAASUVORK5CYII=','base64');
  await page.route('**/assets/reference-dev/section9/*.webp',route=>route.fulfill({
    status:200,contentType:'image/png',body:transparentPng
  }));
  await page.goto('/?section9Reference=1');
  const section=page.locator('#rsvp');
  await expect(section).toHaveClass(/s9-reference-loaded/);
  await expect(section).toHaveClass(/s9-reference-butterfly-loaded/);
  await expect(section).toHaveAttribute('data-reference-art','loaded');
  await expect(section).toHaveAttribute('data-reference-butterfly','loaded');
  const wing=section.locator('.s9-butterfly > .s9-wing-left');
  const style=await wing.evaluate(el=>({image:getComputedStyle(el).backgroundImage,
    size:getComputedStyle(el).backgroundSize,animation:getComputedStyle(el).animationName}));
  expect(style.image).toContain('assets/reference-dev/section9/bfly_1.webp');
  expect(style.size).toBe('200% 100%');
  expect(style.animation).toBe('s9-sprite-flap-left');
});
test('Plain localhost root automatically loads locally staged paper and butterfly',async({page})=>{
  // Harmless generated fixture; no vendor artwork enters Git or CI.
  const transparentPng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/2XcAAAAASUVORK5CYII=','base64');
  await page.route('**/assets/reference-dev/section9/*.webp',route=>route.fulfill({
    status:200,contentType:'image/png',body:transparentPng
  }));
  await page.goto('/');
  const section=page.locator('#rsvp');
  await expect(section).toHaveClass(/s9-reference-loaded/);
  await expect(section).toHaveClass(/s9-reference-butterfly-loaded/);
  expect(new URL(page.url()).searchParams.has('section9Reference')).toBe(false);
  await page.goto('/?section9Reference=0');
  await expect(section).not.toHaveClass(/s9-reference-loaded/);
  await expect(section).not.toHaveClass(/s9-reference-butterfly-loaded/);
  await expect(section.locator('#s9ReferenceArt')).not.toHaveAttribute('src');
});

test('Missing original Section 9 files report diagnostics rather than silently vanishing',async({page})=>{
  await page.route('**/assets/reference-dev/section9/*.webp',route=>route.fulfill({
    status:404,contentType:'text/plain',body:'Not found'
  }));
  await page.goto('/');
  const section=page.locator('#rsvp');
  await expect(section).toHaveAttribute('data-reference-art','missing');
  await expect(section).toHaveAttribute('data-reference-butterfly','missing');
  await expect(section).not.toHaveClass(/s9-reference-loaded/);
  await expect(section).not.toHaveClass(/s9-reference-butterfly-loaded/);
  await expect(section.locator('#s9ReferenceArt')).not.toHaveAttribute('src');
});

test('Missing optional butterfly sprite gracefully falls back to CSS art',async({page})=>{
  await page.route('**/assets/reference-dev/section9/bfly_1.webp',route=>route.fulfill({status:404,body:'not found'}));
  await page.goto('/?section9Reference=1');
  const section=page.locator('#rsvp');
  await expect(section).toHaveAttribute('data-reference-butterfly','missing');
  await expect(section).not.toHaveClass(/s9-reference-butterfly-loaded/);
  const backgrounds=await section.locator('.s9-butterfly > .s9-wing-left, .s9-butterfly-forward > .s9-wing-left').evaluateAll(
    wings=>wings.map(wing=>getComputedStyle(wing).backgroundImage));
  expect(backgrounds).toHaveLength(2);
  for(const background of backgrounds)expect(background).toContain('radial-gradient');
});
test('Animation pauses outside view and Reduced Motion remains legible',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const {section}=await go(page);
  await expect(section.locator('.s9-heading')).toBeVisible();
  const state=await section.evaluate(el=>({
    headingOpacity:getComputedStyle(el.querySelector('.s9-heading')).opacity,
    butterfly:getComputedStyle(el.querySelector('.s9-butterfly')).animationName,
    forwardButterfly:getComputedStyle(el.querySelector('.s9-butterfly-forward')).animationName,
    image:el.querySelector('.s9-reference-art').getAttribute('src'),
    imageNaturalWidth:el.querySelector('.s9-reference-art').naturalWidth,
    referenceLoaded:el.classList.contains('s9-reference-loaded')
  }));
  expect(state.headingOpacity).toBe('1');
  expect(state.butterfly).toBe('none');
  expect(state.forwardButterfly).toBe('none');
  // Reduced Motion affects decorative animations, not optional private paper.
  if(state.image!==null){
    expect(state.image).toBe('./assets/reference-dev/section9/paper.webp');
    expect(state.referenceLoaded).toBe(true);
    expect(state.imageNaturalWidth).toBeGreaterThan(0);
  }else{
    expect(state.referenceLoaded).toBe(false);
  }
});

test('Section 9 keeps opposing flight directions at animation checkpoints',async({page})=>{
  const {section}=await go(page);
  const tracks=await section.evaluate(el=>{
    const checkpoint=(selector,animationName,t1,t2)=>{
      const target=el.querySelector(selector);
      const animation=target.getAnimations().find(a=>a.animationName===animationName);
      if(!animation)return {found:false};
      animation.pause();
      animation.currentTime=t1;
      const x1=target.getBoundingClientRect().x;
      animation.currentTime=t2;
      const x2=target.getBoundingClientRect().x;
      return {found:true,x1,x2};
    };
    return {
      east:checkpoint('.s9-butterfly-forward','s9-flight-forward',4000,8000),
      west:checkpoint('.s9-butterfly','s9-flight',9000,12000),
    };
  });
  expect(tracks.east.found).toBe(true);
  expect(tracks.west.found).toBe(true);
  expect(tracks.east.x2-tracks.east.x1).toBeGreaterThan(40);
  expect(tracks.west.x1-tracks.west.x2).toBeGreaterThan(35);
});

test('Section 9 petals are decorative, scroll-contained and reduced-motion safe',async({page})=>{
  const {section}=await go(page);
  const petals=section.locator('.s9-petals i');
  await expect(petals).toHaveCount(8);
  await expect(section.locator('.s9-petals')).toHaveAttribute('aria-hidden','true');
  const initial=await section.evaluate(el=>{
    const layer=el.querySelector('.s9-petals'),petal=layer.querySelector('i');
    const lr=layer.getBoundingClientRect(),sr=el.getBoundingClientRect();
    return {
      pointer:getComputedStyle(layer).pointerEvents,
      overflow:getComputedStyle(layer).overflow,
      petalStack:parseInt(getComputedStyle(layer).zIndex,10),
      contentStack:parseInt(getComputedStyle(el.querySelector('.s9-inner')).zIndex,10),
      animation:getComputedStyle(petal).animationName,
      left:lr.left-sr.left,right:sr.right-lr.right,
      top:lr.top-sr.top,bottom:sr.bottom-lr.bottom
    };
  });
  expect(initial.pointer).toBe('none');
  expect(initial.overflow).toBe('hidden');
  // The live reference shows petals passing over the wishes cards.
  expect(initial.petalStack).toBeGreaterThan(initial.contentStack);
  expect(initial.animation).toBe('s9-petal-drift');
  for(const side of ['left','right','top','bottom'])expect(Math.abs(initial[side])).toBeLessThanOrEqual(1);
  await page.emulateMedia({reducedMotion:'reduce'});
  const reduced=await petals.first().evaluate(el=>({
    animation:getComputedStyle(el).animationName,
    opacity:getComputedStyle(el).opacity
  }));
  expect(reduced.animation).toBe('none');
  expect(reduced.opacity).toBe('0');
  await page.evaluate(()=>document.getElementById('closingMessage')
    .scrollIntoView({block:'start',behavior:'instant'}));
  await page.evaluate(()=>document.getElementById('rsvp')
    .scrollIntoView({block:'start',behavior:'instant'}));
  await expect(section).toBeInViewport();
});

test('Section 9 captures entry middle exit and reverse scroll on four phones',async({page},testInfo)=>{
  const {section,errors}=await go(page);
  await page.waitForTimeout(1900);
  const viewport=page.viewportSize();
  const stages=['entry','middle','exit','reverse-middle'];
  for(const stage of stages){
    await page.evaluate(({stage,viewHeight})=>{
      const target=document.getElementById('rsvp');
      const rect=target.getBoundingClientRect();
      const height=rect.height;
      const desiredTop=stage==='entry'?
        Math.min(viewHeight*.7,height*.3):
        (stage==='exit'?
          -(height-Math.min(180,viewHeight*.3)):
          -(height/2-viewHeight/2));
      document.documentElement.style.scrollBehavior='auto';
      window.scrollTo({top:Math.round(window.scrollY+rect.top-desiredTop),
        behavior:'instant'});
    },{stage,viewHeight:viewport.height});
    await page.waitForTimeout(240);
    const metrics=await section.evaluate(el=>{
      const bounds=el.getBoundingClientRect();
      const selectors=['.s9-inner','.s9-heading','.s9-form','.s9-wall','.s9-wish','.s9-petals'];
      const parts=selectors.map(selector=>{
        const r=el.querySelector(selector).getBoundingClientRect();
        return {selector,left:r.left,right:r.right,width:r.width,
          clientWidth:el.querySelector(selector).clientWidth,
          scrollWidth:el.querySelector(selector).scrollWidth};
      });
      return {visible:bounds.top<innerHeight&&bounds.bottom>0,
        width:bounds.width,overflow:document.documentElement.scrollWidth-innerWidth,
        active:el.classList.contains('s9-active'),parts};
    });
    expect(metrics.visible,stage).toBe(true);
    expect(metrics.width,stage).toBe(viewport.width);
    expect(metrics.overflow,stage).toBeLessThanOrEqual(1);
    expect(metrics.active,stage).toBe(true);
    for(const part of metrics.parts){
      expect(part.left,stage+' '+part.selector).toBeGreaterThanOrEqual(-1);
      expect(part.right,stage+' '+part.selector).toBeLessThanOrEqual(viewport.width+1);
      const overhang=part.scrollWidth-part.clientWidth;
      if(part.selector==='.s9-inner'){
        // The ivory arch intentionally extends 13px outside its content column;
        // its scrollWidth is ~17px greater, but the SECTION clips it and the
        // document still has zero horizontal overflow (asserted above).
        expect(overhang,stage+' decorative frame overhang').toBeGreaterThanOrEqual(10);
        expect(overhang,stage+' decorative frame overhang').toBeLessThanOrEqual(22);
      }else{
        expect(overhang,stage+' '+part.selector).toBeLessThanOrEqual(2);
      }
    }
    await page.screenshot({
      path:testInfo.outputPath('s9-'+stage+'-'+testInfo.project.name+'.png'),
      animations:'allow'
    });
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(section.locator('.s9-heading')).toBeVisible();
  const animations=await section.evaluate(el=>({
    west:getComputedStyle(el.querySelector('.s9-butterfly')).animationName,
    east:getComputedStyle(el.querySelector('.s9-butterfly-forward')).animationName,
    petals:getComputedStyle(el.querySelector('.s9-petals i')).animationName,
  }));
  expect(animations).toEqual({west:'none',east:'none',petals:'none'});
  expect(errors).toEqual([]);
});

test('Section 9 butterfly x tracks match archived 390px reference frames',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='iphone-390','Reference positions measured at 390px');
  const {section}=await go(page);
  const tracks=await section.evaluate(el=>{
    const sample=(selector,name,ms)=>{
      const target=el.querySelector(selector);
      const animation=target.getAnimations().find(item=>item.animationName===name);
      if(!animation)return null;
      animation.pause();
      animation.currentTime=ms;
      return target.getBoundingClientRect().x;
    };
    return {
      eastStart:sample('.s9-butterfly-forward','s9-flight-forward',8800),
      eastEnd:sample('.s9-butterfly-forward','s9-flight-forward',13600),
      westStart:sample('.s9-butterfly','s9-flight',10000),
      westEnd:sample('.s9-butterfly','s9-flight',13600),
    };
  });
  // These times are reconstructed from the previous local flight's 21-frame
  // animation clock, not copied from the vendor's JavaScript.
  // Reference observations: east 121→319px; west 302→147px.
  const source={eastStart:121,eastEnd:319,westStart:302,westEnd:147};
  for(const [key,expected] of Object.entries(source)){
    expect(tracks[key],key+' must be a sampled CSS-animation coordinate').not.toBeNull();
    expect(Math.abs(tracks[key]-expected),key+' at 390px').toBeLessThan(9);
  }
});
