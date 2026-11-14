import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests: the real web app in a real browser, against the real API.
 * They prove the screens show exactly what the API returned (the API itself is checked against
 * JPL Horizons and NASA's maps by the API tests and docs/VALIDATION.md).
 *
 * Run from apps/web: `pnpm build && pnpm test:e2e`. The API needs its data
 * (apps/api/scripts/download_data.py).
 */
const CI = !!process.env.CI;
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: CI ? 1 : 0,
  reporter: CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    // A fixed time zone and locale, so dates on screen can be compared with the API's UTC times.
    timezoneId: 'Asia/Beirut',
    locale: 'en-GB',
    ...devices['Desktop Chrome'],
    viewport: { width: 1280, height: 800 },
    trace: 'retain-on-failure',
    // Locally use the installed Chrome; CI installs Playwright's Chromium.
    channel: CI ? undefined : 'chrome',
    launchOptions: {
      args: [
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
        '--ignore-gpu-blocklist',
      ],
    },
  },
  webServer: [
    {
      command: 'cd ../api && uv run uvicorn app.main:app --port 8000',
      url: `${API_URL}/health`,
      reuseExistingServer: !CI,
      timeout: 120_000,
    },
    {
      command: 'pnpm exec next start -p 3000',
      url: 'http://localhost:3000',
      reuseExistingServer: !CI,
      timeout: 120_000,
      env: { NEXT_PUBLIC_API_URL: API_URL },
    },
  ],
});
