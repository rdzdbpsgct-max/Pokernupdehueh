import { useState } from 'react';
import type { Level, TimerState, ChipConfig, ChipDenomination } from '../domain/types';
import { formatTime, getLevelLabel, getBlindsText } from '../domain/logic';
import { useTranslation } from '../i18n';

interface Props {
  timerState: TimerState;
  levels: Level[];
  largeDisplay: boolean;
  countdownEnabled: boolean;
  onScrub?: (seconds: number) => void;
  chipConfig?: ChipConfig;
  colorUpMap?: Map<number, ChipDenomination[]>;
}

function NextLevelInfo({ levels, currentLevelIndex, largeDisplay }: { levels: Level[]; currentLevelIndex: number; largeDisplay: boolean }) {
  const { t } = useTranslation();
  const nextIdx = currentLevelIndex + 1;
  const nextLvl = nextIdx < levels.length ? levels[nextIdx] : null;
  if (!nextLvl) return null;
  const nextLabel = getLevelLabel(nextLvl, nextIdx, levels);
  return (
    <div className="text-center">
      <p className={`text-gray-500 ${largeDisplay ? 'text-sm' : 'text-xs'} uppercase tracking-wider`}>
        {t('timer.next')} {nextLabel}
      </p>
      {nextLvl.type === 'break' ? (
        <p className={`text-amber-500/70 font-medium mt-0.5 ${largeDisplay ? 'text-lg' : 'text-sm'}`}>
          {t('timer.break')} ({formatTime(nextLvl.durationSeconds)})
        </p>
      ) : (
        <p className={`text-gray-400 font-medium mt-0.5 ${largeDisplay ? 'text-lg' : 'text-sm'}`}>
          {getBlindsText(nextLvl)} ({formatTime(nextLvl.durationSeconds)})
        </p>
      )}
    </div>
  );
}

export function TimerDisplay({ timerState, levels, largeDisplay, countdownEnabled, onScrub, chipConfig, colorUpMap }: Props) {
  const { t } = useTranslation();
  const [scrubbing, setScrubbing] = useState(false);

  const currentLevel = levels[timerState.currentLevelIndex];
  if (!currentLevel) return null;

  const remaining = timerState.remainingSeconds;
  const isCountdown = countdownEnabled && remaining <= 10 && remaining > 0 && timerState.status === 'running';
  const isBreak = currentLevel.type === 'break';
  const progress = 1 - remaining / currentLevel.durationSeconds;

  const label = getLevelLabel(currentLevel, timerState.currentLevelIndex, levels);

  return (
    <div className="flex flex-col items-center justify-center gap-2 sm:gap-4 select-none w-full">
      {/* Progress bar */}
      <div className="w-full max-w-xl h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-200 ${
            isBreak ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${Math.min(100, progress * 100)}%` }}
        />
      </div>

      {/* Level info */}
      <div className="text-center">
        <p className={`font-bold uppercase tracking-wider ${
          isBreak ? 'text-amber-400' : 'text-emerald-400'
        } ${largeDisplay ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'}`}>
          {label}
        </p>
        {currentLevel.type === 'level' && (
          <div className={`mt-2 ${largeDisplay ? 'space-y-1' : 'space-y-0.5'}`}>
            <p className={`text-white font-bold tabular-nums tracking-wide ${
              largeDisplay ? 'text-[3rem] sm:text-[5.5rem] lg:text-[8rem]' : 'text-4xl sm:text-6xl'
            }`}>
              {currentLevel.smallBlind ?? 0} / {currentLevel.bigBlind ?? 0}
            </p>
            {currentLevel.ante != null && currentLevel.ante > 0 && (
              <p className={`text-gray-400 font-semibold ${
                largeDisplay ? 'text-lg sm:text-2xl' : 'text-base sm:text-lg'
              }`}>
                {t('timer.ante')} {currentLevel.ante}
              </p>
            )}
          </div>
        )}
        {isBreak && (
          <p className={`text-amber-300 font-semibold mt-2 ${
            largeDisplay ? 'text-3xl sm:text-5xl' : 'text-xl sm:text-2xl'
          }`}>
            {t('timer.break')}
          </p>
        )}
      </div>

      {/* Next Level info */}
      <NextLevelInfo
        levels={levels}
        currentLevelIndex={timerState.currentLevelIndex}
        largeDisplay={largeDisplay}
      />

      {/* Color-Up Banner */}
      {chipConfig?.enabled && (() => {
        const currentColorUp = colorUpMap?.get(timerState.currentLevelIndex);
        if (!currentColorUp || currentColorUp.length === 0) return null;
        return (
          <div className="w-full max-w-xl px-4 py-2 bg-amber-900/40 border border-amber-600 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2">
              {currentColorUp.map((d) => (
                <span
                  key={d.id}
                  className="w-5 h-5 rounded-full inline-block border border-amber-400"
                  style={{ backgroundColor: d.color }}
                />
              ))}
              <span className="text-amber-300 text-sm font-bold">
                {t('colorUp.banner', {
                  chips: currentColorUp.map((d) => d.label).join(', '),
                })}
              </span>
            </div>
          </div>
        );
      })()}

      {/* Timer */}
      <div
        className={`font-mono font-bold tabular-nums ${
          largeDisplay ? 'text-[4rem] sm:text-[7rem] lg:text-[10rem] leading-none' : 'text-5xl sm:text-8xl'
        } ${
          isCountdown
            ? 'text-red-500 animate-pulse'
            : timerState.status === 'paused'
            ? 'text-yellow-400'
            : remaining <= 0
            ? 'text-gray-500'
            : 'text-white'
        }`}
      >
        {formatTime(remaining)}
      </div>

      {/* Time-Scrub Controls */}
      {onScrub && (
        <div className="flex flex-col items-center gap-2 w-full max-w-xl">
          <button
            onClick={() => setScrubbing((v) => !v)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              scrubbing
                ? 'bg-amber-700 hover:bg-amber-600 text-white'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
            }`}
          >
            {scrubbing ? t('timer.closeSlider') : t('timer.adjustTime')}
          </button>
          {scrubbing && (
            <div className="w-full flex items-center gap-3">
              <span className="text-xs text-gray-500 w-12 text-right">0:00</span>
              <input
                type="range"
                min={0}
                max={currentLevel.durationSeconds}
                step={1}
                value={Math.round(remaining)}
                onChange={(e) => onScrub(Number(e.target.value))}
                className="flex-1 accent-emerald-500 h-2 cursor-pointer"
              />
              <span className="text-xs text-gray-500 w-12">
                {formatTime(currentLevel.durationSeconds)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Status */}
      <p className="text-sm text-gray-500 uppercase tracking-widest">
        {timerState.status === 'running'
          ? t('timer.running')
          : timerState.status === 'paused'
          ? t('timer.paused')
          : remaining <= 0
          ? t('timer.finished')
          : t('timer.stopped')}
      </p>
    </div>
  );
}
