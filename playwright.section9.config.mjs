// Independent Section 9 QA: never attach to an unrelated localhost:8000 server.
// The public/manual preview remains on :8000; this test process owns :8019.
import base from './playwright.config.mjs';
import {defineConfig} from '@playwright/test';

export default defineConfig({
  ...base,
  use:{
    ...base.use,
    baseURL:'http://127.0.0.1:8019'
  },
  webServer:{
    command:'python tools/section9-test-server.py',
    url:'http://127.0.0.1:8019/api/rsvp/status',
    timeout:30000,
    reuseExistingServer:false
  }
});
