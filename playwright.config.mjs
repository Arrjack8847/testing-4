import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // Cross-engine accessibility is a separate CI matrix, not repeated at
  // every original mobile Chromium viewport.
  testIgnore: ['cross-browser.spec.mjs'],
  timeout: 35_000,
  expect: { timeout: 25_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:8000',
    browserName: 'chromium',
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'small-phone', use: { viewport: { width: 320, height: 568 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } },
    { name: 'android-360', use: { viewport: { width: 360, height: 740 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } },
    { name: 'iphone-390', use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } },
    { name: 'large-phone', use: { viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } }
  ],
  webServer: {
    command: 'python3 tools/dev-server.py',
    port: 8000,
    timeout: 20_000,
    reuseExistingServer: !process.env.CI
  }
});
