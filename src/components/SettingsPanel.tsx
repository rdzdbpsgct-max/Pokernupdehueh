import type { Settings } from '../domain/types';
import { useTranslation } from '../i18n';

interface Props {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onToggleFullscreen: () => void;
}

function CheckBox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-all duration-200 ${
        checked
          ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-sm shadow-emerald-500/30'
          : 'bg-gray-700/80 border border-gray-600/60'
      }`}
    >
      {checked && (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
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
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggle('soundEnabled')}>
          <span className="text-sm text-gray-300">{t('settings.sound')}</span>
          <CheckBox checked={settings.soundEnabled} onChange={() => toggle('soundEnabled')} />
        </div>
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggle('countdownEnabled')}>
          <span className="text-sm text-gray-300">{t('settings.countdown')}</span>
          <CheckBox checked={settings.countdownEnabled} onChange={() => toggle('countdownEnabled')} />
        </div>
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggle('autoAdvance')}>
          <span className="text-sm text-gray-300">{t('settings.autoAdvance')}</span>
          <CheckBox checked={settings.autoAdvance} onChange={() => toggle('autoAdvance')} />
        </div>
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggle('largeDisplay')}>
          <span className="text-sm text-gray-300">{t('settings.largeDisplay')}</span>
          <CheckBox checked={settings.largeDisplay} onChange={() => toggle('largeDisplay')} />
        </div>
        <button
          onClick={onToggleFullscreen}
          className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors text-left"
        >
          {t('settings.fullscreen')}
        </button>
      </div>

      {/* Keyboard shortcuts reference */}
      <div className="pt-2 border-t border-gray-700/40">
        <h4 className="text-xs text-gray-600 uppercase tracking-wider mb-1">{t('settings.shortcuts')}</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-500">
          <span><kbd className="px-1.5 py-0.5 bg-gray-800/80 rounded-md border border-gray-700/50 text-gray-400 shadow-sm shadow-black/10">Space</kbd> {t('settings.shortcutStartPause')}</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-800/80 rounded-md border border-gray-700/50 text-gray-400 shadow-sm shadow-black/10">N</kbd> {t('settings.shortcutNext')}</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-800/80 rounded-md border border-gray-700/50 text-gray-400 shadow-sm shadow-black/10">V</kbd> {t('settings.shortcutPrevious')}</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-800/80 rounded-md border border-gray-700/50 text-gray-400 shadow-sm shadow-black/10">R</kbd> {t('settings.shortcutReset')}</span>
        </div>
      </div>
    </div>
  );
}
