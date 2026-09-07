import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('the full reading journey works with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4331/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('A little ink');
    await page.getByRole('link', { name: 'See how it folds' }).click();
    await expect(page).toHaveURL(/#how-it-works$/);
    await expect(page.getByText('Fold the left half to the right.', { exact: false })).toBeVisible();
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Install', exact: true }).click();
    await expect(page).toHaveURL('http://127.0.0.1:4331/install/');
    await expect(page.getByRole('heading', { name: 'Install Orifude.', exact: true })).toBeVisible();
    await expect(page.getByText('yay -S orifude-bin', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Copy / })).toHaveCount(0);
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Changelog' }).click();
    await expect(page).toHaveURL('http://127.0.0.1:4331/changelog/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.getByRole('link', { name: 'Return to Orifude' }).click();
    await expect(page).toHaveURL('http://127.0.0.1:4331/');
    const missing = await page.goto('http://127.0.0.1:4331/no-such-paper/');
    expect(missing?.status()).toBe(404);
    expect(missing?.headers()['content-security-policy']).toMatch(/script-src 'sha256-[A-Za-z0-9+/=]+';/);
    await expect(page.getByRole('heading', { name: /This paper took/ })).toBeVisible();
    await page.getByRole('link', { name: /Return to Orifude/ }).click();
    await expect(page).toHaveURL('http://127.0.0.1:4331/');
  } finally { await context.close(); }
});

test('keyboard readers can skip navigation and follow the main links', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'See how it folds' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#how-it-works$/);
});

test('static pages load under the restrictive policy without external dependencies', async ({ page }) => {
  const external: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:4331') external.push(request.url());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  for (const path of ['/', '/install/', '/changelog/']) {
    const response = await page.goto(path);
    expect(response?.headers()['content-security-policy']).toMatch(/script-src 'sha256-[A-Za-z0-9+/=]+';/);
    expect(response?.headers()['x-content-type-options']).toBe('nosniff');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('iframe, form')).toHaveCount(0);
    await expect(page.locator('script')).toHaveCount(path === '/install/' ? 1 : 0);
    for (const image of await page.locator('img').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((element) => element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0)).toBe(true);
    }
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://orifude.com${path}`);
  }
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('pages reflow at narrow widths and enlarged text', async ({ page }) => {
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/install/', '/changelog/', '/404.html']) {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
  await page.setViewportSize({ width: 640, height: 900 });
  for (const path of ['/', '/install/']) {
    await page.goto(path);
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');
  await page.evaluate(async () => {
    document.documentElement.style.fontSize = '200%';
    await document.fonts.ready;
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('page landmarks, names, and contrast pass automated accessibility checks', async ({ page }) => {
  for (const path of ['/', '/install/', '/changelog/', '/404.html']) {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations).toEqual([]);
  }
});

test('reduced motion and missing CSS leave the content usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  await page.route('**/*.css', (route) => route.abort());
  await page.goto('/changelog/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('link', { name: 'Return to Orifude' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('A little ink');
});
