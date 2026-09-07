import { test, expect } from '@playwright/test';

test('each Copy button puts exactly its visible command on the clipboard', async ({ page, context, browserName }) => {
  // Chromium's automated context requires an explicit clipboard permission.
  if (browserName === 'chromium') await context.grantPermissions(['clipboard-write'], { origin: 'http://127.0.0.1:4331' });
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Install', exact: true }).click();
  await expect(page).toHaveURL(/\/install\/$/);
  await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Install', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.getByRole('navigation', { name: 'Installation methods' }).getByRole('link', { name: /Arch Linux/ }).click();
  await expect(page.getByText('yay -S orifude-bin', { exact: true })).toBeInViewport();
  await page.locator('summary').filter({ hasText: 'Verify your download' }).click();
  // Paste through the browser's native editing action, without replacing the Clipboard API.
  await page.evaluate(() => {
    const target = document.createElement('textarea');
    target.setAttribute('aria-label', 'Clipboard test destination');
    document.body.append(target);
  });
  const destination = page.getByRole('textbox', { name: 'Clipboard test destination' });
  for (const command of await page.locator('[data-command]').all()) {
    const expected = await command.locator('code').textContent();
    const copy = command.getByRole('button', { name: /^Copy / });
    await copy.focus();
    await page.keyboard.press('Enter');
    await expect(command.getByRole('status')).toHaveText('Copied');
    await expect(copy).toBeFocused();
    await destination.fill('');
    await destination.press('ControlOrMeta+V');
    await expect(destination).toHaveValue(expected!);
  }
});

test('clipboard denial leaves the command readable and allows another attempt', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: {
      writeText: async () => { throw new DOMException('Denied by test', 'NotAllowedError'); },
    } });
  });
  await page.goto('/install/');
  const arch = page.getByRole('region', { name: 'Arch Linux · yay' });
  const copy = arch.getByRole('button', { name: /^Copy / });
  for (let attempt = 0; attempt < 2; attempt++) {
    await copy.click();
    await expect(arch.getByRole('status')).toHaveText('Could not copy. Select the command and copy it manually.');
    await expect(copy).toBeEnabled();
    await expect(arch.getByText('yay -S orifude-bin', { exact: true })).toBeVisible();
  }
});

test('browsers without the Clipboard API can still read every installation command', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { value: undefined }); });
  await page.goto('/install/');
  await expect(page.getByRole('button', { name: /^Copy / })).toHaveCount(0);
  await expect(page.getByText('yay -S orifude-bin', { exact: true })).toBeVisible();
  await expect(page.getByText('brew install nuggocto/tap/orifude', { exact: true })).toBeVisible();
});

test('the clipboard exception does not permit unrelated inline or same-origin scripts', async ({ page }) => {
  await page.goto('/install/');
  await page.evaluate(() => {
    const script = document.createElement('script');
    script.textContent = 'document.body.dataset.unapprovedScriptRan = "yes"';
    document.body.append(script);
  });
  expect(await page.locator('body').getAttribute('data-unapproved-script-ran')).toBeNull();
  const blocked = page.waitForEvent('console', { predicate: (message) => message.type() === 'error' && message.text().includes('copy-command.js') });
  await page.evaluate(() => {
    const script = document.createElement('script');
    script.src = '/copy-command.js';
    document.body.append(script);
  });
  await blocked;
});
