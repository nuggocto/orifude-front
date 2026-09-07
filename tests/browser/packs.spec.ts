import { test, expect } from '@playwright/test';

test('creators can find the submission path and players get exact reviewed downloads without scripts', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4332/#puzzle-packs');
    const section = page.getByRole('region', { name: 'Make a puzzle pack.' });
    await expect(section).toBeInViewport();
    await expect(section.getByRole('link', { name: 'pack pull request', exact: true })).toHaveAttribute('href', /template=puzzle-pack\.md$/);
    await expect(section.getByText('orifude verify PATH', { exact: true })).toBeVisible();
    await expect(section.getByText('orifude solve PATH', { exact: true })).toBeVisible();
    const downloads = section.getByRole('article');
    await expect(downloads.getByRole('heading')).toHaveText('A <script>alert(1)</script> paper 1.0.0');
    await expect(downloads.locator('script')).toHaveCount(0);
    await expect(downloads.getByRole('link', { name: /^Download/ })).toHaveAttribute('href', 'https://github.com/nuggocto/orifude/releases/download/pack-fixture-v1.0.0/fixture-1.0.0.zip');
    await expect(downloads.getByRole('link', { name: 'SHA-256 checksums', exact: true })).toHaveAttribute('href', 'https://github.com/nuggocto/orifude/releases/download/pack-fixture-v1.0.0/SHA256SUMS');
    await expect(section.getByText('orifude pack install FILENAME.zip', { exact: true })).toBeVisible();
  } finally { await context.close(); }
});
