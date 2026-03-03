import { describe, it, expect, beforeEach, vi } from 'vitest';
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
  computeDefaultAnte,
  applyDefaultAntes,
  isRebuyActive,
  computeTournamentElapsedSeconds,
  defaultPayoutConfig,
  defaultRebuyConfig,
  defaultAddOnConfig,
  defaultBountyConfig,
  computeTotalRebuys,
  computeTotalAddOns,
  computePrizePool,
  computePayouts,
  computeNextPlacement,
  computeAverageStack,
  defaultChipConfig,
  movePlayer,
  shufflePlayers,
  roundToNice,
  roundToChipMultiple,
  generateBlindStructure,
  estimateDuration,
  estimatePlayedLevels,
  estimateAllDurations,
  checkBlindChipCompatibility,
  computeColorUps,
  formatElapsedTime,
  computeEstimatedRemainingSeconds,
  computeAverageStackInBB,
  isBubble,
  isInTheMoney,
  loadTemplates,
  saveTemplate,
  deleteTemplate,
  exportTemplateToJSON,
  parseTemplateFile,
  computeBlindStructureSummary,
} from '../src/domain/logic';
import type { Level, TournamentConfig, TimerState, PayoutConfig, RebuyConfig, Player } from '../src/domain/types';

// Helper to create a full TournamentConfig for tests
function makeConfig(partial: Partial<TournamentConfig> & { name: string; levels: Level[] }): TournamentConfig {
  return {
    anteEnabled: false,
    players: [],
    dealerIndex: 0,
    payout: defaultPayoutConfig(),
    rebuy: defaultRebuyConfig(),
    addOn: defaultAddOnConfig(),
    bounty: defaultBountyConfig(),
    chips: defaultChipConfig(),
    buyIn: 10,
    startingChips: 20000,
    ...partial,
  };
}

function makePlayer(partial: Partial<Player> & { id: string; name: string }): Player {
  return {
    rebuys: 0,
    addOn: false,
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
      dealerIndex: 0,
      payout: defaultPayoutConfig(),
      rebuy: defaultRebuyConfig(),
      addOn: defaultAddOnConfig(),
      bounty: defaultBountyConfig(),
      chips: defaultChipConfig(),
      buyIn: 10,
      startingChips: 20000,
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
    expect(imported?.anteEnabled).toBe(false);
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
      rebuy: { enabled: true, limitType: 'time', levelLimit: 4, timeLimit: 7200, rebuyCost: 25, rebuyChips: 15000 },
      bounty: { enabled: true, amount: 10 },
      buyIn: 25,
      startingChips: 15000,
    };
    const imported = importConfigJSON(exportConfigJSON(config));
    expect(imported?.anteEnabled).toBe(false);
    expect(imported?.players[0].rebuys).toBe(2);
    expect(imported?.players[0].status).toBe('active');
    expect(imported?.payout.mode).toBe('euro');
    expect(imported?.rebuy.enabled).toBe(true);
    expect(imported?.rebuy.rebuyCost).toBe(25);
    expect(imported?.rebuy.rebuyChips).toBe(15000);
    expect(imported?.bounty.enabled).toBe(true);
    expect(imported?.bounty.amount).toBe(10);
    expect(imported?.buyIn).toBe(25);
    expect(imported?.startingChips).toBe(15000);
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
// computeDefaultAnte
// ---------------------------------------------------------------------------
describe('computeDefaultAnte', () => {
  it('returns 0 for zero or negative big blind', () => {
    expect(computeDefaultAnte(0)).toBe(0);
    expect(computeDefaultAnte(-100)).toBe(0);
  });

  it('computes ~12.5% of big blind, rounded to nice values', () => {
    // 50 * 0.125 = 6.25 → round=6, ≤10 → round(6/5)*5 = 5
    expect(computeDefaultAnte(50)).toBe(5);
    // 100 * 0.125 = 12.5 → round=13, ≤50 → round(13/5)*5 = 15
    expect(computeDefaultAnte(100)).toBe(15);
    // 150 * 0.125 = 18.75 → round=19, ≤50 → round(19/5)*5 = 20
    expect(computeDefaultAnte(150)).toBe(20);
  });

  it('rounds to nice values for medium blinds', () => {
    expect(computeDefaultAnte(200)).toBe(25);   // 200 * 0.125 = 25
    expect(computeDefaultAnte(400)).toBe(50);   // 400 * 0.125 = 50
    expect(computeDefaultAnte(600)).toBe(75);   // 600 * 0.125 = 75
    expect(computeDefaultAnte(800)).toBe(100);  // 800 * 0.125 = 100
  });

  it('rounds to nice values for large blinds', () => {
    // 1000 * 0.125 = 125 → round=125, ≤500 → round(125/50)*50 = 150
    expect(computeDefaultAnte(1000)).toBe(150);
    expect(computeDefaultAnte(2000)).toBe(250);  // 2000 * 0.125 = 250
    expect(computeDefaultAnte(4000)).toBe(500);  // 4000 * 0.125 = 500
  });
});

// ---------------------------------------------------------------------------
// applyDefaultAntes
// ---------------------------------------------------------------------------
describe('applyDefaultAntes', () => {
  it('applies ante values to all play levels', () => {
    const levels: Level[] = [
      { id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50, ante: 0 },
      { id: '2', type: 'level', durationSeconds: 600, smallBlind: 100, bigBlind: 200, ante: 0 },
    ];
    const result = applyDefaultAntes(levels);
    expect(result[0].ante).toBe(5);   // 50 * 0.125 = 6.25 → rounded to 5
    expect(result[1].ante).toBe(25);  // 200 * 0.125 = 25
  });

  it('does not modify break levels', () => {
    const levels: Level[] = [
      { id: '1', type: 'break', durationSeconds: 300, label: 'Pause' },
    ];
    const result = applyDefaultAntes(levels);
    expect(result[0]).toEqual(levels[0]);
  });

  it('returns new array (immutability)', () => {
    const levels: Level[] = [
      { id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50, ante: 0 },
    ];
    const result = applyDefaultAntes(levels);
    expect(result).not.toBe(levels);
    expect(result[0]).not.toBe(levels[0]);
    expect(levels[0].ante).toBe(0);
  });

  it('handles mixed levels and breaks', () => {
    const levels: Level[] = [
      { id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50, ante: 0 },
      { id: '2', type: 'break', durationSeconds: 300, label: 'Pause' },
      { id: '3', type: 'level', durationSeconds: 600, smallBlind: 200, bigBlind: 400, ante: 0 },
    ];
    const result = applyDefaultAntes(levels);
    expect(result[0].ante).toBe(5);   // 50 * 0.125 → rounded to 5
    expect(result[1].type).toBe('break');
    expect(result[1].ante).toBeUndefined();
    expect(result[2].ante).toBe(50);  // 400 * 0.125 = 50
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
    const rebuy: RebuyConfig = { enabled: false, limitType: 'levels', levelLimit: 4, timeLimit: 3600, rebuyCost: 10, rebuyChips: 20000 };
    expect(isRebuyActive(rebuy, 0, levels, 0)).toBe(false);
  });

  it('returns true during level-based rebuy period', () => {
    const rebuy: RebuyConfig = { enabled: true, limitType: 'levels', levelLimit: 2, timeLimit: 3600, rebuyCost: 10, rebuyChips: 20000 };
    expect(isRebuyActive(rebuy, 0, levels, 0)).toBe(true);
    expect(isRebuyActive(rebuy, 1, levels, 0)).toBe(true);
  });

  it('returns false after level-based rebuy period ends', () => {
    const rebuy: RebuyConfig = { enabled: true, limitType: 'levels', levelLimit: 2, timeLimit: 3600, rebuyCost: 10, rebuyChips: 20000 };
    expect(isRebuyActive(rebuy, 3, levels, 0)).toBe(false);
  });

  it('returns true during time-based rebuy period', () => {
    const rebuy: RebuyConfig = { enabled: true, limitType: 'time', levelLimit: 4, timeLimit: 3600, rebuyCost: 10, rebuyChips: 20000 };
    expect(isRebuyActive(rebuy, 0, levels, 1800)).toBe(true);
  });

  it('returns false after time-based rebuy period ends', () => {
    const rebuy: RebuyConfig = { enabled: true, limitType: 'time', levelLimit: 4, timeLimit: 3600, rebuyCost: 10, rebuyChips: 20000 };
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

// ---------------------------------------------------------------------------
// defaultAddOnConfig
// ---------------------------------------------------------------------------
describe('defaultAddOnConfig', () => {
  it('returns disabled add-on with default cost and chips', () => {
    const config = defaultAddOnConfig();
    expect(config.enabled).toBe(false);
    expect(config.cost).toBe(10);
    expect(config.chips).toBe(20000);
  });

  it('uses provided buyIn and startingChips', () => {
    const config = defaultAddOnConfig(20, 50000);
    expect(config.cost).toBe(20);
    expect(config.chips).toBe(50000);
  });
});

// ---------------------------------------------------------------------------
// computeTotalAddOns
// ---------------------------------------------------------------------------
describe('computeTotalAddOns', () => {
  it('returns 0 when no players have add-ons', () => {
    const players = [
      makePlayer({ id: '1', name: 'A' }),
      makePlayer({ id: '2', name: 'B' }),
    ];
    expect(computeTotalAddOns(players)).toBe(0);
  });

  it('counts players with add-ons', () => {
    const players = [
      makePlayer({ id: '1', name: 'A', addOn: true }),
      makePlayer({ id: '2', name: 'B', addOn: false }),
      makePlayer({ id: '3', name: 'C', addOn: true }),
    ];
    expect(computeTotalAddOns(players)).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// computePrizePool with add-ons
// ---------------------------------------------------------------------------
describe('computePrizePool with add-ons', () => {
  it('includes add-on costs in prize pool', () => {
    const players = [
      makePlayer({ id: '1', name: 'A', addOn: true }),
      makePlayer({ id: '2', name: 'B', addOn: true }),
      makePlayer({ id: '3', name: 'C', addOn: false }),
    ];
    // 3 × 10 buy-in + 0 rebuys + 2 × 15 add-on = 30 + 30 = 60
    expect(computePrizePool(players, 10, 10, 15)).toBe(60);
  });

  it('combines rebuys and add-ons', () => {
    const players = [
      makePlayer({ id: '1', name: 'A', rebuys: 2, addOn: true }),
      makePlayer({ id: '2', name: 'B', rebuys: 0, addOn: false }),
    ];
    // 2 × 10 buy-in + 2 × 10 rebuy + 1 × 10 add-on = 20 + 20 + 10 = 50
    expect(computePrizePool(players, 10, 10, 10)).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// computeAverageStack
// ---------------------------------------------------------------------------
describe('computeAverageStack', () => {
  it('computes basic average with no rebuys or add-ons', () => {
    const players = [
      makePlayer({ id: '1', name: 'A' }),
      makePlayer({ id: '2', name: 'B' }),
    ];
    // 2 × 20000 / 2 active = 20000
    expect(computeAverageStack(players, 20000, 20000, 20000)).toBe(20000);
  });

  it('increases average when players are eliminated', () => {
    const players = [
      makePlayer({ id: '1', name: 'A' }),
      makePlayer({ id: '2', name: 'B', status: 'eliminated', placement: 3 }),
      makePlayer({ id: '3', name: 'C' }),
    ];
    // 3 × 20000 / 2 active = 30000
    expect(computeAverageStack(players, 20000, 20000, 20000)).toBe(30000);
  });

  it('includes rebuy chips in total', () => {
    const players = [
      makePlayer({ id: '1', name: 'A', rebuys: 1 }),
      makePlayer({ id: '2', name: 'B' }),
    ];
    // (2 × 20000 + 1 × 20000) / 2 = 30000
    expect(computeAverageStack(players, 20000, 20000, 20000)).toBe(30000);
  });

  it('includes add-on chips in total', () => {
    const players = [
      makePlayer({ id: '1', name: 'A', addOn: true }),
      makePlayer({ id: '2', name: 'B' }),
    ];
    // (2 × 20000 + 1 × 10000) / 2 = 25000
    expect(computeAverageStack(players, 20000, 20000, 10000)).toBe(25000);
  });

  it('combines rebuys, add-ons, and eliminations', () => {
    const players = [
      makePlayer({ id: '1', name: 'A', rebuys: 1, addOn: true }),
      makePlayer({ id: '2', name: 'B', status: 'eliminated', placement: 3, addOn: true }),
      makePlayer({ id: '3', name: 'C' }),
    ];
    // total chips: 3 × 20000 + 1 × 20000 rebuy + 2 × 10000 add-on = 60000 + 20000 + 20000 = 100000
    // active players: 2
    // avg = 50000
    expect(computeAverageStack(players, 20000, 20000, 10000)).toBe(50000);
  });

  it('returns 0 when no active players', () => {
    const players = [
      makePlayer({ id: '1', name: 'A', status: 'eliminated', placement: 2 }),
    ];
    expect(computeAverageStack(players, 20000, 20000, 20000)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// defaultPlayers includes addOn field
// ---------------------------------------------------------------------------
describe('defaultPlayers addOn field', () => {
  it('creates players with addOn set to false', () => {
    const players = defaultPlayers(3);
    players.forEach((p) => {
      expect(p.addOn).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// import/export backward compatibility with addOn
// ---------------------------------------------------------------------------
describe('import/export addOn backward compatibility', () => {
  it('imports old config without addOn field, sets defaults', () => {
    const oldJson = JSON.stringify({
      name: 'Old Tournament',
      levels: [{ id: 'l1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50, ante: 0 }],
      buyIn: 10,
      startingChips: 20000,
      players: [{ id: 'p1', name: 'Alice', rebuys: 0, status: 'active', placement: null, eliminatedBy: null, knockouts: 0 }],
    });
    const imported = importConfigJSON(oldJson);
    expect(imported).not.toBeNull();
    expect(imported!.addOn.enabled).toBe(false);
    expect(imported!.addOn.cost).toBe(10);
    expect(imported!.addOn.chips).toBe(20000);
    expect(imported!.players[0].addOn).toBe(false);
  });

  it('preserves addOn config through export/import round-trip', () => {
    const config = makeConfig({
      name: 'AddOn Test',
      levels: [{ id: 'l1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50, ante: 0 }],
      addOn: { enabled: true, cost: 15, chips: 30000 },
      players: [makePlayer({ id: 'p1', name: 'Alice', addOn: true })],
    });
    const json = exportConfigJSON(config);
    const imported = importConfigJSON(json);
    expect(imported).not.toBeNull();
    expect(imported!.addOn.enabled).toBe(true);
    expect(imported!.addOn.cost).toBe(15);
    expect(imported!.addOn.chips).toBe(30000);
    expect(imported!.players[0].addOn).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// movePlayer
// ---------------------------------------------------------------------------
describe('movePlayer', () => {
  const players = [
    makePlayer({ id: '1', name: 'Alice' }),
    makePlayer({ id: '2', name: 'Bob' }),
    makePlayer({ id: '3', name: 'Carol' }),
  ];

  it('moves player up (swaps with previous)', () => {
    const result = movePlayer(players, 1, -1);
    expect(result[0].name).toBe('Bob');
    expect(result[1].name).toBe('Alice');
    expect(result[2].name).toBe('Carol');
  });

  it('moves player down (swaps with next)', () => {
    const result = movePlayer(players, 0, 1);
    expect(result[0].name).toBe('Bob');
    expect(result[1].name).toBe('Alice');
    expect(result[2].name).toBe('Carol');
  });

  it('returns same array when moving first player up', () => {
    const result = movePlayer(players, 0, -1);
    expect(result).toBe(players);
  });

  it('returns same array when moving last player down', () => {
    const result = movePlayer(players, 2, 1);
    expect(result).toBe(players);
  });

  it('returns new array (immutability) on valid move', () => {
    const result = movePlayer(players, 1, -1);
    expect(result).not.toBe(players);
    expect(players[0].name).toBe('Alice');
  });
});

// ---------------------------------------------------------------------------
// shufflePlayers
// ---------------------------------------------------------------------------
describe('shufflePlayers', () => {
  it('returns array of same length', () => {
    const players = [
      makePlayer({ id: '1', name: 'A' }),
      makePlayer({ id: '2', name: 'B' }),
      makePlayer({ id: '3', name: 'C' }),
    ];
    const { players: shuffled } = shufflePlayers(players);
    expect(shuffled).toHaveLength(3);
  });

  it('contains all original players', () => {
    const players = [
      makePlayer({ id: '1', name: 'A' }),
      makePlayer({ id: '2', name: 'B' }),
      makePlayer({ id: '3', name: 'C' }),
    ];
    const { players: shuffled } = shufflePlayers(players);
    const ids = shuffled.map((p) => p.id).sort();
    expect(ids).toEqual(['1', '2', '3']);
  });

  it('returns new array (immutability)', () => {
    const players = [
      makePlayer({ id: '1', name: 'A' }),
      makePlayer({ id: '2', name: 'B' }),
    ];
    const { players: shuffled } = shufflePlayers(players);
    expect(shuffled).not.toBe(players);
  });

  it('returns dealerIndex within valid range', () => {
    const players = [
      makePlayer({ id: '1', name: 'A' }),
      makePlayer({ id: '2', name: 'B' }),
      makePlayer({ id: '3', name: 'C' }),
    ];
    for (let i = 0; i < 20; i++) {
      const { dealerIndex } = shufflePlayers(players);
      expect(dealerIndex).toBeGreaterThanOrEqual(0);
      expect(dealerIndex).toBeLessThan(players.length);
    }
  });

  it('handles single player', () => {
    const players = [makePlayer({ id: '1', name: 'A' })];
    const { players: shuffled, dealerIndex } = shufflePlayers(players);
    expect(shuffled).toHaveLength(1);
    expect(dealerIndex).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// dealerIndex backward compatibility
// ---------------------------------------------------------------------------
describe('dealerIndex backward compatibility', () => {
  it('fills in default dealerIndex when missing from import', () => {
    const json = JSON.stringify({ name: 'Old', levels: [] });
    const imported = importConfigJSON(json);
    expect(imported?.dealerIndex).toBe(0);
  });

  it('preserves dealerIndex through export/import round-trip', () => {
    const config = makeConfig({
      name: 'Dealer Test',
      levels: [],
      dealerIndex: 3,
    });
    const json = exportConfigJSON(config);
    const imported = importConfigJSON(json);
    expect(imported?.dealerIndex).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// roundToNice
// ---------------------------------------------------------------------------
describe('roundToNice', () => {
  it('returns 0 for zero or negative values', () => {
    expect(roundToNice(0)).toBe(0);
    expect(roundToNice(-5)).toBe(0);
  });

  it('rounds small values (1–10) to nearest integer, min 1', () => {
    expect(roundToNice(1)).toBe(1);
    expect(roundToNice(3)).toBe(3);
    expect(roundToNice(7.4)).toBe(7);
    expect(roundToNice(10)).toBe(10);
    expect(roundToNice(0.3)).toBe(1);
  });

  it('rounds to 5s for values 11–50', () => {
    expect(roundToNice(12)).toBe(10);
    expect(roundToNice(13)).toBe(15);
    expect(roundToNice(27)).toBe(25);
    expect(roundToNice(48)).toBe(50);
  });

  it('rounds to 25s for values 51–200', () => {
    expect(roundToNice(60)).toBe(50);
    expect(roundToNice(75)).toBe(75);
    expect(roundToNice(110)).toBe(100);
    expect(roundToNice(190)).toBe(200);
  });

  it('rounds to 50s for values 201–1000', () => {
    expect(roundToNice(225)).toBe(250);
    expect(roundToNice(500)).toBe(500);
    expect(roundToNice(975)).toBe(1000);
  });

  it('rounds to 100s for values 1001–5000', () => {
    expect(roundToNice(1050)).toBe(1100);
    expect(roundToNice(2500)).toBe(2500);
    expect(roundToNice(4999)).toBe(5000);
  });

  it('rounds to 500s for values above 5000', () => {
    expect(roundToNice(5100)).toBe(5000);
    expect(roundToNice(7500)).toBe(7500);
    expect(roundToNice(12300)).toBe(12500);
  });
});

// ---------------------------------------------------------------------------
// generateBlindStructure
// ---------------------------------------------------------------------------
describe('generateBlindStructure', () => {
  it('generates levels with ascending blinds', () => {
    const levels = generateBlindStructure({ startingChips: 20000, speed: 'normal', anteEnabled: false });
    const playLevels = levels.filter((l) => l.type === 'level');
    for (let i = 1; i < playLevels.length; i++) {
      expect(playLevels[i].bigBlind!).toBeGreaterThan(playLevels[i - 1].bigBlind!);
    }
  });

  it('SB < BB in every play level', () => {
    const levels = generateBlindStructure({ startingChips: 20000, speed: 'fast', anteEnabled: false });
    const playLevels = levels.filter((l) => l.type === 'level');
    for (const level of playLevels) {
      expect(level.smallBlind!).toBeLessThan(level.bigBlind!);
    }
  });

  it('inserts breaks every 4 play levels', () => {
    const levels = generateBlindStructure({ startingChips: 20000, speed: 'normal', anteEnabled: false });
    let playCount = 0;
    for (const level of levels) {
      if (level.type === 'level') playCount++;
      if (level.type === 'break') {
        // Break should appear after every 4th play level
        expect(playCount % 4).toBe(0);
      }
    }
  });

  it('includes ante when enabled', () => {
    const levels = generateBlindStructure({ startingChips: 20000, speed: 'normal', anteEnabled: true });
    const playLevels = levels.filter((l) => l.type === 'level');
    // At least some levels should have ante > 0
    const withAnte = playLevels.filter((l) => (l.ante ?? 0) > 0);
    expect(withAnte.length).toBeGreaterThan(0);
  });

  it('no ante when disabled', () => {
    const levels = generateBlindStructure({ startingChips: 20000, speed: 'normal', anteEnabled: false });
    const playLevels = levels.filter((l) => l.type === 'level');
    playLevels.forEach((l) => {
      expect(l.ante).toBe(0);
    });
  });

  it('has no duplicate BB values', () => {
    const levels = generateBlindStructure({ startingChips: 20000, speed: 'normal', anteEnabled: false });
    const bbs = levels.filter((l) => l.type === 'level').map((l) => l.bigBlind!);
    const unique = [...new Set(bbs)];
    expect(bbs).toEqual(unique);
  });

  it('works with different starting chips (5000)', () => {
    const levels = generateBlindStructure({ startingChips: 5000, speed: 'normal', anteEnabled: false });
    const playLevels = levels.filter((l) => l.type === 'level');
    expect(playLevels.length).toBeGreaterThanOrEqual(5);
    expect(playLevels[0].bigBlind!).toBeGreaterThan(0);
  });

  it('works with large starting chips (50000)', () => {
    const levels = generateBlindStructure({ startingChips: 50000, speed: 'normal', anteEnabled: false });
    const playLevels = levels.filter((l) => l.type === 'level');
    expect(playLevels.length).toBeGreaterThanOrEqual(5);
    expect(playLevels[0].bigBlind!).toBeGreaterThan(0);
  });

  it('uses correct level duration per speed', () => {
    const fast = generateBlindStructure({ startingChips: 20000, speed: 'fast', anteEnabled: false });
    const normal = generateBlindStructure({ startingChips: 20000, speed: 'normal', anteEnabled: false });
    const slow = generateBlindStructure({ startingChips: 20000, speed: 'slow', anteEnabled: false });

    expect(fast.filter((l) => l.type === 'level')[0].durationSeconds).toBe(360);
    expect(normal.filter((l) => l.type === 'level')[0].durationSeconds).toBe(720);
    expect(slow.filter((l) => l.type === 'level')[0].durationSeconds).toBe(1200);
  });

  it('starts at 25/50 for 20k starting chips', () => {
    const levels = generateBlindStructure({ startingChips: 20000, speed: 'normal', anteEnabled: false });
    const first = levels.filter((l) => l.type === 'level')[0];
    expect(first.smallBlind).toBe(25);
    expect(first.bigBlind).toBe(50);
  });

  it('different speeds produce different blind progressions (not just duration)', () => {
    const fast = generateBlindStructure({ startingChips: 20000, speed: 'fast', anteEnabled: false });
    const slow = generateBlindStructure({ startingChips: 20000, speed: 'slow', anteEnabled: false });
    const fastBBs = fast.filter((l) => l.type === 'level').map((l) => l.bigBlind!);
    const slowBBs = slow.filter((l) => l.type === 'level').map((l) => l.bigBlind!);
    // Slow should have more play levels than fast (more intermediate steps)
    expect(slowBBs.length).toBeGreaterThan(fastBBs.length);
    // Both start at 50
    expect(fastBBs[0]).toBe(50);
    expect(slowBBs[0]).toBe(50);
  });

  it('normal speed: level 5 is 200/400 for 20k chips', () => {
    const levels = generateBlindStructure({ startingChips: 20000, speed: 'normal', anteEnabled: false });
    const playLevels = levels.filter((l) => l.type === 'level');
    expect(playLevels[4].smallBlind).toBe(200);
    expect(playLevels[4].bigBlind).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// estimateDuration
// ---------------------------------------------------------------------------
describe('estimateDuration', () => {
  it('sums all level durations', () => {
    const levels: Level[] = [
      { id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50, ante: 0 },
      { id: '2', type: 'break', durationSeconds: 300, label: 'Pause' },
      { id: '3', type: 'level', durationSeconds: 600, smallBlind: 50, bigBlind: 100, ante: 0 },
    ];
    expect(estimateDuration(levels)).toBe(1500);
  });

  it('returns 0 for empty levels', () => {
    expect(estimateDuration([])).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// estimatePlayedLevels
// ---------------------------------------------------------------------------
describe('estimatePlayedLevels', () => {
  it('returns fewer levels with fewer players', () => {
    const allLevels = generateBlindStructure({ startingChips: 20000, speed: 'normal', anteEnabled: false });
    const for4 = estimatePlayedLevels(allLevels, 4, 20000);
    const for8 = estimatePlayedLevels(allLevels, 8, 20000);
    expect(for4.length).toBeLessThanOrEqual(for8.length);
  });

  it('returns all levels when player count < 2', () => {
    const allLevels = generateBlindStructure({ startingChips: 20000, speed: 'normal', anteEnabled: false });
    const result = estimatePlayedLevels(allLevels, 1, 20000);
    expect(result.length).toBe(allLevels.length);
  });

  it('cuts off at appropriate blind level for given player count', () => {
    const allLevels = generateBlindStructure({ startingChips: 20000, speed: 'normal', anteEnabled: false });
    const played = estimatePlayedLevels(allLevels, 6, 20000);
    // Total chips = 120k, endBB ≈ 4800 → should stop around BB 5000-6000
    const lastPlay = [...played].reverse().find((l) => l.type === 'level');
    expect(lastPlay).toBeDefined();
    expect(lastPlay!.bigBlind!).toBeLessThanOrEqual(20000);
  });
});

// ---------------------------------------------------------------------------
// estimateAllDurations
// ---------------------------------------------------------------------------
describe('estimateAllDurations', () => {
  it('returns 3 estimates', () => {
    const estimates = estimateAllDurations(20000, false, 6);
    expect(estimates).toHaveLength(3);
  });

  it('returns estimates in order: fast < normal < slow', () => {
    const estimates = estimateAllDurations(20000, false, 6);
    expect(estimates[0].speed).toBe('fast');
    expect(estimates[1].speed).toBe('normal');
    expect(estimates[2].speed).toBe('slow');
    expect(estimates[0].totalSeconds).toBeLessThan(estimates[1].totalSeconds);
    expect(estimates[1].totalSeconds).toBeLessThan(estimates[2].totalSeconds);
  });

  it('each estimate has non-empty levels', () => {
    const estimates = estimateAllDurations(20000, false, 6);
    estimates.forEach((e) => {
      expect(e.levels.length).toBeGreaterThan(0);
      expect(e.totalSeconds).toBeGreaterThan(0);
    });
  });

  it('more players produce longer estimates', () => {
    const est4 = estimateAllDurations(20000, false, 4);
    const est8 = estimateAllDurations(20000, false, 8);
    // Normal speed: 8 players should take longer than 4
    const normal4 = est4.find((e) => e.speed === 'normal')!;
    const normal8 = est8.find((e) => e.speed === 'normal')!;
    expect(normal8.totalSeconds).toBeGreaterThanOrEqual(normal4.totalSeconds);
  });
});

// ---------------------------------------------------------------------------
// roundToChipMultiple
// ---------------------------------------------------------------------------
describe('roundToChipMultiple', () => {
  it('returns 0 for zero or negative value', () => {
    expect(roundToChipMultiple(0, 25)).toBe(0);
    expect(roundToChipMultiple(-10, 25)).toBe(0);
  });

  it('rounds to nearest multiple of chip denomination', () => {
    expect(roundToChipMultiple(30, 25)).toBe(25);
    expect(roundToChipMultiple(40, 25)).toBe(50);
    expect(roundToChipMultiple(75, 50)).toBe(100);
    expect(roundToChipMultiple(60, 50)).toBe(50);
    expect(roundToChipMultiple(100, 100)).toBe(100);
  });

  it('never returns less than the smallest chip', () => {
    expect(roundToChipMultiple(1, 25)).toBe(25);
    expect(roundToChipMultiple(10, 50)).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// checkBlindChipCompatibility
// ---------------------------------------------------------------------------
describe('checkBlindChipCompatibility', () => {
  const denoms25 = [
    { id: '1', value: 25, color: '#fff', label: 'White' },
    { id: '2', value: 100, color: '#f00', label: 'Red' },
  ];
  const denoms50 = [
    { id: '1', value: 50, color: '#fff', label: 'White' },
    { id: '2', value: 100, color: '#f00', label: 'Red' },
  ];

  it('returns empty when all blinds are multiples of smallest chip', () => {
    const levels: Level[] = [
      { id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50, ante: 0 },
      { id: '2', type: 'level', durationSeconds: 600, smallBlind: 50, bigBlind: 100, ante: 0 },
    ];
    expect(checkBlindChipCompatibility(levels, denoms25)).toEqual([]);
  });

  it('detects incompatible blind values', () => {
    const levels: Level[] = [
      { id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50, ante: 0 },
      { id: '2', type: 'level', durationSeconds: 600, smallBlind: 75, bigBlind: 150, ante: 0 },
    ];
    // With 50 as smallest chip, 25, 75, 150 are not multiples of 50
    const conflicts = checkBlindChipCompatibility(levels, denoms50);
    expect(conflicts).toContain(25);
    expect(conflicts).toContain(75);
  });

  it('returns empty for empty denominations', () => {
    const levels: Level[] = [
      { id: '1', type: 'level', durationSeconds: 600, smallBlind: 33, bigBlind: 77, ante: 0 },
    ];
    expect(checkBlindChipCompatibility(levels, [])).toEqual([]);
  });

  it('ignores breaks', () => {
    const levels: Level[] = [
      { id: '1', type: 'break', durationSeconds: 300, label: 'Pause' },
    ];
    expect(checkBlindChipCompatibility(levels, denoms25)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// generateBlindStructure with smallestChip
// ---------------------------------------------------------------------------
describe('generateBlindStructure with chip constraint', () => {
  it('all blind values are multiples of smallestChip when provided', () => {
    const levels = generateBlindStructure({ startingChips: 20000, speed: 'normal', anteEnabled: false, smallestChip: 25 });
    const playLevels = levels.filter((l) => l.type === 'level');
    for (const level of playLevels) {
      expect(level.smallBlind! % 25).toBe(0);
      expect(level.bigBlind! % 25).toBe(0);
    }
  });

  it('all blind values are multiples of 50 when smallestChip=50', () => {
    const levels = generateBlindStructure({ startingChips: 20000, speed: 'normal', anteEnabled: false, smallestChip: 50 });
    const playLevels = levels.filter((l) => l.type === 'level');
    for (const level of playLevels) {
      expect(level.smallBlind! % 50).toBe(0);
      expect(level.bigBlind! % 50).toBe(0);
    }
  });

  it('ante values are multiples of smallestChip when enabled', () => {
    const levels = generateBlindStructure({ startingChips: 20000, speed: 'normal', anteEnabled: true, smallestChip: 25 });
    const playLevels = levels.filter((l) => l.type === 'level');
    const withAnte = playLevels.filter((l) => (l.ante ?? 0) > 0);
    for (const level of withAnte) {
      expect(level.ante! % 25).toBe(0);
    }
  });

  it('first level starts at 25/50 for 20k with smallestChip=25', () => {
    const levels = generateBlindStructure({ startingChips: 20000, speed: 'normal', anteEnabled: false, smallestChip: 25 });
    const first = levels.filter((l) => l.type === 'level')[0];
    expect(first.smallBlind).toBe(25);
    expect(first.bigBlind).toBe(50);
  });

  it('first level starts at 50/100 for 20k with smallestChip=50', () => {
    const levels = generateBlindStructure({ startingChips: 20000, speed: 'normal', anteEnabled: false, smallestChip: 50 });
    const first = levels.filter((l) => l.type === 'level')[0];
    expect(first.smallBlind).toBe(50);
    expect(first.bigBlind).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// computeColorUps
// ---------------------------------------------------------------------------
describe('computeColorUps', () => {
  // 5-color default: 25, 50, 100, 500, 1000
  const chips5 = [
    { id: '1', value: 25, color: '#fff', label: 'White' },
    { id: '2', value: 50, color: '#f00', label: 'Red' },
    { id: '3', value: 100, color: '#00f', label: 'Blue' },
    { id: '4', value: 500, color: '#0f0', label: 'Green' },
    { id: '5', value: 1000, color: '#000', label: 'Black' },
  ];

  // 6-color: adds 5000
  const chips6 = [
    ...chips5,
    { id: '6', value: 5000, color: '#a0f', label: 'Purple' },
  ];

  it('1000 chip must NOT be removed when blinds include 3000/6000', () => {
    // Structure that includes 3000/6000 blinds
    const levels: Level[] = [
      { id: 'l1', type: 'level', durationSeconds: 720, smallBlind: 25, bigBlind: 50, ante: 0 },
      { id: 'l2', type: 'level', durationSeconds: 720, smallBlind: 50, bigBlind: 100, ante: 0 },
      { id: 'l3', type: 'level', durationSeconds: 720, smallBlind: 100, bigBlind: 200, ante: 0 },
      { id: 'l4', type: 'level', durationSeconds: 720, smallBlind: 200, bigBlind: 400, ante: 0 },
      { id: 'b1', type: 'break', durationSeconds: 600, label: 'Pause' },
      { id: 'l5', type: 'level', durationSeconds: 720, smallBlind: 300, bigBlind: 600, ante: 0 },
      { id: 'l6', type: 'level', durationSeconds: 720, smallBlind: 500, bigBlind: 1000, ante: 0 },
      { id: 'l7', type: 'level', durationSeconds: 720, smallBlind: 1000, bigBlind: 2000, ante: 0 },
      { id: 'l8', type: 'level', durationSeconds: 720, smallBlind: 1500, bigBlind: 3000, ante: 0 },
      { id: 'b2', type: 'break', durationSeconds: 600, label: 'Pause' },
      { id: 'l9', type: 'level', durationSeconds: 720, smallBlind: 3000, bigBlind: 6000, ante: 0 },
    ];
    const colorUps = computeColorUps(levels, chips5);

    // Collect all removed chip IDs across all events
    const removedIds = new Set<string>();
    for (const denoms of colorUps.values()) {
      for (const d of denoms) removedIds.add(d.id);
    }

    // 1000 chip (id '5') must NOT be removed — it's the highest denomination
    expect(removedIds.has('5')).toBe(false);
  });

  it('1000 chip is NOT removed at 3000/6000 with 6-color set', () => {
    const levels: Level[] = [
      { id: 'l1', type: 'level', durationSeconds: 720, smallBlind: 500, bigBlind: 1000, ante: 0 },
      { id: 'l2', type: 'level', durationSeconds: 720, smallBlind: 1000, bigBlind: 2000, ante: 0 },
      { id: 'l3', type: 'level', durationSeconds: 720, smallBlind: 1500, bigBlind: 3000, ante: 0 },
      { id: 'b1', type: 'break', durationSeconds: 600, label: 'Pause' },
      { id: 'l4', type: 'level', durationSeconds: 720, smallBlind: 3000, bigBlind: 6000, ante: 0 },
    ];
    const colorUps = computeColorUps(levels, chips6);

    const removedIds = new Set<string>();
    for (const denoms of colorUps.values()) {
      for (const d of denoms) removedIds.add(d.id);
    }

    // 1000 chip NOT removed: 3000 and 6000 are not multiples of 5000
    expect(removedIds.has('5')).toBe(false);
  });

  it('1000 chip IS removed when only 5000/10000 blinds remain (6-color)', () => {
    const levels: Level[] = [
      { id: 'l1', type: 'level', durationSeconds: 720, smallBlind: 500, bigBlind: 1000, ante: 0 },
      { id: 'l2', type: 'level', durationSeconds: 720, smallBlind: 1000, bigBlind: 2000, ante: 0 },
      { id: 'b1', type: 'break', durationSeconds: 600, label: 'Pause' },
      { id: 'l3', type: 'level', durationSeconds: 720, smallBlind: 5000, bigBlind: 10000, ante: 0 },
      { id: 'l4', type: 'level', durationSeconds: 720, smallBlind: 10000, bigBlind: 20000, ante: 0 },
    ];
    const colorUps = computeColorUps(levels, chips6);

    const removedIds = new Set<string>();
    for (const denoms of colorUps.values()) {
      for (const d of denoms) removedIds.add(d.id);
    }

    // 1000 IS removed once all future values are multiples of 5000
    expect(removedIds.has('5')).toBe(true);
  });

  it('25 chip is removed when all future blinds are multiples of 50', () => {
    const levels: Level[] = [
      { id: 'l1', type: 'level', durationSeconds: 720, smallBlind: 25, bigBlind: 50, ante: 0 },
      { id: 'l2', type: 'level', durationSeconds: 720, smallBlind: 50, bigBlind: 100, ante: 0 },
      { id: 'b1', type: 'break', durationSeconds: 600, label: 'Pause' },
      { id: 'l3', type: 'level', durationSeconds: 720, smallBlind: 100, bigBlind: 200, ante: 0 },
      { id: 'l4', type: 'level', durationSeconds: 720, smallBlind: 200, bigBlind: 400, ante: 0 },
    ];
    const colorUps = computeColorUps(levels, chips5);

    const removedIds = new Set<string>();
    for (const denoms of colorUps.values()) {
      for (const d of denoms) removedIds.add(d.id);
    }

    // 25 chip (id '1') should be removed
    expect(removedIds.has('1')).toBe(true);
  });

  it('highest denomination is never removed', () => {
    const levels: Level[] = [
      { id: 'l1', type: 'level', durationSeconds: 720, smallBlind: 500, bigBlind: 1000, ante: 0 },
      { id: 'l2', type: 'level', durationSeconds: 720, smallBlind: 1000, bigBlind: 2000, ante: 0 },
    ];
    const colorUps = computeColorUps(levels, chips5);

    const removedIds = new Set<string>();
    for (const denoms of colorUps.values()) {
      for (const d of denoms) removedIds.add(d.id);
    }

    // 1000 (highest) must never be removed
    expect(removedIds.has('5')).toBe(false);
  });
});

// ─── formatElapsedTime ────────────────────────────────────────────

describe('formatElapsedTime', () => {
  it('formats zero seconds as 0:00:00', () => {
    expect(formatElapsedTime(0)).toBe('0:00:00');
  });

  it('formats seconds under one hour correctly', () => {
    expect(formatElapsedTime(754)).toBe('0:12:34');
  });

  it('formats seconds over one hour correctly', () => {
    expect(formatElapsedTime(5025)).toBe('1:23:45');
  });

  it('clamps negative values to 0:00:00', () => {
    expect(formatElapsedTime(-100)).toBe('0:00:00');
  });
});

// ─── computeEstimatedRemainingSeconds ─────────────────────────────

describe('computeEstimatedRemainingSeconds', () => {
  const levels: Level[] = [
    { id: '1', type: 'level', durationSeconds: 600, smallBlind: 10, bigBlind: 20, ante: 0 },
    { id: '2', type: 'level', durationSeconds: 600, smallBlind: 20, bigBlind: 40, ante: 0 },
    { id: '3', type: 'level', durationSeconds: 600, smallBlind: 30, bigBlind: 60, ante: 0 },
  ];

  it('sums remaining of current level plus all future levels', () => {
    // On first level with 300s remaining + 600 + 600 = 1500
    expect(computeEstimatedRemainingSeconds(levels, 0, 300)).toBe(1500);
  });

  it('returns only remaining seconds on the last level', () => {
    expect(computeEstimatedRemainingSeconds(levels, 2, 120)).toBe(120);
  });

  it('returns 0 for negative remaining on last level', () => {
    expect(computeEstimatedRemainingSeconds(levels, 2, -10)).toBe(0);
  });
});

// ─── computeAverageStackInBB ──────────────────────────────────────

describe('computeAverageStackInBB', () => {
  it('returns average stack divided by big blind, rounded to 1 decimal', () => {
    expect(computeAverageStackInBB(10000, 300)).toBe(33.3);
  });

  it('returns 0 when big blind is 0', () => {
    expect(computeAverageStackInBB(10000, 0)).toBe(0);
  });

  it('rounds to one decimal place', () => {
    // 10000 / 700 = 14.2857... → 14.3
    expect(computeAverageStackInBB(10000, 700)).toBe(14.3);
  });
});

// ─── isBubble ─────────────────────────────────────────────────────

describe('isBubble', () => {
  it('returns true when active players equals paid places + 1', () => {
    expect(isBubble(4, 3)).toBe(true);
  });

  it('returns false when more players than bubble threshold', () => {
    expect(isBubble(6, 3)).toBe(false);
  });

  it('returns false when already in the money', () => {
    expect(isBubble(3, 3)).toBe(false);
  });

  it('returns false when paid places is 0', () => {
    expect(isBubble(4, 0)).toBe(false);
  });

  it('returns false when only 1 player', () => {
    expect(isBubble(1, 3)).toBe(false);
  });
});

// ─── isInTheMoney ─────────────────────────────────────────────────

describe('isInTheMoney', () => {
  it('returns true when active players equals paid places', () => {
    expect(isInTheMoney(3, 3)).toBe(true);
  });

  it('returns true when active players is fewer than paid places', () => {
    expect(isInTheMoney(2, 3)).toBe(true);
  });

  it('returns false when more active players than paid places', () => {
    expect(isInTheMoney(5, 3)).toBe(false);
  });

  it('returns false when only 1 player', () => {
    expect(isInTheMoney(1, 3)).toBe(false);
  });
});

// ─── Tournament Templates ─────────────────────────────────────────

describe('Tournament Templates', () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};
    const mockStorage = {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => { storage[key] = value; },
      removeItem: (key: string) => { delete storage[key]; },
      clear: () => { storage = {}; },
      get length() { return Object.keys(storage).length; },
      key: (i: number) => Object.keys(storage)[i] ?? null,
    };
    vi.stubGlobal('localStorage', mockStorage);
  });

  it('returns empty array when no templates saved', () => {
    expect(loadTemplates()).toEqual([]);
  });

  it('saves and loads a template', () => {
    const players: Player[] = [
      { id: 'p1', name: 'Spieler 1', rebuys: 0, addOn: false, eliminated: false, eliminatedOrder: null, seat: 1, bountyCount: 0 },
      { id: 'p2', name: 'Spieler 2', rebuys: 0, addOn: false, eliminated: false, eliminatedOrder: null, seat: 2, bountyCount: 0 },
    ];
    const config: TournamentConfig = {
      levels: [{ id: '1', type: 'level', durationSeconds: 600, smallBlind: 10, bigBlind: 20, ante: 0 }],
      startingChips: 10000,
      players,
      payoutConfig: defaultPayoutConfig(),
      rebuyConfig: defaultRebuyConfig(),
      addOnConfig: defaultAddOnConfig(),
      bountyConfig: defaultBountyConfig(),
      chipConfig: defaultChipConfig(),
    };

    const saved = saveTemplate('My Tournament', config);
    expect(saved.name).toBe('My Tournament');
    expect(saved.id).toBeTruthy();
    expect(saved.config.startingChips).toBe(10000);

    const loaded = loadTemplates();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].name).toBe('My Tournament');
  });

  it('deletes a template', () => {
    const players: Player[] = [
      { id: 'p1', name: 'Spieler 1', rebuys: 0, addOn: false, eliminated: false, eliminatedOrder: null, seat: 1, bountyCount: 0 },
    ];
    const config: TournamentConfig = {
      levels: [{ id: '1', type: 'level', durationSeconds: 600, smallBlind: 10, bigBlind: 20, ante: 0 }],
      startingChips: 10000,
      players,
      payoutConfig: defaultPayoutConfig(),
      rebuyConfig: defaultRebuyConfig(),
      addOnConfig: defaultAddOnConfig(),
      bountyConfig: defaultBountyConfig(),
      chipConfig: defaultChipConfig(),
    };

    const saved = saveTemplate('To Delete', config);
    expect(loadTemplates()).toHaveLength(1);

    deleteTemplate(saved.id);
    expect(loadTemplates()).toHaveLength(0);
  });

  it('handles corrupt localStorage data gracefully', () => {
    localStorage.setItem('poker-timer-templates', 'not valid json!!!');
    expect(loadTemplates()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Template File Export/Import
// ---------------------------------------------------------------------------

describe('exportTemplateToJSON', () => {
  it('serializes a template with name and config', () => {
    const config = makeConfig({
      name: 'Test',
      levels: [{ id: '1', type: 'level', durationSeconds: 600, smallBlind: 10, bigBlind: 20, ante: 0 }],
    });
    const json = exportTemplateToJSON('My Template', config);
    const parsed = JSON.parse(json);
    expect(parsed.name).toBe('My Template');
    expect(parsed.createdAt).toBeTruthy();
    expect(parsed.config).toBeDefined();
    expect(parsed.config.levels).toHaveLength(1);
  });
});

describe('parseTemplateFile', () => {
  it('parses template format (name + config wrapper)', () => {
    const config = makeConfig({
      name: 'Test',
      levels: [{ id: '1', type: 'level', durationSeconds: 600, smallBlind: 10, bigBlind: 20, ante: 0 }],
    });
    const json = JSON.stringify({ name: 'Friday Poker', config });
    const result = parseTemplateFile(json);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Friday Poker');
    expect(result!.config.levels).toHaveLength(1);
  });

  it('parses direct config format (name + levels at top level)', () => {
    const json = JSON.stringify({
      name: 'Direct Config',
      levels: [{ id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50, ante: 0 }],
      buyIn: 20,
      startingChips: 10000,
    });
    const result = parseTemplateFile(json);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Direct Config');
    expect(result!.config.buyIn).toBe(20);
  });

  it('parses output of exportTemplateToJSON round-trip', () => {
    const config = makeConfig({
      name: 'Round Trip',
      levels: [
        { id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50, ante: 5 },
        { id: '2', type: 'break', durationSeconds: 300, label: 'Pause' },
      ],
    });
    const json = exportTemplateToJSON('Round Trip', config);
    const result = parseTemplateFile(json);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Round Trip');
    expect(result!.config.levels).toHaveLength(2);
  });

  it('returns null for invalid JSON', () => {
    expect(parseTemplateFile('not json')).toBeNull();
  });

  it('returns null for JSON without levels', () => {
    expect(parseTemplateFile(JSON.stringify({ name: 'No levels' }))).toBeNull();
  });

  it('returns null for empty object', () => {
    expect(parseTemplateFile(JSON.stringify({}))).toBeNull();
  });
});

describe('computeBlindStructureSummary', () => {
  it('counts levels, breaks, and average minutes', () => {
    const levels: Level[] = [
      { id: '1', type: 'level', durationSeconds: 600, smallBlind: 10, bigBlind: 20 },
      { id: '2', type: 'level', durationSeconds: 900, smallBlind: 20, bigBlind: 40 },
      { id: '3', type: 'break', durationSeconds: 300, label: 'Pause' },
      { id: '4', type: 'level', durationSeconds: 600, smallBlind: 30, bigBlind: 60 },
    ];
    const result = computeBlindStructureSummary(levels);
    expect(result.levelCount).toBe(3);
    expect(result.breakCount).toBe(1);
    expect(result.avgMinutes).toBe(12); // (600+900+600)/3/60 = 11.67 → 12
  });

  it('handles no breaks', () => {
    const levels: Level[] = [
      { id: '1', type: 'level', durationSeconds: 900, smallBlind: 10, bigBlind: 20 },
      { id: '2', type: 'level', durationSeconds: 900, smallBlind: 20, bigBlind: 40 },
    ];
    const result = computeBlindStructureSummary(levels);
    expect(result.levelCount).toBe(2);
    expect(result.breakCount).toBe(0);
    expect(result.avgMinutes).toBe(15);
  });

  it('returns zeros for empty levels', () => {
    const result = computeBlindStructureSummary([]);
    expect(result.levelCount).toBe(0);
    expect(result.breakCount).toBe(0);
    expect(result.avgMinutes).toBe(0);
  });
});

describe('speech module', () => {
  // Import speech functions — speechSynthesis is not available in jsdom,
  // so these tests verify graceful degradation (no errors thrown)

  it('announce does not throw without speechSynthesis', async () => {
    const { announce } = await import('../src/domain/speech');
    expect(() => announce('test')).not.toThrow();
  });

  it('cancelSpeech does not throw without speechSynthesis', async () => {
    const { cancelSpeech } = await import('../src/domain/speech');
    expect(() => cancelSpeech()).not.toThrow();
  });

  it('initSpeech does not throw without speechSynthesis', async () => {
    const { initSpeech } = await import('../src/domain/speech');
    expect(() => initSpeech()).not.toThrow();
  });

  it('setSpeechLanguage does not throw', async () => {
    const { setSpeechLanguage } = await import('../src/domain/speech');
    expect(() => setSpeechLanguage('de')).not.toThrow();
    expect(() => setSpeechLanguage('en')).not.toThrow();
  });

  it('announcement builders do not throw without speechSynthesis', async () => {
    const {
      announceLevelChange, announceBreakStart, announceBreakWarning,
      announceCountdown, announceBubble, announceInTheMoney,
      announceElimination, announceWinner, announceAddOn,
      announceRebuyEnded, announceColorUp,
    } = await import('../src/domain/speech');

    const mockT = ((key: string, params?: Record<string, string | number>) => {
      let text = key;
      if (params) for (const [k, v] of Object.entries(params)) text += ` ${k}=${v}`;
      return text;
    }) as Parameters<typeof announceLevelChange>[4];

    expect(() => announceLevelChange(5, 200, 400, 50, mockT)).not.toThrow();
    expect(() => announceLevelChange(3, 100, 200, undefined, mockT)).not.toThrow();
    expect(() => announceBreakStart(10, mockT)).not.toThrow();
    expect(() => announceBreakWarning(mockT)).not.toThrow();
    expect(() => announceCountdown(5)).not.toThrow();
    expect(() => announceBubble(mockT)).not.toThrow();
    expect(() => announceInTheMoney(mockT)).not.toThrow();
    expect(() => announceElimination('Alice', 3, mockT)).not.toThrow();
    expect(() => announceWinner('Bob', mockT)).not.toThrow();
    expect(() => announceAddOn(mockT)).not.toThrow();
    expect(() => announceRebuyEnded(mockT)).not.toThrow();
    expect(() => announceColorUp('500, 1000', mockT)).not.toThrow();
  });
});
