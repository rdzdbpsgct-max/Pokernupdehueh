import type {
  TournamentConfig,
  TournamentResult,
  PlayerResult,
  PayoutConfig,
  Player,
  PointSystem,
  LeagueStanding,
  League,
} from './types';

// ---------------------------------------------------------------------------
// Prize Pool & Payouts
// ---------------------------------------------------------------------------

export function computeTotalRebuys(players: Player[]): number {
  return players.reduce((sum, p) => sum + p.rebuys, 0);
}

export function computeTotalAddOns(players: Player[]): number {
  return players.filter((p) => p.addOn).length;
}

export function computePrizePool(
  players: Player[], buyIn: number,
  rebuyCost?: number, addOnCost?: number,
  separateRebuyPot?: boolean,
): number {
  const totalRebuys = computeTotalRebuys(players);
  const totalAddOns = computeTotalAddOns(players);
  const costPerRebuy = rebuyCost ?? buyIn;
  const costPerAddOn = addOnCost ?? buyIn;
  const rebuyTotal = separateRebuyPot ? 0 : (totalRebuys * costPerRebuy);
  return (players.length * buyIn) + rebuyTotal + (totalAddOns * costPerAddOn);
}

export function computeRebuyPot(players: Player[], rebuyCost: number): number {
  return computeTotalRebuys(players) * rebuyCost;
}

export function computePayouts(
  payout: PayoutConfig,
  prizePool: number,
): { place: number; amount: number }[] {
  return payout.entries.map((entry) => ({
    place: entry.place,
    amount:
      payout.mode === 'percent'
        ? Math.round((entry.value / 100) * prizePool * 100) / 100
        : entry.value,
  }));
}

// ---------------------------------------------------------------------------
// Payout defaults
// ---------------------------------------------------------------------------

export function defaultPayoutConfig(): PayoutConfig {
  return {
    mode: 'percent',
    entries: [
      { place: 1, value: 50 },
      { place: 2, value: 30 },
      { place: 3, value: 20 },
    ],
  };
}

export function defaultPayoutForPlayerCount(playerCount: number): PayoutConfig {
  let entries: { place: number; value: number }[];

  if (playerCount <= 2) {
    entries = [{ place: 1, value: 100 }];
  } else if (playerCount <= 3) {
    entries = [
      { place: 1, value: 65 },
      { place: 2, value: 35 },
    ];
  } else if (playerCount <= 4) {
    entries = [
      { place: 1, value: 60 },
      { place: 2, value: 40 },
    ];
  } else if (playerCount <= 10) {
    entries = [
      { place: 1, value: 50 },
      { place: 2, value: 30 },
      { place: 3, value: 20 },
    ];
  } else if (playerCount <= 15) {
    entries = [
      { place: 1, value: 40 },
      { place: 2, value: 25 },
      { place: 3, value: 20 },
      { place: 4, value: 15 },
    ];
  } else {
    entries = [
      { place: 1, value: 35 },
      { place: 2, value: 25 },
      { place: 3, value: 18 },
      { place: 4, value: 13 },
      { place: 5, value: 9 },
    ];
  }

  return { mode: 'percent', entries };
}

// ---------------------------------------------------------------------------
// Build Tournament Result
// ---------------------------------------------------------------------------

export function buildTournamentResult(
  config: TournamentConfig,
  elapsedSeconds: number,
  levelsPlayed: number,
): TournamentResult {
  const prizePool = computePrizePool(
    config.players, config.buyIn,
    config.rebuy.enabled ? config.rebuy.rebuyCost : undefined,
    config.addOn.enabled ? config.addOn.cost : undefined,
    config.rebuy.separatePot,
  );
  const payouts = computePayouts(config.payout, prizePool);
  const payoutMap = new Map(payouts.map((p) => [p.place, p.amount]));

  const sorted = [...config.players].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (b.status === 'active' && a.status !== 'active') return 1;
    if (a.placement != null && b.placement != null) return a.placement - b.placement;
    return 0;
  });

  const players: PlayerResult[] = sorted.map((p, i) => {
    const place = p.status === 'active' ? 1 : (p.placement ?? i + 1);
    const payout = payoutMap.get(place) ?? 0;
    const totalCost = config.buyIn
      + p.rebuys * (config.rebuy.enabled ? config.rebuy.rebuyCost : config.buyIn)
      + (p.addOn ? (config.addOn.enabled ? config.addOn.cost : config.buyIn) : 0);
    const bountyEarned = config.bounty.enabled ? p.knockouts * config.bounty.amount : 0;
    return {
      name: p.name,
      place,
      payout,
      rebuys: p.rebuys,
      addOn: p.addOn,
      knockouts: p.knockouts,
      bountyEarned,
      netBalance: payout + bountyEarned - totalCost,
    };
  });

  return {
    id: crypto.randomUUID(),
    name: config.name,
    date: new Date().toISOString(),
    playerCount: config.players.length,
    buyIn: config.buyIn,
    prizePool,
    players,
    bountyEnabled: config.bounty.enabled,
    bountyAmount: config.bounty.amount,
    rebuyEnabled: config.rebuy.enabled,
    totalRebuys: computeTotalRebuys(config.players),
    addOnEnabled: config.addOn.enabled,
    totalAddOns: computeTotalAddOns(config.players),
    elapsedSeconds,
    levelsPlayed,
    leagueId: config.leagueId,
    rebuyPot: config.rebuy.separatePot
      ? computeRebuyPot(config.players, config.rebuy.enabled ? config.rebuy.rebuyCost : config.buyIn)
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// Tournament Result -- Text & CSV Export
// ---------------------------------------------------------------------------

const PLACE_EMOJI = ['\u{1F3C6}', '\u{1F948}', '\u{1F949}'];

export function formatResultAsText(result: TournamentResult, locale: string = 'de-DE'): string {
  const isEn = locale.startsWith('en');
  const lines: string[] = [];
  lines.push(`\u2660\u2665 ${result.name || 'Poker Tournament'} \u2666\u2663`);
  lines.push(new Date(result.date).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }));
  lines.push('');
  for (const p of result.players) {
    const emoji = PLACE_EMOJI[p.place - 1] ?? `${p.place}.`;
    const payoutStr = p.payout > 0 ? ` \u2192 ${p.payout.toFixed(2)} \u20AC` : '';
    lines.push(`${emoji} ${p.name}${payoutStr}`);
  }
  lines.push('');
  const playersLabel = isEn ? 'Players' : 'Spieler';
  lines.push(`Prizepool: ${result.prizePool.toFixed(2)} \u20AC | ${result.playerCount} ${playersLabel}`);
  if (result.rebuyPot && result.rebuyPot > 0) {
    lines.push(`Rebuy-Topf: ${result.rebuyPot.toFixed(2)} \u20AC`);
  }
  if (result.totalRebuys > 0) lines.push(`Rebuys: ${result.totalRebuys}`);
  return lines.join('\n');
}

export function formatResultAsCSV(result: TournamentResult): string {
  const header = 'Place,Name,Payout,Rebuys,AddOn,Knockouts,NetBalance';
  const rows = result.players.map((p) =>
    [p.place, `"${p.name}"`, p.payout.toFixed(2), p.rebuys, p.addOn ? 1 : 0, p.knockouts, p.netBalance.toFixed(2)].join(','),
  );
  return [header, ...rows].join('\n');
}

// ---------------------------------------------------------------------------
// Player Statistics (cross-tournament aggregation)
// ---------------------------------------------------------------------------

export function computePlayerStats(history: TournamentResult[]): import('./types').PlayerStat[] {
  const map = new Map<string, import('./types').PlayerStat>();

  for (const tournament of history) {
    for (const p of tournament.players) {
      const key = p.name.toLowerCase().trim();
      let stat = map.get(key);
      if (!stat) {
        stat = {
          name: p.name,
          tournaments: 0,
          wins: 0,
          cashes: 0,
          totalPayout: 0,
          totalCost: 0,
          netBalance: 0,
          avgPlace: 0,
          bestPlace: Infinity,
          knockouts: 0,
        };
        map.set(key, stat);
      }
      stat.tournaments++;
      if (p.place === 1) stat.wins++;
      if (p.payout > 0) stat.cashes++;
      stat.totalPayout += p.payout + p.bountyEarned;
      stat.totalCost += p.payout + p.bountyEarned - p.netBalance; // totalCost = payout + bounty - netBalance
      stat.netBalance += p.netBalance;
      stat.avgPlace += p.place;
      if (p.place < stat.bestPlace) stat.bestPlace = p.place;
      stat.knockouts += p.knockouts;
    }
  }

  const stats = [...map.values()];
  for (const s of stats) {
    s.avgPlace = Math.round((s.avgPlace / s.tournaments) * 10) / 10;
    if (s.bestPlace === Infinity) s.bestPlace = 0;
  }
  stats.sort((a, b) => b.netBalance - a.netBalance);
  return stats;
}

// ---------------------------------------------------------------------------
// League Standings
// ---------------------------------------------------------------------------

export function computeLeagueStandings(
  leagueId: string,
  history: TournamentResult[],
  pointSystem: PointSystem,
): LeagueStanding[] {
  const pointMap = new Map(pointSystem.entries.map((e) => [e.place, e.points]));
  const map = new Map<string, LeagueStanding>();

  for (const tournament of history) {
    if (tournament.leagueId !== leagueId) continue;
    for (const p of tournament.players) {
      const key = p.name.toLowerCase().trim();
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
        };
        map.set(key, standing);
      }
      standing.tournaments++;
      standing.points += pointMap.get(p.place) ?? 0;
      if (p.place === 1) standing.wins++;
      if (p.payout > 0) standing.cashes++;
      standing.avgPlace += p.place;
      if (p.place < standing.bestPlace) standing.bestPlace = p.place;
    }
  }

  const standings = [...map.values()];
  for (const s of standings) {
    s.avgPlace = Math.round((s.avgPlace / s.tournaments) * 10) / 10;
    if (s.bestPlace === Infinity) s.bestPlace = 0;
  }
  standings.sort((a, b) => b.points - a.points || a.avgPlace - b.avgPlace);
  return standings;
}

export function formatLeagueAsText(league: League, standings: LeagueStanding[]): string {
  const lines: string[] = [];
  lines.push(`\u2660 ${league.name}`);
  lines.push('');
  for (let i = 0; i < standings.length; i++) {
    const s = standings[i];
    const medal = i === 0 ? '\u{1F3C6}' : i === 1 ? '\u{1F948}' : i === 2 ? '\u{1F949}' : `${i + 1}.`;
    lines.push(`${medal} ${s.name} — ${s.points} Pts (${s.tournaments} T, ${s.wins} W)`);
  }
  return lines.join('\n');
}

export function formatLeagueAsCSV(standings: LeagueStanding[]): string {
  const header = 'Rank,Name,Points,Tournaments,Wins,Cashes,AvgPlace,BestPlace';
  const rows = standings.map((s, i) =>
    [i + 1, `"${s.name}"`, s.points, s.tournaments, s.wins, s.cashes, s.avgPlace, s.bestPlace].join(','),
  );
  return [header, ...rows].join('\n');
}

// ---------------------------------------------------------------------------
// Mystery Bounty
// ---------------------------------------------------------------------------

export function drawMysteryBounty(pool: number[]): { amount: number; remainingPool: number[] } {
  if (pool.length === 0) return { amount: 0, remainingPool: [] };
  const idx = Math.floor(Math.random() * pool.length);
  const amount = pool[idx];
  const remainingPool = [...pool.slice(0, idx), ...pool.slice(idx + 1)];
  return { amount, remainingPool };
}

// ---------------------------------------------------------------------------
// QR Code Decoding (compact tournament result sharing)
// ---------------------------------------------------------------------------

export function decodeResultFromQR(encoded: string): TournamentResult | null {
  try {
    const parts = encoded.split('|');
    if (parts.length < 11) return null;

    const name = parts[0];
    const date = parts[1];
    const playerCount = Number(parts[2]);
    const buyIn = Number(parts[3]);
    const prizePool = Number(parts[4]);
    const bountyAmount = Number(parts[5]);
    const totalRebuys = Number(parts[6]);
    const totalAddOns = Number(parts[7]);
    const elapsedMinutes = Number(parts[8]);
    const levelsPlayed = Number(parts[9]);
    const playersRaw = parts.slice(10).join('|');

    if (!name || isNaN(playerCount)) return null;

    const players: PlayerResult[] = playersRaw.split(';').filter(Boolean).map(entry => {
      const [pName, place, payout, rebuys, addOn, knockouts] = entry.split(':');
      const rebuyCount = Number(rebuys) || 0;
      const hasAddOn = Number(addOn) === 1;
      const totalCost = buyIn + rebuyCount * buyIn + (hasAddOn ? buyIn : 0);
      const bountyEarned = bountyAmount > 0 ? (Number(knockouts) || 0) * bountyAmount : 0;
      return {
        name: pName,
        place: Number(place),
        payout: Number(payout) || 0,
        rebuys: rebuyCount,
        addOn: hasAddOn,
        knockouts: Number(knockouts) || 0,
        bountyEarned,
        netBalance: (Number(payout) || 0) + bountyEarned - totalCost,
      };
    });

    return {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      name,
      date: new Date(date).toISOString(),
      playerCount,
      buyIn,
      prizePool,
      players,
      bountyEnabled: bountyAmount > 0,
      bountyAmount,
      rebuyEnabled: totalRebuys > 0,
      totalRebuys,
      addOnEnabled: totalAddOns > 0,
      totalAddOns,
      elapsedSeconds: elapsedMinutes * 60,
      levelsPlayed,
    };
  } catch {
    return null;
  }
}
