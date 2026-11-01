import {test,expect} from '@playwright/test';

async function ready(page) {
  await expect(page.locator('#invitation')).toHaveAttribute('data-layers','ready',{timeout:30000});
}
test('phone QA remains absent from the normal guest invitation',async({page})=>{
  await page.goto('/');
  await ready(page);
  await expect(page.locator('#phoneQaLaunch')).toHaveCount(0);
  await expect(page.locator('#phoneQaPanel')).toHaveCount(0);
  expect(await page.evaluate(()=>Boolean(window.__phoneQa))).toBe(false);
  expect(await page.evaluate(()=>Boolean(window.__scenePerf))).toBe(false);
});

test('QA panel opens on a mobile tap and reports real viewport and art status',async({page})=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?phoneqa=1');
  await ready(page);
  const launch=page.locator('#phoneQaLaunch');
  await expect(launch).toBeVisible();
  await launch.tap();
  const panel=page.locator('#phoneQaPanel');
  await expect(panel).toBeVisible();
  await expect(launch).toHaveAttribute('aria-expanded','true');
  await expect(page.locator('#phoneQaTelemetry')).toContainText('Viewport');
  await expect(page.locator('#phoneQaTelemetry')).toContainText('ready');
  const values=await page.evaluate(()=>window.__phoneQa.telemetry);
  const device=page.viewportSize();
  expect(values.viewport).toBe(`${device.width}×${device.height}`);
  expect(values.horizontalOverflow).toBe(0);
  expect(values.artwork).toBe('ready');
  expect(values.state).toBe('cover');
  await page.locator('#phoneQaClose').tap();
  await expect(panel).toBeHidden();
  await page.getByRole('button',{name:'Open Invitation'}).tap();
  await expect(page.locator('#invitation')).toHaveAttribute('data-state','opened');
  await launch.tap();
  await expect(page.locator('#phoneQaTelemetry')).toContainText('opened');
  expect(errors).toEqual([]);
});

test('on-phone test report contains checks, notes, and local metrics without network upload',async({page})=>{
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'clipboard',{value:undefined,configurable:true});
  });
  await page.goto('/?phoneqa=1');
  await ready(page);
  await page.locator('#phoneQaLaunch').tap();
  await page.locator('#phoneQaChecks input').first().check();
  await page.locator('#phoneQaNotes').fill('Small flower overlaps the right edge');
  await page.locator('#phoneQaCopy').tap();
  await expect(page.locator('#phoneQaReport')).toBeVisible();
  const report=await page.locator('#phoneQaReport').inputValue();
  expect(report).toContain('Section 1 real-device report');
  expect(report).toContain('PASS — Cover fits');
  expect(report).toContain('NOT VERIFIED — Camera opens smoothly');
  expect(report).toContain('Small flower overlaps the right edge');
  expect(report).toContain('horizontalOverflow: 0');
  expect(await page.evaluate(()=>window.__phoneQa.report)).toBe(report);
});

test('five-second measurement reports actual frame sampling without claiming device battery results',async({page})=>{
  test.setTimeout(45000);
  await page.goto('/?phoneqa=1');
  await ready(page);
  await page.locator('#phoneQaLaunch').tap();
  const button=page.locator('#phoneQaMeasure');
  await button.tap();
  await expect(button).toBeDisabled();
  await expect(button).toBeEnabled({timeout:12000});
  const sample=await page.evaluate(()=>window.__phoneQa.sample);
  expect(sample).toBeTruthy();
  expect(sample.complete).toBe(true);
  expect(sample.seconds).toBeGreaterThanOrEqual(4.7);
  expect(sample.seconds).toBeLessThan(9);
  expect(sample.frameCallbackHz).toBeGreaterThan(5);
  expect(sample.petalPaintHz).toBeGreaterThan(0);
  expect(sample.petalPaintHz).toBeLessThanOrEqual(34);
  await expect(page.locator('#phoneQaMeasureResult')).toContainText('petal paints/s');
});

test('phone QA remains readable after rotation-size changes',async({page})=>{
  await page.goto('/?phoneqa=1');
  await ready(page);
  await page.locator('#phoneQaLaunch').tap();
  await page.setViewportSize({width:740,height:360});
  await expect.poll(async()=>page.evaluate(()=>window.__phoneQa.telemetry.orientation))
    .toBe('landscape');
  await expect(page.locator('#phoneQaPanel')).toBeVisible();
  await expect(page.locator('#phoneQaClose')).toBeInViewport();
  const panel=await page.locator('#phoneQaPanel').boundingBox();
  expect(panel.x).toBeGreaterThanOrEqual(0);
  expect(panel.x+panel.width).toBeLessThanOrEqual(741);
  await page.setViewportSize({width:390,height:844});
  await expect.poll(async()=>page.evaluate(()=>window.__phoneQa.telemetry.orientation))
    .toBe('portrait');
  await expect(page.locator('#phoneQaClose')).toBeInViewport();
});
