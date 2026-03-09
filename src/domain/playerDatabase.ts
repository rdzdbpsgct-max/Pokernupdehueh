import type { RegisteredPlayer } from './types';

// ---------------------------------------------------------------------------
// Persistent Player Database
// ---------------------------------------------------------------------------

const PLAYERS_KEY = 'poker-timer-players';

function isValidRegisteredPlayer(item: unknown): item is RegisteredPlayer {
  if (!item || typeof item !== 'object') return false;
  const r = item as Record<string, unknown>;
  return typeof r.id === 'string' && typeof r.name === 'string' && typeof r.createdAt === 'string';
}

export function loadPlayerDatabase(): RegisteredPlayer[] {
  try {
    const raw = localStorage.getItem(PLAYERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidRegisteredPlayer);
  } catch {
    return [];
  }
}

export function savePlayerDatabase(players: RegisteredPlayer[]): void {
  try {
    localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
  } catch { /* private browsing or quota exceeded */ }
}

export function addRegisteredPlayer(name: string): RegisteredPlayer {
  const db = loadPlayerDatabase();
  const normalized = name.trim();
  // Check for duplicate (case-insensitive)
  const existing = db.find((p) => p.name.toLowerCase() === normalized.toLowerCase());
  if (existing) {
    existing.lastPlayedAt = new Date().toISOString();
    savePlayerDatabase(db);
    return existing;
  }
  const player: RegisteredPlayer = {
    id: `rp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: normalized,
    createdAt: new Date().toISOString(),
    lastPlayedAt: new Date().toISOString(),
  };
  db.push(player);
  savePlayerDatabase(db);
  return player;
}

export function deleteRegisteredPlayer(id: string): void {
  const db = loadPlayerDatabase().filter((p) => p.id !== id);
  savePlayerDatabase(db);
}

/**
 * Sync player names from a finished tournament into the player database.
 * Updates lastPlayedAt for existing players, adds new ones.
 */
export function syncPlayersToDatabase(playerNames: string[]): void {
  const db = loadPlayerDatabase();
  const nameMap = new Map(db.map((p) => [p.name.toLowerCase(), p]));
  const now = new Date().toISOString();
  let changed = false;

  for (const name of playerNames) {
    const normalized = name.trim();
    if (!normalized) continue;
    const existing = nameMap.get(normalized.toLowerCase());
    if (existing) {
      existing.lastPlayedAt = now;
      changed = true;
    } else {
      const player: RegisteredPlayer = {
        id: `rp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: normalized,
        createdAt: now,
        lastPlayedAt: now,
      };
      db.push(player);
      nameMap.set(normalized.toLowerCase(), player);
      changed = true;
    }
  }

  if (changed) savePlayerDatabase(db);
}
