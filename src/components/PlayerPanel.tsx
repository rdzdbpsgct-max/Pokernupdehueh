import { useState, useMemo } from 'react';
import type { Player, PayoutConfig, BountyConfig, RebuyConfig, AddOnConfig } from '../domain/types';
import { computeTotalRebuys, computeTotalAddOns, computePrizePool, computePayouts } from '../domain/logic';
import { useTranslation } from '../i18n';

interface Props {
  players: Player[];
  dealerIndex: number;
  buyIn: number;
  payout: PayoutConfig;
  rebuyActive: boolean;
  rebuyConfig: RebuyConfig;
  addOnConfig: AddOnConfig;
  addOnWindowOpen: boolean;
  bountyConfig: BountyConfig;
  averageStack: number;
  onUpdateRebuys: (playerId: string, newCount: number) => void;
  onUpdateAddOn: (playerId: string, hasAddOn: boolean) => void;
  onEliminatePlayer: (playerId: string, eliminatedBy: string | null) => void;
  onReinstatePlayer: (playerId: string) => void;
}

export function PlayerPanel({
  players,
  dealerIndex,
  buyIn,
  payout,
  rebuyActive,
  rebuyConfig,
  addOnConfig,
  addOnWindowOpen,
  bountyConfig,
  averageStack,
  onUpdateRebuys,
  onUpdateAddOn,
  onEliminatePlayer,
  onReinstatePlayer,
}: Props) {
  const { t } = useTranslation();
  const [eliminatingId, setEliminatingId] = useState<string | null>(null);
  const [selectedKiller, setSelectedKiller] = useState<string>('');

  const totalRebuys = computeTotalRebuys(players);
  const totalAddOns = computeTotalAddOns(players);
  const prizePool = computePrizePool(players, buyIn, rebuyConfig.rebuyCost, addOnConfig.enabled ? addOnConfig.cost : 0);
  const payoutAmounts = computePayouts(payout, prizePool);

  const nameSizeClass = useMemo(() => {
    const maxLen = players.reduce((max, p) => Math.max(max, p.name.length), 0);
    if (maxLen <= 8) return 'text-sm';
    if (maxLen <= 12) return 'text-xs';
    if (maxLen <= 18) return 'text-[11px]';
    return 'text-[10px]';
  }, [players]);

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
        <h3 className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('playerPanel.prizePool')}</h3>
        <div className="mt-1 px-3 py-2 bg-emerald-900/20 border border-emerald-700/50 rounded-xl shadow-md shadow-emerald-900/10">
          <p className="text-emerald-300 text-lg font-bold">
            {prizePool.toFixed(2)} {t('unit.eur')}
          </p>
          <p className="text-emerald-500/70 text-xs">
            {players.length} &times; {buyIn} {t('unit.eur')}
            {totalRebuys > 0 && (
              <> + {totalRebuys} Rebuy{totalRebuys > 1 ? 's' : ''} &times; {rebuyConfig.rebuyCost} {t('unit.eur')}</>
            )}
            {totalAddOns > 0 && (
              <> + {totalAddOns} Add-On{totalAddOns > 1 ? 's' : ''} &times; {addOnConfig.cost} {t('unit.eur')}</>
            )}
          </p>
          {bountyConfig.enabled && (
            <p className="text-amber-500/70 text-xs mt-0.5">
              + Bounty-Pool: {(players.length * bountyConfig.amount).toFixed(2)} {t('unit.eur')}
              ({players.length} &times; {bountyConfig.amount} {t('unit.eur')})
            </p>
          )}
        </div>
      </div>

      {/* Payout breakdown */}
      <div>
        <h3 className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('playerPanel.payout')}</h3>
        <div className="mt-1 space-y-1">
          {payoutAmounts.map((p) => (
            <div
              key={p.place}
              className="flex justify-between px-3 py-1 bg-gray-100 dark:bg-gray-800/50 rounded-lg text-sm"
            >
              <span className="text-gray-500 dark:text-gray-400">
                {p.place}. {t('playerPanel.place')}
              </span>
              <span className="text-gray-900 dark:text-white font-medium">{p.amount.toFixed(2)} {t('unit.eur')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Average Stack */}
      <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('playerPanel.avgStack')}</span>
          <span className="text-gray-900 dark:text-white text-sm font-mono font-bold">
            {averageStack.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Add-On info banner (shown after rebuy phase ends) */}
      {addOnWindowOpen && totalAddOns < activePlayers.length && (
        <div className="px-3 py-2 bg-amber-900/30 border border-amber-700/40 rounded-lg">
          <p className="text-amber-300 text-sm font-medium">
            {t('playerPanel.addOnAvailable')}
          </p>
          <p className="text-amber-500/70 text-xs mt-0.5">
            {addOnConfig.cost} {t('unit.eur')} → +{addOnConfig.chips.toLocaleString()} {t('unit.chips')}
          </p>
        </div>
      )}

      {/* Active Players */}
      <div>
        <h3 className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          {t('playerPanel.activePlayers')} ({activePlayers.length})
        </h3>
        <div className="mt-1 space-y-1">
          {activePlayers.map((player) => {
            const seatIndex = players.indexOf(player);
            const isDealer = seatIndex === dealerIndex;
            return (
            <div
              key={player.id}
              className="flex items-center justify-between px-3 py-1.5 bg-gray-100/80 dark:bg-gray-800/40 rounded-lg border border-gray-200 dark:border-gray-700/20 transition-colors hover:bg-gray-200/60 dark:hover:bg-gray-800/60 hover:border-gray-300 dark:hover:border-gray-600/40"
            >
              <div className="flex-1 mr-2 min-w-0">
                <span className={`${nameSizeClass} text-gray-800 dark:text-gray-200 truncate block`}>
                  <span className="text-gray-400 dark:text-gray-500 text-xs mr-1">#{seatIndex + 1}</span>
                  {isDealer && (
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold mr-1 align-text-bottom ring-2 ring-red-500/30">D</span>
                  )}
                  {player.name}
                </span>
                {bountyConfig.enabled && player.knockouts > 0 && (
                  <span className="text-xs text-amber-400">
                    {player.knockouts} KO ({(player.knockouts * bountyConfig.amount).toFixed(0)} {t('unit.eur')})
                  </span>
                )}
                {!rebuyActive && player.rebuys > 0 && (
                  <span className="inline-block bg-emerald-900/30 text-emerald-400 rounded-full px-1.5 text-xs font-medium">
                    {player.rebuys} RB
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {/* Rebuy controls (only during active rebuy phase) */}
                {rebuyActive && (
                  <div className="flex items-center gap-1 mr-1" title="Rebuys">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 mr-0.5">RB</span>
                    <button
                      onClick={() =>
                        onUpdateRebuys(player.id, Math.max(0, player.rebuys - 1))
                      }
                      disabled={player.rebuys <= 0}
                      className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      -
                    </button>
                    <span className="text-gray-900 dark:text-white text-xs font-mono w-4 text-center">
                      {player.rebuys}
                    </span>
                    <button
                      onClick={() =>
                        onUpdateRebuys(player.id, player.rebuys + 1)
                      }
                      className="w-8 h-8 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-colors"
                    >
                      +
                    </button>
                  </div>
                )}

                {/* Add-On toggle (only after rebuy phase ends) */}
                {addOnWindowOpen && (
                  <button
                    onClick={() => onUpdateAddOn(player.id, !player.addOn)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      player.addOn
                        ? 'bg-emerald-700/50 text-emerald-300'
                        : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400'
                    }`}
                    title="Add-On"
                  >
                    {player.addOn ? '✓ AO' : 'AO'}
                  </button>
                )}

                {/* Eliminate button */}
                {activePlayers.length > 1 && (
                  <button
                    onClick={() => handleEliminate(player.id)}
                    className="px-3 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-800 text-red-300 text-xs font-medium transition-all duration-200 border border-red-800/30 hover:border-red-700/50"
                    title={t('playerPanel.eliminateTooltip')}
                  >
                    {t('playerPanel.eliminate')}
                  </button>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* Bounty elimination dialog */}
      {eliminatingId && bountyConfig.enabled && (
        <div className="px-3 py-3 bg-amber-900/20 border border-amber-700/40 rounded-lg space-y-2">
          <p className="text-sm text-amber-300 font-medium">
            {t('playerPanel.whoEliminated', { name: players.find((p) => p.id === eliminatingId)?.name ?? '?' })}
          </p>
          <select
            value={selectedKiller}
            onChange={(e) => setSelectedKiller(e.target.value)}
            className="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:border-amber-500"
          >
            <option value="">{t('playerPanel.selectPlayer')}</option>
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
              className="flex-1 px-2 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-xs font-medium transition-colors"
            >
              {t('app.cancel')}
            </button>
            <button
              onClick={confirmElimination}
              disabled={!selectedKiller}
              className="flex-1 px-2 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {t('playerPanel.confirm')}
            </button>
          </div>
        </div>
      )}

      {/* Eliminated Players */}
      {eliminatedPlayers.length > 0 && (
        <div>
          <h3 className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {t('playerPanel.eliminated')}
          </h3>
          <div className="mt-1 space-y-1">
            {eliminatedPlayers.map((player, idx) => {
              // Only the most recently eliminated player (highest placement = last in sorted list) can be reinstated
              const isLastEliminated = idx === eliminatedPlayers.length - 1;
              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between px-3 py-1.5 bg-gray-100/50 dark:bg-gray-800/20 rounded-lg opacity-40"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-bold w-6 text-right shrink-0">
                      {player.placement}.
                    </span>
                    <span className={`${nameSizeClass} text-gray-500 dark:text-gray-400 line-through truncate`}>
                      {player.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {bountyConfig.enabled && (
                      <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                        {player.knockouts > 0 && (
                          <span className="text-amber-500/70">
                            {player.knockouts} KO
                          </span>
                        )}
                        {player.eliminatedBy && (
                          <span>
                            {t('playerPanel.by')} {players.find((p) => p.id === player.eliminatedBy)?.name ?? '?'}
                          </span>
                        )}
                      </div>
                    )}
                    {isLastEliminated && (
                      <button
                        onClick={() => onReinstatePlayer(player.id)}
                        className="px-3 py-1.5 rounded-lg bg-blue-900/40 hover:bg-blue-800 text-blue-300 text-xs font-medium transition-all duration-200 border border-blue-800/30"
                        title={t('playerPanel.reinstateTooltip')}
                      >
                        {t('playerPanel.reinstate')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
