import type { RebuyConfig, RebuyLimitType } from '../domain/types';

interface Props {
  rebuy: RebuyConfig;
  onChange: (rebuy: RebuyConfig) => void;
  buyIn: number;
  startingChips: number;
}

export function RebuyEditor({ rebuy, onChange, buyIn, startingChips }: Props) {
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
        {rebuy.enabled ? '✓ Rebuy aktiviert' : 'Rebuy deaktiviert'}
      </button>

      {/* Settings (only when enabled) */}
      {rebuy.enabled && (
        <div className="space-y-3 pl-2 border-l-2 border-emerald-800">
          {/* Rebuy cost & chips */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Kosten</label>
              <input
                type="number"
                min={1}
                step={1}
                value={rebuy.rebuyCost}
                onChange={(e) =>
                  onChange({ ...rebuy, rebuyCost: Math.max(1, Number(e.target.value)) })
                }
                className="w-20 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm text-center focus:outline-none focus:border-emerald-500"
              />
              <span className="text-gray-500 text-xs">EUR</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Chips</label>
              <input
                type="number"
                min={1}
                step={1000}
                value={rebuy.rebuyChips}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  onChange({ ...rebuy, rebuyChips: Math.max(1000, Math.round(raw / 1000) * 1000) });
                }}
                className="w-24 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm text-center focus:outline-none focus:border-emerald-500"
              />
              <span className="text-gray-500 text-xs">Chips</span>
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
              Nach Levels
            </button>
            <button
              onClick={() => setLimitType('time')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                rebuy.limitType === 'time'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Nach Zeit
            </button>
          </div>

          {/* Level limit */}
          {rebuy.limitType === 'levels' && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Rebuy bis Level</label>
              <input
                type="number"
                min={1}
                max={20}
                value={rebuy.levelLimit}
                onChange={(e) => setLevelLimit(Number(e.target.value))}
                className="w-16 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm text-center focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Time limit */}
          {rebuy.limitType === 'time' && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Rebuy-Zeitraum</label>
              <input
                type="number"
                min={0}
                max={10}
                value={hours}
                onChange={(e) =>
                  setTimeLimitFromHoursMinutes(Number(e.target.value), minutes)
                }
                className="w-14 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm text-center focus:outline-none focus:border-emerald-500"
              />
              <span className="text-gray-500 text-xs">Std</span>
              <input
                type="number"
                min={0}
                max={59}
                value={minutes}
                onChange={(e) =>
                  setTimeLimitFromHoursMinutes(hours, Number(e.target.value))
                }
                className="w-14 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm text-center focus:outline-none focus:border-emerald-500"
              />
              <span className="text-gray-500 text-xs">Min</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
