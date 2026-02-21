import { useState } from 'react';
import type { Level, TimerState } from '../domain/types';
import { formatTime, getLevelLabel, getBlindsText } from '../domain/logic';

interface Props {
  timerState: TimerState;
  levels: Level[];
  largeDisplay: boolean;
  countdownEnabled: boolean;
  onScrub?: (seconds: number) => void;
}

export function TimerDisplay({ timerState, levels, largeDisplay, countdownEnabled, onScrub }: Props) {
  const [scrubbing, setScrubbing] = useState(false);

  const currentLevel = levels[timerState.currentLevelIndex];
  if (!currentLevel) return null;

  const remaining = timerState.remainingSeconds;
  const isCountdown = countdownEnabled && remaining <= 10 && remaining > 0 && timerState.status === 'running';
  const isBreak = currentLevel.type === 'break';
  const progress = 1 - remaining / currentLevel.durationSeconds;

  const label = getLevelLabel(currentLevel, timerState.currentLevelIndex, levels);
  const blindsText = getBlindsText(currentLevel);

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
        } ${largeDisplay ? 'text-2xl' : 'text-lg'}`}>
          {label}
        </p>
        {blindsText && (
          <p className={`text-gray-200 font-semibold mt-1 ${
            largeDisplay ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-2xl'
          }`}>
            {blindsText}
          </p>
        )}
        {isBreak && (
          <p className={`text-amber-300 font-semibold mt-1 ${
            largeDisplay ? 'text-3xl' : 'text-xl'
          }`}>
            Pause
          </p>
        )}
      </div>

      {/* Next Level info */}
      {(() => {
        const nextIdx = timerState.currentLevelIndex + 1;
        const nextLvl = nextIdx < levels.length ? levels[nextIdx] : null;
        if (!nextLvl) return null;
        const nextLabel = getLevelLabel(nextLvl, nextIdx, levels);
        return (
          <div className="text-center">
            <p className={`text-gray-500 ${largeDisplay ? 'text-sm' : 'text-xs'} uppercase tracking-wider`}>
              Nächstes {nextLabel}
            </p>
            {nextLvl.type === 'break' ? (
              <p className={`text-amber-500/70 font-medium mt-0.5 ${largeDisplay ? 'text-lg' : 'text-sm'}`}>
                Pause ({formatTime(nextLvl.durationSeconds)})
              </p>
            ) : (
              <p className={`text-gray-400 font-medium mt-0.5 ${largeDisplay ? 'text-lg' : 'text-sm'}`}>
                {getBlindsText(nextLvl)} ({formatTime(nextLvl.durationSeconds)})
              </p>
            )}
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
            {scrubbing ? 'Slider schließen' : 'Zeit anpassen'}
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
          ? 'Läuft'
          : timerState.status === 'paused'
          ? 'Pausiert'
          : remaining <= 0
          ? 'Beendet'
          : 'Gestoppt'}
      </p>
    </div>
  );
}
