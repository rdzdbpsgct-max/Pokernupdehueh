import type {
  GameDay,
  GameDayParticipant,
  League,
  ExtendedLeagueStanding,
  TournamentResult,
  TiebreakerConfig,
  Season,
} from './types';
import { csvSafe } from './tournament';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GAMEDAYS_KEY = 'poker-timer-gamedays';

// ---------------------------------------------------------------------------
// Player Name Normalization
// ---------------------------------------------------------------------------

export function normalizePlayerName(name: string): string {
  return name.toLowerCase().trim();
}

// ---------------------------------------------------------------------------
// GameDay CRUD (localStorage)
// ---------------------------------------------------------------------------

function isValidGameDay(item: unknown): item is GameDay {
  if (!item || typeof item !== 'object') return false;
  const r = item as Record<string, unknown>;
  return typeof r.id === 'string' && typeof r.leagueId === 'string' && typeof r.date === 'string' && Array.isArray(r.participants);
}

export function loadGameDays(): GameDay[] {
  try {
    const raw = localStorage.getItem(GAMEDAYS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidGameDay);
  } catch {
    return [];
  }
}

export function loadGameDaysForLeague(leagueId: string): GameDay[] {
  return loadGameDays().filter((gd) => gd.leagueId === leagueId);
}

export function loadGameDaysForSeason(leagueId: string, seasonId: string): GameDay[] {
  return loadGameDays().filter((gd) => gd.leagueId === leagueId && gd.seasonId === seasonId);
}

/** Upsert a game day: update existing by id, or append if new. */
export function saveGameDay(gameDay: GameDay): GameDay {
  const gameDays = loadGameDays();
  const idx = gameDays.findIndex((gd) => gd.id === gameDay.id);
  if (idx >= 0) {
    gameDays[idx] = gameDay;
  } else {
    gameDays.push(gameDay);
  }
  try {
    localStorage.setItem(GAMEDAYS_KEY, JSON.stringify(gameDays));
  } catch { /* private browsing or quota exceeded */ }
  return gameDay;
}

export function deleteGameDay(id: string): void {
  const gameDays = loadGameDays().filter((gd) => gd.id !== id);
  try {
    localStorage.setItem(GAMEDAYS_KEY, JSON.stringify(gameDays));
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Auto-Create GameDay from TournamentResult
// ---------------------------------------------------------------------------

/**
 * Create a GameDay from a finished tournament result.
 * Maps PlayerResult[] → GameDayParticipant[] with points from the league's point system.
 * Optionally accepts registered players to populate registeredPlayerId for stable identity.
 */
export function createGameDayFromResult(
  result: TournamentResult,
  league: League,
  registeredPlayers?: { id: string; name: string }[],
): GameDay {
  const pointMap = new Map(league.pointSystem.entries.map((e) => [e.place, e.points]));

  // Build a name→id lookup for registered players (case-insensitive)
  const playerIdMap = new Map<string, string>();
  if (registeredPlayers) {
    for (const rp of registeredPlayers) {
      playerIdMap.set(normalizePlayerName(rp.name), rp.id);
    }
  }

  const participants: GameDayParticipant[] = result.players.map((p) => {
    const rebuyCost = result.rebuyEnabled ? p.rebuys * (result.buyIn) : 0;
    const addOnCost = p.addOn ? result.buyIn : 0;
    const totalCost = result.buyIn + rebuyCost + addOnCost;
    const registeredPlayerId = playerIdMap.get(normalizePlayerName(p.name));
    return {
      name: p.name,
      place: p.place,
      points: pointMap.get(p.place) ?? 0,
      buyIn: result.buyIn,
      rebuys: p.rebuys,
      addOnCost: addOnCost,
      payout: p.payout,
      netBalance: p.payout + p.bountyEarned - totalCost,
      ...(registeredPlayerId ? { registeredPlayerId } : {}),
    };
  });

  const totalBuyIns = participants.reduce((sum, p) => sum + p.buyIn + (result.rebuyEnabled ? p.rebuys * result.buyIn : 0) + p.addOnCost, 0);
  const totalPrizePool = result.prizePool;

  // Determine next game day number for this league
  const existingGameDays = loadGameDaysForLeague(league.id);
  const nextNumber = existingGameDays.length + 1;

  const gameDay: GameDay = {
    id: `gd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    leagueId: league.id,
    seasonId: league.activeSeasonId,
    date: result.date,
    label: `Spieltag ${nextNumber}`,
    tournamentResultId: result.id,
    participants,
    totalPrizePool,
    totalBuyIns,
    cashBalance: totalBuyIns - totalPrizePool,
  };

  saveGameDay(gameDay);
  return gameDay;
}

// ---------------------------------------------------------------------------
// Extended League Standings
// ---------------------------------------------------------------------------

/**
 * Compute extended standings from game days, including financial data,
 * participation rate, corrections, and tiebreaker sorting.
 */
export function computeExtendedStandings(
  league: League,
  gameDays: GameDay[],
  options?: { excludeGuests?: boolean },
): ExtendedLeagueStanding[] {
  const pointMap = new Map(league.pointSystem.entries.map((e) => [e.place, e.points]));
  const map = new Map<string, ExtendedLeagueStanding>();

  for (const gd of gameDays) {
    for (const p of gd.participants) {
      if (options?.excludeGuests && p.isGuest) continue;

      const key = normalizePlayerName(p.name);
      let standing = map.get(key);
      if (!standing) {
        standing = {
          name: p.name,
          points: 0,
          tournaments: 0,
          wins: 0,
          cashes: 0,
          avgPlace: 0,
          bestPlace: Infinity,
          totalCost: 0,
          totalPayout: 0,
          netBalance: 0,
          participationRate: 0,
          knockouts: 0,
          corrections: 0,
          rank: 0,
        };
        map.set(key, standing);
      }
      standing.tournaments++;
      standing.points += pointMap.get(p.place) ?? p.points;
      if (p.place === 1) standing.wins++;
      if (p.payout > 0) standing.cashes++;
      standing.avgPlace += p.place;
      if (p.place < standing.bestPlace) standing.bestPlace = p.place;
      const cost = p.buyIn + (p.rebuys * p.buyIn) + p.addOnCost;
      standing.totalCost += cost;
      standing.totalPayout += p.payout;
      standing.netBalance += p.netBalance;
    }
  }

  // Apply corrections
  if (league.corrections) {
    for (const correction of league.corrections) {
      const key = normalizePlayerName(correction.playerName);
      const standing = map.get(key);
      if (standing) {
        standing.points += correction.points;
        standing.corrections += correction.points;
      }
    }
  }

  const totalGameDays = gameDays.length;
  const standings = [...map.values()];
  for (const s of standings) {
    s.avgPlace = s.tournaments > 0 ? Math.round((s.avgPlace / s.tournaments) * 10) / 10 : 0;
    if (s.bestPlace === Infinity) s.bestPlace = 0;
    s.participationRate = totalGameDays > 0 ? s.tournaments / totalGameDays : 0;
  }

  // Primary sort: points DESC, then avgPlace ASC
  standings.sort((a, b) => b.points - a.points || a.avgPlace - b.avgPlace);

  // Apply tiebreaker if configured
  if (league.tiebreaker) {
    applyTiebreaker(standings, gameDays, league.tiebreaker);
  }

  // Assign ranks
  for (let i = 0; i < standings.length; i++) {
    standings[i].rank = i + 1;
  }

  return standings;
}

// ---------------------------------------------------------------------------
// Tiebreaker
// ---------------------------------------------------------------------------

/**
 * Re-sort standings in-place by applying tiebreaker criteria to groups with equal points.
 */
export function applyTiebreaker(
  standings: ExtendedLeagueStanding[],
  gameDays: GameDay[],
  config: TiebreakerConfig,
): ExtendedLeagueStanding[] {
  // Group by points
  const groups: ExtendedLeagueStanding[][] = [];
  let currentGroup: ExtendedLeagueStanding[] = [];
  for (const s of standings) {
    if (currentGroup.length === 0 || currentGroup[0].points === s.points) {
      currentGroup.push(s);
    } else {
      groups.push(currentGroup);
      currentGroup = [s];
    }
  }
  if (currentGroup.length > 0) groups.push(currentGroup);

  // Sort within each group
  const sorted: ExtendedLeagueStanding[] = [];
  for (const group of groups) {
    if (group.length <= 1) {
      sorted.push(...group);
      continue;
    }
    group.sort((a, b) => {
      for (const criterion of config.criteria) {
        let diff = 0;
        switch (criterion) {
          case 'avgPlace':
            diff = a.avgPlace - b.avgPlace; // lower is better
            break;
          case 'wins':
            diff = b.wins - a.wins; // more is better
            break;
          case 'cashes':
            diff = b.cashes - a.cashes; // more is better
            break;
          case 'lastResult': {
            // Compare last game day placement (lower is better)
            const lastGD = gameDays.length > 0 ? gameDays[gameDays.length - 1] : null;
            if (lastGD) {
              const aLast = lastGD.participants.find((p) => normalizePlayerName(p.name) === normalizePlayerName(a.name));
              const bLast = lastGD.participants.find((p) => normalizePlayerName(p.name) === normalizePlayerName(b.name));
              diff = (aLast?.place ?? 999) - (bLast?.place ?? 999);
            }
            break;
          }
          case 'headToHead':
            // Head-to-head: count how often a placed higher than b across all game days
            {
              let aWins = 0;
              let bWins = 0;
              for (const gd of gameDays) {
                const aP = gd.participants.find((p) => normalizePlayerName(p.name) === normalizePlayerName(a.name));
                const bP = gd.participants.find((p) => normalizePlayerName(p.name) === normalizePlayerName(b.name));
                if (aP && bP) {
                  if (aP.place < bP.place) aWins++;
                  else if (bP.place < aP.place) bWins++;
                }
              }
              diff = bWins - aWins; // more wins → better → comes first
            }
            break;
        }
        if (diff !== 0) return diff;
      }
      return 0;
    });
    sorted.push(...group);
  }

  // Replace standings in-place
  for (let i = 0; i < sorted.length; i++) {
    standings[i] = sorted[i];
  }
  return standings;
}

// ---------------------------------------------------------------------------
// League Finances
// ---------------------------------------------------------------------------

export interface LeagueFinanceSummary {
  totalBuyIns: number;
  totalPayouts: number;
  totalCashBalance: number;
  perGameDay: {
    id: string;
    date: string;
    label: string;
    cashBalance: number;
    cumulative: number;
  }[];
}

export function computeLeagueFinances(gameDays: GameDay[]): LeagueFinanceSummary {
  let totalBuyIns = 0;
  let totalPayouts = 0;
  let cumulative = 0;

  // Sort game days by date for correct cumulative calculation
  const sorted = [...gameDays].sort((a, b) => a.date.localeCompare(b.date));

  const perGameDay = sorted.map((gd) => {
    totalBuyIns += gd.totalBuyIns;
    totalPayouts += gd.totalPrizePool;
    cumulative += gd.cashBalance;
    return {
      id: gd.id,
      date: gd.date,
      label: gd.label ?? gd.date,
      cashBalance: gd.cashBalance,
      cumulative,
    };
  });

  return {
    totalBuyIns,
    totalPayouts,
    totalCashBalance: cumulative,
    perGameDay,
  };
}

// ---------------------------------------------------------------------------
// Season Helpers
// ---------------------------------------------------------------------------

export function getActiveSeason(league: League): Season | undefined {
  if (!league.seasons || !league.activeSeasonId) return undefined;
  return league.seasons.find((s) => s.id === league.activeSeasonId);
}

export function getGameDaysInSeason(gameDays: GameDay[], seasonId: string): GameDay[] {
  return gameDays.filter((gd) => gd.seasonId === seasonId);
}

export function createSeason(name: string): Season {
  return {
    id: `season_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    startDate: new Date().toISOString().split('T')[0],
  };
}

// ---------------------------------------------------------------------------
// Export Helpers
// ---------------------------------------------------------------------------

export function formatLeagueStandingsAsText(
  league: League,
  standings: ExtendedLeagueStanding[],
): string {
  const lines: string[] = [];
  lines.push(`\u2660 ${league.name}`);
  lines.push('');
  for (const s of standings) {
    const medal = s.rank === 1 ? '\u{1F3C6}' : s.rank === 2 ? '\u{1F948}' : s.rank === 3 ? '\u{1F949}' : `${s.rank}.`;
    const balance = s.netBalance >= 0 ? `+${s.netBalance.toFixed(2)}` : s.netBalance.toFixed(2);
    lines.push(`${medal} ${s.name} — ${s.points} Pts (${s.tournaments} T, ${s.wins} W, ${balance} \u20AC)`);
  }
  return lines.join('\n');
}

export function formatLeagueStandingsAsCSV(
  standings: ExtendedLeagueStanding[],
): string {
  const header = 'Rank,Name,Points,GameDays,Wins,Cashes,AvgPlace,BestPlace,Knockouts,TotalCost,TotalPayout,NetBalance,ParticipationRate,Corrections';
  const rows = standings.map((s) =>
    `${s.rank},${csvSafe(s.name)},${s.points},${s.tournaments},${s.wins},${s.cashes},${s.avgPlace},${s.bestPlace},${s.knockouts},${s.totalCost.toFixed(2)},${s.totalPayout.toFixed(2)},${s.netBalance.toFixed(2)},${(s.participationRate * 100).toFixed(0)}%,${s.corrections}`,
  );
  return [header, ...rows].join('\n');
}

export function formatLeagueFinancesAsCSV(
  gameDays: GameDay[],
): string {
  const finances = computeLeagueFinances(gameDays);
  const header = 'Date,Label,BuyIns,Payouts,CashBalance,Cumulative';
  const rows = finances.perGameDay.map((gd) =>
    `${gd.date},${csvSafe(gd.label)},${gameDays.find((g) => g.id === gd.id)?.totalBuyIns.toFixed(2) ?? '0.00'},${gameDays.find((g) => g.id === gd.id)?.totalPrizePool.toFixed(2) ?? '0.00'},${gd.cashBalance.toFixed(2)},${gd.cumulative.toFixed(2)}`,
  );
  return [header, ...rows].join('\n');
}

// ---------------------------------------------------------------------------
// League Player Stats (Phase 3)
// ---------------------------------------------------------------------------

export interface LeaguePlayerStats {
  name: string;
  pointsHistory: { gameDayId: string; date: string; points: number; cumulative: number }[];
  placeDistribution: Record<number, number>;
  streaks: { currentWin: number; bestWin: number; currentCash: number; bestCash: number };
  formLast5: ('W' | 'C' | 'X')[];
  headToHead: Record<string, { wins: number; losses: number }>;
}

export function computeLeaguePlayerStats(
  playerName: string,
  gameDays: GameDay[],
): LeaguePlayerStats {
  const key = normalizePlayerName(playerName);
  const sorted = [...gameDays].sort((a, b) => a.date.localeCompare(b.date));

  const pointsHistory: LeaguePlayerStats['pointsHistory'] = [];
  const placeDistribution: Record<number, number> = {};
  const headToHead: Record<string, { wins: number; losses: number }> = {};
  let cumulative = 0;
  let currentWin = 0;
  let bestWin = 0;
  let currentCash = 0;
  let bestCash = 0;
  const form: ('W' | 'C' | 'X')[] = [];

  for (const gd of sorted) {
    const participant = gd.participants.find((p) => normalizePlayerName(p.name) === key);
    if (!participant) continue;

    cumulative += participant.points;
    pointsHistory.push({
      gameDayId: gd.id,
      date: gd.date,
      points: participant.points,
      cumulative,
    });

    placeDistribution[participant.place] = (placeDistribution[participant.place] ?? 0) + 1;

    // Streaks
    if (participant.place === 1) {
      currentWin++;
      bestWin = Math.max(bestWin, currentWin);
    } else {
      currentWin = 0;
    }
    if (participant.payout > 0) {
      currentCash++;
      bestCash = Math.max(bestCash, currentCash);
    } else {
      currentCash = 0;
    }

    // Form
    if (participant.place === 1) form.push('W');
    else if (participant.payout > 0) form.push('C');
    else form.push('X');

    // Head-to-head
    for (const other of gd.participants) {
      if (normalizePlayerName(other.name) === key) continue;
      const otherKey = normalizePlayerName(other.name);
      if (!headToHead[otherKey]) headToHead[otherKey] = { wins: 0, losses: 0 };
      if (participant.place < other.place) headToHead[otherKey].wins++;
      else if (participant.place > other.place) headToHead[otherKey].losses++;
    }
  }

  return {
    name: playerName,
    pointsHistory,
    placeDistribution,
    streaks: { currentWin, bestWin, currentCash, bestCash },
    formLast5: form.slice(-5),
    headToHead,
  };
}

// ---------------------------------------------------------------------------
// QR Encoding for League Standings (Phase 3)
// ---------------------------------------------------------------------------

export function encodeLeagueStandingsForQR(
  league: League,
  standings: ExtendedLeagueStanding[],
): string {
  // Compact format: leagueName|rank:name:points:tournaments:wins:netBalance;...
  const players = standings.map((s) =>
    `${s.rank}:${s.name}:${s.points}:${s.tournaments}:${s.wins}:${s.netBalance.toFixed(2)}`,
  ).join(';');
  const encoded = encodeURIComponent(`${league.name}|${players}`);
  return `#ls=${encoded}`;
}

export function decodeLeagueStandingsFromQR(hash: string): { leagueName: string; standings: { rank: number; name: string; points: number; tournaments: number; wins: number; netBalance: number }[] } | null {
  try {
    if (!hash.startsWith('#ls=')) return null;
    const decoded = decodeURIComponent(hash.slice(4));
    const [leagueName, playersStr] = decoded.split('|');
    if (!leagueName || !playersStr) return null;
    const standings = playersStr.split(';').filter(Boolean).map((entry) => {
      const [rank, name, points, tournaments, wins, netBalance] = entry.split(':');
      const rankNum = parseInt(rank, 10);
      const pointsNum = parseInt(points, 10);
      const tournamentsNum = parseInt(tournaments, 10);
      const winsNum = parseInt(wins, 10);
      const balanceNum = parseFloat(netBalance);
      if (!name || [rankNum, pointsNum, tournamentsNum, winsNum, balanceNum].some(isNaN)) {
        return null;
      }
      return {
        rank: rankNum,
        name,
        points: pointsNum,
        tournaments: tournamentsNum,
        wins: winsNum,
        netBalance: balanceNum,
      };
    }).filter(<T,>(v: T | null): v is T => v !== null);
    if (standings.length === 0) return null;
    return { leagueName, standings };
  } catch {
    return null;
  }
}
