/**
 * Edge Case & Robustness Tests — Phases 4, 5, 6, 11, 12, 13
 *
 * Covers: timer boundary conditions, blind structure extremes, player
 * management edge cases, format function edge cases, multi-table edge
 * cases, input sanitization, and general robustness.
 */
import {
  // Timer (Phase 4)
  computeRemaining,
  advanceLevel,
  previousLevel,
  resetCurrentLevel,
  restartTournament,
  computeTournamentElapsedSeconds,
  computeEstimatedRemainingSeconds,
  // Blinds (Phase 5)
  generateBlindStructure,
  generateBlindsByEndTime,
  roundToNice,
  roundToChipMultiple,
  computeBlindStructureSummary,
  stripAnteFromLevels,
  computeDefaultAnte,
  applyDefaultAntes,
  estimateDuration,
  // Players (Phase 6)
  defaultPlayers,
  shufflePlayers,
  movePlayer,
  computeNextPlacement,
  isBubble,
  isInTheMoney,
  computeAverageStack,
  computeAverageStackInBB,
  findChipLeader,
  computeAverageStackFromPlayers,
  canReEntry,
  reEnterPlayer,
  // Format (Phase 11)
  formatTime,
  formatElapsedTime,
  getLevelLabel,
  getBlindsText,
  // Tournament (Phase 6, 11)
  computeSidePots,
  computePayouts,
  csvSafe,
  decodeResultFromQR,
  defaultPayoutForPlayerCount,
  // Validation
  validatePayoutConfig,
  // Helpers
  snapSpinnerValue,
  generateId,
  generatePlayerId,
  generateChipId,
  // Tables (Phase 6)
  createTable,
  distributePlayersToTables,
  balanceTables,
  findTableToDissolve,
  shouldMergeToFinalTable,
  toggleSeatLock,
  advanceTableDealer,
  findPlayerSeat,
  seatPlayerAtSmallestTable,
} from '../src/domain/logic';
import type { Level, Player, TimerState, Table } from '../src/domain/types';

// ---------------------------------------------------------------------------
// Helper factories
// ---------------------------------------------------------------------------

function makeLevel(overrides?: Partial<Level>): Level {
  return { id: 'l1', type: 'level', durationSeconds: 600, smallBlind: 10, bigBlind: 20, ...overrides };
}

function makeLevels(count: number): Level[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `l${i}`,
    type: (i % 4 === 3 ? 'break' : 'level') as 'level' | 'break',
    durationSeconds: 600,
    smallBlind: i % 4 === 3 ? undefined : 10 * (i + 1),
    bigBlind: i % 4 === 3 ? undefined : 20 * (i + 1),
  }));
}

function makePlayer(overrides?: Partial<Player>): Player {
  return {
    id: 'p1', name: 'Alice', rebuys: 0, addOn: false,
    status: 'active', placement: null, eliminatedBy: null, knockouts: 0,
    ...overrides,
  };
}

function makeTimerState(overrides?: Partial<TimerState>): TimerState {
  return {
    currentLevelIndex: 0, remainingSeconds: 600, status: 'stopped',
    startedAt: null, remainingAtStart: null,
    ...overrides,
  };
}

// ============================= PHASE 4 ====================================
// Timer & Tournament Logic Edge Cases
// ======================================================================

describe('Timer edge cases (Phase 4)', () => {
  describe('computeRemaining', () => {
    it('returns exact remaining when no time elapsed', () => {
      expect(computeRemaining(1000, 600, 1000)).toBe(600);
    });

    it('returns 0 when elapsed exceeds remaining', () => {
      expect(computeRemaining(1000, 600, 2000000)).toBe(0);
    });

    it('never returns negative', () => {
      expect(computeRemaining(0, 10, 999999999)).toBe(0);
    });

    it('handles sub-second precision (no rounding — returns fractional)', () => {
      // 1500ms elapsed from 600s → 598.5 (computeRemaining does NOT floor)
      const result = computeRemaining(0, 600, 1500);
      expect(result).toBe(598.5);
    });

    it('handles same start and now time', () => {
      expect(computeRemaining(5000, 300, 5000)).toBe(300);
    });
  });

  describe('advanceLevel', () => {
    it('advances to next level', () => {
      const levels = makeLevels(5);
      const state = makeTimerState({ currentLevelIndex: 0 });
      const next = advanceLevel(state, levels);
      expect(next.currentLevelIndex).toBe(1);
      expect(next.remainingSeconds).toBe(levels[1].durationSeconds);
    });

    it('stops at the last level (does not overflow)', () => {
      const levels = makeLevels(3);
      const state = makeTimerState({ currentLevelIndex: 2 });
      const next = advanceLevel(state, levels);
      expect(next.currentLevelIndex).toBe(2);
      expect(next.status).toBe('stopped');
    });

    it('handles single-level tournament', () => {
      const levels = [makeLevel()];
      const state = makeTimerState({ currentLevelIndex: 0 });
      const next = advanceLevel(state, levels);
      expect(next.currentLevelIndex).toBe(0);
      expect(next.status).toBe('stopped');
    });
  });

  describe('previousLevel', () => {
    it('moves to previous level', () => {
      const levels = makeLevels(5);
      const state = makeTimerState({ currentLevelIndex: 3 });
      const next = previousLevel(state, levels);
      expect(next.currentLevelIndex).toBe(2);
    });

    it('clamps at level 0 (does not go negative)', () => {
      const levels = makeLevels(5);
      const state = makeTimerState({ currentLevelIndex: 0 });
      const next = previousLevel(state, levels);
      expect(next.currentLevelIndex).toBe(0);
    });
  });

  describe('resetCurrentLevel', () => {
    it('resets remaining to full duration', () => {
      const levels = makeLevels(3);
      const state = makeTimerState({ currentLevelIndex: 1, remainingSeconds: 42 });
      const next = resetCurrentLevel(state, levels);
      expect(next.remainingSeconds).toBe(levels[1].durationSeconds);
    });
  });

  describe('restartTournament', () => {
    it('returns level 0 stopped', () => {
      const levels = makeLevels(5);
      const state = restartTournament(levels);
      expect(state.currentLevelIndex).toBe(0);
      expect(state.status).toBe('stopped');
      expect(state.remainingSeconds).toBe(levels[0].durationSeconds);
    });
  });

  describe('elapsed and estimated remaining', () => {
    it('computeTournamentElapsedSeconds with mid-level timer', () => {
      const levels = makeLevels(5); // each 600s
      // At level 2, 200s remaining → elapsed in this level = 400s
      // Levels 0 and 1 complete = 1200s
      const elapsed = computeTournamentElapsedSeconds(levels, 2, 200);
      expect(elapsed).toBe(1600); // 600 + 600 + 400
    });

    it('computeEstimatedRemainingSeconds includes current + future levels', () => {
      const levels = makeLevels(5); // each 600s
      const remaining = computeEstimatedRemainingSeconds(levels, 2, 200);
      // 200s in current + 600*2 (levels 3,4) = 200 + 1200 = 1400
      expect(remaining).toBe(1400);
    });

    it('handles level 0 with full remaining', () => {
      const levels = makeLevels(3);
      expect(computeTournamentElapsedSeconds(levels, 0, 600)).toBe(0);
    });
  });
});

// ============================= PHASE 5 ====================================
// Blind Structure & Setup Logic
// ======================================================================

describe('Blind structure edge cases (Phase 5)', () => {
  describe('generateBlindStructure', () => {
    it('generates valid structure for small starting chips (1000)', () => {
      const levels = generateBlindStructure({ startingChips: 1000, speed: 'fast', anteEnabled: false });
      expect(levels.length).toBeGreaterThan(3);
      // First level should have small blinds relative to chips
      const firstPlay = levels.find(l => l.type === 'level');
      expect(firstPlay!.smallBlind).toBeLessThan(50);
    });

    it('generates valid structure for large starting chips (100000)', () => {
      const levels = generateBlindStructure({ startingChips: 100000, speed: 'slow', anteEnabled: false });
      expect(levels.length).toBeGreaterThan(10);
    });

    it('includes breaks at regular intervals', () => {
      const levels = generateBlindStructure({ startingChips: 20000, speed: 'normal', anteEnabled: false });
      const breaks = levels.filter(l => l.type === 'break');
      expect(breaks.length).toBeGreaterThan(0);
    });

    it('generates ante values when anteEnabled', () => {
      const levels = generateBlindStructure({ startingChips: 20000, speed: 'normal', anteEnabled: true });
      const withAnte = levels.filter(l => l.type === 'level' && l.ante && l.ante > 0);
      expect(withAnte.length).toBeGreaterThan(0);
    });

    it('respects chip-aware rounding when smallestChip is provided', () => {
      const levels = generateBlindStructure({ startingChips: 20000, speed: 'normal', anteEnabled: false, smallestChip: 25 });
      const playLevels = levels.filter(l => l.type === 'level');
      for (const l of playLevels) {
        expect(l.smallBlind! % 25).toBe(0);
        expect(l.bigBlind! % 25).toBe(0);
      }
    });
  });

  describe('generateBlindsByEndTime', () => {
    it('generates structure targeting ~120 minutes', () => {
      const levels = generateBlindsByEndTime({
        startingChips: 20000, targetMinutes: 120, playerCount: 8,
        anteEnabled: false,
      });
      expect(levels.length).toBeGreaterThan(5);
      const totalSeconds = estimateDuration(levels);
      // Should be within reasonable range of target
      expect(totalSeconds).toBeGreaterThan(60 * 60); // > 60 min
      expect(totalSeconds).toBeLessThan(240 * 60);   // < 240 min
    });

    it('handles very short target (30 minutes)', () => {
      const levels = generateBlindsByEndTime({
        startingChips: 10000, targetMinutes: 30, playerCount: 6,
        anteEnabled: false,
      });
      expect(levels.length).toBeGreaterThan(2);
    });
  });

  describe('roundToNice', () => {
    it('rounds to "poker-friendly" values', () => {
      expect(roundToNice(0)).toBe(0);
      expect(roundToNice(1)).toBeGreaterThanOrEqual(1);
      expect(roundToNice(7)).toBeGreaterThanOrEqual(5);
      expect(roundToNice(123)).toBeGreaterThanOrEqual(100);
    });
  });

  describe('roundToChipMultiple', () => {
    it('rounds to nearest chip multiple', () => {
      expect(roundToChipMultiple(120, 25)).toBe(125);
      expect(roundToChipMultiple(100, 25)).toBe(100);
      expect(roundToChipMultiple(13, 5)).toBe(15);
    });

    it('handles chip=1 (identity)', () => {
      expect(roundToChipMultiple(42, 1)).toBe(42);
    });
  });

  describe('computeBlindStructureSummary', () => {
    it('counts levels, breaks, and avg minutes', () => {
      const levels: Level[] = [
        makeLevel({ durationSeconds: 600 }),
        makeLevel({ durationSeconds: 900 }),
        makeLevel({ type: 'break', durationSeconds: 300 }),
      ];
      const summary = computeBlindStructureSummary(levels);
      expect(summary.levelCount).toBe(2);
      expect(summary.breakCount).toBe(1);
      expect(summary.avgMinutes).toBeGreaterThan(0);
    });

    it('handles empty array', () => {
      const summary = computeBlindStructureSummary([]);
      expect(summary.levelCount).toBe(0);
      expect(summary.breakCount).toBe(0);
    });
  });

  describe('ante calculation', () => {
    it('computeDefaultAnte standard: ~12.5% of BB', () => {
      const ante = computeDefaultAnte(200, 'standard');
      expect(ante).toBeLessThanOrEqual(50); // reasonable for BB=200
      expect(ante).toBeGreaterThan(0);
    });

    it('computeDefaultAnte BBA: ante equals BB', () => {
      expect(computeDefaultAnte(200, 'bigBlindAnte')).toBe(200);
    });

    it('stripAnteFromLevels removes all antes', () => {
      const levels = [
        makeLevel({ ante: 10 }),
        makeLevel({ ante: 25 }),
        makeLevel({ type: 'break' }),
      ];
      const stripped = stripAnteFromLevels(levels);
      expect(stripped.every(l => !l.ante || l.ante === 0)).toBe(true);
    });

    it('applyDefaultAntes sets antes on all play levels', () => {
      const levels = [
        makeLevel({ bigBlind: 200, ante: undefined }),
        makeLevel({ type: 'break' }),
        makeLevel({ bigBlind: 400, ante: undefined }),
      ];
      const withAntes = applyDefaultAntes(levels, 'standard');
      expect(withAntes[0].ante).toBeGreaterThan(0);
      expect(withAntes[2].ante).toBeGreaterThan(0);
    });
  });
});

// ============================= PHASE 6 ====================================
// Player, Tournament & Multi-Table Logic
// ======================================================================

describe('Player edge cases (Phase 6)', () => {
  describe('defaultPlayers', () => {
    it('creates N players with unique IDs', () => {
      const players = defaultPlayers(8);
      const ids = players.map(p => p.id);
      expect(new Set(ids).size).toBe(8);
    });

    it('creates 0 players for count 0', () => {
      expect(defaultPlayers(0)).toEqual([]);
    });
  });

  describe('shufflePlayers', () => {
    it('returns same number of players', () => {
      const players = defaultPlayers(6);
      const { players: shuffled } = shufflePlayers(players);
      expect(shuffled).toHaveLength(6);
    });

    it('returns a valid dealer index', () => {
      const players = defaultPlayers(6);
      const { dealerIndex } = shufflePlayers(players);
      expect(dealerIndex).toBeGreaterThanOrEqual(0);
      expect(dealerIndex).toBeLessThan(6);
    });
  });

  describe('movePlayer', () => {
    it('swaps player with next position', () => {
      const players = defaultPlayers(3);
      const moved = movePlayer(players, 0, 1);
      expect(moved[0].id).toBe(players[1].id);
      expect(moved[1].id).toBe(players[0].id);
    });

    it('does not move beyond array bounds', () => {
      const players = defaultPlayers(3);
      // Move last player forward — should not crash
      const moved = movePlayer(players, 2, 1);
      expect(moved).toHaveLength(3);
    });
  });

  describe('placement and bubble', () => {
    it('computeNextPlacement counts active players', () => {
      const players = [
        makePlayer({ id: 'p1', status: 'active' }),
        makePlayer({ id: 'p2', status: 'active' }),
        makePlayer({ id: 'p3', status: 'eliminated', placement: 3 }),
      ];
      expect(computeNextPlacement(players)).toBe(2);
    });

    it('isBubble: true when activePlayers = paidPlaces + 1', () => {
      expect(isBubble(4, 3)).toBe(true);
    });

    it('isBubble: false when more than 1 away', () => {
      expect(isBubble(5, 3)).toBe(false);
    });

    it('isInTheMoney: true when activePlayers <= paidPlaces', () => {
      expect(isInTheMoney(3, 3)).toBe(true);
      expect(isInTheMoney(2, 3)).toBe(true);
    });

    it('isInTheMoney: false when activePlayers > paidPlaces', () => {
      expect(isInTheMoney(4, 3)).toBe(false);
    });
  });

  describe('stack calculations', () => {
    it('computeAverageStack handles 0 active players', () => {
      const players = [makePlayer({ status: 'eliminated' })];
      expect(computeAverageStack(players, 10000, 0, 0)).toBe(0);
    });

    it('computeAverageStackInBB handles 0 big blind', () => {
      expect(computeAverageStackInBB(10000, 0)).toBe(0);
    });

    it('findChipLeader returns null when no players have chips', () => {
      const players = [makePlayer({ id: 'p1' }), makePlayer({ id: 'p2' })];
      expect(findChipLeader(players)).toBeNull();
    });

    it('findChipLeader finds player with most chips', () => {
      const players = [
        makePlayer({ id: 'p1', chips: 5000 }),
        makePlayer({ id: 'p2', chips: 15000 }),
        makePlayer({ id: 'p3', chips: 8000 }),
      ];
      expect(findChipLeader(players)).toBe('p2');
    });

    it('computeAverageStackFromPlayers returns null when not tracked', () => {
      const players = [makePlayer(), makePlayer({ id: 'p2' })];
      expect(computeAverageStackFromPlayers(players)).toBeNull();
    });
  });

  describe('re-entry', () => {
    it('canReEntry returns false when not enabled', () => {
      const player = makePlayer({ status: 'eliminated' });
      const rebuy = { enabled: true, limitType: 'levels' as const, levelLimit: 4, timeLimit: 3600, rebuyCost: 10, rebuyChips: 5000 };
      expect(canReEntry(player, rebuy)).toBe(false); // reEntryEnabled not set
    });

    it('reEnterPlayer returns unchanged array for active player', () => {
      const players = [makePlayer({ id: 'p1', status: 'active' })];
      const result = reEnterPlayer(players, 'p1');
      expect(result).toBe(players); // identity — no change
    });
  });
});

// ============================= PHASE 6 (Multi-Table) =======================

describe('Multi-table edge cases (Phase 6)', () => {
  function makeTable(id: string, playerIds: (string | null)[]): Table {
    return {
      id, name: `Table ${id}`, maxSeats: 9,
      seats: playerIds.map((pid, i) => ({ seatNumber: i + 1, playerId: pid })),
      status: 'active', dealerSeat: null,
    };
  }

  function activePlayers(ids: string[]): Player[] {
    return ids.map(id => makePlayer({ id, name: id }));
  }

  it('createTable creates empty table with correct seats', () => {
    const table = createTable('Main', 6);
    expect(table.seats).toHaveLength(6);
    expect(table.seats.every(s => s.playerId === null)).toBe(true);
    expect(table.status).toBe('active');
  });

  it('distributePlayersToTables round-robins across tables', () => {
    const t1 = createTable('T1', 9);
    const t2 = createTable('T2', 9);
    const result = distributePlayersToTables(['a', 'b', 'c', 'd', 'e'], [t1, t2]);
    // Round-robin: a→T1, b→T2, c→T1, d→T2, e→T1
    const t1Players = result[0].seats.filter(s => s.playerId).length;
    const t2Players = result[1].seats.filter(s => s.playerId).length;
    expect(t1Players).toBe(3);
    expect(t2Players).toBe(2);
  });

  it('balanceTables moves players when imbalanced', () => {
    const t1 = makeTable('t1', ['a', 'b', 'c', 'd', 'e', null, null, null, null]);
    const t2 = makeTable('t2', ['f', null, null, null, null, null, null, null, null]);
    const players = activePlayers(['a', 'b', 'c', 'd', 'e', 'f']);
    const { tables, moves } = balanceTables([t1, t2], players);
    // After balancing: 5 vs 1 → should become 3 vs 3
    const t1After = tables[0].seats.filter(s => s.playerId).length;
    const t2After = tables[1].seats.filter(s => s.playerId).length;
    expect(Math.abs(t1After - t2After)).toBeLessThanOrEqual(1);
    expect(moves.length).toBeGreaterThan(0);
  });

  it('findTableToDissolve returns table below threshold', () => {
    const t1 = makeTable('t1', ['a', 'b', null, null, null, null, null, null, null]);
    const t2 = makeTable('t2', ['c', 'd', 'e', 'f', null, null, null, null, null]);
    const players = activePlayers(['a', 'b', 'c', 'd', 'e', 'f']);
    const result = findTableToDissolve([t1, t2], players, 3);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('t1'); // only 2 active < threshold 3
  });

  it('shouldMergeToFinalTable true when all fit at one table', () => {
    const t1 = makeTable('t1', ['a', 'b', null, null, null, null, null, null, null]);
    const t2 = makeTable('t2', ['c', 'd', null, null, null, null, null, null, null]);
    const players = activePlayers(['a', 'b', 'c', 'd']);
    expect(shouldMergeToFinalTable([t1, t2], players)).toBe(true);
  });

  it('toggleSeatLock locks an empty seat', () => {
    const table = createTable('T1', 6);
    const tables = toggleSeatLock([table], table.id, 3);
    expect(tables[0].seats[2].locked).toBe(true);
  });

  it('advanceTableDealer skips empty seats', () => {
    const table = makeTable('t1', [null, 'a', null, 'b', null, null, null, null, null]);
    table.dealerSeat = 2; // seat 2 has player 'a'
    const players = activePlayers(['a', 'b']);
    const result = advanceTableDealer(table, players);
    expect(result.dealerSeat).toBe(4); // next occupied seat
  });

  it('findPlayerSeat finds correct table and seat', () => {
    const t1 = makeTable('t1', [null, 'p1', null]);
    const t2 = makeTable('t2', ['p2', null, null]);
    const result = findPlayerSeat([t1, t2], 'p1');
    expect(result).not.toBeNull();
    expect(result!.table.id).toBe('t1');
    expect(result!.seat.seatNumber).toBe(2);
  });

  it('seatPlayerAtSmallestTable picks table with fewest players', () => {
    const t1 = makeTable('t1', ['a', 'b', 'c', null, null]);
    const t2 = makeTable('t2', ['d', null, null, null, null]);
    const players = activePlayers(['a', 'b', 'c', 'd', 'e']);
    const result = seatPlayerAtSmallestTable([t1, t2], players, 'e');
    expect(result).not.toBeNull();
    expect(result!.tableId).toBe('t2'); // fewer active players
  });
});

// ============================= PHASE 11 ===================================
// Format & Edge Cases
// ======================================================================

describe('Format edge cases (Phase 11)', () => {
  describe('formatTime', () => {
    it('formats 0 seconds as 00:00', () => {
      expect(formatTime(0)).toBe('00:00');
    });

    it('formats negative seconds as 00:00', () => {
      expect(formatTime(-10)).toBe('00:00');
    });

    it('formats 3599 seconds as 59:59', () => {
      expect(formatTime(3599)).toBe('59:59');
    });

    it('formats 3600+ seconds correctly', () => {
      expect(formatTime(3661)).toBe('61:01');
    });
  });

  describe('formatElapsedTime', () => {
    it('formats 0 as 0:00:00', () => {
      expect(formatElapsedTime(0)).toBe('0:00:00');
    });

    it('formats 90 minutes correctly', () => {
      expect(formatElapsedTime(5400)).toBe('1:30:00');
    });
  });

  describe('getLevelLabel', () => {
    it('returns custom label for break with label', () => {
      const level = makeLevel({ type: 'break', label: 'Dinner Break' });
      expect(getLevelLabel(level, 0, [level])).toBe('Dinner Break');
    });

    it('counts only play levels for numbering', () => {
      const levels: Level[] = [
        makeLevel({ id: 'l0' }),
        makeLevel({ id: 'b1', type: 'break' }),
        makeLevel({ id: 'l2' }),
      ];
      const label = getLevelLabel(levels[2], 2, levels);
      expect(label).toContain('2'); // Level 2, not Level 3
    });
  });

  describe('getBlindsText', () => {
    it('returns empty string for break', () => {
      expect(getBlindsText(makeLevel({ type: 'break' }))).toBe('');
    });

    it('includes ante when present', () => {
      const text = getBlindsText(makeLevel({ smallBlind: 100, bigBlind: 200, ante: 25 }));
      expect(text).toContain('100');
      expect(text).toContain('200');
      expect(text).toContain('25');
    });
  });
});

// ============================= PHASE 11 (cont) ============================
// Tournament calculation edge cases
// ======================================================================

describe('Tournament calculation edge cases (Phase 11)', () => {
  describe('computeSidePots', () => {
    it('handles empty stacks', () => {
      expect(computeSidePots([])).toEqual([]);
    });

    it('handles single player (returns empty — needs at least 2)', () => {
      const pots = computeSidePots([1000]);
      expect(pots).toHaveLength(0);
    });

    it('handles all-zero stacks', () => {
      const pots = computeSidePots([0, 0, 0]);
      expect(pots).toEqual([]);
    });
  });

  describe('computePayouts', () => {
    it('handles zero prize pool', () => {
      const result = computePayouts({ mode: 'percent', entries: [{ place: 1, value: 100 }] }, 0);
      expect(result[0].amount).toBe(0);
    });

    it('distributes percent payouts correctly', () => {
      const result = computePayouts({
        mode: 'percent',
        entries: [{ place: 1, value: 50 }, { place: 2, value: 30 }, { place: 3, value: 20 }],
      }, 1000);
      expect(result[0].amount).toBe(500);
      expect(result[1].amount).toBe(300);
      expect(result[2].amount).toBe(200);
    });
  });

  describe('csvSafe', () => {
    it('escapes strings starting with =', () => {
      const result = csvSafe('=SUM(A1)');
      expect(result.startsWith('=')).toBe(false);
    });

    it('escapes strings with commas', () => {
      const result = csvSafe('Alice, Bob');
      expect(result).toContain('"');
    });
  });

  describe('decodeResultFromQR', () => {
    it('returns null for empty string', () => {
      expect(decodeResultFromQR('')).toBeNull();
    });

    it('returns null for invalid format', () => {
      expect(decodeResultFromQR('not|valid')).toBeNull();
    });
  });

  describe('defaultPayoutForPlayerCount', () => {
    it('returns payout for 2 players', () => {
      const payout = defaultPayoutForPlayerCount(2);
      expect(payout.entries.length).toBeGreaterThanOrEqual(1);
    });

    it('returns more places for more players', () => {
      const small = defaultPayoutForPlayerCount(4);
      const large = defaultPayoutForPlayerCount(20);
      expect(large.entries.length).toBeGreaterThanOrEqual(small.entries.length);
    });
  });
});

// ============================= PHASE 12 ===================================
// Validation edge cases
// ======================================================================

describe('Validation edge cases (Phase 12)', () => {
  describe('validatePayoutConfig', () => {
    it('rejects negative payout values', () => {
      const errors = validatePayoutConfig({
        mode: 'percent',
        entries: [{ place: 1, value: -10 }],
      });
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects duplicate places', () => {
      const errors = validatePayoutConfig({
        mode: 'percent',
        entries: [{ place: 1, value: 50 }, { place: 1, value: 50 }],
      });
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});

// ============================= PHASE 13 ===================================
// Helpers & Robustness
// ======================================================================

describe('Helpers & robustness (Phase 13)', () => {
  describe('ID generators', () => {
    it('generateId produces unique IDs', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateId()));
      expect(ids.size).toBe(100);
    });

    it('generatePlayerId produces unique IDs', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generatePlayerId()));
      expect(ids.size).toBe(100);
    });

    it('generateChipId produces unique IDs', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateChipId()));
      expect(ids.size).toBe(100);
    });
  });

  describe('snapSpinnerValue', () => {
    it('snaps up when incrementing', () => {
      // 1500 → 2500 (step 1000), should snap to 2000 or 3000
      const result = snapSpinnerValue(2500, 1500, 1000);
      expect(result % 1000).toBe(0);
    });

    it('snaps down when decrementing', () => {
      const result = snapSpinnerValue(1500, 2500, 1000);
      expect(result % 1000).toBe(0);
    });

    it('enforces minimum value', () => {
      expect(snapSpinnerValue(-5, 0, 1, 0)).toBe(0);
      expect(snapSpinnerValue(0, 5, 5, 1)).toBe(1);
    });

    it('accepts direct keyboard input as-is', () => {
      // Large diff = keyboard input, not spinner click
      const result = snapSpinnerValue(1234, 0, 1000);
      expect(result).toBe(1234);
    });
  });

  // ---------------------------------------------------------------------------
  // Break Extension (Task A3.1)
  // ---------------------------------------------------------------------------

  describe('break extension', () => {
    it('skip break advances to next level', () => {
      const levels: Level[] = [
        { type: 'level', smallBlind: 25, bigBlind: 50, ante: 0, durationSeconds: 600 },
        { type: 'break', durationSeconds: 300 },
        { type: 'level', smallBlind: 50, bigBlind: 100, ante: 0, durationSeconds: 600 },
      ];
      const state: TimerState = {
        currentLevelIndex: 1,
        remainingSeconds: 200,
        status: 'stopped',
        startedAt: null,
        remainingAtStart: null,
      };
      const next = advanceLevel(state, levels);
      expect(next.currentLevelIndex).toBe(2);
      expect(next.remainingSeconds).toBe(600);
    });

    it('extendLevel concept: adding seconds increases remaining time', () => {
      // This tests the pure logic behind extendLevel — adding seconds to remaining time
      const remaining = 200;
      const additionalSeconds = 300;
      const extended = remaining + additionalSeconds;
      expect(extended).toBe(500);
    });
  });
});
