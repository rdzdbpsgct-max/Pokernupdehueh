import type { TimerState } from '../domain/types';

interface Props {
  timerState: TimerState;
  onToggleStartPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onReset: () => void;
  onRestart: () => void;
}

export function Controls({
  timerState,
  onToggleStartPause,
  onNext,
  onPrevious,
  onReset,
  onRestart,
}: Props) {
  const isRunning = timerState.status === 'running';
  const isStopped = timerState.status === 'stopped';

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onPrevious}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
          title="Vorheriges Level (P)"
        >
          ⏮ Zurück
        </button>

        <button
          onClick={onToggleStartPause}
          className={`px-8 py-3 rounded-xl text-lg font-bold transition-colors ${
            isRunning
              ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
          title="Start/Pause (Space)"
        >
          {isRunning ? '⏸ Pause' : isStopped && timerState.remainingSeconds <= 0 ? '⏹ Ende' : '▶ Start'}
        </button>

        <button
          onClick={onNext}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
          title="Nächstes Level (N)"
        >
          Weiter ⏭
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onReset}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs font-medium transition-colors"
          title="Level zurücksetzen (R)"
        >
          ↺ Level Reset
        </button>
        <button
          onClick={onRestart}
          className="px-3 py-1.5 bg-gray-800 hover:bg-red-900 text-gray-300 hover:text-red-300 rounded text-xs font-medium transition-colors"
          title="Turnier neu starten"
        >
          ⟲ Turnier Restart
        </button>
      </div>
    </div>
  );
}
