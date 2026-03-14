// ---------------------------------------------------------------------------
// tournamentEvents.ts — Tournament Event Log domain logic
// ---------------------------------------------------------------------------
//
// Append-only event log for tracking all tournament actions.
// Pure functions, no React dependencies.
// ---------------------------------------------------------------------------

import type { TournamentEvent, TournamentEventType } from './types';

// ---------------------------------------------------------------------------
// Event ID generation
// ---------------------------------------------------------------------------

let eventIdCounter = 0;

/** Generates a unique event ID using timestamp and incrementing counter. */
function generateEventId(): string {
  return `evt_${Date.now()}_${eventIdCounter++}`;
}

// ---------------------------------------------------------------------------
// Event creation
// ---------------------------------------------------------------------------

/**
 * Creates a new TournamentEvent with a unique ID and current timestamp.
 */
export function createEvent(
  type: TournamentEventType,
  levelIndex: number,
  data: Record<string, unknown> = {},
): TournamentEvent {
  return {
    id: generateEventId(),
    type,
    timestamp: Date.now(),
    levelIndex,
    data,
  };
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

/** Returns all events matching the given type. */
export function filterEventsByType(
  events: TournamentEvent[],
  type: TournamentEventType,
): TournamentEvent[] {
  return events.filter((e) => e.type === type);
}

/** Returns events where data.playerId or data.eliminatorId matches the given ID. */
export function filterEventsByPlayer(
  events: TournamentEvent[],
  playerId: string,
): TournamentEvent[] {
  return events.filter(
    (e) => e.data.playerId === playerId || e.data.eliminatorId === playerId,
  );
}

/** Finds the first elimination event for a player (or undefined). */
export function getElimination(
  events: TournamentEvent[],
  playerId: string,
): TournamentEvent | undefined {
  return events.find(
    (e) => e.type === 'player_eliminated' && e.data.playerId === playerId,
  );
}

/** Returns all rebuy events for a specific player. */
export function getRebuyEvents(
  events: TournamentEvent[],
  playerId: string,
): TournamentEvent[] {
  return events.filter(
    (e) => e.type === 'rebuy_taken' && e.data.playerId === playerId,
  );
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** Formats a timestamp as HH:MM:SS in de-DE locale. */
export function formatEventTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * Formats a single event as compact text with emojis (WhatsApp-friendly).
 * @param event The event to format
 * @param playerNameMap Map from player ID to display name
 */
export function formatEventAsText(
  event: TournamentEvent,
  playerNameMap: Record<string, string>,
): string {
  const time = formatEventTimestamp(event.timestamp);
  const playerName = (id: unknown) =>
    typeof id === 'string' ? (playerNameMap[id] ?? id) : String(id ?? '');

  switch (event.type) {
    case 'player_eliminated': {
      const name = playerName(event.data.playerId);
      const eliminator = event.data.eliminatorId
        ? ` (von ${playerName(event.data.eliminatorId)})`
        : '';
      const placement = event.data.placement != null
        ? ` → Platz ${event.data.placement}`
        : '';
      return `${time} ❌ ${name} ausgeschieden${eliminator}${placement}`;
    }
    case 'rebuy_taken':
      return `${time} 🔄 ${playerName(event.data.playerId)} Rebuy`;
    case 'addon_taken':
      return `${time} ➕ ${playerName(event.data.playerId)} Add-On`;
    case 'level_start':
      return `${time} ▶ Level ${typeof event.data.levelNumber === 'number' ? event.data.levelNumber : event.levelIndex + 1} gestartet`;
    case 'timer_paused':
      return `${time} ⏸ Timer pausiert`;
    case 'timer_resumed':
      return `${time} ▶ Timer fortgesetzt`;
    case 'break_extended':
      return `${time} ☕ Pause verlängert (+${event.data.seconds ?? 0}s)`;
    case 'break_skipped':
      return `${time} ⏭ Pause übersprungen`;
    case 'tournament_started':
      return `${time} 🃏 Turnier gestartet`;
    case 'tournament_finished':
      return `${time} 🏆 Turnier beendet`;
    case 'player_reinstated':
      return `${time} ↩ ${playerName(event.data.playerId)} zurück im Turnier`;
    case 'late_registration':
      return `${time} 📝 ${playerName(event.data.playerId)} nachgemeldet`;
    case 're_entry':
      return `${time} 🔁 ${playerName(event.data.playerId)} Re-Entry`;
    case 'dealer_advanced':
      return `${time} 🎯 Dealer weitergerückt`;
    case 'table_move':
      return `${time} 🔀 ${playerName(event.data.playerId)} Tischwechsel`;
    case 'table_dissolved':
      return `${time} 🚫 Tisch ${event.data.tableNumber ?? ''} aufgelöst`;
    case 'call_the_clock_started':
      return `${time} ⏱ Call the Clock gestartet`;
    case 'call_the_clock_expired':
      return `${time} ⏱ Call the Clock abgelaufen`;
    case 'level_skip_forward':
      return `${time} ⏩ Level vorgesprungen`;
    case 'level_skip_backward':
      return `${time} ⏪ Level zurückgesprungen`;
    default:
      return `${time} ${event.type}`;
  }
}
