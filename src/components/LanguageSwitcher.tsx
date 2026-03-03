import { useTranslation } from '../i18n';

export function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();
  return (
    <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700/40">
      <button
        onClick={() => setLanguage('de')}
        className={`px-2 py-1 text-xs font-medium transition-colors ${
          language === 'de'
            ? 'bg-emerald-700 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        DE
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 text-xs font-medium transition-colors ${
          language === 'en'
            ? 'bg-emerald-700 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        EN
      </button>
    </div>
  );
}
