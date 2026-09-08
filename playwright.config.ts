import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  timeout: 30_000,
  globalTimeout: 180_000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  workers: 3,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4331',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {} } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    // Keep WebKit on Unix; its native Windows port has clipboard and Tab failures.
    ...(process.platform === 'win32' ? [] : [{ name: 'webkit', use: { browserName: 'webkit' as const } }]),
  ],
  globalSetup: './tests/preview.mjs',
});
