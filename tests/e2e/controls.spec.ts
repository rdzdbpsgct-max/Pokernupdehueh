import { test, expect } from '@playwright/test';
import { startTournament } from './helpers';

test.describe('Game Controls', () => {
  test.beforeEach(async ({ page }) => {
    await startTournament(page);
  });

  test('play/pause via space bar', async ({ page }) => {
    // Timer should start in stopped state — press space to start
    await page.keyboard.press('Space');

    // Should show "Pause" button text (running state)
    await expect(page.locator('button:has-text("Pause")').first()).toBeVisible({ timeout: 3000 });

    // Pause
    await page.keyboard.press('Space');

    // Should show "Start" button text (paused state)
    await expect(page.locator('button:has-text("Start")').first()).toBeVisible({ timeout: 3000 });
  });

  test('next/previous level via keyboard', async ({ page }) => {
    // Use the level label in the timer display — scoped via aria-live container to avoid matching stats headers
    const levelLabel = page.locator('[aria-live="polite"] p.uppercase').first();
    await expect(levelLabel).toBeVisible({ timeout: 3000 });
    await expect(levelLabel).toContainText('Level 1');

    // Press N for next level
    await page.keyboard.press('n');
    await expect(levelLabel).toContainText('Level 2', { timeout: 3000 });

    // Press V for previous level
    await page.keyboard.press('v');
    await expect(levelLabel).toContainText('Level 1', { timeout: 3000 });
  });
});
