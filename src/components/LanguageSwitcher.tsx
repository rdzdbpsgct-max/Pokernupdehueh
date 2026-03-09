import { useTranslation } from '../i18n';

export function LanguageSwitcher() {
  const { t, language, setLanguage } = useTranslation();
  return (
    <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700/40" title={t('language.switcherTitle')}>
      <button
        onClick={() => setLanguage('de')}
        title="Deutsch"
        className={`px-2 py-1 text-xs font-medium transition-colors ${
          language === 'de'
            ? 'text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        style={language === 'de' ? { backgroundColor: 'var(--accent-700)' } : undefined}
      >
        DE
      </button>
      <button
        onClick={() => setLanguage('en')}
        title="English"
        className={`px-2 py-1 text-xs font-medium transition-colors ${
          language === 'en'
            ? 'text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        style={language === 'en' ? { backgroundColor: 'var(--accent-700)' } : undefined}
      >
        EN
      </button>
    </div>
  );
}
