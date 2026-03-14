// ---------------------------------------------------------------------------
// Alert Engine — user-defined custom alerts/announcements
// ---------------------------------------------------------------------------

import type { AlertConfig, AlertTrigger, TournamentConfig } from './types';
import { generateId } from './helpers';

/**
 * Creates a new alert with sensible defaults for the given trigger type.
 */
export function createDefaultAlert(trigger: AlertTrigger): AlertConfig {
  return {
    id: generateId(),
    enabled: true,
    trigger,
    text: '',
    voice: true,
    sound: 'beep',
    ...(trigger === 'level_start' ? { levelIndex: 0 } : {}),
    ...(trigger === 'time_remaining' ? { secondsBefore: 60 } : {}),
    ...(trigger === 'player_count' ? { playerCount: 2 } : {}),
  };
}

/**
 * Replace template variables in alert text with actual values.
 * Supported: {level}, {bigBlind}, {smallBlind}, {ante}, {players}
 */
export function interpolateAlertText(
  text: string,
  context: { levelIndex: number; config: TournamentConfig; activePlayers: number },
): string {
  const level = context.config.levels[context.levelIndex];
  const playLevelNum = context.config.levels
    .slice(0, context.levelIndex + 1)
    .filter(l => l.type === 'level').length;

  return text
    .replace(/\{level\}/g, String(playLevelNum))
    .replace(/\{bigBlind\}/g, String(level?.bigBlind ?? 0))
    .replace(/\{smallBlind\}/g, String(level?.smallBlind ?? 0))
    .replace(/\{ante\}/g, String(level?.ante ?? 0))
    .replace(/\{players\}/g, String(context.activePlayers));
}

/**
 * Determine whether an alert should fire given the current trigger and context.
 */
export function shouldFireAlert(
  alert: AlertConfig,
  trigger: AlertTrigger,
  context: {
    levelIndex: number;
    remainingSeconds: number;
    activePlayers: number;
    prevActivePlayers: number;
  },
): boolean {
  if (!alert.enabled) return false;
  if (alert.trigger !== trigger) return false;

  switch (trigger) {
    case 'level_start':
      return context.levelIndex === alert.levelIndex;

    case 'time_remaining':
      return context.remainingSeconds === (alert.secondsBefore ?? 0);

    case 'break_start':
      return true; // fires for every break

    case 'player_count':
      return (
        context.activePlayers === alert.playerCount &&
        context.prevActivePlayers > (alert.playerCount ?? 0)
      );

    default:
      return false;
  }
}
