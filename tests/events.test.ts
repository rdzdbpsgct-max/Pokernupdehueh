import {
  createEvent,
  filterEventsByType,
  filterEventsByPlayer,
  getElimination,
  getRebuyEvents,
  formatEventTimestamp,
  formatEventAsText,
} from '../src/domain/tournamentEvents';
import type { TournamentEvent } from '../src/domain/types';

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
