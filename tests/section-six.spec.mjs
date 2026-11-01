import {test,expect} from '@playwright/test';

async function reachRSVP(page) {
  const errors = [];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  const section=page.locator('#rsvp');
  await expect(section).toHaveAttribute('aria-hidden','true');
  await expect(section).toHaveJSProperty('inert',true);
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(section).toHaveAttribute('aria-hidden','false');
  await expect(section).toHaveJSProperty('inert',false);
  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    document.getElementById('rsvp').scrollIntoView({block:'start',behavior:'instant'});
  });
  await expect(section).toBeInViewport();
  return {section,errors};
}

test('RSVP is an honest preview with no destination configured',async({page})=>{
  const {section,errors}=await reachRSVP(page);
  await expect(section).toHaveAttribute('data-section','6');
  await expect(page.getByRole('heading',{level:2,name:'Kindly Respond'})).toBeVisible();
  await expect(section.locator('#rsvpWarning')).toContainText('will not be sent');
  await expect(section.locator('.rsvp-preview')).toBeHidden();
  await expect(section.locator('#rsvpGuests')).toBeDisabled();
  const preview=section.getByRole('button',{name:'Preview RSVP — not sent'});
  await expect(preview).toBeEnabled();
  await preview.click();
  await expect(section.locator('.rsvp-preview')).toBeHidden();
  expect(errors).toEqual([]);
});

test('accepting RSVP shows correct guest count and never claims submission',async({page},testInfo)=>{
  const {section,errors}=await reachRSVP(page);
  await section.locator('#rsvpName').fill('  Dana   Test  ');
  await section.getByRole('radio',{name:'Joyfully accepts'}).check();
  const guests=section.locator('#rsvpGuests');
  await expect(guests).toBeEnabled();
  await guests.selectOption('3');
  await section.locator('#rsvpMessage').fill('Looking forward to celebrating!');
  await section.getByRole('button',{name:'Preview RSVP — not sent'}).click();
  await expect(section.locator('#rsvpPreview')).toBeVisible();
  await expect(section.locator('#rsvpPreviewName')).toHaveText('Dana Test');
  await expect(section.locator('#rsvpPreviewAttendance')).toHaveText('Joyfully accepts');
  await expect(section.locator('#rsvpPreviewGuests')).toHaveText('3');
  await expect(section.locator('#rsvpPreviewMessage')).toHaveText('Looking forward to celebrating!');
  await expect(section.locator('.rsvp-preview-disclosure')).toContainText('has not been submitted');
  await expect(section.locator('#rsvpCopyButton')).toBeEnabled();
  await section.screenshot({path:testInfo.outputPath('section-six-rsvp-preview.png'),animations:'disabled'});
  await guests.selectOption('2');
  await expect(section.locator('#rsvpPreview')).toBeHidden();
  expect(errors).toEqual([]);
});

test('declining RSVP resets the guests field and supports an empty message',async({page})=>{
  const {section}=await reachRSVP(page);
  await section.locator('#rsvpName').fill('Guest Example');
  await section.getByRole('radio',{name:'Joyfully accepts'}).check();
  await section.locator('#rsvpGuests').selectOption('5');
  await section.getByRole('radio',{name:'Regretfully declines'}).check();
  await expect(section.locator('#rsvpGuests')).toBeDisabled();
  await expect(section.locator('#rsvpGuests')).toHaveValue('1');
  await section.getByRole('button',{name:'Preview RSVP — not sent'}).click();
  await expect(section.locator('#rsvpPreviewAttendance')).toHaveText('Regretfully declines');
  await expect(section.locator('#rsvpPreviewGuests')).toHaveText('Not attending');
  await expect(section.locator('#rsvpPreviewMessage')).toHaveText('No message');
  await section.locator('#rsvpName').fill('   ');
  await section.getByRole('button',{name:'Preview RSVP — not sent'}).click();
  await expect(section.locator('#rsvpPreview')).toBeHidden();
});

test('RSVP Section 5-to-6 transition and inputs fit four phone widths',async({page},testInfo)=>{
  const {section}=await reachRSVP(page);
  await expect(section).toHaveClass(/is-visible/);
  const stats=await section.evaluate(el=>{
    const previous=document.getElementById('gallery');
    const card=el.querySelector('.rsvp-paper').getBoundingClientRect();
    const form=el.querySelector('#rsvpForm').getBoundingClientRect();
    return {adjacent:previous.nextElementSibling===el,
      gap:el.getBoundingClientRect().top-previous.getBoundingClientRect().bottom,
      overflow:document.documentElement.scrollWidth-innerWidth,screen:innerWidth,
      cardLeft:card.left,cardRight:card.right,formRight:form.right};
  });
  expect(stats.adjacent).toBe(true);
  expect(Math.abs(stats.gap)).toBeLessThanOrEqual(1);
  expect(stats.overflow).toBeLessThanOrEqual(1);
  expect(stats.cardLeft).toBeGreaterThanOrEqual(-1);
  expect(stats.cardRight).toBeLessThanOrEqual(stats.screen+1);
  expect(stats.formRight).toBeLessThanOrEqual(stats.screen+1);
  await section.screenshot({path:testInfo.outputPath('section-six-rsvp-form.png'),animations:'disabled'});
});

test('RSVP uses reduced-motion readable content and resets when closed',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const {section}=await reachRSVP(page);
  await expect(section.locator('.rsvp-heading')).toBeVisible();
  const state=await section.locator('.rsvp-heading').evaluate(el=>({
    opacity:getComputedStyle(el).opacity,translate:getComputedStyle(el).translate
  }));
  expect(state.opacity).toBe('1');
  expect(['none','0px','0px 0px']).toContain(state.translate);
  await section.locator('#rsvpName').fill('Guest Example');
  await section.getByRole('radio',{name:'Joyfully accepts'}).check();
  await section.getByRole('button',{name:'Preview RSVP — not sent'}).click();
  await expect(section.locator('#rsvpPreview')).toBeVisible();
  await page.evaluate(()=>{document.getElementById('invitation').dataset.state='cover';});
  await expect(section).toHaveAttribute('aria-hidden','true');
  await expect(section).toHaveJSProperty('inert',true);
  await expect(section.locator('#rsvpName')).toHaveValue('');
  await expect(section.locator('#rsvpPreview')).toBeHidden();
});
