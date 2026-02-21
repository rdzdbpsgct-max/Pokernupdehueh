import type { Player, PayoutConfig, BountyConfig } from '../domain/types';
import { computeTotalRebuys, computePrizePool, computePayouts } from '../domain/logic';

interface Props {
  players: Player[];
  winner: Player;
  buyIn: number;
  payout: PayoutConfig;
  bounty: BountyConfig;
  onBackToSetup: () => void;
}

export function TournamentFinished({
  players,
  winner,
  buyIn,
  payout,
  bounty,
  onBackToSetup,
}: Props) {
  const totalRebuys = computeTotalRebuys(players);
  const prizePool = computePrizePool(players, buyIn);
  const payoutAmounts = computePayouts(payout, prizePool);
  const payoutMap = new Map(payoutAmounts.map((p) => [p.place, p.amount]));
  const maxPaidPlace = payoutAmounts.length > 0 ? Math.max(...payoutAmounts.map((p) => p.place)) : 0;

  // Build standings: winner = 1st, then eliminated sorted by placement
  const standings: (Player & { finalPlace: number })[] = [
    { ...winner, finalPlace: 1 },
    ...players
      .filter((p) => p.status === 'eliminated')
      .sort((a, b) => (a.placement ?? 0) - (b.placement ?? 0))
      .map((p) => ({ ...p, finalPlace: p.placement ?? 0 })),
  ];

  // Bounty results (only players with knockouts, sorted desc)
  const bountyResults = bounty.enabled
    ? players
        .filter((p) => p.knockouts > 0)
        .sort((a, b) => b.knockouts - a.knockouts)
        .map((p) => ({ ...p, bountyEarned: p.knockouts * bounty.amount }))
    : [];

  const placeColor = (place: number) => {
    if (place === 1) return 'text-amber-400';
    if (place === 2) return 'text-gray-300';
    if (place === 3) return 'text-amber-700';
    return 'text-gray-500';
  };

  const placeLabel = (place: number) => {
    if (place === 1) return '1.';
    if (place === 2) return '2.';
    if (place === 3) return '3.';
    return `${place}.`;
  };

  return (
    <div className="flex-1 flex items-start justify-center p-6 overflow-y-auto">
      <div className="w-full max-w-lg space-y-6 py-8">
        {/* Winner celebration */}
        <div className="text-center space-y-3 py-6 px-4 rounded-2xl border-2 border-amber-500/30 bg-gradient-to-b from-amber-900/20 to-transparent">
          <div className="text-7xl animate-bounce">
            &#127942;
          </div>
          <p className="text-emerald-400 text-lg font-medium tracking-wide">
            Herzlichen Glückwunsch
          </p>
          <p className="text-4xl font-bold text-white">
            {winner.name}
          </p>
          <p className="text-amber-400/70 text-sm uppercase tracking-widest">
            Turniersieger
          </p>
        </div>

        {/* Standings / Ergebnis */}
        <div>
          <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            Ergebnis
          </h3>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
            {standings.map((player, idx) => {
              const isPaid = payoutMap.has(player.finalPlace);
              const amount = payoutMap.get(player.finalPlace);
              const showDivider = idx > 0 && !isPaid && payoutMap.has(standings[idx - 1].finalPlace);

              return (
                <div key={player.id}>
                  {showDivider && (
                    <div className="border-t border-gray-700 mx-3" />
                  )}
                  <div
                    className={`flex items-center justify-between px-4 py-2.5 ${
                      player.finalPlace === 1
                        ? 'bg-amber-900/20'
                        : idx % 2 === 0
                        ? 'bg-gray-800/30'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span
                        className={`text-sm font-bold w-6 text-right shrink-0 ${placeColor(
                          player.finalPlace,
                        )}`}
                      >
                        {placeLabel(player.finalPlace)}
                      </span>
                      <span
                        className={`text-sm truncate ${
                          isPaid ? 'text-white font-medium' : 'text-gray-500'
                        }`}
                      >
                        {player.name}
                      </span>
                    </div>
                    {isPaid && amount != null && (
                      <span className="text-emerald-400 text-sm font-bold shrink-0 ml-3">
                        {amount.toFixed(2)} EUR
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bounty results */}
        {bounty.enabled && bountyResults.length > 0 && (
          <div>
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">
              Bounty
            </h3>
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
              {bountyResults.map((player, idx) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between px-4 py-2.5 ${
                    idx % 2 === 0 ? 'bg-gray-800/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-sm text-gray-200 truncate">
                      {player.name}
                    </span>
                    <span className="text-xs text-amber-500/70 shrink-0">
                      {player.knockouts} KO
                    </span>
                  </div>
                  <span className="text-amber-400 text-sm font-bold shrink-0 ml-3">
                    {player.bountyEarned.toFixed(2)} EUR
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-700 px-4 py-2 flex justify-between">
                <span className="text-xs text-gray-500">Bounty-Pool gesamt</span>
                <span className="text-xs text-amber-400/70 font-medium">
                  {(players.length * bounty.amount).toFixed(2)} EUR
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tournament info summary */}
        <div>
          <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            Turnier-Info
          </h3>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Preisgeld</span>
              <span className="text-white font-medium">{prizePool.toFixed(2)} EUR</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Spieler</span>
              <span className="text-white">{players.length}</span>
            </div>
            {totalRebuys > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Rebuys</span>
                <span className="text-white">{totalRebuys}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Buy-In</span>
              <span className="text-white">{buyIn} EUR</span>
            </div>
            {bounty.enabled && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Bounty</span>
                <span className="text-white">{bounty.amount} EUR / KO</span>
              </div>
            )}
            {maxPaidPlace > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Bezahlte Plätze</span>
                <span className="text-white">Top {maxPaidPlace}</span>
              </div>
            )}
          </div>
        </div>

        {/* Back to setup */}
        <div className="pt-2">
          <button
            onClick={onBackToSetup}
            className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-lg font-medium transition-colors"
          >
            Zurück zum Setup
          </button>
        </div>
      </div>
    </div>
  );
}
