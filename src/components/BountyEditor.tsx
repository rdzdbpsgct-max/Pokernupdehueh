import type { BountyConfig } from '../domain/types';
import { useTranslation } from '../i18n';

interface Props {
  bounty: BountyConfig;
  onChange: (bounty: BountyConfig) => void;
}

export function BountyEditor({ bounty, onChange }: Props) {
  const { t } = useTranslation();

  const toggle = () => {
    onChange({ ...bounty, enabled: !bounty.enabled });
  };

  return (
    <div className="space-y-3">
      {/* Toggle */}
      <button
        onClick={toggle}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          bounty.enabled
            ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
            : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
        }`}
      >
        {bounty.enabled ? t('bountyEditor.enabled') : t('bountyEditor.disabled')}
      </button>

      {/* Settings (only when enabled) */}
      {bounty.enabled && (
        <div className="space-y-3 pl-2 border-l-2 border-emerald-800">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300">{t('bountyEditor.perKnockout')}</label>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={bounty.amount}
              onChange={(e) =>
                onChange({ ...bounty, amount: Math.max(1, Number(e.target.value)) })
              }
              className="w-20 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm text-center focus:outline-none focus:border-emerald-500"
            />
            <span className="text-gray-500 text-xs">{t('unit.eur')}</span>
          </div>
          <p className="text-xs text-gray-500">
            {t('bountyEditor.description')}
          </p>
        </div>
      )}
    </div>
  );
}
