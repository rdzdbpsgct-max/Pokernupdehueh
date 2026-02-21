import type { TournamentConfig } from '../domain/types';
import { createPreset } from '../domain/logic';

interface Props {
  onSelect: (config: TournamentConfig) => void;
}

const presets = [
  { key: 'turbo' as const, label: 'Turbo', desc: '6 min Levels, schnelles Spiel' },
  { key: 'standard' as const, label: 'Standard', desc: '15 min Levels, klassisch' },
  { key: 'deep' as const, label: 'Deep Stack', desc: '20 min Levels, viel Spieltiefe' },
];

export function PresetPicker({ onSelect }: Props) {
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
