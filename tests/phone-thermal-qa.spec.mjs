import {test, expect} from '@playwright/test';

test('phone thermal QA is opt-in and does not run for guests', async ({page}) => {
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#phoneQaLaunch')).toHaveCount(0);
  await expect(page.locator('#phoneQaPanel')).toHaveCount(0);
  expect(await page.evaluate(() => window.__phoneQa)).toBeUndefined();
  await page.goto('/?phoneqa=1');
  await expect(page.locator('#phoneQaLaunch')).toBeVisible();
  await page.locator('#phoneQaLaunch').click();
  await expect(page.locator('#phoneQaScrollMeasure')).toBeVisible();
  await expect(page.locator('#phoneQaMeasure')).toBeVisible();
  expect(await page.evaluate(() => window.__phoneQa?.sample)).toBeNull();
  await page.locator('#phoneQaScrollMeasure').click();
  await expect(page.locator('#phoneQaPanel')).toBeHidden();
  await expect(page.locator('#phoneQaScrollMeasure')).toBeDisabled();
  expect(errors).toEqual([]);
});
