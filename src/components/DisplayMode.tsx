import { useState, useEffect, useCallback } from 'react';
import type { TimerState, Level, ChipConfig, ChipDenomination } from '../domain/types';
import { formatTime, getLevelLabel, getBlindsText, getRemovedDenomIds, getNextColorUpLevel } from '../domain/logic';
import { useTranslation } from '../i18n';

type Screen = 'timer' | 'schedule' | 'chips';

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
}: Props) {
  const { t } = useTranslation();

  // Build available screens
  const screens: Screen[] = ['timer', 'schedule'];
  if (chipConfig?.enabled) screens.push('chips');

  const [activeScreen, setActiveScreen] = useState<Screen>('timer');

  // Auto-rotate every 15 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setActiveScreen((prev) => {
        const idx = screens.indexOf(prev);
        return screens[(idx + 1) % screens.length];
      });
    }, ROTATION_INTERVAL);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chipConfig?.enabled]);

  // Keyboard: Arrow keys for manual navigation, T/Escape to exit
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === 'ArrowRight' || e.code === 'ArrowDown') {
        e.preventDefault();
        setActiveScreen((prev) => {
          const idx = screens.indexOf(prev);
          return screens[(idx + 1) % screens.length];
        });
      } else if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') {
        e.preventDefault();
        setActiveScreen((prev) => {
          const idx = screens.indexOf(prev);
          return screens[(idx - 1 + screens.length) % screens.length];
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

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 text-white flex flex-col select-none overflow-hidden">
      {/* Top bar: tournament name + players + screen dots */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-800/60">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-gray-300 tracking-tight truncate max-w-[50vw]">
            {tournamentName || t('app.title')}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Screen indicator dots */}
          <div className="flex items-center gap-1.5">
            {screens.map((s) => (
              <button
                key={s}
                onClick={() => setActiveScreen(s)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  s === activeScreen
                    ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
                aria-label={s}
              />
            ))}
          </div>
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

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in" key={activeScreen}>
        {activeScreen === 'timer' && (
          <TimerScreen
            label={label}
            currentLevel={currentLevel}
            remaining={remaining}
            isBreak={isBreak}
            isCountdown={isCountdown}
            timerState={timerState}
            levels={levels}
            isBubble={isBubble}
            isLastHand={isLastHand}
            isHandForHand={isHandForHand}
          />
        )}
        {activeScreen === 'schedule' && (
          <ScheduleScreen
            levels={levels}
            currentLevelIndex={timerState.currentLevelIndex}
          />
        )}
        {activeScreen === 'chips' && chipConfig && colorUpMap && (
          <ChipsScreen
            chipConfig={chipConfig}
            colorUpMap={colorUpMap}
            currentLevelIndex={timerState.currentLevelIndex}
            levels={levels}
          />
        )}
      </div>

      {/* Bottom bar: rotation hint */}
      <div className="px-6 py-2 border-t border-gray-800/60 text-center">
        <p className="text-gray-600 text-xs">
          {t('display.rotationHint', { n: ROTATION_INTERVAL / 1000 })} · ← → {t('display.navigate')}
        </p>
      </div>
    </div>
  );
}

// --- Timer Screen ---
function TimerScreen({
  label,
  currentLevel,
  remaining,
  isBreak,
  isCountdown,
  timerState,
  levels,
  isBubble,
  isLastHand,
  isHandForHand,
}: {
  label: string;
  currentLevel: Level;
  remaining: number;
  isBreak: boolean;
  isCountdown: boolean;
  timerState: TimerState;
  levels: Level[];
  isBubble: boolean;
  isLastHand: boolean;
  isHandForHand?: boolean;
}) {
  const { t } = useTranslation();
  const progress = 1 - remaining / currentLevel.durationSeconds;
  const pct = Math.min(100, progress * 100);

  const nextIdx = timerState.currentLevelIndex + 1;
  const nextLevel = nextIdx < levels.length ? levels[nextIdx] : null;

  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full max-w-5xl">
      {/* Banners */}
      {isLastHand && (
        <div className="px-8 py-3 bg-amber-900/40 border-2 border-amber-500 rounded-xl text-center animate-addon-pulse">
          <p className="text-amber-300 text-2xl font-bold tracking-wider">{t('game.lastHand')}</p>
        </div>
      )}
      {isBubble && (
        <div className="px-8 py-3 bg-red-900/40 border-2 border-red-500 rounded-xl text-center animate-bubble-pulse">
          <p className="text-red-300 text-2xl font-bold tracking-wider">🫧 {t('bubble.bubble')} 🫧</p>
        </div>
      )}
      {isHandForHand && (
        <div className="px-8 py-3 bg-red-900/40 border-2 border-red-500 rounded-xl text-center animate-bubble-pulse">
          <p className="text-red-300 text-2xl font-bold tracking-wider">{t('display.handForHand')}</p>
        </div>
      )}

      {/* Level label */}
      <p className={`font-bold uppercase tracking-wider text-2xl sm:text-3xl ${
        isBreak ? 'text-amber-400' : 'text-emerald-400'
      }`}>
        {label}
      </p>

      {/* Blinds */}
      {currentLevel.type === 'level' && (
        <div className="text-center">
          <p className="text-[4rem] sm:text-[7rem] lg:text-[10rem] font-bold tabular-nums tracking-wide leading-none drop-shadow-[0_0_20px_rgba(255,255,255,0.08)]">
            {currentLevel.smallBlind ?? 0} / {currentLevel.bigBlind ?? 0}
          </p>
          {currentLevel.ante != null && currentLevel.ante > 0 && (
            <p className="text-gray-400 font-semibold text-xl sm:text-3xl mt-2">
              {t('display.ante')} {currentLevel.ante}
            </p>
          )}
        </div>
      )}
      {isBreak && (
        <p className="text-amber-300 font-semibold text-4xl sm:text-6xl">{t('display.break')}</p>
      )}

      {/* Timer */}
      <p className={`font-mono font-bold tabular-nums text-[5rem] sm:text-[9rem] lg:text-[12rem] leading-none ${
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
      <div className="w-full max-w-3xl h-3 bg-gray-800 rounded-full overflow-hidden">
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
        <div className="text-center mt-2">
          <p className="text-gray-500 text-sm uppercase tracking-wider">{t('display.nextLevel')}</p>
          {nextLevel.type === 'break' ? (
            <p className="text-amber-500/70 font-medium text-lg">{t('display.break')} ({formatTime(nextLevel.durationSeconds)})</p>
          ) : (
            <p className="text-gray-400 font-medium text-lg">
              {getBlindsText(nextLevel)} ({formatTime(nextLevel.durationSeconds)})
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// --- Schedule Screen ---
function ScheduleScreen({
  levels,
  currentLevelIndex,
}: {
  levels: Level[];
  currentLevelIndex: number;
}) {
  const { t } = useTranslation();
  const visibleCount = 14;
  const start = Math.max(0, currentLevelIndex - 2);
  const end = Math.min(levels.length, start + visibleCount);
  const visible = levels.slice(start, end);

  return (
    <div className="w-full max-w-4xl">
      <h2 className="text-xl font-bold text-gray-300 uppercase tracking-wider mb-4 text-center">
        {t('display.schedule')}
      </h2>
      <div className="space-y-1.5">
        {visible.map((level, vi) => {
          const i = start + vi;
          const isCurrent = i === currentLevelIndex;
          const isPast = i < currentLevelIndex;
          const levelLabel = getLevelLabel(level, i, levels);

          return (
            <div
              key={level.id}
              className={`flex items-center justify-between px-5 py-2.5 rounded-xl text-base sm:text-lg transition-all ${
                isCurrent
                  ? level.type === 'break'
                    ? 'bg-amber-900/40 border-2 border-amber-500/70 text-amber-200 shadow-lg shadow-amber-900/20'
                    : 'bg-emerald-900/40 border-2 border-emerald-500/70 text-white shadow-lg shadow-emerald-900/20'
                  : isPast
                  ? 'bg-gray-900/30 text-gray-600 line-through'
                  : level.type === 'break'
                  ? 'bg-amber-950/20 text-amber-400/70 border border-amber-800/30'
                  : 'bg-gray-900/40 text-gray-400 border border-gray-800/40'
              }`}
            >
              <span className="flex items-center gap-3">
                {isCurrent && <span className="text-emerald-400 text-xl">▸</span>}
                <span className="font-medium">{levelLabel}</span>
                {level.type === 'level' && (
                  <span className={isCurrent ? 'text-gray-300' : 'text-gray-500'}>{getBlindsText(level)}</span>
                )}
                {level.type === 'level' && level.ante != null && level.ante > 0 && (
                  <span className={`text-sm ${isCurrent ? 'text-gray-400' : 'text-gray-600'}`}>
                    (Ante {level.ante})
                  </span>
                )}
              </span>
              <span className="font-mono text-sm text-gray-500">{formatTime(level.durationSeconds)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Chips Screen ---
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
    <div className="w-full max-w-3xl">
      <h2 className="text-xl font-bold text-gray-300 uppercase tracking-wider mb-6 text-center">
        {t('display.chips')}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {sorted.map((denom) => {
          const isRemoved = removedIds.has(denom.id);
          return (
            <div
              key={denom.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-lg transition-all ${
                isRemoved
                  ? 'opacity-30 bg-gray-900/30'
                  : 'bg-gray-800/60 border border-gray-700/40'
              }`}
            >
              <span
                className="w-8 h-8 rounded-full shrink-0 border-2 border-white/20 shadow-lg"
                style={{ backgroundColor: denom.color }}
              />
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${isRemoved ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                  {denom.label}
                </p>
                <p className={`font-mono text-sm ${isRemoved ? 'line-through text-gray-600' : 'text-gray-400'}`}>
                  {denom.value.toLocaleString()}
                </p>
              </div>
              {isRemoved && <span className="text-red-400/60 text-lg">✕</span>}
            </div>
          );
        })}
      </div>

      {/* Next color-up */}
      {chipConfig.colorUpEnabled && nextColorUpLevel !== null && (
        <div className="mt-6 text-center">
          <p className="text-amber-400/80 text-base font-medium">
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
