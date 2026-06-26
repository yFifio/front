import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:8080';
const API_PORT = process.env.E2E_API_PORT ?? '3001';
const API_BASE = process.env.E2E_API_URL ?? `http://127.0.0.1:${API_PORT}/api`;
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

process.env.E2E_API_URL = API_BASE;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: `PORT=${API_PORT} npm run dev`,
      cwd: '../server',
      url: `${API_ORIGIN}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: `VITE_API_PROXY_TARGET=${API_ORIGIN} npm run dev`,
      cwd: '.',
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
