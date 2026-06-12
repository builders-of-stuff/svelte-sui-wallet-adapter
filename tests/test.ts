import { expect, test } from '@playwright/test';

test('index page renders wallet adapter state', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /Svelte Sui Wallet Adapter/i })
  ).toBeVisible();
  await expect(page.getByTestId('connection-status')).toHaveText(/disconnected/);
});

test('network switcher changes the active network', async ({ page }) => {
  await page.goto('/');

  const testnetPill = page.getByRole('button', { name: 'testnet', exact: true });
  await testnetPill.click();

  await expect(testnetPill).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('connection-status')).toHaveText(/disconnected/);
  await expect(page.getByText('Runs against testnet')).toBeVisible();
});

test('connect button opens the wallet selection modal', async ({ page }) => {
  await page.goto('/');

  await page
    .getByTestId('hero-connect')
    .getByRole('button', { name: 'Connect' })
    .click();
  await expect(page.getByText('Connect a wallet')).toBeVisible();

  // No wallet extensions in the test browser, so known wallets show install links
  await expect(page.getByRole('link', { name: /Slush/ })).toBeVisible();

  await page.getByRole('button', { name: 'What is a wallet?' }).click();
  await expect(page.getByRole('link', { name: 'Get started on Sui' })).toBeVisible();

  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByText('Connect a wallet')).toBeVisible();
});
