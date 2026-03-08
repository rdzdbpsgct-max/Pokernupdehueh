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
  computeRebuyPot,
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
  advanceDealer,
  buildTournamentResult,
  saveTournamentResult,
  loadTournamentHistory,
  deleteTournamentResult,
  clearTournamentHistory,
  formatResultAsText,
  formatResultAsCSV,
  computePlayerStats,
  decodeResultFromQR,
  initializePlayerStacks,
  findChipLeader,
  computeAverageStackFromPlayers,
  addRebuyToStack,
  addAddOnToStack,
  canPlayerRebuy,
  isLateRegistrationOpen,
  loadPlayerDatabase,
  savePlayerDatabase,
  addRegisteredPlayer,
  deleteRegisteredPlayer,
  importPlayersFromHistory,
  syncPlayersToDatabase,
  defaultPointSystem,
  computeLeagueStandings,
  loadLeagues,
  saveLeague,
  deleteLeague,
  formatLeagueAsText,
  drawMysteryBounty,
  parseConfigObject,
  isWizardCompleted,
  markWizardCompleted,
  WIZARD_KEY,
  createTable,
  distributePlayersToTables,
  removePlayerFromTable,
  findPlayerTable,
  getActivePlayersPerTable,
  balanceTables,
  shouldMergeToFinalTable,
  mergeToFinalTable,
  getTablePlayerIds,
  findLowestAvailableSeat,
  findHighestOccupiedSeat,
  findPlayerSeat,
  seatPlayerAtSmallestTable,
  findTableToDissolve,
  dissolveTable,
  advanceTableDealer,
  exportLeagueToJSON,
  parseLeagueFile,
} from '../src/domain/logic';
import type { Level, TournamentConfig, TimerState, PayoutConfig, RebuyConfig, Player, League, TournamentResult, Table } from '../src/domain/types';

// Helper to create a full TournamentConfig for tests
function makeConfig(partial: Partial<TournamentConfig> & { name: string; levels: Level[] }): TournamentConfig {
  return {
    anteEnabled: false,
    anteMode: 'standard' as const,
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
      anteMode: 'standard',
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
// Big Blind Ante
// ---------------------------------------------------------------------------
describe('Big Blind Ante', () => {
  it('computeDefaultAnte returns bigBlind in BBA mode', () => {
    expect(computeDefaultAnte(200, 'bigBlindAnte')).toBe(200);
    expect(computeDefaultAnte(1000, 'bigBlindAnte')).toBe(1000);
    expect(computeDefaultAnte(0, 'bigBlindAnte')).toBe(0);
  });

  it('computeDefaultAnte returns ~12.5% in standard mode', () => {
    expect(computeDefaultAnte(200, 'standard')).toBe(25);
    expect(computeDefaultAnte(200)).toBe(25); // default is standard
  });

  it('applyDefaultAntes uses BBA mode', () => {
    const levels: Level[] = [
      { id: '1', type: 'level', durationSeconds: 600, smallBlind: 100, bigBlind: 200, ante: 0 },
      { id: '2', type: 'break', durationSeconds: 300, label: 'Pause' },
      { id: '3', type: 'level', durationSeconds: 600, smallBlind: 200, bigBlind: 400, ante: 0 },
    ];
    const result = applyDefaultAntes(levels, 'bigBlindAnte');
    expect(result[0].ante).toBe(200);  // equals bigBlind
    expect(result[1].ante).toBeUndefined(); // break unchanged
    expect(result[2].ante).toBe(400);  // equals bigBlind
  });

  it('importConfigJSON defaults anteMode to standard for old configs', () => {
    const oldConfig = { name: 'Old', levels: [{ id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50, ante: 0 }], players: [] };
    const json = JSON.stringify(oldConfig);
    const result = importConfigJSON(json);
    expect(result).not.toBeNull();
    expect(result!.anteMode).toBe('standard');
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
// isLateRegistrationOpen
// ---------------------------------------------------------------------------

describe('isLateRegistrationOpen', () => {
  const levels: Level[] = [
    { id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50 },
    { id: '2', type: 'level', durationSeconds: 600, smallBlind: 50, bigBlind: 100 },
    { id: '3', type: 'break', durationSeconds: 300, label: 'Break' },
    { id: '4', type: 'level', durationSeconds: 600, smallBlind: 100, bigBlind: 200 },
  ];
  const baseConfig = {
    name: '', levels, anteEnabled: false, anteMode: 'standard' as const,
    players: [], dealerIndex: 0, payout: { mode: 'percent' as const, entries: [] },
    rebuy: { enabled: false, limitType: 'levels' as const, levelLimit: 4, timeLimit: 3600, rebuyCost: 10, rebuyChips: 20000 },
    addOn: { enabled: false, cost: 10, chips: 20000 },
    bounty: { enabled: false, amount: 0 },
    chips: { enabled: false, colorUpEnabled: false, denominations: [], colorUpSchedule: [] },
    buyIn: 10, startingChips: 20000,
  };

  it('returns false when late registration is not configured', () => {
    expect(isLateRegistrationOpen(baseConfig, 0, levels)).toBe(false);
  });

  it('returns true during the late registration period', () => {
    const config = { ...baseConfig, lateRegistration: { enabled: true, levelLimit: 2 } };
    expect(isLateRegistrationOpen(config, 0, levels)).toBe(true); // play level 1
    expect(isLateRegistrationOpen(config, 1, levels)).toBe(true); // play level 2
  });

  it('returns false after the late registration period', () => {
    const config = { ...baseConfig, lateRegistration: { enabled: true, levelLimit: 2 } };
    expect(isLateRegistrationOpen(config, 3, levels)).toBe(false); // play level 3
  });
});

// ---------------------------------------------------------------------------
// canPlayerRebuy
// ---------------------------------------------------------------------------

describe('canPlayerRebuy', () => {
  const player: Player = { id: 'p1', name: 'Alice', rebuys: 2, addOn: false, status: 'active', placement: null, eliminatedBy: null, knockouts: 0 };
  const rebuy: RebuyConfig = { enabled: true, limitType: 'levels', levelLimit: 4, timeLimit: 3600, rebuyCost: 10, rebuyChips: 20000 };

  it('returns true when maxRebuysPerPlayer is undefined (unlimited)', () => {
    expect(canPlayerRebuy(player, rebuy)).toBe(true);
  });

  it('returns true when player has fewer rebuys than the cap', () => {
    expect(canPlayerRebuy(player, { ...rebuy, maxRebuysPerPlayer: 3 })).toBe(true);
  });

  it('returns false when player has reached the cap', () => {
    expect(canPlayerRebuy(player, { ...rebuy, maxRebuysPerPlayer: 2 })).toBe(false);
    expect(canPlayerRebuy(player, { ...rebuy, maxRebuysPerPlayer: 1 })).toBe(false);
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
// computePrizePool with separateRebuyPot
// ---------------------------------------------------------------------------
describe('computePrizePool with separateRebuyPot', () => {
  it('excludes rebuys from prize pool when separateRebuyPot is true', () => {
    const players = [
      makePlayer({ id: '1', name: 'A', rebuys: 2 }),
      makePlayer({ id: '2', name: 'B', rebuys: 1 }),
    ];
    // Without separate pot: 2 × 10 + 3 × 10 = 50
    expect(computePrizePool(players, 10, 10, undefined, false)).toBe(50);
    // With separate pot: 2 × 10 = 20 (rebuys excluded)
    expect(computePrizePool(players, 10, 10, undefined, true)).toBe(20);
  });

  it('still includes add-ons when separateRebuyPot is true', () => {
    const players = [
      makePlayer({ id: '1', name: 'A', rebuys: 1, addOn: true }),
      makePlayer({ id: '2', name: 'B', rebuys: 0, addOn: true }),
    ];
    // With separate pot: 2 × 10 buy-in + 0 rebuys + 2 × 15 add-on = 50
    expect(computePrizePool(players, 10, 10, 15, true)).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// computeRebuyPot
// ---------------------------------------------------------------------------
describe('computeRebuyPot', () => {
  it('computes total rebuy pot', () => {
    const players = [
      makePlayer({ id: '1', name: 'A', rebuys: 2 }),
      makePlayer({ id: '2', name: 'B', rebuys: 1 }),
      makePlayer({ id: '3', name: 'C', rebuys: 0 }),
    ];
    expect(computeRebuyPot(players, 10)).toBe(30);
  });

  it('returns 0 when no rebuys', () => {
    const players = [
      makePlayer({ id: '1', name: 'A', rebuys: 0 }),
    ];
    expect(computeRebuyPot(players, 10)).toBe(0);
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
  // Import speech functions — speechSynthesis and Audio are not available in jsdom,
  // so these tests verify graceful degradation (no errors thrown)

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

  it('announceCountdown returns true for both German and English', async () => {
    const { setSpeechLanguage, announceCountdown, cancelSpeech } = await import('../src/domain/speech');
    setSpeechLanguage('de');
    expect(announceCountdown(5)).toBe(true);
    cancelSpeech();
    setSpeechLanguage('en');
    expect(announceCountdown(5)).toBe(true);
    cancelSpeech();
    setSpeechLanguage('de'); // restore
  });

  it('announcement builders do not throw without speechSynthesis or Audio', async () => {
    const {
      setSpeechLanguage,
      announceLevelChange, announceBreakStart, announceBreakWarning,
      announceCountdown, announceBubble, announceInTheMoney,
      announceElimination, announceWinner, announceBounty, announceAddOn,
      announceRebuyEnded, announceColorUp, announceTournamentStart,
      announceHeadsUp, cancelSpeech,
    } = await import('../src/domain/speech');

    setSpeechLanguage('de');

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
    expect(() => announceElimination(mockT)).not.toThrow();
    expect(() => announceWinner(mockT)).not.toThrow();
    expect(() => announceBounty(mockT)).not.toThrow();
    expect(() => announceAddOn(mockT)).not.toThrow();
    expect(() => announceRebuyEnded(mockT)).not.toThrow();
    expect(() => announceColorUp('500, 1000', mockT)).not.toThrow();
    expect(() => announceTournamentStart(mockT)).not.toThrow();
    expect(() => announceHeadsUp(mockT)).not.toThrow();
    cancelSpeech();
  });

  it('convenience functions do not throw when language is English', async () => {
    const {
      setSpeechLanguage, announceBubble, announceInTheMoney,
      announceTournamentStart, announceHeadsUp, cancelSpeech,
    } = await import('../src/domain/speech');

    setSpeechLanguage('en');

    const mockT = ((key: string) => key) as Parameters<typeof announceBubble>[0];

    // English now has MP3 audio files — these should not throw
    expect(() => announceBubble(mockT)).not.toThrow();
    expect(() => announceInTheMoney(mockT)).not.toThrow();
    expect(() => announceTournamentStart(mockT)).not.toThrow();
    expect(() => announceHeadsUp(mockT)).not.toThrow();
    cancelSpeech();
    setSpeechLanguage('de'); // restore
  });
});

describe('advanceDealer', () => {
  const makePlayers = (statuses: ('active' | 'eliminated')[]): Player[] =>
    statuses.map((status, i) => ({
      id: `p${i}`,
      name: `Player ${i + 1}`,
      rebuys: 0,
      addOn: false,
      status,
      placement: status === 'eliminated' ? i + 1 : null,
      eliminatedBy: null,
      knockouts: 0,
    }));

  it('advances to next active player', () => {
    const players = makePlayers(['active', 'active', 'active']);
    expect(advanceDealer(players, 0)).toBe(1);
    expect(advanceDealer(players, 1)).toBe(2);
    expect(advanceDealer(players, 2)).toBe(0);
  });

  it('skips eliminated players', () => {
    const players = makePlayers(['active', 'eliminated', 'active']);
    expect(advanceDealer(players, 0)).toBe(2);
    expect(advanceDealer(players, 2)).toBe(0);
  });

  it('wraps around correctly', () => {
    const players = makePlayers(['eliminated', 'eliminated', 'active', 'active']);
    expect(advanceDealer(players, 3)).toBe(2);
    expect(advanceDealer(players, 2)).toBe(3);
  });

  it('returns currentDealerIndex when all eliminated', () => {
    const players = makePlayers(['eliminated', 'eliminated']);
    expect(advanceDealer(players, 0)).toBe(0);
  });

  it('returns 0 for empty array', () => {
    expect(advanceDealer([], 0)).toBe(0);
  });
});

describe('sound functions return Promises', () => {
  it('playVictorySound returns a Promise', async () => {
    const { playVictorySound } = await import('../src/domain/sounds');
    const result = playVictorySound();
    expect(result).toBeInstanceOf(Promise);
    await result;
  });

  it('playBubbleSound returns a Promise', async () => {
    const { playBubbleSound } = await import('../src/domain/sounds');
    const result = playBubbleSound();
    expect(result).toBeInstanceOf(Promise);
    await result;
  });

  it('playInTheMoneySound returns a Promise', async () => {
    const { playInTheMoneySound } = await import('../src/domain/sounds');
    const result = playInTheMoneySound();
    expect(result).toBeInstanceOf(Promise);
    await result;
  });
});

describe('audioPlayer module', () => {
  it('cancelAudioPlayback does not throw', async () => {
    const { cancelAudioPlayback } = await import('../src/domain/audioPlayer');
    expect(() => cancelAudioPlayback()).not.toThrow();
  });

  it('playAudioSequence rejects without AudioContext', async () => {
    const { playAudioSequence } = await import('../src/domain/audioPlayer');
    // jsdom does not have AudioContext — should reject gracefully
    await expect(playAudioSequence(['test.mp3'])).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Tournament History
// ---------------------------------------------------------------------------
describe('buildTournamentResult', () => {
  const levels: Level[] = [
    { id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50 },
    { id: '2', type: 'break', durationSeconds: 300 },
    { id: '3', type: 'level', durationSeconds: 600, smallBlind: 50, bigBlind: 100 },
  ];

  it('builds a result with correct structure', () => {
    const config = makeConfig({
      name: 'Friday Night',
      levels,
      buyIn: 10,
      players: [
        makePlayer({ id: '1', name: 'Alice', status: 'active', knockouts: 2 }),
        makePlayer({ id: '2', name: 'Bob', status: 'eliminated', placement: 3, eliminatedBy: '1' }),
        makePlayer({ id: '3', name: 'Carol', status: 'eliminated', placement: 2, eliminatedBy: '1' }),
      ],
      payout: { mode: 'percent', entries: [{ place: 1, value: 70 }, { place: 2, value: 30 }] },
    });
    const result = buildTournamentResult(config, 1500, 3);
    expect(result.name).toBe('Friday Night');
    expect(result.playerCount).toBe(3);
    expect(result.prizePool).toBe(30);
    expect(result.levelsPlayed).toBe(3);
    expect(result.elapsedSeconds).toBe(1500);
    expect(result.players).toHaveLength(3);
    // Winner should be first
    expect(result.players[0].name).toBe('Alice');
    expect(result.players[0].place).toBe(1);
    expect(result.players[0].payout).toBe(21); // 70% of 30
    expect(result.players[0].netBalance).toBe(11); // 21 - 10
    // Second place
    expect(result.players[1].name).toBe('Carol');
    expect(result.players[1].place).toBe(2);
    expect(result.players[1].payout).toBe(9); // 30% of 30
    // Third place — no payout
    expect(result.players[2].name).toBe('Bob');
    expect(result.players[2].place).toBe(3);
    expect(result.players[2].payout).toBe(0);
    expect(result.players[2].netBalance).toBe(-10);
  });

  it('accounts for rebuys and add-ons in net balance', () => {
    const config = makeConfig({
      name: 'Rebuy Night',
      levels,
      buyIn: 10,
      rebuy: { enabled: true, limitType: 'levels', levelLimit: 4, timeLimit: 3600, rebuyCost: 10, rebuyChips: 20000 },
      addOn: { enabled: true, cost: 5, chips: 10000 },
      players: [
        makePlayer({ id: '1', name: 'Alice', status: 'active', rebuys: 2, addOn: true }),
        makePlayer({ id: '2', name: 'Bob', status: 'eliminated', placement: 2, rebuys: 1 }),
      ],
      payout: { mode: 'percent', entries: [{ place: 1, value: 100 }] },
    });
    const result = buildTournamentResult(config, 900, 2);
    // Prizepool: 2*10 + 3*10 + 1*5 = 55
    expect(result.prizePool).toBe(55);
    expect(result.totalRebuys).toBe(3);
    expect(result.totalAddOns).toBe(1);
    // Alice: payout=55, cost=10+20+5=35, net=20
    expect(result.players[0].netBalance).toBe(20);
    // Bob: payout=0, cost=10+10=20, net=-20
    expect(result.players[1].netBalance).toBe(-20);
  });
});

describe('Tournament History persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('save and load round-trip', () => {
    const levels: Level[] = [{ id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50 }];
    const config = makeConfig({
      name: 'Test',
      levels,
      buyIn: 10,
      players: [
        makePlayer({ id: '1', name: 'A', status: 'active' }),
        makePlayer({ id: '2', name: 'B', status: 'eliminated', placement: 2 }),
      ],
      payout: { mode: 'percent', entries: [{ place: 1, value: 100 }] },
    });
    const result = buildTournamentResult(config, 600, 1);
    saveTournamentResult(result);
    const history = loadTournamentHistory();
    expect(history).toHaveLength(1);
    expect(history[0].name).toBe('Test');
    expect(history[0].id).toBe(result.id);
  });

  it('delete removes a specific entry', () => {
    const levels: Level[] = [{ id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50 }];
    const config = makeConfig({
      name: 'T1',
      levels,
      buyIn: 5,
      players: [
        makePlayer({ id: '1', name: 'A', status: 'active' }),
        makePlayer({ id: '2', name: 'B', status: 'eliminated', placement: 2 }),
      ],
      payout: { mode: 'percent', entries: [{ place: 1, value: 100 }] },
    });
    const r1 = buildTournamentResult(config, 600, 1);
    saveTournamentResult(r1);
    const r2 = buildTournamentResult({ ...config, name: 'T2' }, 800, 2);
    saveTournamentResult(r2);
    expect(loadTournamentHistory()).toHaveLength(2);
    deleteTournamentResult(r1.id);
    const remaining = loadTournamentHistory();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].name).toBe('T2');
  });

  it('caps history at 50 entries', () => {
    const levels: Level[] = [{ id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50 }];
    const config = makeConfig({
      name: 'Cap',
      levels,
      buyIn: 5,
      players: [
        makePlayer({ id: '1', name: 'A', status: 'active' }),
        makePlayer({ id: '2', name: 'B', status: 'eliminated', placement: 2 }),
      ],
      payout: { mode: 'percent', entries: [{ place: 1, value: 100 }] },
    });
    for (let i = 0; i < 55; i++) {
      saveTournamentResult(buildTournamentResult({ ...config, name: `T${i}` }, 600, 1));
    }
    const history = loadTournamentHistory();
    expect(history).toHaveLength(50);
    // Most recent should be first
    expect(history[0].name).toBe('T54');
  });

  it('clearTournamentHistory removes all', () => {
    const levels: Level[] = [{ id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50 }];
    const config = makeConfig({
      name: 'X',
      levels,
      buyIn: 5,
      players: [
        makePlayer({ id: '1', name: 'A', status: 'active' }),
        makePlayer({ id: '2', name: 'B', status: 'eliminated', placement: 2 }),
      ],
      payout: { mode: 'percent', entries: [{ place: 1, value: 100 }] },
    });
    saveTournamentResult(buildTournamentResult(config, 600, 1));
    expect(loadTournamentHistory()).toHaveLength(1);
    clearTournamentHistory();
    expect(loadTournamentHistory()).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Text & CSV Export
// ---------------------------------------------------------------------------
describe('formatResultAsText', () => {
  it('produces WhatsApp-friendly text', () => {
    const result = {
      id: 'test-id',
      name: 'Friday Night',
      date: '2026-01-15T20:00:00.000Z',
      playerCount: 3,
      buyIn: 10,
      prizePool: 30,
      players: [
        { name: 'Alice', place: 1, payout: 21, rebuys: 0, addOn: false, knockouts: 2, bountyEarned: 0, netBalance: 11 },
        { name: 'Carol', place: 2, payout: 9, rebuys: 0, addOn: false, knockouts: 0, bountyEarned: 0, netBalance: -1 },
        { name: 'Bob', place: 3, payout: 0, rebuys: 0, addOn: false, knockouts: 0, bountyEarned: 0, netBalance: -10 },
      ],
      bountyEnabled: false, bountyAmount: 0,
      rebuyEnabled: false, totalRebuys: 0,
      addOnEnabled: false, totalAddOns: 0,
      elapsedSeconds: 1500, levelsPlayed: 3,
    };
    const text = formatResultAsText(result);
    expect(text).toContain('♠♥ Friday Night ♦♣');
    expect(text).toContain('🏆 Alice → 21.00 €');
    expect(text).toContain('🥈 Carol → 9.00 €');
    expect(text).toContain('🥉 Bob');
    expect(text).toContain('Prizepool: 30.00 €');
  });

  it('uses English labels when locale is en-US', () => {
    const result = {
      id: 'test-id',
      name: 'Friday Night',
      date: '2026-01-15T20:00:00.000Z',
      playerCount: 3,
      buyIn: 10,
      prizePool: 30,
      players: [
        { name: 'Alice', place: 1, payout: 21, rebuys: 0, addOn: false, knockouts: 2, bountyEarned: 0, netBalance: 11 },
        { name: 'Bob', place: 2, payout: 9, rebuys: 0, addOn: false, knockouts: 0, bountyEarned: 0, netBalance: -1 },
      ],
      bountyEnabled: false, bountyAmount: 0,
      rebuyEnabled: false, totalRebuys: 0,
      addOnEnabled: false, totalAddOns: 0,
      elapsedSeconds: 1500, levelsPlayed: 3,
    };
    const text = formatResultAsText(result, 'en-US');
    expect(text).toContain('Players');
    expect(text).not.toContain('Spieler');
  });
});

describe('formatResultAsCSV', () => {
  it('produces valid CSV', () => {
    const result = {
      id: 'test-id',
      name: 'Test',
      date: '2026-01-15T20:00:00.000Z',
      playerCount: 2,
      buyIn: 10,
      prizePool: 20,
      players: [
        { name: 'Alice', place: 1, payout: 20, rebuys: 0, addOn: false, knockouts: 1, bountyEarned: 0, netBalance: 10 },
        { name: 'Bob', place: 2, payout: 0, rebuys: 1, addOn: true, knockouts: 0, bountyEarned: 0, netBalance: -10 },
      ],
      bountyEnabled: false, bountyAmount: 0,
      rebuyEnabled: true, totalRebuys: 1,
      addOnEnabled: true, totalAddOns: 1,
      elapsedSeconds: 900, levelsPlayed: 2,
    };
    const csv = formatResultAsCSV(result);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Place,Name,Payout,Rebuys,AddOn,Knockouts,NetBalance');
    expect(lines[1]).toContain('"Alice"');
    expect(lines[2]).toContain('"Bob"');
    expect(lines).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// Player Statistics
// ---------------------------------------------------------------------------
describe('computePlayerStats', () => {
  it('aggregates across multiple tournaments', () => {
    const history = [
      {
        id: '1', name: 'T1', date: '2026-01-01', playerCount: 3, buyIn: 10, prizePool: 30,
        players: [
          { name: 'Alice', place: 1, payout: 21, rebuys: 0, addOn: false, knockouts: 2, bountyEarned: 0, netBalance: 11 },
          { name: 'Bob', place: 2, payout: 9, rebuys: 0, addOn: false, knockouts: 0, bountyEarned: 0, netBalance: -1 },
          { name: 'Carol', place: 3, payout: 0, rebuys: 0, addOn: false, knockouts: 0, bountyEarned: 0, netBalance: -10 },
        ],
        bountyEnabled: false, bountyAmount: 0, rebuyEnabled: false, totalRebuys: 0,
        addOnEnabled: false, totalAddOns: 0, elapsedSeconds: 1500, levelsPlayed: 3,
      },
      {
        id: '2', name: 'T2', date: '2026-01-08', playerCount: 3, buyIn: 10, prizePool: 30,
        players: [
          { name: 'Bob', place: 1, payout: 21, rebuys: 0, addOn: false, knockouts: 1, bountyEarned: 0, netBalance: 11 },
          { name: 'Alice', place: 2, payout: 9, rebuys: 0, addOn: false, knockouts: 1, bountyEarned: 0, netBalance: -1 },
          { name: 'Carol', place: 3, payout: 0, rebuys: 0, addOn: false, knockouts: 0, bountyEarned: 0, netBalance: -10 },
        ],
        bountyEnabled: false, bountyAmount: 0, rebuyEnabled: false, totalRebuys: 0,
        addOnEnabled: false, totalAddOns: 0, elapsedSeconds: 1200, levelsPlayed: 2,
      },
    ];
    const stats = computePlayerStats(history);
    expect(stats).toHaveLength(3);
    // Alice: net 11 + -1 = 10, should be first
    const alice = stats.find((s) => s.name === 'Alice')!;
    expect(alice.tournaments).toBe(2);
    expect(alice.wins).toBe(1);
    expect(alice.cashes).toBe(2);
    expect(alice.netBalance).toBe(10);
    expect(alice.avgPlace).toBe(1.5);
    expect(alice.bestPlace).toBe(1);
    expect(alice.knockouts).toBe(3);
    // Bob: net -1 + 11 = 10
    const bob = stats.find((s) => s.name === 'Bob')!;
    expect(bob.wins).toBe(1);
    expect(bob.netBalance).toBe(10);
    // Carol: always 3rd
    const carol = stats.find((s) => s.name === 'Carol')!;
    expect(carol.tournaments).toBe(2);
    expect(carol.wins).toBe(0);
    expect(carol.cashes).toBe(0);
    expect(carol.netBalance).toBe(-20);
    expect(carol.avgPlace).toBe(3);
  });

  it('normalizes player names (case-insensitive)', () => {
    const history = [
      {
        id: '1', name: 'T1', date: '2026-01-01', playerCount: 2, buyIn: 10, prizePool: 20,
        players: [
          { name: 'Alice', place: 1, payout: 20, rebuys: 0, addOn: false, knockouts: 0, bountyEarned: 0, netBalance: 10 },
          { name: 'bob', place: 2, payout: 0, rebuys: 0, addOn: false, knockouts: 0, bountyEarned: 0, netBalance: -10 },
        ],
        bountyEnabled: false, bountyAmount: 0, rebuyEnabled: false, totalRebuys: 0,
        addOnEnabled: false, totalAddOns: 0, elapsedSeconds: 600, levelsPlayed: 1,
      },
      {
        id: '2', name: 'T2', date: '2026-01-08', playerCount: 2, buyIn: 10, prizePool: 20,
        players: [
          { name: 'Bob', place: 1, payout: 20, rebuys: 0, addOn: false, knockouts: 0, bountyEarned: 0, netBalance: 10 },
          { name: 'ALICE', place: 2, payout: 0, rebuys: 0, addOn: false, knockouts: 0, bountyEarned: 0, netBalance: -10 },
        ],
        bountyEnabled: false, bountyAmount: 0, rebuyEnabled: false, totalRebuys: 0,
        addOnEnabled: false, totalAddOns: 0, elapsedSeconds: 600, levelsPlayed: 1,
      },
    ];
    const stats = computePlayerStats(history);
    // Should be 2 players, not 4
    expect(stats).toHaveLength(2);
  });

  it('returns empty array for empty history', () => {
    expect(computePlayerStats([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// QR Code Decoding
// ---------------------------------------------------------------------------
describe('QR code decoding', () => {
  it('decodeResultFromQR decodes a valid encoded string', () => {
    const encoded = 'Freitagspoker|2025-06-01|4|10|50|5|1|1|120|12|Alice:1:30:0:0:1;Bob:2:15:1:1:0;Charlie:3:5:0:0:0;Diana:4:0:0:0:0';
    const decoded = decodeResultFromQR(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.name).toBe('Freitagspoker');
    expect(decoded!.playerCount).toBe(4);
    expect(decoded!.buyIn).toBe(10);
    expect(decoded!.prizePool).toBe(50);
    expect(decoded!.bountyAmount).toBe(5);
    expect(decoded!.players).toHaveLength(4);
    expect(decoded!.players[0].name).toBe('Alice');
    expect(decoded!.players[0].place).toBe(1);
    expect(decoded!.players[0].payout).toBe(30);
    expect(decoded!.players[1].rebuys).toBe(1);
    expect(decoded!.players[1].addOn).toBe(true);
    expect(decoded!.levelsPlayed).toBe(12);
    expect(decoded!.elapsedSeconds).toBe(7200);
  });

  it('decodeResultFromQR returns null for invalid input', () => {
    expect(decodeResultFromQR('')).toBeNull();
    expect(decodeResultFromQR('not|enough|fields')).toBeNull();
  });

  it('decodeResultFromQR returns null for non-string', () => {
    expect(decodeResultFromQR(null as unknown as string)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Per-player stack tracking
// ---------------------------------------------------------------------------

describe('initializePlayerStacks', () => {
  it('sets starting chips for active players', () => {
    const players = [
      makePlayer({ id: '1', name: 'A' }),
      makePlayer({ id: '2', name: 'B' }),
    ];
    const result = initializePlayerStacks(players, 20000, 0, 0);
    expect(result[0].chips).toBe(20000);
    expect(result[1].chips).toBe(20000);
  });

  it('accounts for rebuys and add-ons', () => {
    const players = [
      makePlayer({ id: '1', name: 'A', rebuys: 2, addOn: true }),
    ];
    const result = initializePlayerStacks(players, 20000, 20000, 15000);
    expect(result[0].chips).toBe(20000 + 2 * 20000 + 15000);
  });

  it('sets 0 for eliminated players', () => {
    const players = [
      makePlayer({ id: '1', name: 'A', status: 'eliminated' }),
    ];
    const result = initializePlayerStacks(players, 20000, 0, 0);
    expect(result[0].chips).toBe(0);
  });
});

describe('findChipLeader', () => {
  it('returns player with most chips', () => {
    const players = [
      makePlayer({ id: '1', name: 'A', chips: 30000 }),
      makePlayer({ id: '2', name: 'B', chips: 50000 }),
      makePlayer({ id: '3', name: 'C', chips: 20000 }),
    ];
    expect(findChipLeader(players)).toBe('2');
  });

  it('returns null when no stacks tracked', () => {
    const players = [
      makePlayer({ id: '1', name: 'A' }),
      makePlayer({ id: '2', name: 'B' }),
    ];
    expect(findChipLeader(players)).toBeNull();
  });

  it('ignores eliminated players', () => {
    const players = [
      makePlayer({ id: '1', name: 'A', chips: 10000 }),
      makePlayer({ id: '2', name: 'B', chips: 50000, status: 'eliminated' }),
    ];
    expect(findChipLeader(players)).toBe('1');
  });
});

describe('computeAverageStackFromPlayers', () => {
  it('computes average from tracked stacks', () => {
    const players = [
      makePlayer({ id: '1', name: 'A', chips: 30000 }),
      makePlayer({ id: '2', name: 'B', chips: 50000 }),
      makePlayer({ id: '3', name: 'C', chips: 20000 }),
    ];
    expect(computeAverageStackFromPlayers(players)).toBe(Math.round(100000 / 3));
  });

  it('returns null when no stacks tracked', () => {
    const players = [
      makePlayer({ id: '1', name: 'A' }),
    ];
    expect(computeAverageStackFromPlayers(players)).toBeNull();
  });
});

describe('addRebuyToStack', () => {
  it('adds rebuy chips to existing stack', () => {
    const player = makePlayer({ id: '1', name: 'A', chips: 15000 });
    const result = addRebuyToStack(player, 20000);
    expect(result.chips).toBe(35000);
  });

  it('returns unchanged player when chips undefined', () => {
    const player = makePlayer({ id: '1', name: 'A' });
    const result = addRebuyToStack(player, 20000);
    expect(result.chips).toBeUndefined();
  });
});

describe('addAddOnToStack', () => {
  it('adds add-on chips to existing stack', () => {
    const player = makePlayer({ id: '1', name: 'A', chips: 25000 });
    const result = addAddOnToStack(player, 20000);
    expect(result.chips).toBe(45000);
  });
});

// ---------------------------------------------------------------------------
// Persistent Player Database
// ---------------------------------------------------------------------------

describe('Player Database', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loadPlayerDatabase returns empty array when no data', () => {
    expect(loadPlayerDatabase()).toEqual([]);
  });

  it('addRegisteredPlayer adds a new player', () => {
    const player = addRegisteredPlayer('Alice');
    expect(player.name).toBe('Alice');
    expect(player.id).toMatch(/^rp_/);
    const db = loadPlayerDatabase();
    expect(db).toHaveLength(1);
    expect(db[0].name).toBe('Alice');
  });

  it('addRegisteredPlayer deduplicates case-insensitively', () => {
    addRegisteredPlayer('Alice');
    const updated = addRegisteredPlayer('alice');
    expect(updated.name).toBe('Alice'); // keeps original casing
    const db = loadPlayerDatabase();
    expect(db).toHaveLength(1);
  });

  it('deleteRegisteredPlayer removes a player', () => {
    const player = addRegisteredPlayer('Bob');
    addRegisteredPlayer('Charlie');
    deleteRegisteredPlayer(player.id);
    const db = loadPlayerDatabase();
    expect(db).toHaveLength(1);
    expect(db[0].name).toBe('Charlie');
  });

  it('syncPlayersToDatabase adds new and updates existing', () => {
    addRegisteredPlayer('Alice');
    syncPlayersToDatabase(['Alice', 'Bob', 'Charlie']);
    const db = loadPlayerDatabase();
    expect(db).toHaveLength(3);
    const names = db.map((p) => p.name);
    expect(names).toContain('Alice');
    expect(names).toContain('Bob');
    expect(names).toContain('Charlie');
  });

  it('importPlayersFromHistory imports from tournament history', () => {
    // Manually store history without going through saveTournamentResult
    // (which auto-syncs players), to test importPlayersFromHistory in isolation
    const result = {
      id: 'test-1',
      name: 'Test Tournament',
      date: new Date().toISOString(),
      playerCount: 3,
      buyIn: 10,
      prizePool: 30,
      players: [
        { name: 'Alice', place: 1, payout: 20, rebuys: 0, addOn: false, knockouts: 2, bountyEarned: 0, netBalance: 10 },
        { name: 'Bob', place: 2, payout: 10, rebuys: 0, addOn: false, knockouts: 0, bountyEarned: 0, netBalance: 0 },
        { name: 'Charlie', place: 3, payout: 0, rebuys: 0, addOn: false, knockouts: 0, bountyEarned: 0, netBalance: -10 },
      ],
      bountyEnabled: false,
      bountyAmount: 0,
      rebuyEnabled: false,
      totalRebuys: 0,
      addOnEnabled: false,
      totalAddOns: 0,
      elapsedSeconds: 3600,
      levelsPlayed: 8,
    };
    localStorage.setItem('poker-timer-history', JSON.stringify([result]));

    // Add Alice to DB first — should not be duplicated
    addRegisteredPlayer('Alice');
    const added = importPlayersFromHistory();
    expect(added).toBe(2); // Bob + Charlie
    const db = loadPlayerDatabase();
    expect(db).toHaveLength(3);
  });

  it('savePlayerDatabase + loadPlayerDatabase round-trip', () => {
    const players = [
      { id: 'rp_1', name: 'Test', createdAt: '2024-01-01', lastPlayedAt: '2024-06-01' },
    ];
    savePlayerDatabase(players);
    const loaded = loadPlayerDatabase();
    expect(loaded).toEqual(players);
  });
});

// ---------------------------------------------------------------------------
// League — Point System & CRUD
// ---------------------------------------------------------------------------
describe('defaultPointSystem', () => {
  it('returns correct entries', () => {
    const ps = defaultPointSystem();
    expect(ps.entries).toHaveLength(7);
    expect(ps.entries[0]).toEqual({ place: 1, points: 10 });
    expect(ps.entries[6]).toEqual({ place: 7, points: 1 });
  });
});

describe('League CRUD', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('save + load round-trip', () => {
    const league: League = {
      id: 'league_test_1',
      name: 'Friday Night',
      pointSystem: defaultPointSystem(),
      createdAt: new Date().toISOString(),
    };
    saveLeague(league);
    const loaded = loadLeagues();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].name).toBe('Friday Night');
  });

  it('delete removes league', () => {
    const league: League = {
      id: 'league_test_2',
      name: 'Test League',
      pointSystem: defaultPointSystem(),
      createdAt: new Date().toISOString(),
    };
    saveLeague(league);
    expect(loadLeagues()).toHaveLength(1);
    deleteLeague('league_test_2');
    expect(loadLeagues()).toHaveLength(0);
  });

  it('upsert updates existing league', () => {
    const league: League = {
      id: 'league_test_3',
      name: 'Original',
      pointSystem: defaultPointSystem(),
      createdAt: new Date().toISOString(),
    };
    saveLeague(league);
    saveLeague({ ...league, name: 'Updated' });
    const loaded = loadLeagues();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].name).toBe('Updated');
  });
});

describe('computeLeagueStandings', () => {
  it('aggregates correctly', () => {
    const pointSystem = defaultPointSystem();
    const history: TournamentResult[] = [
      {
        id: 'r1', name: 'T1', date: '2024-01-01', playerCount: 3, buyIn: 10,
        prizePool: 30, bountyEnabled: false, bountyAmount: 0, rebuyEnabled: false,
        totalRebuys: 0, addOnEnabled: false, totalAddOns: 0, elapsedSeconds: 3600, levelsPlayed: 8,
        leagueId: 'league_1',
        players: [
          { name: 'Alice', place: 1, payout: 20, rebuys: 0, addOn: false, knockouts: 2, bountyEarned: 0, netBalance: 10 },
          { name: 'Bob', place: 2, payout: 10, rebuys: 0, addOn: false, knockouts: 0, bountyEarned: 0, netBalance: 0 },
          { name: 'Carol', place: 3, payout: 0, rebuys: 0, addOn: false, knockouts: 0, bountyEarned: 0, netBalance: -10 },
        ],
      },
      {
        id: 'r2', name: 'T2', date: '2024-02-01', playerCount: 3, buyIn: 10,
        prizePool: 30, bountyEnabled: false, bountyAmount: 0, rebuyEnabled: false,
        totalRebuys: 0, addOnEnabled: false, totalAddOns: 0, elapsedSeconds: 3600, levelsPlayed: 8,
        leagueId: 'league_1',
        players: [
          { name: 'Bob', place: 1, payout: 20, rebuys: 0, addOn: false, knockouts: 1, bountyEarned: 0, netBalance: 10 },
          { name: 'Alice', place: 2, payout: 10, rebuys: 0, addOn: false, knockouts: 1, bountyEarned: 0, netBalance: 0 },
          { name: 'Carol', place: 3, payout: 0, rebuys: 0, addOn: false, knockouts: 0, bountyEarned: 0, netBalance: -10 },
        ],
      },
    ];

    const standings = computeLeagueStandings('league_1', history, pointSystem);
    expect(standings).toHaveLength(3);

    // Alice: 1st (10pts) + 2nd (7pts) = 17pts
    const alice = standings.find(s => s.name === 'Alice');
    expect(alice).toBeDefined();
    expect(alice!.points).toBe(17);
    expect(alice!.tournaments).toBe(2);
    expect(alice!.wins).toBe(1);

    // Bob: 2nd (7pts) + 1st (10pts) = 17pts
    const bob = standings.find(s => s.name === 'Bob');
    expect(bob).toBeDefined();
    expect(bob!.points).toBe(17);

    // Carol: 3rd (5pts) + 3rd (5pts) = 10pts
    const carol = standings.find(s => s.name === 'Carol');
    expect(carol).toBeDefined();
    expect(carol!.points).toBe(10);
  });

  it('filters by leagueId', () => {
    const pointSystem = defaultPointSystem();
    const history: TournamentResult[] = [
      {
        id: 'r1', name: 'T1', date: '2024-01-01', playerCount: 2, buyIn: 10,
        prizePool: 20, bountyEnabled: false, bountyAmount: 0, rebuyEnabled: false,
        totalRebuys: 0, addOnEnabled: false, totalAddOns: 0, elapsedSeconds: 3600, levelsPlayed: 8,
        leagueId: 'league_A',
        players: [
          { name: 'Alice', place: 1, payout: 20, rebuys: 0, addOn: false, knockouts: 1, bountyEarned: 0, netBalance: 10 },
          { name: 'Bob', place: 2, payout: 0, rebuys: 0, addOn: false, knockouts: 0, bountyEarned: 0, netBalance: -10 },
        ],
      },
      {
        id: 'r2', name: 'T2', date: '2024-01-02', playerCount: 2, buyIn: 10,
        prizePool: 20, bountyEnabled: false, bountyAmount: 0, rebuyEnabled: false,
        totalRebuys: 0, addOnEnabled: false, totalAddOns: 0, elapsedSeconds: 3600, levelsPlayed: 8,
        leagueId: 'league_B',
        players: [
          { name: 'Carol', place: 1, payout: 20, rebuys: 0, addOn: false, knockouts: 1, bountyEarned: 0, netBalance: 10 },
          { name: 'Dave', place: 2, payout: 0, rebuys: 0, addOn: false, knockouts: 0, bountyEarned: 0, netBalance: -10 },
        ],
      },
    ];

    const standingsA = computeLeagueStandings('league_A', history, pointSystem);
    expect(standingsA).toHaveLength(2);
    expect(standingsA.map(s => s.name).sort()).toEqual(['Alice', 'Bob']);

    const standingsB = computeLeagueStandings('league_B', history, pointSystem);
    expect(standingsB).toHaveLength(2);
    expect(standingsB.map(s => s.name).sort()).toEqual(['Carol', 'Dave']);
  });
});

describe('formatLeagueAsText', () => {
  it('produces expected output', () => {
    const league: League = {
      id: 'league_1',
      name: 'Friday League',
      pointSystem: defaultPointSystem(),
      createdAt: '2024-01-01',
    };
    const standings = [
      { name: 'Alice', points: 17, tournaments: 2, wins: 1, cashes: 2, avgPlace: 1.5, bestPlace: 1 },
      { name: 'Bob', points: 10, tournaments: 2, wins: 0, cashes: 1, avgPlace: 2.5, bestPlace: 2 },
    ];
    const text = formatLeagueAsText(league, standings);
    expect(text).toContain('Friday League');
    expect(text).toContain('Alice');
    expect(text).toContain('17 Pts');
    expect(text).toContain('Bob');
  });
});

// ---------------------------------------------------------------------------
// Mystery Bounty
// ---------------------------------------------------------------------------
describe('drawMysteryBounty', () => {
  it('returns correct amount and remaining pool', () => {
    // Use a fixed seed by mocking Math.random
    vi.spyOn(Math, 'random').mockReturnValue(0.0); // will pick index 0
    const result = drawMysteryBounty([5, 10, 20]);
    expect(result.amount).toBe(5);
    expect(result.remainingPool).toEqual([10, 20]);
    vi.restoreAllMocks();
  });

  it('handles empty pool', () => {
    const result = drawMysteryBounty([]);
    expect(result.amount).toBe(0);
    expect(result.remainingPool).toEqual([]);
  });

  it('removes exactly one element from pool', () => {
    const pool = [1, 2, 3, 4, 5];
    const result = drawMysteryBounty(pool);
    expect(result.remainingPool).toHaveLength(4);
    expect(pool).toHaveLength(5); // original unchanged
  });
});

describe('defaultBountyConfig', () => {
  it('includes type field defaulting to fixed', () => {
    const config = defaultBountyConfig();
    expect(config.type).toBe('fixed');
    expect(config.enabled).toBe(false);
    expect(config.amount).toBe(5);
  });
});

describe('parseConfigObject — bounty backward compatibility', () => {
  it('defaults bounty type to fixed for old configs', () => {
    const raw = {
      name: 'Test',
      levels: [{ id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50 }],
      bounty: { enabled: true, amount: 10 },
    };
    const config = parseConfigObject(raw as Record<string, unknown>);
    expect(config).not.toBeNull();
    expect(config!.bounty.type).toBe('fixed');
    expect(config!.bounty.mysteryPool).toBeUndefined();
  });

  it('preserves mystery bounty type and pool', () => {
    const raw = {
      name: 'Test',
      levels: [{ id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50 }],
      bounty: { enabled: true, amount: 5, type: 'mystery', mysteryPool: [1, 2, 5, 10] },
    };
    const config = parseConfigObject(raw as Record<string, unknown>);
    expect(config).not.toBeNull();
    expect(config!.bounty.type).toBe('mystery');
    expect(config!.bounty.mysteryPool).toEqual([1, 2, 5, 10]);
  });

  it('parses leagueId from config', () => {
    const raw = {
      name: 'Test',
      levels: [{ id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50 }],
      leagueId: 'league_123',
    };
    const config = parseConfigObject(raw as Record<string, unknown>);
    expect(config).not.toBeNull();
    expect(config!.leagueId).toBe('league_123');
  });
});

// ---------------------------------------------------------------------------
// Setup Wizard persistence
// ---------------------------------------------------------------------------
describe('Setup Wizard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('isWizardCompleted returns false when not set', () => {
    expect(isWizardCompleted()).toBe(false);
  });

  it('markWizardCompleted sets flag and isWizardCompleted returns true', () => {
    markWizardCompleted();
    expect(isWizardCompleted()).toBe(true);
    expect(localStorage.getItem(WIZARD_KEY)).toBe('true');
  });
});

// ---------------------------------------------------------------------------
// Multi-Table Support
// ---------------------------------------------------------------------------
describe('Multi-Table', () => {
  const mkPlayers = (count: number): Player[] =>
    Array.from({ length: count }, (_, i) =>
      makePlayer({ id: `p${i + 1}`, name: `Player ${i + 1}` }),
    );

  /** Helper to create a table with players seated */
  const mkTable = (id: string, name: string, maxSeats: number, playerIds: string[]): Table => {
    const seats = Array.from({ length: maxSeats }, (_, i) => ({
      seatNumber: i + 1,
      playerId: playerIds[i] ?? null,
    }));
    return { id, name, maxSeats, seats, status: 'active' as const, dealerSeat: null };
  };

  // --- Table creation & helpers ---

  it('createTable creates Seat[] array with correct seatNumbers', () => {
    const table = createTable('Table 1');
    expect(table.name).toBe('Table 1');
    expect(table.maxSeats).toBe(10);
    expect(table.seats).toHaveLength(10);
    expect(table.seats[0].seatNumber).toBe(1);
    expect(table.seats[9].seatNumber).toBe(10);
    expect(table.seats.every(s => s.playerId === null)).toBe(true);
    expect(table.status).toBe('active');
    expect(table.dealerSeat).toBeNull();
    expect(table.id).toBeTruthy();
  });

  it('getTablePlayerIds extracts player IDs from seats', () => {
    const table = mkTable('t1', 'T1', 5, ['a', 'b']);
    expect(getTablePlayerIds(table)).toEqual(['a', 'b']);
  });

  it('findLowestAvailableSeat returns correct seat', () => {
    const table = mkTable('t1', 'T1', 5, ['a', 'b']);
    // Seats 1=a, 2=b, 3=null, 4=null, 5=null
    expect(findLowestAvailableSeat(table)).toBe(3);
  });

  it('findLowestAvailableSeat returns null when full', () => {
    const table = mkTable('t1', 'T1', 2, ['a', 'b']);
    expect(findLowestAvailableSeat(table)).toBeNull();
  });

  it('findHighestOccupiedSeat returns correct seat (active only)', () => {
    const table = mkTable('t1', 'T1', 5, ['p1', 'p2', 'p3']);
    const players: Player[] = [
      makePlayer({ id: 'p1', name: 'A' }),
      makePlayer({ id: 'p2', name: 'B', status: 'eliminated' }),
      makePlayer({ id: 'p3', name: 'C' }),
    ];
    const seat = findHighestOccupiedSeat(table, players);
    expect(seat?.seatNumber).toBe(3);
    expect(seat?.playerId).toBe('p3');
  });

  it('findPlayerSeat finds table + seat', () => {
    const tables: Table[] = [
      mkTable('t1', 'T1', 5, ['a', 'b']),
      mkTable('t2', 'T2', 5, ['c', 'd']),
    ];
    const result = findPlayerSeat(tables, 'c');
    expect(result).not.toBeNull();
    expect(result!.table.id).toBe('t2');
    expect(result!.seat.seatNumber).toBe(1);
    expect(findPlayerSeat(tables, 'z')).toBeNull();
  });

  // --- Distribution ---

  it('distributePlayersToTables round-robin assigns seats', () => {
    const tables = [createTable('T1', 10), createTable('T2', 10)];
    const ids = ['a', 'b', 'c', 'd'];
    const result = distributePlayersToTables(ids, tables);
    // P1→T1S1, P2→T2S1, P3→T1S2, P4→T2S2
    expect(result[0].seats[0].playerId).toBe('a');
    expect(result[1].seats[0].playerId).toBe('b');
    expect(result[0].seats[1].playerId).toBe('c');
    expect(result[1].seats[1].playerId).toBe('d');
  });

  it('distributePlayersToTables handles 7 players and 2 tables', () => {
    const tables = [createTable('T1', 10), createTable('T2', 10)];
    const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const result = distributePlayersToTables(ids, tables);
    const t1Players = getTablePlayerIds(result[0]);
    const t2Players = getTablePlayerIds(result[1]);
    expect(t1Players.length).toBe(4); // a, c, e, g
    expect(t2Players.length).toBe(3); // b, d, f
  });

  it('distributePlayersToTables does not exceed maxSeats', () => {
    const tables = [createTable('T1', 2), createTable('T2', 2)];
    const ids = ['a', 'b', 'c', 'd', 'e']; // 5 players, only 4 seats total
    const result = distributePlayersToTables(ids, tables);
    const t1Count = getTablePlayerIds(result[0]).length;
    const t2Count = getTablePlayerIds(result[1]).length;
    expect(t1Count).toBeLessThanOrEqual(2);
    expect(t2Count).toBeLessThanOrEqual(2);
  });

  // --- Removal ---

  it('removePlayerFromTable empties seat (does not remove it)', () => {
    const tables: Table[] = [
      mkTable('t1', 'T1', 10, ['a', 'b', 'c']),
      mkTable('t2', 'T2', 10, ['d', 'e']),
    ];
    const result = removePlayerFromTable(tables, 'b');
    // Seat 2 should be empty now, not removed
    expect(result[0].seats[1].playerId).toBeNull();
    expect(result[0].seats[0].playerId).toBe('a');
    expect(result[0].seats[2].playerId).toBe('c');
    expect(result[0].seats).toHaveLength(10);
  });

  // --- Lookup ---

  it('findPlayerTable finds the correct table', () => {
    const tables: Table[] = [
      mkTable('t1', 'T1', 10, ['a', 'b']),
      mkTable('t2', 'T2', 10, ['c', 'd']),
    ];
    expect(findPlayerTable(tables, 'c')?.id).toBe('t2');
    expect(findPlayerTable(tables, 'z')).toBeUndefined();
  });

  // --- Active counts ---

  it('getActivePlayersPerTable counts active correctly', () => {
    const tables: Table[] = [
      mkTable('t1', 'T1', 10, ['p1', 'p2', 'p3']),
      mkTable('t2', 'T2', 10, ['p4', 'p5']),
    ];
    const players: Player[] = [
      makePlayer({ id: 'p1', name: 'A' }),
      makePlayer({ id: 'p2', name: 'B', status: 'eliminated' }),
      makePlayer({ id: 'p3', name: 'C' }),
      makePlayer({ id: 'p4', name: 'D' }),
      makePlayer({ id: 'p5', name: 'E', status: 'eliminated' }),
    ];
    const counts = getActivePlayersPerTable(tables, players);
    expect(counts.get('t1')).toBe(2);
    expect(counts.get('t2')).toBe(1);
  });

  // --- Balancing ---

  it('balanceTables with even tables returns no moves', () => {
    const tables: Table[] = [
      mkTable('t1', 'T1', 10, ['p1', 'p2']),
      mkTable('t2', 'T2', 10, ['p3', 'p4']),
    ];
    const players = mkPlayers(4);
    const result = balanceTables(tables, players);
    expect(result.moves).toEqual([]);
  });

  it('balanceTables moves highest seat from largest to lowest seat at smallest', () => {
    // T1: p1(S1) p2(S2) p3(S3) p4(S4) — T2: p5(S1) — diff = 3
    const tables: Table[] = [
      mkTable('t1', 'T1', 10, ['p1', 'p2', 'p3', 'p4']),
      mkTable('t2', 'T2', 10, ['p5']),
    ];
    const players = mkPlayers(5);
    const result = balanceTables(tables, players);
    expect(result.moves.length).toBeGreaterThan(0);
    // First move should be from highest seat (S4 = p4) at T1 to lowest available (S2) at T2
    expect(result.moves[0].fromSeat).toBe(4);
    expect(result.moves[0].toSeat).toBe(2);
    expect(result.moves[0].reason).toBe('balance');
    expect(result.moves[0].timestamp).toBeGreaterThan(0);
  });

  it('balanceTables ensures max diff <= 1 after balancing', () => {
    const tables: Table[] = [
      mkTable('t1', 'T1', 10, ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']),
      mkTable('t2', 'T2', 10, ['p7']),
      mkTable('t3', 'T3', 10, ['p8']),
    ];
    const players = mkPlayers(8);
    const result = balanceTables(tables, players);
    const counts = result.tables.filter(t => t.status === 'active').map(t =>
      t.seats.filter(s => s.playerId !== null).length,
    );
    const max = Math.max(...counts);
    const min = Math.min(...counts);
    expect(max - min).toBeLessThanOrEqual(1);
  });

  // --- Seating a single player ---

  it('seatPlayerAtSmallestTable picks table with fewest active, lowest seat', () => {
    const tables: Table[] = [
      mkTable('t1', 'T1', 5, ['p1', 'p2', 'p3']),
      mkTable('t2', 'T2', 5, ['p4']),
    ];
    const players = mkPlayers(4);
    const result = seatPlayerAtSmallestTable(tables, players, 'p5');
    expect(result).not.toBeNull();
    expect(result!.tableId).toBe('t2');
    expect(result!.seatNumber).toBe(2); // lowest available at T2
  });

  // --- Dissolution ---

  it('findTableToDissolve finds table at/below threshold', () => {
    const tables: Table[] = [
      mkTable('t1', 'T1', 10, ['p1', 'p2', 'p3', 'p4', 'p5']),
      mkTable('t2', 'T2', 10, ['p6', 'p7']), // 2 players <= threshold 3
    ];
    const players = mkPlayers(7);
    const result = findTableToDissolve(tables, players, 3);
    expect(result?.id).toBe('t2');
  });

  it('dissolveTable distributes players to remaining tables', () => {
    const tables: Table[] = [
      mkTable('t1', 'T1', 10, ['p1', 'p2', 'p3', 'p4', 'p5']),
      mkTable('t2', 'T2', 10, ['p6', 'p7']),
    ];
    const players = mkPlayers(7);
    const result = dissolveTable(tables, players, 't2');
    // T2 should be dissolved
    const t2 = result.tables.find(t => t.id === 't2');
    expect(t2?.status).toBe('dissolved');
    // Players should be moved to T1
    expect(result.moves.length).toBe(2);
    expect(result.moves[0].reason).toBe('dissolution');
    // T1 should now have 7 players
    const t1 = result.tables.find(t => t.id === 't1');
    expect(t1?.seats.filter(s => s.playerId !== null).length).toBe(7);
  });

  // --- Final Table ---

  it('shouldMergeToFinalTable returns true when players fit', () => {
    const tables: Table[] = [
      mkTable('t1', 'T1', 9, ['p1', 'p2', 'p3']),
      mkTable('t2', 'T2', 9, ['p4', 'p5']),
    ];
    const players = mkPlayers(5);
    expect(shouldMergeToFinalTable(tables, players)).toBe(true);
  });

  it('shouldMergeToFinalTable returns false when too many players', () => {
    const tables: Table[] = [
      mkTable('t1', 'T1', 4, ['p1', 'p2', 'p3']),
      mkTable('t2', 'T2', 4, ['p4', 'p5']),
    ];
    const players = mkPlayers(5);
    expect(shouldMergeToFinalTable(tables, players)).toBe(false);
  });

  it('shouldMergeToFinalTable returns false with single table', () => {
    const tables: Table[] = [
      mkTable('t1', 'T1', 10, ['p1', 'p2']),
    ];
    const players = mkPlayers(2);
    expect(shouldMergeToFinalTable(tables, players)).toBe(false);
  });

  it('shouldMergeToFinalTable ignores dissolved tables', () => {
    const dissolved = mkTable('t1', 'T1', 10, []);
    dissolved.status = 'dissolved';
    const tables: Table[] = [
      dissolved,
      mkTable('t2', 'T2', 5, ['p1', 'p2', 'p3']),
    ];
    const players = mkPlayers(3);
    // Only 1 active table => false (can't merge to fewer)
    expect(shouldMergeToFinalTable(tables, players)).toBe(false);
  });

  it('mergeToFinalTable seats all active players, others dissolved', () => {
    const tables: Table[] = [
      mkTable('t1', 'T1', 9, ['p1', 'p2', 'p3']),
      mkTable('t2', 'T2', 9, ['p4', 'p5']),
    ];
    const players: Player[] = [
      ...mkPlayers(4),
      makePlayer({ id: 'p5', name: 'Player 5', status: 'eliminated' }),
    ];
    const result = mergeToFinalTable(tables, players);
    const finalTable = result.tables.find(t => t.status === 'active');
    expect(finalTable).toBeTruthy();
    expect(finalTable!.name).toBe('Final Table');
    const seatedIds = finalTable!.seats.filter(s => s.playerId !== null).map(s => s.playerId);
    expect(seatedIds).toContain('p1');
    expect(seatedIds).toContain('p2');
    expect(seatedIds).toContain('p3');
    expect(seatedIds).toContain('p4');
    expect(seatedIds).not.toContain('p5'); // eliminated
    // T2 should be dissolved
    const t2 = result.tables.find(t => t.id === 't2');
    expect(t2?.status).toBe('dissolved');
  });

  it('mergeToFinalTable moves have reason final-table', () => {
    const tables: Table[] = [
      mkTable('t1', 'T1', 9, ['p1', 'p2']),
      mkTable('t2', 'T2', 9, ['p3', 'p4']),
    ];
    const players = mkPlayers(4);
    const result = mergeToFinalTable(tables, players);
    expect(result.moves.length).toBeGreaterThan(0);
    expect(result.moves.every(m => m.reason === 'final-table')).toBe(true);
  });

  // --- Dealer ---

  it('advanceTableDealer skips empty seats', () => {
    const table = mkTable('t1', 'T1', 5, ['p1']);
    // Only p1 at seat 1, rest empty. Dealer at seat 1.
    table.dealerSeat = 1;
    const players = mkPlayers(1);
    const result = advanceTableDealer(table, players);
    // Should wrap back to seat 1 (only occupied seat)
    expect(result.dealerSeat).toBe(1);
  });

  it('advanceTableDealer skips eliminated players', () => {
    const table = mkTable('t1', 'T1', 5, ['p1', 'p2', 'p3']);
    table.dealerSeat = 1;
    const players: Player[] = [
      makePlayer({ id: 'p1', name: 'A' }),
      makePlayer({ id: 'p2', name: 'B', status: 'eliminated' }),
      makePlayer({ id: 'p3', name: 'C' }),
    ];
    const result = advanceTableDealer(table, players);
    // Should skip p2 (eliminated) and go to p3 at seat 3
    expect(result.dealerSeat).toBe(3);
  });

  // --- Backward compatibility ---

  it('parseConfigObject migrates old Table format (playerIds[]) to new (seats[])', () => {
    const raw = {
      name: 'Test',
      levels: [{ id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50 }],
      tables: [
        { id: 't1', name: 'Table 1', seats: 10, playerIds: ['a', 'b'] },
      ],
    };
    const config = parseConfigObject(raw as Record<string, unknown>);
    expect(config).not.toBeNull();
    expect(config!.tables).toHaveLength(1);
    expect(config!.tables![0].name).toBe('Table 1');
    expect(config!.tables![0].maxSeats).toBe(10);
    expect(config!.tables![0].seats).toHaveLength(10);
    expect(config!.tables![0].seats[0].playerId).toBe('a');
    expect(config!.tables![0].seats[1].playerId).toBe('b');
    expect(config!.tables![0].seats[2].playerId).toBeNull();
    expect(config!.tables![0].status).toBe('active');
  });

  it('parseConfigObject parses multiTable config with defaults', () => {
    const raw = {
      name: 'Test',
      levels: [{ id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50 }],
      multiTable: { enabled: true, seatsPerTable: 8 },
    };
    const config = parseConfigObject(raw as Record<string, unknown>);
    expect(config!.multiTable).toBeDefined();
    expect(config!.multiTable!.enabled).toBe(true);
    expect(config!.multiTable!.seatsPerTable).toBe(8);
    expect(config!.multiTable!.dissolveThreshold).toBe(3); // default
    expect(config!.multiTable!.autoBalanceOnElimination).toBe(true); // default
  });

  it('parseConfigObject returns undefined tables when field is missing', () => {
    const raw = {
      name: 'Test',
      levels: [{ id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50 }],
    };
    const config = parseConfigObject(raw as Record<string, unknown>);
    expect(config).not.toBeNull();
    expect(config!.tables).toBeUndefined();
    expect(config!.multiTable).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// League Export / Import
// ---------------------------------------------------------------------------
describe('League Export / Import', () => {
  it('exportLeagueToJSON returns valid JSON with league and results', () => {
    const league: League = {
      id: 'test-league',
      name: 'Friday Night',
      pointSystem: { entries: [{ place: 1, points: 10 }] },
      createdAt: '2024-01-01T00:00:00.000Z',
    };
    const json = exportLeagueToJSON(league);
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe(1);
    expect(parsed.league.id).toBe('test-league');
    expect(parsed.league.name).toBe('Friday Night');
    expect(Array.isArray(parsed.results)).toBe(true);
    expect(typeof parsed.exportedAt).toBe('string');
  });

  it('parseLeagueFile round-trip returns same league data', () => {
    const league: League = {
      id: 'rt-league',
      name: 'Round Trip',
      pointSystem: { entries: [{ place: 1, points: 10 }, { place: 2, points: 7 }] },
      createdAt: '2024-06-01T00:00:00.000Z',
    };
    const json = exportLeagueToJSON(league);
    const parsed = parseLeagueFile(json);
    expect(parsed).not.toBeNull();
    expect(parsed!.league.name).toBe('Round Trip');
    expect(parsed!.league.pointSystem.entries).toHaveLength(2);
  });

  it('parseLeagueFile returns null for invalid input', () => {
    expect(parseLeagueFile('')).toBeNull();
    expect(parseLeagueFile('{}')).toBeNull();
    expect(parseLeagueFile('{"league": {}}')).toBeNull();
    expect(parseLeagueFile('not json')).toBeNull();
    expect(parseLeagueFile('{"league": {"id": "x", "name": "y"}}')).toBeNull(); // missing results
  });

  it('parseLeagueFile accepts valid export with results', () => {
    const payload = {
      version: 1,
      league: { id: 'l1', name: 'Test', pointSystem: { entries: [] }, createdAt: '2024-01-01T00:00:00.000Z' },
      results: [{ id: 'r1', leagueId: 'l1', name: 'T1', date: '2024-01-01', playerCount: 6, buyIn: 10, prizePool: 60, players: [], bountyEnabled: false, bountyAmount: 0, rebuyEnabled: false, totalRebuys: 0, addOnEnabled: false, totalAddOns: 0, elapsedSeconds: 3600, levelsPlayed: 5 }],
      exportedAt: '2024-01-01T00:00:00.000Z',
    };
    const result = parseLeagueFile(JSON.stringify(payload));
    expect(result).not.toBeNull();
    expect(result!.results).toHaveLength(1);
  });
});
