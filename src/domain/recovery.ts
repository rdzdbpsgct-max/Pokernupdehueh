import type { League, TournamentConfig } from './types';

export interface RecoverySanitizationResult {
  config: TournamentConfig;
  removedMissingLeagueLink: boolean;
}

/**
 * Remove stale league references from recovered tournament config.
 * This prevents restore flows from keeping a leagueId that no longer exists.
 */
export function sanitizeRecoveredConfig(
  config: TournamentConfig,
  leagues: Pick<League, 'id'>[],
): RecoverySanitizationResult {
  if (!config.leagueId) {
    return { config, removedMissingLeagueLink: false };
  }
  const exists = leagues.some((league) => league.id === config.leagueId);
  if (exists) {
    return { config, removedMissingLeagueLink: false };
  }
  return {
    config: {
      ...config,
      leagueId: undefined,
    },
    removedMissingLeagueLink: true,
  };
}

