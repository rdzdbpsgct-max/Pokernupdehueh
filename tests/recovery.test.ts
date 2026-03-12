import { defaultConfig } from '../src/domain/logic';
import { sanitizeRecoveredConfig } from '../src/domain/recovery';

describe('recovery sanitization', () => {
  it('keeps league link when league still exists', () => {
    const config = { ...defaultConfig(), leagueId: 'league-1' };
    const result = sanitizeRecoveredConfig(config, [{ id: 'league-1' }]);
    expect(result.removedMissingLeagueLink).toBe(false);
    expect(result.config.leagueId).toBe('league-1');
  });

  it('removes stale league link when league was deleted', () => {
    const config = { ...defaultConfig(), leagueId: 'league-old' };
    const result = sanitizeRecoveredConfig(config, [{ id: 'league-new' }]);
    expect(result.removedMissingLeagueLink).toBe(true);
    expect(result.config.leagueId).toBeUndefined();
  });

  it('is a no-op when no league is linked', () => {
    const config = defaultConfig();
    const result = sanitizeRecoveredConfig(config, [{ id: 'league-1' }]);
    expect(result.removedMissingLeagueLink).toBe(false);
    expect(result.config.leagueId).toBeUndefined();
  });
});

