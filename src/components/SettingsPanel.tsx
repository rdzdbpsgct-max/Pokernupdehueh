import type { Settings } from '../domain/types';
import { useTranslation } from '../i18n';

interface Props {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onToggleFullscreen: () => void;
}

export function SettingsPanel({ settings, onChange, onToggleFullscreen }: Props) {
  const { t } = useTranslation();

  const toggle = (key: keyof Settings) => {
    onChange({ ...settings, [key]: !settings[key] });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-xs text-gray-500 uppercase tracking-wider">{t('settings.title')}</h3>
      <div className="space-y-2">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-gray-300">{t('settings.sound')}</span>
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={() => toggle('soundEnabled')}
            className="w-4 h-4 accent-emerald-500"
          />
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-gray-300">{t('settings.countdown')}</span>
          <input
            type="checkbox"
            checked={settings.countdownEnabled}
            onChange={() => toggle('countdownEnabled')}
            className="w-4 h-4 accent-emerald-500"
          />
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-gray-300">{t('settings.autoAdvance')}</span>
          <input
            type="checkbox"
            checked={settings.autoAdvance}
            onChange={() => toggle('autoAdvance')}
            className="w-4 h-4 accent-emerald-500"
          />
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-gray-300">{t('settings.largeDisplay')}</span>
          <input
            type="checkbox"
            checked={settings.largeDisplay}
            onChange={() => toggle('largeDisplay')}
            className="w-4 h-4 accent-emerald-500"
          />
        </label>
        <button
          onClick={onToggleFullscreen}
          className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm font-medium transition-colors text-left"
        >
          {t('settings.fullscreen')}
        </button>
      </div>

      {/* Keyboard shortcuts reference */}
      <div className="pt-2 border-t border-gray-800">
        <h4 className="text-xs text-gray-600 uppercase tracking-wider mb-1">{t('settings.shortcuts')}</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-500">
          <span><kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-400">Space</kbd> {t('settings.shortcutStartPause')}</span>
          <span><kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-400">N</kbd> {t('settings.shortcutNext')}</span>
          <span><kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-400">V</kbd> {t('settings.shortcutPrevious')}</span>
          <span><kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-400">R</kbd> {t('settings.shortcutReset')}</span>
        </div>
      </div>
    </div>
  );
}
