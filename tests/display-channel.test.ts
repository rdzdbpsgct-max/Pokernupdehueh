/**
 * DisplayChannel Tests — Phase 9/12
 *
 * Tests the BroadcastChannel communication layer for TV display mode.
 * Covers: serializeColorUpMap, deserializeColorUpMap round-trip,
 * createDisplayChannel, sendDisplayMessage error handling.
 */
import {
  serializeColorUpMap,
  deserializeColorUpMap,
  createDisplayChannel,
  sendDisplayMessage,
} from '../src/domain/displayChannel';
import type { ChipDenomination } from '../src/domain/types';

// ---------------------------------------------------------------------------
// serializeColorUpMap / deserializeColorUpMap
// ---------------------------------------------------------------------------

describe('ColorUp Map serialization', () => {
  const sampleDenom: ChipDenomination = {
    id: 'chip-1',
    value: 25,
    color: '#ff0000',
    label: 'Red 25',
  };

  it('round-trips a Map with entries', () => {
    const map = new Map<number, ChipDenomination[]>();
    map.set(3, [sampleDenom]);
    map.set(7, [{ ...sampleDenom, id: 'chip-2', value: 100 }]);

    const serialized = serializeColorUpMap(map);
    expect(serialized).toHaveLength(2);

    const deserialized = deserializeColorUpMap(serialized);
    expect(deserialized).toBeInstanceOf(Map);
    expect(deserialized!.size).toBe(2);
    expect(deserialized!.get(3)![0].value).toBe(25);
    expect(deserialized!.get(7)![0].value).toBe(100);
  });

  it('serializes undefined → undefined', () => {
    expect(serializeColorUpMap(undefined)).toBeUndefined();
  });

  it('serializes empty map → undefined', () => {
    expect(serializeColorUpMap(new Map())).toBeUndefined();
  });

  it('deserializes undefined → undefined', () => {
    expect(deserializeColorUpMap(undefined)).toBeUndefined();
  });

  it('deserializes empty array → undefined', () => {
    expect(deserializeColorUpMap([])).toBeUndefined();
  });

  it('preserves all chip denomination fields', () => {
    const fullDenom: ChipDenomination = {
      id: 'chip-full',
      value: 500,
      color: '#00ff00',
      label: 'Green 500',
    };
    const map = new Map<number, ChipDenomination[]>();
    map.set(5, [fullDenom]);

    const serialized = serializeColorUpMap(map);
    const deserialized = deserializeColorUpMap(serialized);
    const result = deserialized!.get(5)![0];

    expect(result.id).toBe('chip-full');
    expect(result.value).toBe(500);
    expect(result.color).toBe('#00ff00');
    expect(result.label).toBe('Green 500');
  });

  it('handles multiple denominations per level', () => {
    const map = new Map<number, ChipDenomination[]>();
    map.set(2, [
      { id: 'c1', value: 25, color: '#f00', label: 'Red' },
      { id: 'c2', value: 50, color: '#0f0', label: 'Green' },
    ]);

    const serialized = serializeColorUpMap(map);
    const deserialized = deserializeColorUpMap(serialized);
    expect(deserialized!.get(2)).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// createDisplayChannel
// ---------------------------------------------------------------------------

describe('createDisplayChannel', () => {
  it('creates a BroadcastChannel', () => {
    const channel = createDisplayChannel();
    expect(channel).toBeDefined();
    expect(channel).toBeInstanceOf(BroadcastChannel);
    channel.close();
  });
});

// ---------------------------------------------------------------------------
// sendDisplayMessage
// ---------------------------------------------------------------------------

describe('sendDisplayMessage', () => {
  it('sends a full-state message without throwing', () => {
    const channel = createDisplayChannel();
    expect(() =>
      sendDisplayMessage(channel, {
        type: 'close',
      })
    ).not.toThrow();
    channel.close();
  });

  it('does not throw on closed channel', () => {
    const channel = createDisplayChannel();
    channel.close();
    // Should catch internally and not throw
    expect(() =>
      sendDisplayMessage(channel, { type: 'close' })
    ).not.toThrow();
  });

  it('sends timer-tick messages', () => {
    const channel = createDisplayChannel();
    expect(() =>
      sendDisplayMessage(channel, {
        type: 'timer-tick',
        payload: { remainingSeconds: 120, status: 'running', currentLevelIndex: 3 },
      })
    ).not.toThrow();
    channel.close();
  });

  it('sends call-the-clock messages', () => {
    const channel = createDisplayChannel();
    expect(() =>
      sendDisplayMessage(channel, {
        type: 'call-the-clock',
        payload: { durationSeconds: 60, soundEnabled: true, voiceEnabled: false },
      })
    ).not.toThrow();
    channel.close();
  });
});
