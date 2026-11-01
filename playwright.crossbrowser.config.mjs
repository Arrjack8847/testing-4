import {defineConfig} from '@playwright/test';

// Phase 18 is deliberately separate from the existing Chromium-only,
// pixel-geometry suite. Firefox does not support Playwright's isMobile option.
// All projects use a real 390x844 viewport; engine differences are checked
// behaviorally rather than expecting identical fonts and antialiasing.
export default defineConfig({
  testDir:'./tests',
  testMatch:'cross-browser.spec.mjs',
  timeout:45_000,
  expect:{timeout:15_000},
  retries:process.env.CI?1:0,
  workers:process.env.CI?2:undefined,
  reporter:[['list']],
  use:{
    baseURL:'http://127.0.0.1:8000',
    trace:'retain-on-failure'
  },
  projects:[
    {name:'chromium-a11y',use:{
      browserName:'chromium',viewport:{width:390,height:844},
      deviceScaleFactor:2,isMobile:true,hasTouch:true
    }},
    {name:'firefox-a11y',use:{
      browserName:'firefox',viewport:{width:390,height:844},
      deviceScaleFactor:2
    }},
    {name:'webkit-a11y',use:{
      browserName:'webkit',viewport:{width:390,height:844},
      deviceScaleFactor:2,isMobile:true,hasTouch:true
    }}
  ],
  webServer:{
    command:'python3 -m http.server 8000 --bind 127.0.0.1',
    port:8000,timeout:20_000,
    reuseExistingServer:!process.env.CI
  }
});
