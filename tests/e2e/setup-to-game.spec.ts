import { test, expect } from '@playwright/test';
import { completeWizard } from './helpers';

test.describe('Setup to Game', () => {
  test('wizard appears on first visit', async ({ page }) => {
    await page.goto('/');
    // Wizard should be visible — Welcome step
    await expect(page.locator('text=Willkommen!').first()).toBeVisible({ timeout: 10000 });
    // "Weiter" button should be present
    await expect(page.locator('button:has-text("Weiter")').first()).toBeVisible();
  });

  test('setup page loads via wizard and can start tournament', async ({ page }) => {
    await completeWizard(page);

    // Start button should be enabled (6 players from wizard)
    const startBtn = page.locator('button:has-text("Turnier starten")').first();
    await expect(startBtn).toBeEnabled({ timeout: 5000 });
    await startBtn.click();

    // Timer should now be visible (game mode) — use specific selector to avoid matching hidden table cells
    await expect(page.locator('.font-mono.font-bold.tabular-nums').first()).toBeVisible({ timeout: 5000 });
  });
});
