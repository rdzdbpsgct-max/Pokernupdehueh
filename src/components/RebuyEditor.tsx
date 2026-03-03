import type { RebuyConfig, RebuyLimitType } from '../domain/types';
import { snapSpinnerValue } from '../domain/logic';
import { useTranslation } from '../i18n';
import { NumberStepper } from './NumberStepper';

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
              <NumberStepper
                value={rebuy.rebuyCost}
                onChange={(v) => onChange({ ...rebuy, rebuyCost: Math.max(1, v) })}
                min={1}
                step={1}
              />
              <span className="text-gray-500 text-xs">{t('unit.eur')}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">{t('rebuyEditor.chips')}</label>
              <NumberStepper
                value={rebuy.rebuyChips}
                onChange={(raw) => {
                  const val = snapSpinnerValue(raw, rebuy.rebuyChips, 1000);
                  onChange({ ...rebuy, rebuyChips: val });
                }}
                min={1}
                step={1000}
                inputClassName="w-24"
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
              <NumberStepper
                value={rebuy.levelLimit}
                onChange={(v) => setLevelLimit(v)}
                min={1}
                max={20}
                step={1}
                inputClassName="w-16"
              />
            </div>
          )}

          {/* Time limit */}
          {rebuy.limitType === 'time' && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">{t('rebuyEditor.timePeriod')}</label>
              <NumberStepper
                value={hours}
                onChange={(v) => setTimeLimitFromHoursMinutes(v, minutes)}
                min={0}
                max={10}
                step={1}
                inputClassName="w-14"
              />
              <span className="text-gray-500 text-xs">{t('rebuyEditor.hours')}</span>
              <NumberStepper
                value={minutes}
                onChange={(v) => setTimeLimitFromHoursMinutes(hours, v)}
                min={0}
                max={59}
                step={1}
                inputClassName="w-14"
              />
              <span className="text-gray-500 text-xs">{t('rebuyEditor.minutes')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
