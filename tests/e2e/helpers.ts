import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/** Skip the first-time wizard by setting localStorage before page loads. */
export function skipWizard(page: Page) {
  return page.addInitScript(() => {
    localStorage.setItem('poker-timer-wizard-completed', 'true');
  });
}

/**
 * Complete the wizard via UI clicks to reach the setup page with 6 default players.
 * This is the most reliable way to get a valid tournament config.
 */
export async function completeWizard(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('poker-timer-tour-completed', 'true');
  });
  await page.goto('/');

  // Step 1: Welcome — click "Weiter" (Next)
  await expect(page.locator('text=Willkommen!').first()).toBeVisible({ timeout: 10000 });
  await page.locator('button:has-text("Weiter")').first().click();

  // Step 2: Players — leave default (6 players), click next
  await page.waitForTimeout(300);
  await page.locator('button:has-text("Weiter")').first().click();

  // Step 3: Buy-In — leave default, click next
  await page.waitForTimeout(300);
  await page.locator('button:has-text("Weiter")').first().click();

  // Step 4: Blind Speed — leave default, click next
  await page.waitForTimeout(300);
  await page.locator('button:has-text("Weiter")').first().click();

  // Step 5: Review — click "Turnier starten!" (wizard.start)
  await page.waitForTimeout(300);
  await page.locator('button:has-text("Turnier starten!")').first().click();

  // Now we should be on the setup page with 6 players
  await expect(page.locator('button:has-text("Turnier starten")').first()).toBeVisible({ timeout: 10000 });
}

/**
 * Navigate through wizard, then start the tournament to reach game mode.
 */
export async function startTournament(page: Page) {
  await completeWizard(page);

  // Click start tournament — button has "▶ Turnier starten" text
  const startBtn = page.locator('button:has-text("Turnier starten")').first();
  await expect(startBtn).toBeEnabled({ timeout: 5000 });
  await startBtn.click();

  // Wait for game mode — timer display (large font-mono font-bold tabular-nums element)
  await expect(page.locator('.font-mono.font-bold.tabular-nums').first()).toBeVisible({ timeout: 5000 });
}
