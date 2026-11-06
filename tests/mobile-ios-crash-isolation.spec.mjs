import {test,expect} from '@playwright/test';

// An explicit real-iPhone diagnostic: compare identical page/navigation with
// and without the layered 24-WebP hero; never changes the default reference.
test('still-hero diagnostic skips 24 opening layers without disabling sections 2–10',async({page})=>{
  const failures=[];
  page.on('pageerror',err=>failures.push(err.message));
  await page.goto('/?heroStill=1');
  const root=page.locator('#invitation');
  await expect(root).toHaveAttribute('data-hero-diagnostic','still');
  await expect(root).toHaveAttribute('data-layers','failed');
  await expect(page.locator('#masterArt')).toHaveJSProperty('naturalWidth',1080);
  const imgCount=await page.locator('#animatedScene img').count();
  expect(imgCount).toBeGreaterThan(20);
  expect(await page.locator('#animatedScene img[src]').count()).toBe(0);
  await page.getByRole('button',{name:'Open Invitation',exact:true}).click();
  await expect(root).toHaveAttribute('data-state','opened');
  await expect(page.locator('#masterArt')).toBeVisible();
  await page.evaluate(()=>{
    const end=document.getElementById('closingMessage');
    window.scrollTo({top:end.getBoundingClientRect().top+scrollY,behavior:'instant'});
  });
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(500);
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await expect(root).toHaveAttribute('data-state','opened');
  expect(failures).toEqual([]);
});
test('head script tags are separated by a genuine newline, not literal backslash-n',async({page})=>{
  await page.goto('/');
  const stray=await page.evaluate(()=>[...document.body.childNodes]
    .filter(n=>n.nodeType===Node.TEXT_NODE && /\\n/.test(n.textContent)).map(n=>n.textContent));
  expect(stray).toEqual([]);
  const first=await page.locator('#viewport').boundingBox();
  expect(first.y).toBeCloseTo(0,0);
});
