import { describe, it, expect } from 'vitest';
import {
  formatTime,
  computeRemaining,
  advanceLevel,
  validateConfig,
  previousLevel,
  resetCurrentLevel,
  restartTournament,
  importConfigJSON,
  exportConfigJSON,
  getLevelLabel,
  getBlindsText,
  defaultPlayers,
  validatePayoutConfig,
  stripAnteFromLevels,
  isRebuyActive,
  computeTournamentElapsedSeconds,
  defaultPayoutConfig,
  defaultRebuyConfig,
  defaultBountyConfig,
  computeTotalRebuys,
  computePrizePool,
  computePayouts,
  computeNextPlacement,
} from '../src/domain/logic';
import type { Level, TournamentConfig, TimerState, PayoutConfig, RebuyConfig, Player } from '../src/domain/types';

// Helper to create a full TournamentConfig for tests
function makeConfig(partial: Partial<TournamentConfig> & { name: string; levels: Level[] }): TournamentConfig {
  return {
    anteEnabled: true,
    players: [],
    payout: defaultPayoutConfig(),
    rebuy: defaultRebuyConfig(),
    bounty: defaultBountyConfig(),
    buyIn: 10,
    ...partial,
  };
}

function makePlayer(partial: Partial<Player> & { id: string; name: string }): Player {
  return {
    rebuys: 0,
    status: 'active',
    placement: null,
    eliminatedBy: null,
    knockouts: 0,
    ...partial,
  };
}

// ---------------------------------------------------------------------------
// formatTime
// ---------------------------------------------------------------------------
describe('formatTime', () => {
  it('formats zero', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('formats 61 seconds', () => {
    expect(formatTime(61)).toBe('01:01');
  });

  it('formats 900 seconds (15 min)', () => {
    expect(formatTime(900)).toBe('15:00');
  });

  it('clamps negative to 00:00', () => {
    expect(formatTime(-5)).toBe('00:00');
  });

  it('floors fractional seconds', () => {
    expect(formatTime(59.9)).toBe('00:59');
  });
});

// ---------------------------------------------------------------------------
// computeRemaining
// ---------------------------------------------------------------------------
describe('computeRemaining', () => {
  it('computes correctly for 10s elapsed', () => {
    const startedAt = 1000;
    const remainingAtStart = 60;
    const now = 11000; // 10s later
    expect(computeRemaining(startedAt, remainingAtStart, now)).toBe(50);
  });

  it('never goes below zero', () => {
    const startedAt = 1000;
    const remainingAtStart = 5;
    const now = 100000;
    expect(computeRemaining(startedAt, remainingAtStart, now)).toBe(0);
  });

  it('returns exact remaining when no time has passed', () => {
    expect(computeRemaining(5000, 120, 5000)).toBe(120);
  });
});

// ---------------------------------------------------------------------------
// advanceLevel
// ---------------------------------------------------------------------------
describe('advanceLevel', () => {
  const levels: Level[] = [
    { id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50 },
    { id: '2', type: 'level', durationSeconds: 600, smallBlind: 50, bigBlind: 100 },
    { id: '3', type: 'break', durationSeconds: 300, label: 'Break' },
  ];

  it('advances to the next level', () => {
    const state: TimerState = {
      currentLevelIndex: 0,
      remainingSeconds: 0,
      status: 'running',
      startedAt: null,
      remainingAtStart: null,
    };
    const next = advanceLevel(state, levels);
    expect(next.currentLevelIndex).toBe(1);
    expect(next.remainingSeconds).toBe(600);
    expect(next.status).toBe('stopped');
  });

  it('stops at the end of the tournament', () => {
    const state: TimerState = {
      currentLevelIndex: 2,
      remainingSeconds: 0,
      status: 'running',
      startedAt: null,
      remainingAtStart: null,
    };
    const next = advanceLevel(state, levels);
    expect(next.currentLevelIndex).toBe(2);
    expect(next.status).toBe('stopped');
    expect(next.remainingSeconds).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// previousLevel
// ---------------------------------------------------------------------------
describe('previousLevel', () => {
  const levels: Level[] = [
    { id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50 },
    { id: '2', type: 'level', durationSeconds: 900, smallBlind: 50, bigBlind: 100 },
  ];

  it('goes back one level', () => {
    const state: TimerState = {
      currentLevelIndex: 1,
      remainingSeconds: 100,
      status: 'running',
      startedAt: null,
      remainingAtStart: null,
    };
    const prev = previousLevel(state, levels);
    expect(prev.currentLevelIndex).toBe(0);
    expect(prev.remainingSeconds).toBe(600);
    expect(prev.status).toBe('stopped');
  });

  it('stays at 0 when already first', () => {
    const state: TimerState = {
      currentLevelIndex: 0,
      remainingSeconds: 300,
      status: 'paused',
      startedAt: null,
      remainingAtStart: null,
    };
    const prev = previousLevel(state, levels);
    expect(prev.currentLevelIndex).toBe(0);
    expect(prev.remainingSeconds).toBe(600);
  });
});

// ---------------------------------------------------------------------------
// resetCurrentLevel / restartTournament
// ---------------------------------------------------------------------------
describe('resetCurrentLevel', () => {
  const levels: Level[] = [
    { id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50 },
  ];

  it('resets time to full duration', () => {
    const state: TimerState = {
      currentLevelIndex: 0,
      remainingSeconds: 100,
      status: 'running',
      startedAt: 1000,
      remainingAtStart: 600,
    };
    const reset = resetCurrentLevel(state, levels);
    expect(reset.remainingSeconds).toBe(600);
    expect(reset.status).toBe('stopped');
    expect(reset.startedAt).toBeNull();
  });
});

describe('restartTournament', () => {
  const levels: Level[] = [
    { id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50 },
    { id: '2', type: 'level', durationSeconds: 900, smallBlind: 50, bigBlind: 100 },
  ];

  it('goes back to level 0', () => {
    const fresh = restartTournament(levels);
    expect(fresh.currentLevelIndex).toBe(0);
    expect(fresh.remainingSeconds).toBe(600);
    expect(fresh.status).toBe('stopped');
  });

  it('handles empty levels', () => {
    const fresh = restartTournament([]);
    expect(fresh.remainingSeconds).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// validateConfig
// ---------------------------------------------------------------------------
describe('validateConfig', () => {
  it('returns no errors for valid config', () => {
    const config = makeConfig({
      name: 'Test',
      levels: [
        { id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50 },
        { id: '2', type: 'break', durationSeconds: 300, label: 'Break' },
      ],
    });
    expect(validateConfig(config)).toEqual([]);
  });

  it('catches duration <= 0', () => {
    const config = makeConfig({
      name: 'Test',
      levels: [{ id: '1', type: 'level', durationSeconds: 0, smallBlind: 25, bigBlind: 50 }],
    });
    const errors = validateConfig(config);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain('Dauer');
  });

  it('catches BB <= SB', () => {
    const config = makeConfig({
      name: 'Test',
      levels: [{ id: '1', type: 'level', durationSeconds: 600, smallBlind: 100, bigBlind: 50 }],
    });
    const errors = validateConfig(config);
    expect(errors.some(e => e.message.includes('BB'))).toBe(true);
  });

  it('catches missing SB/BB', () => {
    const config = makeConfig({
      name: 'Test',
      levels: [{ id: '1', type: 'level', durationSeconds: 600 }],
    });
    const errors = validateConfig(config);
    expect(errors.some(e => e.message.includes('SB'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Import / Export
// ---------------------------------------------------------------------------
describe('import/export', () => {
  it('round-trips a config', () => {
    const config: TournamentConfig = {
      name: 'Test',
      levels: [
        { id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50 },
      ],
      anteEnabled: true,
      players: [makePlayer({ id: 'p1', name: 'Alice' })],
      payout: defaultPayoutConfig(),
      rebuy: defaultRebuyConfig(),
      bounty: defaultBountyConfig(),
      buyIn: 10,
    };
    const json = exportConfigJSON(config);
    const imported = importConfigJSON(json);
    expect(imported).toEqual(config);
  });

  it('returns null for invalid JSON', () => {
    expect(importConfigJSON('not json')).toBeNull();
  });

  it('returns null for JSON missing required fields', () => {
    expect(importConfigJSON('{"foo": 1}')).toBeNull();
  });

  it('fills in default anteEnabled when missing', () => {
    const json = JSON.stringify({ name: 'Old', levels: [] });
    const imported = importConfigJSON(json);
    expect(imported?.anteEnabled).toBe(true);
  });

  it('fills in default players when missing', () => {
    const json = JSON.stringify({ name: 'Old', levels: [] });
    const imported = importConfigJSON(json);
    expect(imported?.players).toEqual([]);
  });

  it('fills in default payout when missing', () => {
    const json = JSON.stringify({ name: 'Old', levels: [] });
    const imported = importConfigJSON(json);
    expect(imported?.payout).toEqual(defaultPayoutConfig());
  });

  it('fills in default rebuy when missing', () => {
    const json = JSON.stringify({ name: 'Old', levels: [] });
    const imported = importConfigJSON(json);
    expect(imported?.rebuy).toEqual(defaultRebuyConfig());
  });

  it('preserves new fields when present', () => {
    const config: TournamentConfig = {
      name: 'Full',
      levels: [],
      anteEnabled: false,
      players: [makePlayer({ id: 'x', name: 'Bob', rebuys: 2 })],
      payout: { mode: 'euro', entries: [{ place: 1, value: 100 }] },
      rebuy: { enabled: true, limitType: 'time', levelLimit: 4, timeLimit: 7200 },
      bounty: { enabled: true, amount: 10 },
      buyIn: 25,
    };
    const imported = importConfigJSON(exportConfigJSON(config));
    expect(imported?.anteEnabled).toBe(false);
    expect(imported?.players[0].rebuys).toBe(2);
    expect(imported?.players[0].status).toBe('active');
    expect(imported?.payout.mode).toBe('euro');
    expect(imported?.rebuy.enabled).toBe(true);
    expect(imported?.bounty.enabled).toBe(true);
    expect(imported?.bounty.amount).toBe(10);
    expect(imported?.buyIn).toBe(25);
  });
});

// ---------------------------------------------------------------------------
// Label helpers
// ---------------------------------------------------------------------------
describe('getLevelLabel', () => {
  const levels: Level[] = [
    { id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50 },
    { id: '2', type: 'break', durationSeconds: 300, label: 'Break' },
    { id: '3', type: 'level', durationSeconds: 600, smallBlind: 50, bigBlind: 100 },
  ];

  it('labels play levels correctly', () => {
    expect(getLevelLabel(levels[0], 0, levels)).toBe('Level 1');
    expect(getLevelLabel(levels[2], 2, levels)).toBe('Level 2');
  });

  it('labels breaks', () => {
    expect(getLevelLabel(levels[1], 1, levels)).toBe('Break');
  });
});

describe('getBlindsText', () => {
  it('formats blinds without ante', () => {
    const level: Level = { id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50, ante: 0 };
    expect(getBlindsText(level)).toBe('25 / 50');
  });

  it('formats blinds with ante', () => {
    const level: Level = { id: '1', type: 'level', durationSeconds: 600, smallBlind: 100, bigBlind: 200, ante: 25 };
    expect(getBlindsText(level)).toBe('100 / 200 - Ante 25');
  });

  it('returns empty for break', () => {
    const level: Level = { id: '1', type: 'break', durationSeconds: 300 };
    expect(getBlindsText(level)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// defaultPlayers
// ---------------------------------------------------------------------------
describe('defaultPlayers', () => {
  it('creates correct number of players', () => {
    const players = defaultPlayers(5);
    expect(players).toHaveLength(5);
  });

  it('assigns sequential names', () => {
    const players = defaultPlayers(3);
    expect(players[0].name).toBe('Spieler 1');
    expect(players[1].name).toBe('Spieler 2');
    expect(players[2].name).toBe('Spieler 3');
  });

  it('each player has a unique id', () => {
    const players = defaultPlayers(4);
    const ids = new Set(players.map(p => p.id));
    expect(ids.size).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// validatePayoutConfig
// ---------------------------------------------------------------------------
describe('validatePayoutConfig', () => {
  it('returns no errors for valid percent config summing to 100', () => {
    const payout: PayoutConfig = {
      mode: 'percent',
      entries: [
        { place: 1, value: 50 },
        { place: 2, value: 30 },
        { place: 3, value: 20 },
      ],
    };
    expect(validatePayoutConfig(payout)).toEqual([]);
  });

  it('catches percent not summing to 100', () => {
    const payout: PayoutConfig = {
      mode: 'percent',
      entries: [
        { place: 1, value: 50 },
        { place: 2, value: 30 },
      ],
    };
    const errors = validatePayoutConfig(payout);
    expect(errors.some(e => e.includes('100%'))).toBe(true);
  });

  it('catches empty entries', () => {
    const payout: PayoutConfig = { mode: 'percent', entries: [] };
    const errors = validatePayoutConfig(payout);
    expect(errors.some(e => e.includes('Mindestens'))).toBe(true);
  });

  it('catches negative values', () => {
    const payout: PayoutConfig = {
      mode: 'euro',
      entries: [{ place: 1, value: -10 }],
    };
    const errors = validatePayoutConfig(payout);
    expect(errors.some(e => e.includes('negativ'))).toBe(true);
  });

  it('accepts valid euro config', () => {
    const payout: PayoutConfig = {
      mode: 'euro',
      entries: [
        { place: 1, value: 100 },
        { place: 2, value: 50 },
      ],
    };
    expect(validatePayoutConfig(payout)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// stripAnteFromLevels
// ---------------------------------------------------------------------------
describe('stripAnteFromLevels', () => {
  it('strips ante from all levels, sets to 0', () => {
    const levels: Level[] = [
      { id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50, ante: 10 },
      { id: '2', type: 'level', durationSeconds: 600, smallBlind: 50, bigBlind: 100, ante: 25 },
    ];
    const stripped = stripAnteFromLevels(levels);
    expect(stripped[0].ante).toBe(0);
    expect(stripped[1].ante).toBe(0);
  });

  it('does not modify break levels', () => {
    const levels: Level[] = [
      { id: '1', type: 'break', durationSeconds: 300, label: 'Break' },
    ];
    const stripped = stripAnteFromLevels(levels);
    expect(stripped[0]).toEqual(levels[0]);
  });

  it('returns new array (immutability)', () => {
    const levels: Level[] = [
      { id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50, ante: 10 },
    ];
    const stripped = stripAnteFromLevels(levels);
    expect(stripped).not.toBe(levels);
    expect(stripped[0]).not.toBe(levels[0]);
    expect(levels[0].ante).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// isRebuyActive
// ---------------------------------------------------------------------------
describe('isRebuyActive', () => {
  const levels: Level[] = [
    { id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50 },
    { id: '2', type: 'level', durationSeconds: 600, smallBlind: 50, bigBlind: 100 },
    { id: '3', type: 'break', durationSeconds: 300, label: 'Break' },
    { id: '4', type: 'level', durationSeconds: 600, smallBlind: 100, bigBlind: 200 },
    { id: '5', type: 'level', durationSeconds: 600, smallBlind: 200, bigBlind: 400 },
  ];

  it('returns false when rebuy is disabled', () => {
    const rebuy: RebuyConfig = { enabled: false, limitType: 'levels', levelLimit: 4, timeLimit: 3600 };
    expect(isRebuyActive(rebuy, 0, levels, 0)).toBe(false);
  });

  it('returns true during level-based rebuy period', () => {
    const rebuy: RebuyConfig = { enabled: true, limitType: 'levels', levelLimit: 2, timeLimit: 3600 };
    expect(isRebuyActive(rebuy, 0, levels, 0)).toBe(true);
    expect(isRebuyActive(rebuy, 1, levels, 0)).toBe(true);
  });

  it('returns false after level-based rebuy period ends', () => {
    const rebuy: RebuyConfig = { enabled: true, limitType: 'levels', levelLimit: 2, timeLimit: 3600 };
    expect(isRebuyActive(rebuy, 3, levels, 0)).toBe(false);
  });

  it('returns true during time-based rebuy period', () => {
    const rebuy: RebuyConfig = { enabled: true, limitType: 'time', levelLimit: 4, timeLimit: 3600 };
    expect(isRebuyActive(rebuy, 0, levels, 1800)).toBe(true);
  });

  it('returns false after time-based rebuy period ends', () => {
    const rebuy: RebuyConfig = { enabled: true, limitType: 'time', levelLimit: 4, timeLimit: 3600 };
    expect(isRebuyActive(rebuy, 0, levels, 3600)).toBe(false);
    expect(isRebuyActive(rebuy, 0, levels, 4000)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// computeTournamentElapsedSeconds
// ---------------------------------------------------------------------------
describe('computeTournamentElapsedSeconds', () => {
  const levels: Level[] = [
    { id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50 },
    { id: '2', type: 'level', durationSeconds: 900, smallBlind: 50, bigBlind: 100 },
    { id: '3', type: 'break', durationSeconds: 300, label: 'Break' },
  ];

  it('returns 0 at the start of the tournament', () => {
    expect(computeTournamentElapsedSeconds(levels, 0, 600)).toBe(0);
  });

  it('computes elapsed including previous levels', () => {
    expect(computeTournamentElapsedSeconds(levels, 2, 200)).toBe(1600);
  });

  it('handles mid-level correctly', () => {
    expect(computeTournamentElapsedSeconds(levels, 1, 500)).toBe(1000);
  });
});

// ---------------------------------------------------------------------------
// computeTotalRebuys
// ---------------------------------------------------------------------------
describe('computeTotalRebuys', () => {
  it('sums rebuys across all players', () => {
    const players = [
      makePlayer({ id: '1', name: 'A', rebuys: 2 }),
      makePlayer({ id: '2', name: 'B', rebuys: 1 }),
      makePlayer({ id: '3', name: 'C', rebuys: 0 }),
    ];
    expect(computeTotalRebuys(players)).toBe(3);
  });

  it('returns 0 for empty player list', () => {
    expect(computeTotalRebuys([])).toBe(0);
  });

  it('returns 0 when no player has rebuys', () => {
    const players = [
      makePlayer({ id: '1', name: 'A' }),
      makePlayer({ id: '2', name: 'B' }),
    ];
    expect(computeTotalRebuys(players)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computePrizePool
// ---------------------------------------------------------------------------
describe('computePrizePool', () => {
  it('calculates pool from players and buyIn', () => {
    const players = [
      makePlayer({ id: '1', name: 'A' }),
      makePlayer({ id: '2', name: 'B' }),
      makePlayer({ id: '3', name: 'C' }),
    ];
    expect(computePrizePool(players, 10)).toBe(30);
  });

  it('includes rebuys in pool calculation', () => {
    const players = [
      makePlayer({ id: '1', name: 'A', rebuys: 2 }),
      makePlayer({ id: '2', name: 'B', rebuys: 1 }),
    ];
    // (2 players + 3 rebuys) * 10 = 50
    expect(computePrizePool(players, 10)).toBe(50);
  });

  it('returns 0 for empty player list', () => {
    expect(computePrizePool([], 10)).toBe(0);
  });

  it('returns 0 when buyIn is 0', () => {
    const players = [
      makePlayer({ id: '1', name: 'A', rebuys: 1 }),
    ];
    expect(computePrizePool(players, 0)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computePayouts
// ---------------------------------------------------------------------------
describe('computePayouts', () => {
  it('calculates percent-based payouts', () => {
    const payout: PayoutConfig = {
      mode: 'percent',
      entries: [
        { place: 1, value: 50 },
        { place: 2, value: 30 },
        { place: 3, value: 20 },
      ],
    };
    const result = computePayouts(payout, 100);
    expect(result).toEqual([
      { place: 1, amount: 50 },
      { place: 2, amount: 30 },
      { place: 3, amount: 20 },
    ]);
  });

  it('rounds cent values correctly for percent mode', () => {
    const payout: PayoutConfig = {
      mode: 'percent',
      entries: [
        { place: 1, value: 33.33 },
      ],
    };
    // 33.33% of 100 = 33.33
    const result = computePayouts(payout, 100);
    expect(result[0].amount).toBe(33.33);
  });

  it('returns euro values directly in euro mode', () => {
    const payout: PayoutConfig = {
      mode: 'euro',
      entries: [
        { place: 1, value: 75 },
        { place: 2, value: 25 },
      ],
    };
    const result = computePayouts(payout, 200);
    expect(result).toEqual([
      { place: 1, amount: 75 },
      { place: 2, amount: 25 },
    ]);
  });

  it('handles empty entries', () => {
    const payout: PayoutConfig = { mode: 'percent', entries: [] };
    expect(computePayouts(payout, 100)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Backward compatibility: buyIn default + player rebuys migration
// ---------------------------------------------------------------------------
describe('backward compatibility', () => {
  it('fills in default buyIn when missing from import', () => {
    const json = JSON.stringify({ name: 'Old', levels: [] });
    const imported = importConfigJSON(json);
    expect(imported?.buyIn).toBe(10);
  });

  it('preserves explicit buyIn value from import', () => {
    const json = JSON.stringify({ name: 'Old', levels: [], buyIn: 25 });
    const imported = importConfigJSON(json);
    expect(imported?.buyIn).toBe(25);
  });

  it('migrates players without rebuys field', () => {
    const json = JSON.stringify({
      name: 'Old',
      levels: [],
      players: [{ id: 'p1', name: 'Alice' }],
    });
    const imported = importConfigJSON(json);
    expect(imported?.players[0].rebuys).toBe(0);
  });

  it('preserves existing rebuys values on import', () => {
    const json = JSON.stringify({
      name: 'Old',
      levels: [],
      players: [{ id: 'p1', name: 'Alice', rebuys: 3 }],
    });
    const imported = importConfigJSON(json);
    expect(imported?.players[0].rebuys).toBe(3);
  });

  it('fills in default bounty when missing from import', () => {
    const json = JSON.stringify({ name: 'Old', levels: [] });
    const imported = importConfigJSON(json);
    expect(imported?.bounty).toEqual(defaultBountyConfig());
  });

  it('preserves bounty config on import', () => {
    const json = JSON.stringify({
      name: 'Old',
      levels: [],
      bounty: { enabled: true, amount: 10 },
    });
    const imported = importConfigJSON(json);
    expect(imported?.bounty.enabled).toBe(true);
    expect(imported?.bounty.amount).toBe(10);
  });

  it('migrates players with new elimination fields', () => {
    const json = JSON.stringify({
      name: 'Old',
      levels: [],
      players: [{ id: 'p1', name: 'Alice' }],
    });
    const imported = importConfigJSON(json);
    expect(imported?.players[0].status).toBe('active');
    expect(imported?.players[0].placement).toBeNull();
    expect(imported?.players[0].eliminatedBy).toBeNull();
    expect(imported?.players[0].knockouts).toBe(0);
  });

  it('preserves eliminated player state on import', () => {
    const json = JSON.stringify({
      name: 'Old',
      levels: [],
      players: [{
        id: 'p1', name: 'Alice', rebuys: 0,
        status: 'eliminated', placement: 3, eliminatedBy: 'p2', knockouts: 1,
      }],
    });
    const imported = importConfigJSON(json);
    expect(imported?.players[0].status).toBe('eliminated');
    expect(imported?.players[0].placement).toBe(3);
    expect(imported?.players[0].eliminatedBy).toBe('p2');
    expect(imported?.players[0].knockouts).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// computeNextPlacement
// ---------------------------------------------------------------------------
describe('computeNextPlacement', () => {
  it('returns total active player count as next placement', () => {
    const players = [
      makePlayer({ id: '1', name: 'A' }),
      makePlayer({ id: '2', name: 'B' }),
      makePlayer({ id: '3', name: 'C' }),
    ];
    // 3 active players -> next elimination gets placement 3
    expect(computeNextPlacement(players)).toBe(3);
  });

  it('adjusts after eliminations', () => {
    const players = [
      makePlayer({ id: '1', name: 'A' }),
      makePlayer({ id: '2', name: 'B', status: 'eliminated', placement: 3 }),
      makePlayer({ id: '3', name: 'C' }),
    ];
    // 2 active players -> next elimination gets placement 2
    expect(computeNextPlacement(players)).toBe(2);
  });

  it('returns 1 when one player remains', () => {
    const players = [
      makePlayer({ id: '1', name: 'A' }),
      makePlayer({ id: '2', name: 'B', status: 'eliminated', placement: 3 }),
      makePlayer({ id: '3', name: 'C', status: 'eliminated', placement: 2 }),
    ];
    expect(computeNextPlacement(players)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// defaultBountyConfig
// ---------------------------------------------------------------------------
describe('defaultBountyConfig', () => {
  it('returns disabled bounty with default amount', () => {
    const config = defaultBountyConfig();
    expect(config.enabled).toBe(false);
    expect(config.amount).toBe(5);
  });
});
