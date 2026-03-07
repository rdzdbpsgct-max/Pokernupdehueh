import { useState, useEffect, useCallback } from 'react';
import type { TimerState, Level, ChipConfig, ChipDenomination, Player, PayoutConfig, RebuyConfig, AddOnConfig, BountyConfig } from '../domain/types';
import {
  formatTime, getLevelLabel, getBlindsText, getRemovedDenomIds, getNextColorUpLevel,
  computePrizePool, computePayouts, computeTotalRebuys, computeTotalAddOns,
  computeAverageStackInBB, formatElapsedTime, computeEstimatedRemainingSeconds, findChipLeader,
} from '../domain/logic';
import { useTranslation } from '../i18n';

type SecondaryScreen = 'players' | 'stats' | 'payout' | 'schedule' | 'chips';

interface Props {
  timerState: TimerState;
  levels: Level[];
  chipConfig?: ChipConfig;
  colorUpMap?: Map<number, ChipDenomination[]>;
  tournamentName: string;
  activePlayerCount: number;
  totalPlayerCount: number;
  isBubble: boolean;
  isLastHand: boolean;
  isHandForHand?: boolean;
  onExit: () => void;
  players: Player[];
  buyIn: number;
  payout: PayoutConfig;
  rebuy: RebuyConfig;
  addOn: AddOnConfig;
  bounty: BountyConfig;
  averageStack: number;
  tournamentElapsed: number;
}

const ROTATION_INTERVAL = 15_000;

export function DisplayMode({
  timerState,
  levels,
  chipConfig,
  colorUpMap,
  tournamentName,
  activePlayerCount,
  totalPlayerCount,
  isBubble,
  isLastHand,
  isHandForHand,
  onExit,
  players,
  buyIn,
  payout,
  rebuy,
  addOn,
  bounty,
  averageStack,
  tournamentElapsed,
}: Props) {
  const { t } = useTranslation();

  // Build available secondary screens in order
  const secondaryScreens: SecondaryScreen[] = (() => {
    const screens: SecondaryScreen[] = ['players', 'stats', 'payout', 'schedule'];
    if (chipConfig?.enabled) screens.push('chips');
    return screens;
  })();

  const [activeSecondary, setActiveSecondary] = useState<SecondaryScreen>('players');

  // Auto-rotate secondary area every 15 seconds
  useEffect(() => {
    if (secondaryScreens.length <= 1) return;
    const id = setInterval(() => {
      setActiveSecondary((prev) => {
        const idx = secondaryScreens.indexOf(prev);
        return secondaryScreens[(idx + 1) % secondaryScreens.length];
      });
    }, ROTATION_INTERVAL);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chipConfig?.enabled]);

  // Keyboard: Arrow keys for manual secondary navigation, T/Escape to exit
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === 'ArrowRight' || e.code === 'ArrowDown') {
        e.preventDefault();
        setActiveSecondary((prev) => {
          const idx = secondaryScreens.indexOf(prev);
          return secondaryScreens[(idx + 1) % secondaryScreens.length];
        });
      } else if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') {
        e.preventDefault();
        setActiveSecondary((prev) => {
          const idx = secondaryScreens.indexOf(prev);
          return secondaryScreens[(idx - 1 + secondaryScreens.length) % secondaryScreens.length];
        });
      } else if (e.code === 'KeyT' || e.code === 'Escape') {
        e.preventDefault();
        onExit();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onExit, chipConfig?.enabled],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const currentLevel = levels[timerState.currentLevelIndex];
  if (!currentLevel) return null;

  const remaining = timerState.remainingSeconds;
  const isBreak = currentLevel.type === 'break';
  const isCountdown = remaining <= 10 && remaining > 0 && timerState.status === 'running';
  const label = getLevelLabel(currentLevel, timerState.currentLevelIndex, levels);
  const progress = 1 - remaining / currentLevel.durationSeconds;
  const pct = Math.min(100, progress * 100);
  const nextIdx = timerState.currentLevelIndex + 1;
  const nextLevel = nextIdx < levels.length ? levels[nextIdx] : null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 text-white flex flex-col select-none overflow-hidden">
      {/* Top bar: tournament name + players + exit */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-gray-800/60">
        <h1 className="text-base font-bold text-gray-300 tracking-tight truncate max-w-[50vw]">
          {tournamentName || t('app.title')}
        </h1>
        <div className="flex items-center gap-4">
          {/* Secondary screen indicator dots */}
          {secondaryScreens.length > 1 && (
            <div className="flex items-center gap-1.5">
              {secondaryScreens.map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveSecondary(s)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    s === activeSecondary
                      ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]'
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                  aria-label={s}
                />
              ))}
            </div>
          )}
          <span className="text-gray-400 text-sm font-medium tabular-nums">
            {activePlayerCount}/{totalPlayerCount} {t('display.playersRemaining')}
          </span>
          <button
            onClick={onExit}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg text-xs font-medium transition-colors border border-gray-700/50"
          >
            {t('display.exit')}
          </button>
        </div>
      </div>

      {/* TIMER — always visible (top ~55% of screen) */}
      <div className="flex flex-col items-center justify-center px-6 py-3 flex-[55]">
        {/* Banners */}
        <div className="flex items-center gap-3 mb-2 min-h-[2.5rem]">
          {isLastHand && (
            <div className="px-6 py-1.5 bg-amber-900/40 border-2 border-amber-500 rounded-xl text-center animate-addon-pulse">
              <p className="text-amber-300 text-lg font-bold tracking-wider">{t('game.lastHand')}</p>
            </div>
          )}
          {isBubble && (
            <div className="px-6 py-1.5 bg-red-900/40 border-2 border-red-500 rounded-xl text-center animate-bubble-pulse">
              <p className="text-red-300 text-lg font-bold tracking-wider">{t('bubble.bubble')}</p>
            </div>
          )}
          {isHandForHand && (
            <div className="px-6 py-1.5 bg-red-900/40 border-2 border-red-500 rounded-xl text-center animate-bubble-pulse">
              <p className="text-red-300 text-lg font-bold tracking-wider">{t('display.handForHand')}</p>
            </div>
          )}
        </div>

        {/* Level label */}
        <p className={`font-bold uppercase tracking-wider text-xl sm:text-2xl ${
          isBreak ? 'text-amber-400' : 'text-emerald-400'
        }`}>
          {label}
        </p>

        {/* Blinds */}
        {currentLevel.type === 'level' && (
          <div className="text-center">
            <p className="text-[3rem] sm:text-[5rem] lg:text-[7rem] font-bold tabular-nums tracking-wide leading-none drop-shadow-[0_0_20px_rgba(255,255,255,0.08)]">
              {currentLevel.smallBlind ?? 0} / {currentLevel.bigBlind ?? 0}
            </p>
            {currentLevel.ante != null && currentLevel.ante > 0 && (
              <p className="text-gray-400 font-semibold text-lg sm:text-2xl mt-1">
                {t('display.ante')} {currentLevel.ante}
              </p>
            )}
          </div>
        )}
        {isBreak && (
          <p className="text-amber-300 font-semibold text-3xl sm:text-5xl">{currentLevel.label || t('display.break')}</p>
        )}

        {/* Timer */}
        <p className={`font-mono font-bold tabular-nums text-[4rem] sm:text-[6rem] lg:text-[8rem] leading-none ${
          isCountdown
            ? 'text-red-500 animate-countdown-pulse'
            : timerState.status === 'paused'
            ? 'text-yellow-400 opacity-80'
            : remaining <= 0
            ? 'text-gray-500'
            : 'animate-timer-glow'
        }`}>
          {formatTime(remaining)}
        </p>

        {/* Progress bar */}
        <div className="w-full max-w-3xl h-2.5 bg-gray-800 rounded-full overflow-hidden mt-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isBreak
                ? 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                : 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Next level */}
        {nextLevel && (
          <div className="text-center mt-1">
            <span className="text-gray-500 text-xs uppercase tracking-wider">{t('display.nextLevel')}: </span>
            {nextLevel.type === 'break' ? (
              <span className="text-amber-500/70 font-medium text-sm">{t('display.break')} ({formatTime(nextLevel.durationSeconds)})</span>
            ) : (
              <span className="text-gray-400 font-medium text-sm">
                {getBlindsText(nextLevel)} ({formatTime(nextLevel.durationSeconds)})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Separator */}
      <div className="border-t border-gray-800/60" />

      {/* SECONDARY AREA — rotates between 5 screens (bottom ~45%) */}
      <div className="flex-[45] overflow-hidden px-6 py-3 animate-fade-in" key={activeSecondary}>
        {activeSecondary === 'players' && (
          <PlayersScreen players={players} />
        )}
        {activeSecondary === 'stats' && (
          <StatsScreen
            players={players}
            levels={levels}
            currentLevelIndex={timerState.currentLevelIndex}
            remainingSeconds={timerState.remainingSeconds}
            buyIn={buyIn}
            rebuy={rebuy}
            addOn={addOn}
            bounty={bounty}
            averageStack={averageStack}
            tournamentElapsed={tournamentElapsed}
            activePlayerCount={activePlayerCount}
            totalPlayerCount={totalPlayerCount}
          />
        )}
        {activeSecondary === 'payout' && (
          <PayoutScreen
            players={players}
            buyIn={buyIn}
            payout={payout}
            rebuy={rebuy}
            addOn={addOn}
            isBubble={isBubble}
          />
        )}
        {activeSecondary === 'schedule' && (
          <ScheduleScreen levels={levels} currentLevelIndex={timerState.currentLevelIndex} />
        )}
        {activeSecondary === 'chips' && chipConfig && colorUpMap && (
          <ChipsScreen chipConfig={chipConfig} colorUpMap={colorUpMap} currentLevelIndex={timerState.currentLevelIndex} levels={levels} />
        )}
      </div>

      {/* Bottom bar: rotation hint */}
      <div className="px-6 py-1.5 border-t border-gray-800/60 text-center">
        <p className="text-gray-600 text-xs">
          {secondaryScreens.length > 1
            ? `${t('display.rotationHint', { n: ROTATION_INTERVAL / 1000 })} · ← → ${t('display.navigate')}`
            : `← → ${t('display.navigate')}`
          }
        </p>
      </div>
    </div>
  );
}

// --- Players Screen ---
function PlayersScreen({ players }: { players: Player[] }) {
  const { t } = useTranslation();
  const chipLeaderId = findChipLeader(players);
  const activePlayers = players.filter((p) => p.status === 'active');
  const eliminatedPlayers = [...players]
    .filter((p) => p.status === 'eliminated')
    .sort((a, b) => (a.placement ?? 0) - (b.placement ?? 0));

  return (
    <div className="w-full max-w-4xl mx-auto h-full flex flex-col">
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">
        {t('display.players')} ({activePlayers.length}/{players.length})
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 flex-1 overflow-hidden">
        {activePlayers.map((p, i) => (
          <div
            key={p.id}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/60 border border-gray-700/40 text-sm"
          >
            <span className="text-gray-500 font-mono text-xs w-5 shrink-0">{i + 1}</span>
            <span className="text-gray-200 font-medium truncate flex-1">{p.name}</span>
            {p.id === chipLeaderId && (
              <span className="text-amber-400 text-xs font-bold shrink-0">{t('display.chipLeaderBadge')}</span>
            )}
            {p.rebuys > 0 && (
              <span className="text-emerald-400/70 text-xs shrink-0">R{p.rebuys}</span>
            )}
          </div>
        ))}
      </div>
      {eliminatedPlayers.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 justify-center">
          {eliminatedPlayers.map((p) => (
            <span key={p.id} className="text-gray-600 text-xs">
              {p.placement ?? '?'}. {p.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Stats Screen ---
function StatsScreen({
  players,
  levels,
  currentLevelIndex,
  remainingSeconds,
  buyIn,
  rebuy,
  addOn,
  bounty,
  averageStack,
  tournamentElapsed,
  activePlayerCount,
  totalPlayerCount,
}: {
  players: Player[];
  levels: Level[];
  currentLevelIndex: number;
  remainingSeconds: number;
  buyIn: number;
  rebuy: RebuyConfig;
  addOn: AddOnConfig;
  bounty: BountyConfig;
  averageStack: number;
  tournamentElapsed: number;
  activePlayerCount: number;
  totalPlayerCount: number;
}) {
  const { t } = useTranslation();

  const prizePool = computePrizePool(
    players, buyIn,
    rebuy.enabled ? rebuy.rebuyCost : undefined,
    addOn.enabled ? addOn.cost : undefined,
  );

  const currentLevel = levels[currentLevelIndex];
  const currentBB = currentLevel?.type === 'level' ? (currentLevel.bigBlind ?? 0) : 0;
  const avgBB = currentBB > 0 ? computeAverageStackInBB(averageStack, currentBB) : 0;
  const estRemaining = computeEstimatedRemainingSeconds(levels, currentLevelIndex, remainingSeconds);

  const totalRebuys = rebuy.enabled ? computeTotalRebuys(players) : 0;
  const totalAddOns = addOn.enabled ? computeTotalAddOns(players) : 0;

  const stats: { label: string; value: string }[] = [
    { label: t('display.prizePool'), value: `${prizePool.toLocaleString()} ${t('unit.eur')}` },
    { label: t('display.activePlayers'), value: `${activePlayerCount} / ${totalPlayerCount}` },
  ];
  if (currentBB > 0) {
    stats.push({ label: t('display.avgStack'), value: `${avgBB} BB` });
  }
  stats.push({ label: t('display.elapsed'), value: formatElapsedTime(tournamentElapsed) });
  stats.push({ label: t('display.remaining'), value: `~${formatElapsedTime(estRemaining)}` });
  if (rebuy.enabled && totalRebuys > 0) {
    stats.push({ label: t('display.totalRebuys'), value: String(totalRebuys) });
  }
  if (addOn.enabled && totalAddOns > 0) {
    stats.push({ label: t('display.totalAddOns'), value: String(totalAddOns) });
  }
  if (bounty.enabled) {
    stats.push({ label: t('display.bountyPool'), value: `${players.length * bounty.amount} ${t('unit.eur')}` });
  }

  return (
    <div className="w-full max-w-3xl mx-auto h-full flex flex-col">
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 text-center">
        {t('display.stats')}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1 content-center">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center px-4 py-3 rounded-xl bg-gray-800/60 border border-gray-700/40"
          >
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums">
              {s.value}
            </span>
            <span className="text-xs text-gray-500 uppercase tracking-wider mt-1">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Payout Screen ---
function PayoutScreen({
  players,
  buyIn,
  payout,
  rebuy,
  addOn,
  isBubble,
}: {
  players: Player[];
  buyIn: number;
  payout: PayoutConfig;
  rebuy: RebuyConfig;
  addOn: AddOnConfig;
  isBubble: boolean;
}) {
  const { t } = useTranslation();

  const prizePool = computePrizePool(
    players, buyIn,
    rebuy.enabled ? rebuy.rebuyCost : undefined,
    addOn.enabled ? addOn.cost : undefined,
  );
  const payoutAmounts = computePayouts(payout, prizePool);
  const paidPlaces = payout.entries.length;

  return (
    <div className="w-full max-w-2xl mx-auto h-full flex flex-col">
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">
        {t('display.payout')} — {prizePool.toLocaleString()} {t('unit.eur')}
      </h2>
      <div className="space-y-1 flex-1 overflow-hidden">
        {payoutAmounts.map((p) => {
          const isBubblePos = isBubble && p.place === paidPlaces;
          return (
            <div
              key={p.place}
              className={`flex items-center justify-between px-4 py-2 rounded-lg text-base transition-all ${
                p.place === 1
                  ? 'bg-amber-900/40 border border-amber-500/50 text-amber-200'
                  : p.place <= 3
                  ? 'bg-gray-800/60 border border-gray-700/40 text-gray-200'
                  : 'bg-gray-900/40 border border-gray-800/40 text-gray-400'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm w-8">
                  {p.place === 1 ? '🏆' : p.place === 2 ? '🥈' : p.place === 3 ? '🥉' : `${p.place}.`}
                </span>
                <span className="font-medium">
                  {t('display.payoutPlace', { n: p.place })}
                </span>
                {isBubblePos && (
                  <span className="text-red-400 text-xs font-bold animate-bubble-pulse">
                    ← Bubble
                  </span>
                )}
              </span>
              <span className="font-mono font-bold tabular-nums">
                {p.amount.toLocaleString()} {t('unit.eur')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Schedule Screen (compact for bottom area) ---
function ScheduleScreen({
  levels,
  currentLevelIndex,
}: {
  levels: Level[];
  currentLevelIndex: number;
}) {
  const { t } = useTranslation();
  const visibleCount = 8;
  const start = Math.max(0, currentLevelIndex - 1);
  const end = Math.min(levels.length, start + visibleCount);
  const visible = levels.slice(start, end);

  return (
    <div className="w-full max-w-4xl mx-auto h-full flex flex-col">
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">
        {t('display.schedule')}
      </h2>
      <div className="space-y-1 flex-1 overflow-hidden">
        {visible.map((level, vi) => {
          const i = start + vi;
          const isCurrent = i === currentLevelIndex;
          const isPast = i < currentLevelIndex;
          const levelLabel = getLevelLabel(level, i, levels);

          return (
            <div
              key={level.id}
              className={`flex items-center justify-between px-4 py-1.5 rounded-lg text-sm sm:text-base transition-all ${
                isCurrent
                  ? level.type === 'break'
                    ? 'bg-amber-900/40 border border-amber-500/70 text-amber-200 shadow-lg shadow-amber-900/20'
                    : 'bg-emerald-900/40 border border-emerald-500/70 text-white shadow-lg shadow-emerald-900/20'
                  : isPast
                  ? 'bg-gray-900/30 text-gray-600 line-through'
                  : level.type === 'break'
                  ? 'bg-amber-950/20 text-amber-400/70 border border-amber-800/30'
                  : 'bg-gray-900/40 text-gray-400 border border-gray-800/40'
              }`}
            >
              <span className="flex items-center gap-2">
                {isCurrent && <span className="text-emerald-400 text-base">▸</span>}
                <span className="font-medium">{levelLabel}</span>
                {level.type === 'level' && (
                  <span className={isCurrent ? 'text-gray-300' : 'text-gray-500'}>{getBlindsText(level)}</span>
                )}
                {level.type === 'level' && level.ante != null && level.ante > 0 && (
                  <span className={`text-xs ${isCurrent ? 'text-gray-400' : 'text-gray-600'}`}>
                    (Ante {level.ante})
                  </span>
                )}
              </span>
              <span className="font-mono text-xs text-gray-500">{formatTime(level.durationSeconds)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Chips Screen (compact for bottom area) ---
function ChipsScreen({
  chipConfig,
  colorUpMap,
  currentLevelIndex,
  levels,
}: {
  chipConfig: ChipConfig;
  colorUpMap: Map<number, ChipDenomination[]>;
  currentLevelIndex: number;
  levels: Level[];
}) {
  const { t } = useTranslation();
  const removedIds = getRemovedDenomIds(colorUpMap, currentLevelIndex);
  const nextColorUpLevel = getNextColorUpLevel(colorUpMap, currentLevelIndex);
  const sorted = [...chipConfig.denominations].sort((a, b) => a.value - b.value);

  return (
    <div className="w-full max-w-3xl mx-auto h-full flex flex-col">
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">
        {t('display.chips')}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1 overflow-hidden">
        {sorted.map((denom) => {
          const isRemoved = removedIds.has(denom.id);
          return (
            <div
              key={denom.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-base transition-all ${
                isRemoved
                  ? 'opacity-30 bg-gray-900/30'
                  : 'bg-gray-800/60 border border-gray-700/40'
              }`}
            >
              <span
                className="w-6 h-6 rounded-full shrink-0 border-2 border-white/20 shadow-lg"
                style={{ backgroundColor: denom.color }}
              />
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate text-sm ${isRemoved ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                  {denom.label}
                </p>
                <p className={`font-mono text-xs ${isRemoved ? 'line-through text-gray-600' : 'text-gray-400'}`}>
                  {denom.value.toLocaleString()}
                </p>
              </div>
              {isRemoved && <span className="text-red-400/60 text-sm">✕</span>}
            </div>
          );
        })}
      </div>

      {/* Next color-up */}
      {chipConfig.colorUpEnabled && nextColorUpLevel !== null && (
        <div className="mt-2 text-center">
          <p className="text-amber-400/80 text-sm font-medium">
            {t('chipSidebar.nextColorUp')}:{' '}
            {(() => {
              const targetLevel = levels[nextColorUpLevel];
              const isBreak = targetLevel?.type === 'break';
              const playLevelNumber = levels
                .slice(0, nextColorUpLevel + 1)
                .filter((l) => l.type === 'level').length;
              const denoms = colorUpMap.get(nextColorUpLevel) ?? [];
              return (
                <span>
                  {isBreak
                    ? t('chipSidebar.atBreak', { level: playLevelNumber })
                    : t('chipSidebar.atLevel', { level: playLevelNumber })}
                  {' ('}
                  {denoms.map((d) => d.label).join(', ')}
                  {')'}
                </span>
              );
            })()}
          </p>
        </div>
      )}
    </div>
  );
}
