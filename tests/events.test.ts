import {
  createEvent,
  filterEventsByType,
  filterEventsByPlayer,
  getElimination,
  getRebuyEvents,
  formatEventTimestamp,
  formatEventAsText,
} from '../src/domain/tournamentEvents';
import {
  createDefaultAlert,
  interpolateAlertText,
  shouldFireAlert,
} from '../src/domain/alertEngine';
import type { TournamentEvent, TournamentConfig, AlertConfig } from '../src/domain/types';

// ---------------------------------------------------------------------------
// createEvent
// ---------------------------------------------------------------------------

describe('createEvent', () => {
  it('creates an event with correct type and levelIndex', () => {
    const event = createEvent('level_start', 3, { levelNumber: 4 });
    expect(event.type).toBe('level_start');
    expect(event.levelIndex).toBe(3);
    expect(event.data.levelNumber).toBe(4);
  });

  it('sets a timestamp close to now', () => {
    const before = Date.now();
    const event = createEvent('timer_paused', 0);
    const after = Date.now();
    expect(event.timestamp).toBeGreaterThanOrEqual(before);
    expect(event.timestamp).toBeLessThanOrEqual(after);
  });

  it('uses empty data when none provided', () => {
    const event = createEvent('tournament_started', 0);
    expect(event.data).toEqual({});
  });

  it('generates unique IDs across 100 events', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const event = createEvent('timer_paused', 0);
      ids.add(event.id);
    }
    expect(ids.size).toBe(100);
  });

  it('generates IDs with evt_ prefix', () => {
    const event = createEvent('tournament_started', 0);
    expect(event.id).toMatch(/^evt_/);
  });
});

// ---------------------------------------------------------------------------
// filterEventsByType
// ---------------------------------------------------------------------------

describe('filterEventsByType', () => {
  const events: TournamentEvent[] = [
    createEvent('level_start', 0, { levelNumber: 1 }),
    createEvent('player_eliminated', 1, { playerId: 'p1' }),
    createEvent('rebuy_taken', 1, { playerId: 'p1' }),
    createEvent('player_eliminated', 2, { playerId: 'p2' }),
    createEvent('level_start', 2, { levelNumber: 3 }),
  ];

  it('filters by matching type', () => {
    const result = filterEventsByType(events, 'player_eliminated');
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.type === 'player_eliminated')).toBe(true);
  });

  it('returns empty array when no match', () => {
    const result = filterEventsByType(events, 'tournament_finished');
    expect(result).toHaveLength(0);
  });

  it('returns all matching level_start events', () => {
    const result = filterEventsByType(events, 'level_start');
    expect(result).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// filterEventsByPlayer
// ---------------------------------------------------------------------------

describe('filterEventsByPlayer', () => {
  const events: TournamentEvent[] = [
    createEvent('player_eliminated', 1, { playerId: 'p1', eliminatorId: 'p3' }),
    createEvent('rebuy_taken', 1, { playerId: 'p1' }),
    createEvent('player_eliminated', 2, { playerId: 'p2', eliminatorId: 'p1' }),
    createEvent('addon_taken', 2, { playerId: 'p2' }),
    createEvent('level_start', 3),
  ];

  it('finds events where player is the subject (playerId)', () => {
    const result = filterEventsByPlayer(events, 'p1');
    // p1 is playerId in events 0, 1 and eliminatorId in event 2
    expect(result).toHaveLength(3);
  });

  it('finds events where player is the eliminator (eliminatorId)', () => {
    const result = filterEventsByPlayer(events, 'p3');
    expect(result).toHaveLength(1);
    expect(result[0].data.eliminatorId).toBe('p3');
  });

  it('returns empty for unknown player', () => {
    const result = filterEventsByPlayer(events, 'unknown');
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// getElimination
// ---------------------------------------------------------------------------

describe('getElimination', () => {
  const events: TournamentEvent[] = [
    createEvent('rebuy_taken', 1, { playerId: 'p1' }),
    createEvent('player_eliminated', 2, { playerId: 'p1', placement: 3 }),
    createEvent('player_eliminated', 3, { playerId: 'p2', placement: 2 }),
  ];

  it('finds the elimination event for a player', () => {
    const result = getElimination(events, 'p1');
    expect(result).toBeDefined();
    expect(result!.data.playerId).toBe('p1');
    expect(result!.data.placement).toBe(3);
  });

  it('returns undefined for player without elimination', () => {
    const result = getElimination(events, 'p3');
    expect(result).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getRebuyEvents
// ---------------------------------------------------------------------------

describe('getRebuyEvents', () => {
  const events: TournamentEvent[] = [
    createEvent('rebuy_taken', 0, { playerId: 'p1' }),
    createEvent('rebuy_taken', 1, { playerId: 'p1' }),
    createEvent('rebuy_taken', 1, { playerId: 'p2' }),
    createEvent('addon_taken', 2, { playerId: 'p1' }),
  ];

  it('returns correct count for player with multiple rebuys', () => {
    const result = getRebuyEvents(events, 'p1');
    expect(result).toHaveLength(2);
  });

  it('returns correct count for player with one rebuy', () => {
    const result = getRebuyEvents(events, 'p2');
    expect(result).toHaveLength(1);
  });

  it('returns empty for player without rebuys', () => {
    const result = getRebuyEvents(events, 'p3');
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// formatEventTimestamp
// ---------------------------------------------------------------------------

describe('formatEventTimestamp', () => {
  it('formats timestamp as HH:MM:SS', () => {
    // Use a known timestamp: 2024-01-15 14:30:45 UTC
    const ts = new Date('2024-01-15T14:30:45Z').getTime();
    const result = formatEventTimestamp(ts);
    // Should match HH:MM:SS pattern regardless of timezone
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });
});

// ---------------------------------------------------------------------------
// formatEventAsText
// ---------------------------------------------------------------------------

describe('formatEventAsText', () => {
  const names: Record<string, string> = {
    p1: 'Alice',
    p2: 'Bob',
    p3: 'Charlie',
  };

  it('formats player_eliminated with eliminator and placement', () => {
    const event = createEvent('player_eliminated', 2, {
      playerId: 'p1',
      eliminatorId: 'p2',
      placement: 3,
    });
    const text = formatEventAsText(event, names);
    expect(text).toContain('❌');
    expect(text).toContain('Alice');
    expect(text).toContain('von Bob');
    expect(text).toContain('Platz 3');
  });

  it('formats player_eliminated without eliminator', () => {
    const event = createEvent('player_eliminated', 2, {
      playerId: 'p1',
      placement: 2,
    });
    const text = formatEventAsText(event, names);
    expect(text).toContain('❌');
    expect(text).toContain('Alice');
    expect(text).not.toContain('von');
    expect(text).toContain('Platz 2');
  });

  it('formats rebuy_taken', () => {
    const event = createEvent('rebuy_taken', 1, { playerId: 'p1' });
    const text = formatEventAsText(event, names);
    expect(text).toContain('🔄');
    expect(text).toContain('Alice');
    expect(text).toContain('Rebuy');
  });

  it('formats addon_taken', () => {
    const event = createEvent('addon_taken', 2, { playerId: 'p2' });
    const text = formatEventAsText(event, names);
    expect(text).toContain('➕');
    expect(text).toContain('Bob');
    expect(text).toContain('Add-On');
  });

  it('formats level_start with level number', () => {
    const event = createEvent('level_start', 4, { levelNumber: 5 });
    const text = formatEventAsText(event, names);
    expect(text).toContain('▶');
    expect(text).toContain('Level 5');
    expect(text).toContain('gestartet');
  });

  it('formats level_start without explicit levelNumber uses levelIndex+1', () => {
    const event = createEvent('level_start', 3);
    const text = formatEventAsText(event, names);
    expect(text).toContain('Level 4');
  });

  it('formats timer_paused', () => {
    const event = createEvent('timer_paused', 0);
    const text = formatEventAsText(event, names);
    expect(text).toContain('⏸');
    expect(text).toContain('Timer pausiert');
  });

  it('formats timer_resumed', () => {
    const event = createEvent('timer_resumed', 0);
    const text = formatEventAsText(event, names);
    expect(text).toContain('▶');
    expect(text).toContain('Timer fortgesetzt');
  });

  it('formats tournament_started', () => {
    const event = createEvent('tournament_started', 0);
    const text = formatEventAsText(event, names);
    expect(text).toContain('🃏');
    expect(text).toContain('Turnier gestartet');
  });

  it('formats tournament_finished', () => {
    const event = createEvent('tournament_finished', 5);
    const text = formatEventAsText(event, names);
    expect(text).toContain('🏆');
    expect(text).toContain('Turnier beendet');
  });

  it('formats break_extended with seconds', () => {
    const event = createEvent('break_extended', 2, { seconds: 300 });
    const text = formatEventAsText(event, names);
    expect(text).toContain('☕');
    expect(text).toContain('+300s');
  });

  it('formats break_skipped', () => {
    const event = createEvent('break_skipped', 2);
    const text = formatEventAsText(event, names);
    expect(text).toContain('⏭');
    expect(text).toContain('Pause übersprungen');
  });

  it('formats player_reinstated', () => {
    const event = createEvent('player_reinstated', 2, { playerId: 'p1' });
    const text = formatEventAsText(event, names);
    expect(text).toContain('↩');
    expect(text).toContain('Alice');
  });

  it('formats late_registration', () => {
    const event = createEvent('late_registration', 1, { playerId: 'p3' });
    const text = formatEventAsText(event, names);
    expect(text).toContain('📝');
    expect(text).toContain('Charlie');
  });

  it('formats call_the_clock_started', () => {
    const event = createEvent('call_the_clock_started', 3);
    const text = formatEventAsText(event, names);
    expect(text).toContain('⏱');
    expect(text).toContain('Call the Clock gestartet');
  });

  it('formats table_dissolved with table number', () => {
    const event = createEvent('table_dissolved', 2, { tableNumber: 3 });
    const text = formatEventAsText(event, names);
    expect(text).toContain('🚫');
    expect(text).toContain('Tisch 3');
  });

  it('uses player ID as fallback when name not in map', () => {
    const event = createEvent('rebuy_taken', 1, { playerId: 'unknown_player' });
    const text = formatEventAsText(event, names);
    expect(text).toContain('unknown_player');
  });
});

// ---------------------------------------------------------------------------
// Alert Engine — createDefaultAlert
// ---------------------------------------------------------------------------

describe('createDefaultAlert', () => {
  it('creates an alert with unique id and enabled=true', () => {
    const alert = createDefaultAlert('level_start');
    expect(alert.id).toBeTruthy();
    expect(alert.enabled).toBe(true);
    expect(alert.trigger).toBe('level_start');
    expect(alert.voice).toBe(true);
    expect(alert.sound).toBe('beep');
    expect(alert.text).toBe('');
  });

  it('creates two alerts with different IDs', () => {
    const a1 = createDefaultAlert('level_start');
    const a2 = createDefaultAlert('level_start');
    expect(a1.id).not.toBe(a2.id);
  });

  it('sets levelIndex for level_start trigger', () => {
    const alert = createDefaultAlert('level_start');
    expect(alert.levelIndex).toBe(0);
  });

  it('sets secondsBefore for time_remaining trigger', () => {
    const alert = createDefaultAlert('time_remaining');
    expect(alert.secondsBefore).toBe(60);
  });

  it('sets playerCount for player_count trigger', () => {
    const alert = createDefaultAlert('player_count');
    expect(alert.playerCount).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Alert Engine — interpolateAlertText
// ---------------------------------------------------------------------------

describe('interpolateAlertText', () => {
  const mockConfig: TournamentConfig = {
    name: 'Test',
    levels: [
      { id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50, ante: 5 },
      { id: '2', type: 'break', durationSeconds: 300 },
      { id: '3', type: 'level', durationSeconds: 600, smallBlind: 50, bigBlind: 100, ante: 10 },
    ],
    anteEnabled: true,
    anteMode: 'standard',
    players: [],
    dealerIndex: 0,
    payout: { mode: 'percent', entries: [] },
    rebuy: { enabled: false, limitType: 'levels', levelLimit: 3, timeLimit: 3600, rebuyCost: 10, rebuyChips: 1000 },
    addOn: { enabled: false, cost: 10, chips: 1000 },
    bounty: { enabled: false, amount: 0, type: 'fixed' },
    chips: { enabled: false, colorUpEnabled: false, denominations: [], colorUpSchedule: [] },
    buyIn: 10,
    startingChips: 1000,
  };

  it('replaces all 5 variables correctly', () => {
    const result = interpolateAlertText(
      'Level {level}: Blinds {smallBlind}/{bigBlind}, Ante {ante}, {players} Spieler',
      { levelIndex: 0, config: mockConfig, activePlayers: 8 },
    );
    expect(result).toBe('Level 1: Blinds 25/50, Ante 5, 8 Spieler');
  });

  it('computes correct play-level number skipping breaks', () => {
    const result = interpolateAlertText('{level}', {
      levelIndex: 2, config: mockConfig, activePlayers: 5,
    });
    expect(result).toBe('2'); // levels[0] is level 1, levels[1] is break, levels[2] is level 2
  });

  it('handles text without variables', () => {
    const result = interpolateAlertText('Pause beginnt!', {
      levelIndex: 1, config: mockConfig, activePlayers: 6,
    });
    expect(result).toBe('Pause beginnt!');
  });
});

// ---------------------------------------------------------------------------
// Alert Engine — shouldFireAlert
// ---------------------------------------------------------------------------

describe('shouldFireAlert', () => {
  const baseAlert: AlertConfig = {
    id: 'test-1',
    enabled: true,
    trigger: 'level_start',
    text: 'test',
    voice: true,
    sound: 'beep',
  };

  it('returns false when alert is disabled', () => {
    const alert = { ...baseAlert, enabled: false };
    expect(shouldFireAlert(alert, 'level_start', {
      levelIndex: 0, remainingSeconds: 300, activePlayers: 5, prevActivePlayers: 5,
    })).toBe(false);
  });

  it('returns false when trigger type does not match', () => {
    expect(shouldFireAlert(baseAlert, 'break_start', {
      levelIndex: 0, remainingSeconds: 300, activePlayers: 5, prevActivePlayers: 5,
    })).toBe(false);
  });

  it('level_start: matches correct level index', () => {
    const alert = { ...baseAlert, trigger: 'level_start' as const, levelIndex: 3 };
    expect(shouldFireAlert(alert, 'level_start', {
      levelIndex: 3, remainingSeconds: 300, activePlayers: 5, prevActivePlayers: 5,
    })).toBe(true);
  });

  it('level_start: does not match wrong level index', () => {
    const alert = { ...baseAlert, trigger: 'level_start' as const, levelIndex: 3 };
    expect(shouldFireAlert(alert, 'level_start', {
      levelIndex: 2, remainingSeconds: 300, activePlayers: 5, prevActivePlayers: 5,
    })).toBe(false);
  });

  it('time_remaining: matches exact seconds', () => {
    const alert = { ...baseAlert, trigger: 'time_remaining' as const, secondsBefore: 60 };
    expect(shouldFireAlert(alert, 'time_remaining', {
      levelIndex: 0, remainingSeconds: 60, activePlayers: 5, prevActivePlayers: 5,
    })).toBe(true);
  });

  it('time_remaining: does not match different seconds', () => {
    const alert = { ...baseAlert, trigger: 'time_remaining' as const, secondsBefore: 60 };
    expect(shouldFireAlert(alert, 'time_remaining', {
      levelIndex: 0, remainingSeconds: 59, activePlayers: 5, prevActivePlayers: 5,
    })).toBe(false);
  });

  it('break_start: always matches when trigger type is break_start', () => {
    const alert = { ...baseAlert, trigger: 'break_start' as const };
    expect(shouldFireAlert(alert, 'break_start', {
      levelIndex: 1, remainingSeconds: 300, activePlayers: 5, prevActivePlayers: 5,
    })).toBe(true);
  });

  it('player_count: matches on transition down to target', () => {
    const alert = { ...baseAlert, trigger: 'player_count' as const, playerCount: 4 };
    expect(shouldFireAlert(alert, 'player_count', {
      levelIndex: 0, remainingSeconds: 300, activePlayers: 4, prevActivePlayers: 5,
    })).toBe(true);
  });

  it('player_count: does not match when not transitioning', () => {
    const alert = { ...baseAlert, trigger: 'player_count' as const, playerCount: 4 };
    expect(shouldFireAlert(alert, 'player_count', {
      levelIndex: 0, remainingSeconds: 300, activePlayers: 4, prevActivePlayers: 4,
    })).toBe(false);
  });

  it('player_count: does not match wrong count', () => {
    const alert = { ...baseAlert, trigger: 'player_count' as const, playerCount: 4 };
    expect(shouldFireAlert(alert, 'player_count', {
      levelIndex: 0, remainingSeconds: 300, activePlayers: 3, prevActivePlayers: 4,
    })).toBe(false);
  });
});
