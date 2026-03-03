import type { Settings } from '../domain/types';

interface Props {
  settings: Settings;
  onChange: (settings: Settings) => void;
}

export function VoiceSwitcher({ settings, onChange }: Props) {
  const active = settings.voiceEnabled;
  return (
    <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700/40">
      <button
        onClick={() => onChange({ ...settings, voiceEnabled: false })}
        title="Sound"
        className={`px-2 py-1 text-xs font-medium transition-colors ${
          !active
            ? 'bg-emerald-700 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      </button>
      <button
        onClick={() => onChange({ ...settings, voiceEnabled: true })}
        title="Voice"
        className={`px-2 py-1 text-xs font-medium transition-colors ${
          active
            ? 'bg-emerald-700 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3-3z" />
        </svg>
      </button>
    </div>
  );
}
