import {test,expect} from '@playwright/test';

const continuation=['runningOrder','dressCode','weddingGift','closingMessage'];

async function open(page){
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(page.locator('#invitation')).toHaveAttribute('data-state','opened');
  await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';});
  return errors;
}
async function goTo(page,id){
  await page.evaluate(id=>document.getElementById(id)?.scrollIntoView({block:'center',behavior:'instant'}),id);
  await expect(page.locator('#'+id)).toBeInViewport();
}

test('remaining reference content follows the correct programme → attire → gallery → gift → RSVP → closing order',async({page})=>{
  await page.goto('/');
  for(const id of continuation){
    await expect(page.locator('#'+id)).toHaveAttribute('aria-hidden','true');
    await expect(page.locator('#'+id)).toHaveJSProperty('inert',true);
  }
  const errors=await open(page);
  const order=await page.locator('#invitation > section').evaluateAll(nodes=>nodes.map(n=>n.id));
  const sequence=['eventDetails','saveTheDate','runningOrder','dressCode','gallery','weddingGift','rsvp','closingMessage'];
  for(let i=1;i<sequence.length;i++){
    expect(order.indexOf(sequence[i])).toBe(order.indexOf(sequence[i-1])+1);
  }
  for(const id of continuation){
    await expect(page.locator('#'+id)).toHaveAttribute('aria-hidden','false');
    await expect(page.locator('#'+id)).toHaveJSProperty('inert',false);
  }
  await expect(page.locator('#weddingGift button')).toHaveCount(2);
  for(const b of await page.locator('#weddingGift button').all())await expect(b).toBeDisabled();
  await expect(page.locator('#wishesWall')).toContainText('Sample wishes');
  await expect(page.locator('#closingMessage')).toContainText('Reference-recreation research prototype');
  expect(errors).toEqual([]);
});

test('reference continuation scenes and seams stay within all four mobile widths',async({page},testInfo)=>{
  const errors=await open(page);
  const checks=await page.evaluate(()=>{
    const ids=['saveTheDate','runningOrder','dressCode','gallery','weddingGift','rsvp','closingMessage'];
    return {overflow:document.documentElement.scrollWidth-innerWidth,
      sections:ids.map((id,i)=>{
        const el=document.getElementById(id),b=el.getBoundingClientRect();
        const next=document.getElementById(ids[i+1]);
        return {id,left:b.left,right:b.right,width:b.width,height:b.height,
          gap:next?next.getBoundingClientRect().top-b.bottom:null};
      })
    };
  });
  expect(checks.overflow).toBeLessThanOrEqual(1);
  checks.sections.forEach(s=>{
    expect(s.left).toBeGreaterThanOrEqual(-1);
    expect(s.right).toBeLessThanOrEqual(page.viewportSize().width+1);
    expect(s.height).toBeGreaterThan(300);
    if(s.gap!==null)expect(Math.abs(s.gap)).toBeLessThanOrEqual(1);
  });
  for(const id of ['runningOrder','dressCode','weddingGift','closingMessage']){
    await goTo(page,id);
    const snapshot=await page.locator('#'+id).evaluate(el=>{
      const r=el.querySelector('.ref-content').getBoundingClientRect();
      return {left:r.left,right:r.right,opacity:getComputedStyle(el).opacity};
    });
    expect(snapshot.left).toBeGreaterThanOrEqual(-1);
    expect(snapshot.right).toBeLessThanOrEqual(page.viewportSize().width+1);
    expect(snapshot.opacity).toBe('1');
  }
  if(testInfo.project.name==='iphone-390'){
    for(const id of ['runningOrder','dressCode','weddingGift','closingMessage']){
      await goTo(page,id);
      await page.screenshot({path:testInfo.outputPath('reference-'+id+'-390.png'),animations:'disabled'});
    }
  }
  expect(errors).toEqual([]);
});

test('slow forward/backward scroll recalculates the background without horizontal jumps',async({page})=>{
  await open(page);
  await goTo(page,'dressCode');
  const section=page.locator('#dressCode');
  const top=await section.evaluate(el=>el.getBoundingClientRect().top+scrollY);
  await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),top);
  await page.waitForTimeout(80);
  const first=await section.evaluate(el=>parseFloat(el.style.getPropertyValue('--ref-camera-y'))||0);
  await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),top+250);
  await page.waitForTimeout(80);
  const second=await section.evaluate(el=>parseFloat(el.style.getPropertyValue('--ref-camera-y'))||0);
  await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),top);
  await page.waitForTimeout(80);
  const again=await section.evaluate(el=>parseFloat(el.style.getPropertyValue('--ref-camera-y'))||0);
  expect(Math.abs(first-second)).toBeGreaterThan(.5);
  expect(Math.abs(first-again)).toBeLessThan(.6);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
});

test('reduced motion and local-only guest/gift safeguards are honored',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await open(page);
  await goTo(page,'runningOrder');
  const state=await page.locator('#runningOrder').evaluate(el=>({
    revealReady:el.dataset.revealReady,
    animation:getComputedStyle(el.querySelector('.ref-vine')).animationName,
    opacity:getComputedStyle(el.querySelector('.ref-reveal')).opacity
  }));
  expect(state.revealReady).toBeUndefined();
  expect(state.animation).toBe('none');
  expect(state.opacity).toBe('1');
  await expect(page.locator('#weddingGift button')).toBeDisabled();
  await expect(page.locator('#wishesWall')).toContainText('not real guest submissions');
  await expect(page.locator('#rsvpWarning')).toContainText('response will not be sent');
});
