import { defineConfig, devices } from '@playwright/test';

const clientUrl = process.env.E2E_CLIENT_URL ?? 'http://localhost:3000';
const vendorUrl = process.env.E2E_VENDOR_URL ?? 'http://localhost:3004';
const adminUrl = process.env.E2E_ADMIN_URL ?? 'http://localhost:3020';
const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:3010';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  outputDir: 'test-results',
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npm run dev -- -p 3000',
      url: clientUrl,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npm run start:dev',
      cwd: '../zag-offers-backend',
      url: `${apiUrl}/api`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npm run dev -- -p 3004',
      cwd: '../zag-offers-vendor',
      url: vendorUrl,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npm run dev -- -p 3020',
      cwd: '../zag-offers-admin',
      url: adminUrl,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
