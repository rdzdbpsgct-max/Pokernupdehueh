import type { Table, TableMove, Player } from './types';
import { generateId } from './helpers';

// ---------------------------------------------------------------------------
// Table CRUD
// ---------------------------------------------------------------------------

/** Create a default table with auto-generated name */
export function createTable(name: string, seats: number = 10): Table {
  return { id: generateId(), name, seats, playerIds: [] };
}

// ---------------------------------------------------------------------------
// Player distribution
// ---------------------------------------------------------------------------

/** Distribute players evenly across tables */
export function distributePlayersToTables(playerIds: string[], tables: Table[]): Table[] {
  if (tables.length === 0) return [];
  const updated = tables.map(t => ({ ...t, playerIds: [] as string[] }));
  playerIds.forEach((pid, i) => {
    updated[i % updated.length].playerIds.push(pid);
  });
  return updated;
}

// ---------------------------------------------------------------------------
// Active player counts
// ---------------------------------------------------------------------------

/** Get active player count per table */
export function getActivePlayersPerTable(tables: Table[], players: Player[]): Map<string, number> {
  const activeIds = new Set(players.filter(p => p.status === 'active').map(p => p.id));
  const result = new Map<string, number>();
  for (const table of tables) {
    result.set(table.id, table.playerIds.filter(id => activeIds.has(id)).length);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Player removal (on elimination)
// ---------------------------------------------------------------------------

/** Remove a player from their table (on elimination) */
export function removePlayerFromTable(tables: Table[], playerId: string): Table[] {
  return tables.map(t => ({
    ...t,
    playerIds: t.playerIds.filter(id => id !== playerId),
  }));
}

// ---------------------------------------------------------------------------
// Table lookup
// ---------------------------------------------------------------------------

/** Find which table a player is at */
export function findPlayerTable(tables: Table[], playerId: string): Table | undefined {
  return tables.find(t => t.playerIds.includes(playerId));
}

// ---------------------------------------------------------------------------
// Table balancing
// ---------------------------------------------------------------------------

/**
 * Balance tables so max player difference is <= 1.
 * Returns list of moves needed. Uses "move from largest to smallest" strategy.
 */
export function balanceTables(tables: Table[], players: Player[]): { tables: Table[]; moves: TableMove[] } {
  const moves: TableMove[] = [];
  const updated = tables.map(t => ({ ...t, playerIds: [...t.playerIds] }));
  const activeIds = new Set(players.filter(p => p.status === 'active').map(p => p.id));
  const playerMap = new Map(players.map(p => [p.id, p]));

  // Keep balancing until max diff <= 1
  let maxIterations = 50; // safety
  while (maxIterations-- > 0) {
    // Count active players per table
    const counts = updated.map(t => ({
      table: t,
      active: t.playerIds.filter(id => activeIds.has(id)).length,
    }));

    counts.sort((a, b) => b.active - a.active); // desc
    const max = counts[0]?.active ?? 0;
    const min = counts[counts.length - 1]?.active ?? 0;

    if (max - min <= 1) break; // balanced

    // Move one player from largest to smallest
    const from = counts[0].table;
    const to = counts[counts.length - 1].table;

    // Pick the last active player from the largest table
    const movedId = [...from.playerIds].reverse().find(id => activeIds.has(id));
    if (!movedId) break;

    from.playerIds = from.playerIds.filter(id => id !== movedId);
    to.playerIds.push(movedId);

    const movedPlayer = playerMap.get(movedId);
    moves.push({
      playerId: movedId,
      playerName: movedPlayer?.name ?? 'Unknown',
      fromTableId: from.id,
      fromTableName: from.name,
      toTableId: to.id,
      toTableName: to.name,
    });
  }

  return { tables: updated, moves };
}

// ---------------------------------------------------------------------------
// Final Table
// ---------------------------------------------------------------------------

/**
 * Check if remaining active players can fit at a single table.
 * Returns true if all active players can fit at the largest table.
 */
export function shouldMergeToFinalTable(tables: Table[], players: Player[]): boolean {
  if (tables.length <= 1) return false;
  const activePlayers = players.filter(p => p.status === 'active').length;
  const maxSeats = Math.max(...tables.map(t => t.seats));
  return activePlayers <= maxSeats;
}

/**
 * Merge all active players to the first table (Final Table).
 * Returns the updated tables array (single table with all active players).
 */
export function mergeToFinalTable(tables: Table[], players: Player[]): Table[] {
  if (tables.length === 0) return [];
  const activeIds = players.filter(p => p.status === 'active').map(p => p.id);
  // Use the first table as the final table
  const finalTable: Table = {
    ...tables[0],
    name: 'Final Table',
    playerIds: activeIds,
  };
  return [finalTable];
}
