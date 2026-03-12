import { test, expect } from '@playwright/test';
import { completeWizard } from './helpers';

test.describe('League and Multi-Table happy paths', () => {
  test('league quick start reaches game mode', async ({ page }) => {
    await completeWizard(page);

    const leaguesButton = page.locator('button:has-text("Ligen"), button:has-text("Leagues")').first();
    await expect(leaguesButton).toBeVisible({ timeout: 5000 });
    await leaguesButton.click();

    const createLeagueButton = page.locator('button:has-text("Neue Liga"), button:has-text("New League")').first();
    await expect(createLeagueButton).toBeVisible({ timeout: 5000 });
    await createLeagueButton.click();

    const leagueNameInput = page.locator('input[placeholder="Liga-Name"], input[placeholder="League name"]').first();
    await expect(leagueNameInput).toBeVisible({ timeout: 5000 });
    await leagueNameInput.fill(`E2E League ${Date.now()}`);
    await leagueNameInput.press('Enter');

    const quickStartButton = page.locator('button:has-text("Schnellstart"), button:has-text("Quick Start")').first();
    await expect(quickStartButton).toBeVisible({ timeout: 5000 });
    await quickStartButton.click();

    await expect(page.locator('.font-mono.font-bold.tabular-nums').first()).toBeVisible({ timeout: 8000 });
  });

  test('multi-table setup opens seating overlay on tournament start', async ({ page }) => {
    await completeWizard(page);

    const multiTableSectionToggle = page.locator('button:has-text("Multi-Table")').first();
    await expect(multiTableSectionToggle).toBeVisible({ timeout: 5000 });
    await multiTableSectionToggle.click();

    const multiTableEnableToggle = page.locator('button:has-text("Multi-Table")').nth(1);
    await expect(multiTableEnableToggle).toBeVisible({ timeout: 5000 });
    await multiTableEnableToggle.click();

    const distributePlayersButton = page.locator('button:has-text("Spieler verteilen"), button:has-text("Distribute Players")').first();
    if (await distributePlayersButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await distributePlayersButton.click();
    }

    const startTournamentButton = page.locator('button:has-text("Turnier starten"), button:has-text("Start Tournament")').first();
    await expect(startTournamentButton).toBeEnabled({ timeout: 5000 });
    await startTournamentButton.click();

    const seatingDialog = page.locator('[role="dialog"]').filter({ hasText: /Sitzplatzverteilung|Seating Assignment/ }).first();
    await expect(seatingDialog).toBeVisible({ timeout: 8000 });

    const seatingStartButton = seatingDialog.locator('button:has-text("Turnier starten"), button:has-text("Start Tournament")').first();
    await expect(seatingStartButton).toBeVisible({ timeout: 5000 });
    await seatingStartButton.click();

    await expect(seatingDialog).toBeHidden({ timeout: 5000 });
    await expect(page.locator('.font-mono.font-bold.tabular-nums').first()).toBeVisible({ timeout: 8000 });
  });
});
