import { useState } from 'react';
import type { Player, PayoutConfig, BountyConfig } from '../domain/types';
import { computeTotalRebuys, computePrizePool, computePayouts } from '../domain/logic';

interface Props {
  players: Player[];
  buyIn: number;
  payout: PayoutConfig;
  rebuyEnabled: boolean;
  rebuyActive: boolean;
  bountyConfig: BountyConfig;
  onUpdateRebuys: (playerId: string, newCount: number) => void;
  onEliminatePlayer: (playerId: string, eliminatedBy: string | null) => void;
}

export function PlayerPanel({
  players,
  buyIn,
  payout,
  rebuyEnabled,
  rebuyActive,
  bountyConfig,
  onUpdateRebuys,
  onEliminatePlayer,
}: Props) {
  const [eliminatingId, setEliminatingId] = useState<string | null>(null);
  const [selectedKiller, setSelectedKiller] = useState<string>('');

  const totalRebuys = computeTotalRebuys(players);
  const prizePool = computePrizePool(players, buyIn);
  const payoutAmounts = computePayouts(payout, prizePool);

  const activePlayers = players.filter((p) => p.status === 'active');
  const eliminatedPlayers = [...players]
    .filter((p) => p.status === 'eliminated')
    .sort((a, b) => (a.placement ?? 0) - (b.placement ?? 0));

  const handleEliminate = (playerId: string) => {
    if (bountyConfig.enabled) {
      setEliminatingId(playerId);
      setSelectedKiller('');
    } else {
      onEliminatePlayer(playerId, null);
    }
  };

  const confirmElimination = () => {
    if (eliminatingId && selectedKiller) {
      onEliminatePlayer(eliminatingId, selectedKiller);
      setEliminatingId(null);
      setSelectedKiller('');
    }
  };

  const cancelElimination = () => {
    setEliminatingId(null);
    setSelectedKiller('');
  };

  return (
    <div className="space-y-4">
      {/* Prize Pool */}
      <div>
        <h3 className="text-xs text-gray-500 uppercase tracking-wider">Preisgeld</h3>
        <div className="mt-1 px-3 py-2 bg-emerald-900/30 border border-emerald-800 rounded-lg">
          <p className="text-emerald-300 text-lg font-bold">
            {prizePool.toFixed(2)} EUR
          </p>
          <p className="text-emerald-500/70 text-xs">
            ({players.length} Spieler{totalRebuys > 0 ? ` + ${totalRebuys} Rebuys` : ''}) &times; {buyIn} EUR
          </p>
          {bountyConfig.enabled && (
            <p className="text-amber-500/70 text-xs mt-0.5">
              + Bounty-Pool: {(players.length * bountyConfig.amount).toFixed(2)} EUR
              ({players.length} &times; {bountyConfig.amount} EUR)
            </p>
          )}
        </div>
      </div>

      {/* Payout breakdown */}
      <div>
        <h3 className="text-xs text-gray-500 uppercase tracking-wider">Auszahlung</h3>
        <div className="mt-1 space-y-1">
          {payoutAmounts.map((p) => (
            <div
              key={p.place}
              className="flex justify-between px-3 py-1 bg-gray-800/50 rounded text-sm"
            >
              <span className="text-gray-400">
                {p.place === 1 ? '1.' : p.place === 2 ? '2.' : p.place === 3 ? '3.' : `${p.place}.`} Platz
              </span>
              <span className="text-white font-medium">{p.amount.toFixed(2)} EUR</span>
            </div>
          ))}
        </div>
      </div>

      {/* Active Players */}
      <div>
        <h3 className="text-xs text-gray-500 uppercase tracking-wider">
          Aktive Spieler ({activePlayers.length})
        </h3>
        <div className="mt-1 space-y-1">
          {activePlayers.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between px-3 py-1.5 bg-gray-800/50 rounded"
            >
              <div className="flex-1 mr-2 min-w-0">
                <span className="text-sm text-gray-200 truncate block">
                  {player.name}
                </span>
                {bountyConfig.enabled && player.knockouts > 0 && (
                  <span className="text-xs text-amber-400">
                    {player.knockouts} KO ({(player.knockouts * bountyConfig.amount).toFixed(0)} EUR)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {/* Rebuy controls (only if rebuy enabled in setup) */}
                {rebuyEnabled && (
                  <div className="flex items-center gap-1 mr-1">
                    <button
                      onClick={() =>
                        onUpdateRebuys(player.id, Math.max(0, player.rebuys - 1))
                      }
                      disabled={player.rebuys <= 0}
                      className="w-6 h-6 rounded bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      -
                    </button>
                    <span className="text-white text-xs font-mono w-4 text-center">
                      {player.rebuys}
                    </span>
                    <button
                      onClick={() =>
                        onUpdateRebuys(player.id, player.rebuys + 1)
                      }
                      disabled={!rebuyActive}
                      className="w-6 h-6 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      +
                    </button>
                  </div>
                )}

                {/* Eliminate button */}
                {activePlayers.length > 1 && (
                  <button
                    onClick={() => handleEliminate(player.id)}
                    className="px-2 py-1 rounded bg-red-900/50 hover:bg-red-800 text-red-300 text-xs font-medium transition-colors"
                    title="Spieler ist ausgeschieden"
                  >
                    Raus
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bounty elimination dialog */}
      {eliminatingId && bountyConfig.enabled && (
        <div className="px-3 py-3 bg-amber-900/20 border border-amber-800 rounded-lg space-y-2">
          <p className="text-sm text-amber-300 font-medium">
            Wer hat {players.find((p) => p.id === eliminatingId)?.name} eliminiert?
          </p>
          <select
            value={selectedKiller}
            onChange={(e) => setSelectedKiller(e.target.value)}
            className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-amber-500"
          >
            <option value="">-- Spieler waehlen --</option>
            {activePlayers
              .filter((p) => p.id !== eliminatingId)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={cancelElimination}
              className="flex-1 px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-medium transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={confirmElimination}
              disabled={!selectedKiller}
              className="flex-1 px-2 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Bestaetigen
            </button>
          </div>
        </div>
      )}

      {/* Eliminated Players */}
      {eliminatedPlayers.length > 0 && (
        <div>
          <h3 className="text-xs text-gray-500 uppercase tracking-wider">
            Ausgeschieden
          </h3>
          <div className="mt-1 space-y-1">
            {eliminatedPlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between px-3 py-1.5 bg-gray-800/30 rounded opacity-60"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-xs text-gray-500 font-bold w-6 text-right shrink-0">
                    {player.placement}.
                  </span>
                  <span className="text-sm text-gray-400 line-through truncate">
                    {player.name}
                  </span>
                </div>
                {bountyConfig.enabled && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
                    {player.knockouts > 0 && (
                      <span className="text-amber-500/70">
                        {player.knockouts} KO
                      </span>
                    )}
                    {player.eliminatedBy && (
                      <span>
                        von {players.find((p) => p.id === player.eliminatedBy)?.name ?? '?'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
