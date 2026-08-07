import { expect, test, type Page } from '@playwright/test';

const clientUrl = process.env.E2E_CLIENT_URL ?? 'http://localhost:3000';
const vendorUrl = process.env.E2E_VENDOR_URL ?? 'http://localhost:3004';
const adminUrl = process.env.E2E_ADMIN_URL ?? 'http://localhost:3020';
const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:3010';

test.beforeAll(async ({}, testInfo) => {
  if (testInfo.project.name === 'mobile-chromium') {
    // Desktop exercises several data-heavy pages first; respect the API's
    // shared 10-second local rate-limit window before the mobile pass.
    await new Promise((resolve) => setTimeout(resolve, 10_500));
  }
});

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

async function expectPageWithoutRuntimeErrors(page: Page, url: string) {
  const errors: string[] = [];
  const failedResponses: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) {
      errors.push(message.text());
    }
  });
  page.on('response', (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });

  const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
  expect(response?.ok(), `Expected ${url} to return a successful response`).toBeTruthy();
  await expect(page.locator('body')).toBeVisible();
  await page.waitForTimeout(500);
  await expectNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
  expect(failedResponses).toEqual([]);
}

test.describe('Backend API', () => {
  test('serves the public catalogue', async ({ request }) => {
    const [stores, offers] = await Promise.all([
      request.get(`${apiUrl}/api/stores`),
      request.get(`${apiUrl}/api/offers`),
    ]);

    expect(stores.ok()).toBeTruthy();
    expect(offers.ok()).toBeTruthy();
  });
});

test.describe('Customer web app', () => {
  test('loads the main public routes without runtime or layout errors', async ({ page }) => {
    for (const route of ['/', '/offers', '/stores', '/login']) {
      await expectPageWithoutRuntimeErrors(page, `${clientUrl}${route}`);
    }
  });

  test('logs in a customer through the real API', async ({ page }) => {
    await page.goto(`${clientUrl}/login`);
    await page.getByLabel('رقم الموبايل').fill('01033333333');
    await page.getByRole('textbox', { name: 'كلمة المرور', exact: true }).fill('password123');
    await page.getByRole('button', { name: 'تسجيل الدخول' }).click();

    await expect(page).toHaveURL(`${clientUrl}/`);
    await expect.poll(() => page.evaluate(() => Boolean(localStorage.getItem('token')))).toBeTruthy();
  });
});

test.describe('Vendor web app', () => {
  test('loads the login page without runtime or layout errors', async ({ page }) => {
    await expectPageWithoutRuntimeErrors(page, `${vendorUrl}/login`);
    await expect(page.getByRole('heading', { name: 'أهلًا بعودتك' })).toBeVisible();
  });

  test('logs in a merchant and opens the dashboard', async ({ page }) => {
    await page.goto(`${vendorUrl}/login`);
    await page.getByLabel('رقم الموبايل').fill('01111111111');
    await page.getByRole('textbox', { name: 'كلمة المرور', exact: true }).fill('password123');
    await page.getByRole('button', { name: 'دخول لوحة التحكم' }).click();

    await expect(page).toHaveURL(`${vendorUrl}/dashboard`);
    await expect(page.locator('a.merchant-primary-button[href="/dashboard/offers/new"]')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});

test.describe('Admin web app', () => {
  test('loads the login page without runtime or layout errors', async ({ page }) => {
    await expectPageWithoutRuntimeErrors(page, `${adminUrl}/login`);
    await expect(page.getByRole('heading', { name: 'مرحبًا بعودتك' })).toBeVisible();
  });

  test('logs in an administrator and opens the dashboard', async ({ page }) => {
    await page.goto(`${adminUrl}/login`);
    await page.getByLabel('رقم الموبايل').fill('01000000000');
    await page.getByRole('textbox', { name: 'كلمة المرور', exact: true }).fill('password123');
    await page.getByRole('button', { name: 'دخول النظام' }).click();

    await expect(page).toHaveURL(`${adminUrl}/dashboard`);
    await expect(page.locator('main')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
