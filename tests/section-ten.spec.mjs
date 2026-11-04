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
  await expect(closing).toHaveAttribute('data-artwork','original');
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
  await page.route('**/assets/reference-dev/scene.webp',route=>route.fulfill({
    status:200,contentType:'image/svg+xml',body:svg
  }));
  await page.goto('/');
  const section=page.locator('#closingMessage');
  await expect(section).toHaveAttribute('data-artwork','local-reference');
  const image=section.locator('.closing10-source-scene');
  await expect(image).toHaveJSProperty('naturalWidth',1080);
  await expect(image).toBeVisible();
  await expect(section.locator('.closing10-message')).toContainText('greatest honour');
  await page.getByRole('button',{name:'Open Invitation',exact:true}).click();
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
  await page.waitForTimeout(1450);
  if(headlineExposedAtBottom)expect(await opacity(heading)).toBeGreaterThan(0.98);
  else expect(await opacity(heading)).toBeLessThan(0.03);
  expect(await opacity(footer)).toBeGreaterThan(0.98);

  // Reversing must re-expose the heading, and hide the footer again.
  await go(-200);
  await expect(heading).toHaveAttribute('data-in-view','true');
  await expect(footer).toHaveAttribute('data-in-view','false');
  await page.waitForTimeout(1350);
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
