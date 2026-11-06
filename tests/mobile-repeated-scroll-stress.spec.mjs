import {test,expect} from '@playwright/test';

// Integration stress test for the user-reported failure pattern.
// Browser emulation cannot reproduce native iPhone heat/GPU memory constraints,
// but it catches unintended reloads, missed restoration and JS exceptions.
test('three forward-and-reverse scroll journeys preserve invitation and artwork',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='iphone-390',
    'Run the sustained scroll smoke on one calibrated phone; other suites cover all four widths');
  test.setTimeout(150_000);
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('crash',()=>errors.push('browser page crashed'));
  await page.goto('/');
  await expect(page.locator('#invitation')).toHaveAttribute('data-layers','ready',{timeout:45_000});
  await page.getByRole('button',{name:'Open Invitation',exact:true}).click();
  await page.evaluate(()=>{window.__stressSession=Object.freeze({started:performance.now()});});

  const sectionIds=[
    'viewport','message','couple','eventDetails','runningOrder','dressCode',
    'gallery','weddingGift','rsvp','closingMessage'
  ];
  for(let cycle=0;cycle<3;cycle++){
    for(const id of sectionIds){
      await page.evaluate(name=>{
        const section=document.getElementById(name);
        const top=section.getBoundingClientRect().top+scrollY;
        scrollTo({top:Math.round(top),behavior:'instant'});
      },id);
      await page.waitForTimeout(50);
    }
    await expect(page.locator('#closingMessage')).toHaveAttribute(
      'data-asset-lifecycle','near',{timeout:10_000});
    for(const id of sectionIds.slice().reverse()){
      await page.evaluate(name=>{
        const section=document.getElementById(name);
        const top=section.getBoundingClientRect().top+scrollY;
        scrollTo({top:Math.round(top),behavior:'instant'});
      },id);
      await page.waitForTimeout(50);
    }
    await expect(page.locator('#viewport')).toHaveAttribute(
      'data-asset-lifecycle','near',{timeout:10_000});
    await expect(page.locator('#invitation')).toHaveAttribute(
      'data-hero-rehydrating','false',{timeout:45_000});
    const state=await page.evaluate(()=>({
      stillSameSession:Boolean(window.__stressSession),
      state:document.getElementById('invitation').dataset.state,
      restored:[...document.querySelectorAll('#animatedScene img[src]')]
        .filter(img=>img.complete&&img.naturalWidth>0).length
    }));
    expect(state.stillSameSession).toBe(true);
    expect(state.state).toBe('opened');
    expect(state.restored).toBeGreaterThan(15);
    expect(errors).toEqual([]);
  }
});
