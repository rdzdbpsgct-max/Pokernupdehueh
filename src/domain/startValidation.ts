import type { TranslationKey } from '../i18n';
import { validateConfig, validatePayoutConfig } from './logic';
import type { TournamentConfig } from './types';

type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string;

/**
 * Centralized preflight checks for switching from setup/league into game mode.
 */
export function collectStartErrors(config: TournamentConfig, t: Translate): string[] {
  const errors: string[] = [];

  if (config.players.length < 2) {
    errors.push(t('app.minPlayersRequired'));
  }

  if (config.payout.entries.length > config.players.length) {
    errors.push(
      t('app.morePlacesThanPlayers', {
        places: config.payout.entries.length,
        players: config.players.length,
      }),
    );
  }

  errors.push(...validatePayoutConfig(config.payout, config.players.length));
  errors.push(...validateConfig(config).map((issue) => issue.message));

  return errors;
}
