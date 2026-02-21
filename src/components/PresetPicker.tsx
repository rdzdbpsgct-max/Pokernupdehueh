import type { TournamentConfig } from '../domain/types';
import { createPreset } from '../domain/logic';
import { useTranslation } from '../i18n';

interface Props {
  onSelect: (config: TournamentConfig) => void;
}

export function PresetPicker({ onSelect }: Props) {
  const { t } = useTranslation();

  const presets = [
    { key: 'turbo' as const, label: t('preset.turbo'), desc: t('preset.turboDesc') },
    { key: 'standard' as const, label: t('preset.standard'), desc: t('preset.standardDesc') },
    { key: 'deep' as const, label: t('preset.deep'), desc: t('preset.deepDesc') },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {presets.map((p) => (
        <button
          key={p.key}
          onClick={() => onSelect(createPreset(p.key))}
          className="flex flex-col items-start px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-emerald-600 rounded-lg transition-colors text-left"
        >
          <span className="text-white font-medium text-sm">{p.label}</span>
          <span className="text-gray-400 text-xs mt-0.5">{p.desc}</span>
        </button>
      ))}
    </div>
  );
}
