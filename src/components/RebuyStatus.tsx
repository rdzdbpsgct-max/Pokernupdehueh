import type { RebuyConfig } from '../domain/types';
import { formatTime } from '../domain/logic';
import { useTranslation } from '../i18n';

interface Props {
  active: boolean;
  rebuy: RebuyConfig;
  currentPlayLevel: number;
  elapsedSeconds: number;
}

export function RebuyStatus({ active, rebuy, currentPlayLevel, elapsedSeconds }: Props) {
  const { t } = useTranslation();

  if (!rebuy.enabled) return null;

  if (active) {
    let detail = '';
    if (rebuy.limitType === 'levels') {
      detail = t('rebuyStatus.untilLevel', { limit: rebuy.levelLimit, current: currentPlayLevel });
    } else {
      const remaining = Math.max(0, rebuy.timeLimit - elapsedSeconds);
      detail = t('rebuyStatus.timeRemaining', { time: formatTime(remaining) });
    }

    return (
      <div className="px-4 py-2 bg-emerald-900/30 border border-emerald-700/60 rounded-xl text-center backdrop-blur-sm shadow-sm shadow-emerald-900/10">
        <span className="text-emerald-400 text-sm font-medium">
          {t('rebuyStatus.active')}
        </span>
        <span className="text-emerald-500/70 text-xs ml-2">({detail})</span>
      </div>
    );
  }

  return (
    <div className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/40 rounded-xl text-center">
      <span className="text-gray-400 dark:text-gray-500 text-sm">{t('rebuyStatus.ended')}</span>
    </div>
  );
}
