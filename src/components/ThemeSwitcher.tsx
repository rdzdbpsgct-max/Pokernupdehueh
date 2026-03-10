import { useTheme, type ThemeMode } from '../theme';
import { useTranslation } from '../i18n';
import type { TranslationKey } from '../i18n/translations';

const modes: { mode: ThemeMode; icon: string; key: TranslationKey }[] = [
  { mode: 'system', icon: '💻', key: 'theme.system' },
  { mode: 'light', icon: '☀️', key: 'theme.light' },
  { mode: 'dark', icon: '🌙', key: 'theme.dark' },
];

export function ThemeSwitcher() {
  const { mode, setMode } = useTheme();
  const { t } = useTranslation();

  return (
    <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700/40">
      {modes.map((m) => (
        <button
          key={m.mode}
          onClick={() => setMode(m.mode)}
          title={t(m.key)}
          className={`px-2.5 py-1.5 text-sm font-medium transition-colors ${
            mode === m.mode
              ? 'text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
          }`}
          style={mode === m.mode ? { backgroundColor: 'var(--accent-700)' } : undefined}
        >
          {m.icon}
        </button>
      ))}
    </div>
  );
}
