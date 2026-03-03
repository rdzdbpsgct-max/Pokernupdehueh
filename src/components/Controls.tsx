import type { TimerState } from '../domain/types';
import { useTranslation } from '../i18n';

interface Props {
  timerState: TimerState;
  onToggleStartPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onReset: () => void;
  onRestart: () => void;
  hideSecondaryControls?: boolean;
}

export function Controls({
  timerState,
  onToggleStartPause,
  onNext,
  onPrevious,
  onReset,
  onRestart,
  hideSecondaryControls,
}: Props) {
  const { t } = useTranslation();
  const isRunning = timerState.status === 'running';
  const isStopped = timerState.status === 'stopped';

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onPrevious}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700/80 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md shadow-gray-300/30 dark:shadow-black/20 active:scale-[0.97] active:shadow-sm border border-gray-200 dark:border-gray-600/30"
          title={t('controls.previousTooltip')}
          aria-label={t('controls.previousTooltip')}
        >
          {t('controls.previous')}
        </button>

        <button
          onClick={onToggleStartPause}
          className={`px-8 py-3 rounded-xl text-lg font-bold transition-all duration-200 active:scale-[0.97] active:shadow-md ${
            isRunning
              ? 'bg-gradient-to-b from-yellow-500 to-yellow-700 hover:from-yellow-400 hover:to-yellow-600 text-white shadow-lg shadow-yellow-900/30'
              : 'bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white shadow-lg shadow-emerald-900/30'
          }`}
          title={t('controls.startPauseTooltip')}
          aria-label={isRunning ? t('controls.pause') : t('controls.start')}
          aria-pressed={isRunning}
        >
          {isRunning ? t('controls.pause') : isStopped && timerState.remainingSeconds <= 0 ? t('controls.end') : t('controls.start')}
        </button>

        <button
          onClick={onNext}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700/80 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md shadow-gray-300/30 dark:shadow-black/20 active:scale-[0.97] active:shadow-sm border border-gray-200 dark:border-gray-600/30"
          title={t('controls.nextTooltip')}
          aria-label={t('controls.nextTooltip')}
        >
          {t('controls.next')}
        </button>
      </div>

      {!hideSecondaryControls && (
        <div className="flex items-center gap-3">
          <button
            onClick={onReset}
            className="px-4 py-2 bg-white dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-all duration-200 border border-gray-200 dark:border-gray-700/30 shadow-md shadow-gray-200/30 dark:shadow-black/15 active:scale-[0.97] active:shadow-sm"
            title={t('controls.levelResetTooltip')}
            aria-label={t('controls.levelResetTooltip')}
          >
            {t('controls.levelReset')}
          </button>
          <button
            onClick={onRestart}
            className="px-4 py-2 bg-white dark:bg-gray-800/80 hover:bg-red-50 dark:hover:bg-red-900/80 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-300 rounded-lg text-xs font-medium transition-all duration-200 border border-gray-200 dark:border-gray-700/30 hover:border-red-300 dark:hover:border-red-800/50 shadow-md shadow-gray-200/30 dark:shadow-black/15 active:scale-[0.97] active:shadow-sm"
            title={t('controls.tournamentRestartTooltip')}
            aria-label={t('controls.tournamentRestartTooltip')}
          >
            {t('controls.tournamentRestart')}
          </button>
        </div>
      )}
    </div>
  );
}
