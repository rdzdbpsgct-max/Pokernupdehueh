import type { Settings, AccentColor, BackgroundImage } from '../domain/types';
import { useTranslation } from '../i18n';
import { NumberStepper } from './NumberStepper';
import { useTheme } from '../theme';

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
          ? 'shadow-sm'
          : 'bg-gray-200 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600/60'
      }`}
      style={checked ? { background: 'linear-gradient(to bottom, var(--accent-400), var(--accent-600))', boxShadow: `0 1px 2px var(--accent-glow)` } : undefined}
    >
      {checked && (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}

const ACCENT_OPTIONS: { value: AccentColor; color: string; label: string }[] = [
  { value: 'emerald', color: '#10b981', label: 'Emerald' },
  { value: 'blue',    color: '#3b82f6', label: 'Blue' },
  { value: 'purple',  color: '#8b5cf6', label: 'Purple' },
  { value: 'red',     color: '#ef4444', label: 'Red' },
  { value: 'amber',   color: '#f59e0b', label: 'Amber' },
  { value: 'cyan',    color: '#06b6d4', label: 'Cyan' },
];

const BG_OPTIONS: { value: BackgroundImage; gradient: string; labelKey: string }[] = [
  { value: 'none',       gradient: 'linear-gradient(135deg, #e5e7eb, #d1d5db)', labelKey: 'settings.bgNone' },
  { value: 'felt-green', gradient: 'radial-gradient(circle, rgba(22,163,74,0.5) 0%, rgba(22,163,74,0.2) 100%)', labelKey: 'settings.bgFeltGreen' },
  { value: 'felt-blue',  gradient: 'radial-gradient(circle, rgba(37,99,235,0.5) 0%, rgba(37,99,235,0.2) 100%)', labelKey: 'settings.bgFeltBlue' },
  { value: 'felt-red',   gradient: 'radial-gradient(circle, rgba(185,28,28,0.5) 0%, rgba(185,28,28,0.2) 100%)', labelKey: 'settings.bgFeltRed' },
  { value: 'casino',     gradient: 'repeating-linear-gradient(45deg, rgba(245,158,11,0.15) 0px, rgba(245,158,11,0.15) 2px, transparent 2px, transparent 6px)', labelKey: 'settings.bgCasino' },
  { value: 'dark-wood',  gradient: 'linear-gradient(180deg, rgba(120,80,40,0.4) 0%, rgba(80,50,20,0.5) 100%)', labelKey: 'settings.bgDarkWood' },
  { value: 'abstract',   gradient: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(6,182,212,0.3))', labelKey: 'settings.bgAbstract' },
  { value: 'midnight',   gradient: 'linear-gradient(180deg, rgba(30,58,138,0.5) 0%, rgba(88,28,135,0.4) 100%)', labelKey: 'settings.bgMidnight' },
  { value: 'sunset',     gradient: 'linear-gradient(135deg, rgba(245,158,11,0.4), rgba(239,68,68,0.4))', labelKey: 'settings.bgSunset' },
];

export function SettingsPanel({ settings, onChange, onToggleFullscreen }: Props) {
  const { t } = useTranslation();
  const { accentColor, setAccentColor, backgroundImage, setBackgroundImage } = useTheme();

  const toggle = (key: keyof Settings) => {
    onChange({ ...settings, [key]: !settings[key] });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('settings.title')}</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggle('soundEnabled')}>
          <span className="text-sm text-gray-700 dark:text-gray-300">{t('settings.sound')}</span>
          <CheckBox checked={settings.soundEnabled} onChange={() => toggle('soundEnabled')} />
        </div>
        {settings.soundEnabled && (
          <div className="flex items-center gap-3 pl-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 w-20 shrink-0">{t('settings.volume')}</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={settings.volume}
              onChange={(e) => onChange({ ...settings, volume: Number(e.target.value) })}
              className="flex-1 h-1.5 accent-emerald-500 cursor-pointer"
            />
            <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums w-8 text-right">{settings.volume}%</span>
          </div>
        )}
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggle('countdownEnabled')}>
          <span className="text-sm text-gray-700 dark:text-gray-300">{t('settings.countdown')}</span>
          <CheckBox checked={settings.countdownEnabled} onChange={() => toggle('countdownEnabled')} />
        </div>
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggle('autoAdvance')}>
          <span className="text-sm text-gray-700 dark:text-gray-300">{t('settings.autoAdvance')}</span>
          <CheckBox checked={settings.autoAdvance} onChange={() => toggle('autoAdvance')} />
        </div>
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggle('largeDisplay')}>
          <span className="text-sm text-gray-700 dark:text-gray-300">{t('settings.largeDisplay')}</span>
          <CheckBox checked={settings.largeDisplay} onChange={() => toggle('largeDisplay')} />
        </div>
        {/* Call the Clock duration */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">{t('settings.callTheClock')}</span>
          <div className="flex items-center gap-1">
            <NumberStepper
              value={settings.callTheClockSeconds}
              onChange={(v) => onChange({ ...settings, callTheClockSeconds: Math.max(10, Math.min(300, v)) })}
              min={10}
              max={300}
              step={5}
              inputClassName="w-14"
            />
            <span className="text-xs text-gray-400 dark:text-gray-500">s</span>
          </div>
        </div>
        <button
          onClick={onToggleFullscreen}
          className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors text-left"
        >
          {t('settings.fullscreen')}
        </button>
      </div>

      {/* Accent Color */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700/40">
        <span className="text-sm text-gray-700 dark:text-gray-300 block mb-1.5">{t('settings.accentColor')}</span>
        <div className="flex items-center gap-2">
          {ACCENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setAccentColor(opt.value)}
              className={`w-7 h-7 rounded-full transition-all duration-200 ${
                accentColor === opt.value
                  ? 'ring-2 scale-110'
                  : 'opacity-60 hover:opacity-100 hover:scale-105'
              }`}
              style={{
                backgroundColor: opt.color,
                ...(accentColor === opt.value
                  ? { ringColor: opt.color, boxShadow: `0 0 0 2px var(--accent-ring), 0 0 8px ${opt.color}40` }
                  : {}),
              }}
              title={opt.label}
              aria-label={opt.label}
            />
          ))}
        </div>
      </div>

      {/* Background Image */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700/40">
        <span className="text-sm text-gray-700 dark:text-gray-300 block mb-1.5">{t('settings.backgroundImage')}</span>
        <div className="grid grid-cols-3 gap-1.5">
          {BG_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setBackgroundImage(opt.value)}
              className={`relative w-full aspect-[3/2] rounded-lg overflow-hidden transition-all duration-200 border-2 ${
                backgroundImage === opt.value
                  ? 'scale-[1.02]'
                  : 'border-gray-300 dark:border-gray-700/60 hover:border-gray-400 dark:hover:border-gray-600 opacity-70 hover:opacity-100'
              }`}
              style={{
                background: opt.gradient,
                ...(backgroundImage === opt.value
                  ? { borderColor: 'var(--accent-500)', boxShadow: `0 0 0 1px var(--accent-ring)` }
                  : {}),
              }}
              title={t(opt.labelKey as Parameters<typeof t>[0])}
              aria-label={t(opt.labelKey as Parameters<typeof t>[0])}
            >
              <span className="absolute bottom-0 inset-x-0 text-[9px] text-center py-0.5 bg-black/30 text-white truncate">
                {t(opt.labelKey as Parameters<typeof t>[0])}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Keyboard shortcuts reference */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700/40">
        <h4 className="text-xs text-gray-300 dark:text-gray-600 uppercase tracking-wider mb-1">{t('settings.shortcuts')}</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-400 dark:text-gray-500">
          <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800/80 rounded-md border border-gray-300 dark:border-gray-700/50 text-gray-500 dark:text-gray-400 shadow-sm shadow-gray-200/30 dark:shadow-black/10">Space</kbd> {t('settings.shortcutStartPause')}</span>
          <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800/80 rounded-md border border-gray-300 dark:border-gray-700/50 text-gray-500 dark:text-gray-400 shadow-sm shadow-gray-200/30 dark:shadow-black/10">N</kbd> {t('settings.shortcutNext')}</span>
          <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800/80 rounded-md border border-gray-300 dark:border-gray-700/50 text-gray-500 dark:text-gray-400 shadow-sm shadow-gray-200/30 dark:shadow-black/10">V</kbd> {t('settings.shortcutPrevious')}</span>
          <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800/80 rounded-md border border-gray-300 dark:border-gray-700/50 text-gray-500 dark:text-gray-400 shadow-sm shadow-gray-200/30 dark:shadow-black/10">R</kbd> {t('settings.shortcutReset')}</span>
          <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800/80 rounded-md border border-gray-300 dark:border-gray-700/50 text-gray-500 dark:text-gray-400 shadow-sm shadow-gray-200/30 dark:shadow-black/10">C</kbd> {t('settings.shortcutClock')}</span>
        </div>
      </div>
    </div>
  );
}
