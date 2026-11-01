import {test,expect} from '@playwright/test';

// Normal art is downloaded temporarily by CI. These checks deliberately block
// selected URLs so the browser exercises real cold-load failure behavior.
async function waitForMode(page, expected) {
  await expect(page.locator('#invitation')).toHaveAttribute('data-layers',expected,{timeout:20000});
}

test('missing master image keeps complete layered garden and cover usable',async({page})=>{
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.route('**/assets/scene.webp',route=>route.abort());
  await page.route('**/tasik-kayangan/scene.webp',route=>route.abort());
  await page.goto('/');
  await waitForMode(page,'ready');
  await expect(page.locator('#networkNote')).toBeHidden();
  await expect(page.locator('#animatedScene')).toHaveCSS('opacity','1');
  await expect(page.locator('.depth.palace img')).toHaveJSProperty('complete',true);
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(page.locator('#invitation')).toHaveAttribute('data-state','opened');
  await expect(page.locator('#opened')).not.toHaveAttribute('inert');
  expect(errors).toEqual([]);
});

test('missing animated sprite uses original still artwork without blocking Open',async({page})=>{
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.route('**/assets/hang_3.webp',route=>route.abort());
  await page.route('**/tasik-kayangan/hang_3.webp',route=>route.abort());
  await page.goto('/');
  await waitForMode(page,'failed');
  await expect(page.locator('#animatedScene')).toBeHidden();
  await expect(page.locator('#masterArt')).toHaveJSProperty('complete',true);
  await expect(page.locator('#networkNote')).toBeVisible();
  await expect(page.locator('#networkNote')).toContainText('Showing the still invitation image');
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(page.locator('#invitation')).toHaveAttribute('data-state','opened');
  expect(errors).toEqual([]);
});

test('complete WebP outage retains readable text and working invitation button',async({page})=>{
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.route('**/*.webp',route=>route.abort());
  await page.goto('/');
  await waitForMode(page,'unavailable');
  await expect(page.locator('#masterArt')).toBeHidden();
  await expect(page.locator('#animatedScene')).toBeHidden();
  await expect(page.locator('#networkNote')).toBeVisible();
  await expect(page.locator('#networkNote')).toContainText('Invitation artwork could not be loaded');
  await expect(page.getByRole('button',{name:'Open Invitation'})).toBeVisible();
  await page.getByRole('button',{name:'Open Invitation'}).click();
  await expect(page.locator('#invitation')).toHaveAttribute('data-state','opened');
  await expect(page.locator('#opened')).not.toHaveAttribute('inert');
  expect(errors).toEqual([]);
});
