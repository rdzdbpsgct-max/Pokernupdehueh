import type { TournamentResult } from './types';
import { loadPlayerDatabase, savePlayerDatabase, syncPlayersToDatabase } from './playerDatabase';

// ---------------------------------------------------------------------------
// Tournament History (persistent results)
// ---------------------------------------------------------------------------

const HISTORY_KEY = 'poker-timer-history';
export const MAX_HISTORY = 200;

export function saveTournamentResult(result: TournamentResult): void {
  try {
    const history = loadTournamentHistory();
    history.unshift(result);
    if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch { /* private browsing or quota exceeded */ }

  // Auto-save player names to persistent database
  syncPlayersToDatabase(result.players.map((p) => p.name));
}

function isValidTournamentResult(item: unknown): item is TournamentResult {
  if (!item || typeof item !== 'object') return false;
  const r = item as Record<string, unknown>;
  return typeof r.id === 'string' && typeof r.date === 'string' && Array.isArray(r.players);
}

export function loadTournamentHistory(): TournamentResult[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidTournamentResult);
  } catch {
    return [];
  }
}

export function deleteTournamentResult(id: string): void {
  try {
    const history = loadTournamentHistory();
    const filtered = history.filter((r) => r.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  } catch { /* ignore */ }
}

export function clearTournamentHistory(): void {
  try { localStorage.removeItem(HISTORY_KEY); } catch { /* ignore */ }
}

/**
 * Import player names from tournament history into the player database.
 * Deduplicates by normalized (lowercased) name.
 */
export function importPlayersFromHistory(): number {
  const history = loadTournamentHistory();
  const db = loadPlayerDatabase();
  const existingNames = new Set(db.map((p) => p.name.toLowerCase()));
  let added = 0;
  const now = new Date().toISOString();

  for (const result of history) {
    for (const player of result.players) {
      const normalized = player.name.trim();
      if (!normalized) continue;
      if (existingNames.has(normalized.toLowerCase())) continue;
      existingNames.add(normalized.toLowerCase());
      db.push({
        id: `rp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${added}`,
        name: normalized,
        createdAt: now,
        lastPlayedAt: result.date,
      });
      added++;
    }
  }

  if (added > 0) savePlayerDatabase(db);
  return added;
}
