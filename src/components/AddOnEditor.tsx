import type { AddOnConfig } from '../domain/types';
import { snapSpinnerValue } from '../domain/logic';
import { useTranslation } from '../i18n';

interface Props {
  addOn: AddOnConfig;
  onChange: (addOn: AddOnConfig) => void;
  buyIn: number;
  startingChips: number;
}

export function AddOnEditor({ addOn, onChange, buyIn, startingChips }: Props) {
  const { t } = useTranslation();

  const toggle = () => {
    onChange({
      ...addOn,
      enabled: !addOn.enabled,
      cost: addOn.cost || buyIn,
      chips: addOn.chips || startingChips,
    });
  };

  return (
    <div className="space-y-3">
      {/* Toggle */}
      <button
        onClick={toggle}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          addOn.enabled
            ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
            : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
        }`}
      >
        {addOn.enabled ? t('addOnEditor.enabled') : t('addOnEditor.disabled')}
      </button>

      {/* Settings (only when enabled) */}
      {addOn.enabled && (
        <div className="space-y-3 pl-2 border-l-2 border-emerald-800">
          <p className="text-xs text-gray-500">{t('addOnEditor.description')}</p>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">{t('addOnEditor.cost')}</label>
              <input
                type="number"
                min={1}
                step={1}
                value={addOn.cost}
                onChange={(e) =>
                  onChange({ ...addOn, cost: Math.max(1, Number(e.target.value)) })
                }
                className="w-20 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm text-center focus:outline-none focus:border-emerald-500"
              />
              <span className="text-gray-500 text-xs">{t('unit.eur')}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">{t('addOnEditor.chips')}</label>
              <input
                type="number"
                min={1}
                step={1000}
                value={addOn.chips}
                onChange={(e) => {
                  const val = snapSpinnerValue(Number(e.target.value), addOn.chips, 1000);
                  onChange({ ...addOn, chips: val });
                }}
                className="w-24 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm text-center focus:outline-none focus:border-emerald-500"
              />
              <span className="text-gray-500 text-xs">{t('unit.chips')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
