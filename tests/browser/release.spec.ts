import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('a published release exposes only reviewed instructions and escapes its notes', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4332/');
    await page.getByRole('link', { name: 'Get Orifude', exact: true }).click();
    await expect(page).toHaveURL('http://127.0.0.1:4332/install/');
    await expect(page.getByRole('heading', { name: 'Install Orifude.' })).toBeVisible();
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Changelog' }).click();
    await expect(page.getByRole('heading', { name: 'Orifude 1.0.0' })).toBeVisible();
    await expect(page.getByText('A <script>alert(1)</script> stays plain text.')).toBeVisible();
    await expect(page.locator('script')).toHaveCount(0);
    await expect(page.locator('time')).toHaveAttribute('datetime', '2026-09-01');
    await expect(page.getByRole('link', { name: 'Source tag', exact: true })).toHaveAttribute('href', 'https://github.com/nuggocto/orifude/tree/v1.0.0');
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Install', exact: true }).click();
    const posix = page.getByRole('navigation', { name: 'Installation methods' }).getByRole('link', { name: /POSIX installer/ });
    await posix.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText('sh install.sh --bin-dir', { exact: false })).toBeVisible();
    await expect(page.getByText('inspect the file before running it.', { exact: false }).first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole('heading', { name: /Homebrew|Scoop|Arch Linux/ })).toHaveCount(0);
    await page.getByRole('navigation', { name: 'Installation methods' }).getByRole('link', { name: /PowerShell/ }).click();
    await expect(page.getByText("if ($LASTEXITCODE -ne 0)", { exact: false })).toBeVisible();
    await page.locator('summary').filter({ hasText: 'Verify your download' }).click();
    await expect(page.getByText('gh release verify-asset v1.0.0', { exact: false })).toBeVisible();
  } finally { await context.close(); }
});

test('the published release remains readable without styles and passes accessibility checks', async ({ page }) => {
  await page.goto('http://127.0.0.1:4332/install/');
  for (const details of await page.locator('details').all()) {
    await details.locator('summary').click();
  }
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations).toEqual([]);
  await page.route('**/*.css', (route) => route.abort());
  await page.reload();
  await expect(page.getByText('sh install.sh --bin-dir', { exact: false })).toBeVisible();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Changelog' }).click();
  await expect(page.getByRole('heading', { name: 'Orifude 1.0.0' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Added', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'GitHub release', exact: true })).toHaveAttribute('href', 'https://github.com/nuggocto/orifude/releases/tag/v1.0.0');
});
