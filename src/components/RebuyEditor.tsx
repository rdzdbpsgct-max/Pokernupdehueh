import type { RebuyConfig, RebuyLimitType } from '../domain/types';
import { snapSpinnerValue } from '../domain/logic';
import { useTranslation } from '../i18n';

interface Props {
  rebuy: RebuyConfig;
  onChange: (rebuy: RebuyConfig) => void;
  buyIn: number;
  startingChips: number;
}

export function RebuyEditor({ rebuy, onChange, buyIn, startingChips }: Props) {
  const { t } = useTranslation();

  const toggle = () => {
    onChange({
      ...rebuy,
      enabled: !rebuy.enabled,
      rebuyCost: rebuy.rebuyCost || buyIn,
      rebuyChips: rebuy.rebuyChips || startingChips,
    });
  };

  const setLimitType = (limitType: RebuyLimitType) => {
    onChange({ ...rebuy, limitType });
  };

  const setLevelLimit = (levelLimit: number) => {
    onChange({ ...rebuy, levelLimit: Math.max(1, levelLimit) });
  };

  const setTimeLimitFromHoursMinutes = (hours: number, minutes: number) => {
    const totalSeconds = Math.max(60, hours * 3600 + minutes * 60);
    onChange({ ...rebuy, timeLimit: totalSeconds });
  };

  const hours = Math.floor(rebuy.timeLimit / 3600);
  const minutes = Math.floor((rebuy.timeLimit % 3600) / 60);

  return (
    <div className="space-y-3">
      {/* Toggle */}
      <button
        onClick={toggle}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          rebuy.enabled
            ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
            : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
        }`}
      >
        {rebuy.enabled ? t('rebuyEditor.enabled') : t('rebuyEditor.disabled')}
      </button>

      {/* Settings (only when enabled) */}
      {rebuy.enabled && (
        <div className="space-y-3 pl-2 border-l-2 border-emerald-800">
          {/* Rebuy cost & chips */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">{t('rebuyEditor.cost')}</label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={rebuy.rebuyCost}
                onChange={(e) =>
                  onChange({ ...rebuy, rebuyCost: Math.max(1, Number(e.target.value)) })
                }
                className="w-20 px-2 py-1.5 bg-gray-800/80 border border-gray-700/60 rounded-lg text-white text-sm text-center focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200"
              />
              <span className="text-gray-500 text-xs">{t('unit.eur')}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">{t('rebuyEditor.chips')}</label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                step={1000}
                value={rebuy.rebuyChips}
                onChange={(e) => {
                  const val = snapSpinnerValue(Number(e.target.value), rebuy.rebuyChips, 1000);
                  onChange({ ...rebuy, rebuyChips: val });
                }}
                className="w-24 px-2 py-1.5 bg-gray-800/80 border border-gray-700/60 rounded-lg text-white text-sm text-center focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200"
              />
              <span className="text-gray-500 text-xs">{t('unit.chips')}</span>
            </div>
          </div>

          {/* Limit type toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLimitType('levels')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                rebuy.limitType === 'levels'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {t('rebuyEditor.byLevels')}
            </button>
            <button
              onClick={() => setLimitType('time')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                rebuy.limitType === 'time'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {t('rebuyEditor.byTime')}
            </button>
          </div>

          {/* Level limit */}
          {rebuy.limitType === 'levels' && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">{t('rebuyEditor.untilLevel')}</label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={20}
                value={rebuy.levelLimit}
                onChange={(e) => setLevelLimit(Number(e.target.value))}
                className="w-16 px-2 py-1.5 bg-gray-800/80 border border-gray-700/60 rounded-lg text-white text-sm text-center focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200"
              />
            </div>
          )}

          {/* Time limit */}
          {rebuy.limitType === 'time' && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">{t('rebuyEditor.timePeriod')}</label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={10}
                value={hours}
                onChange={(e) =>
                  setTimeLimitFromHoursMinutes(Number(e.target.value), minutes)
                }
                className="w-14 px-2 py-1.5 bg-gray-800/80 border border-gray-700/60 rounded-lg text-white text-sm text-center focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200"
              />
              <span className="text-gray-500 text-xs">{t('rebuyEditor.hours')}</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={59}
                value={minutes}
                onChange={(e) =>
                  setTimeLimitFromHoursMinutes(hours, Number(e.target.value))
                }
                className="w-14 px-2 py-1.5 bg-gray-800/80 border border-gray-700/60 rounded-lg text-white text-sm text-center focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200"
              />
              <span className="text-gray-500 text-xs">{t('rebuyEditor.minutes')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
