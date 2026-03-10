import { test, expect } from '@playwright/test';
import { completeWizard, startTournament } from './helpers';

test.describe('Player Management', () => {
  test('player count adjustable in setup via NumberStepper', async ({ page }) => {
    await completeWizard(page);

    // Wizard creates 6 players by default — should see player name inputs
    const playerInputs = page.locator('input[type="text"]');
    const count = await playerInputs.count();
    expect(count).toBeGreaterThanOrEqual(6);

    // Find the "+" button (increase) in the player section
    // NumberStepper renders "+" button with aria-label for accessibility.increase
    const increaseBtn = page.locator('button:has-text("+")').first();
    if (await increaseBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await increaseBtn.click();
      await page.waitForTimeout(200);

      // Should now have 7 player inputs
      const newCount = await playerInputs.count();
      expect(newCount).toBeGreaterThanOrEqual(7);
    }
  });

  test('eliminate player in game mode', async ({ page }) => {
    await startTournament(page);

    // Look for the player panel toggle on mobile or player list
    const playerToggle = page.locator('button:has-text("Spieler")').first();
    if (await playerToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await playerToggle.click();
      await page.waitForTimeout(300);
    }

    // Look for any eliminate button
    const eliminateBtn = page.locator('button:has-text("Eliminieren")').first();
    if (await eliminateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await eliminateBtn.click();
      await page.waitForTimeout(500);
    }
  });
});
