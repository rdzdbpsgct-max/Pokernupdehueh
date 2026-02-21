import { useState } from 'react';
import type { TournamentConfig } from '../domain/types';
import { exportConfigJSON, importConfigJSON } from '../domain/logic';
import { useTranslation } from '../i18n';

interface Props {
  config: TournamentConfig;
  onImport: (config: TournamentConfig) => void;
  onClose: () => void;
}

export function ImportExportModal({ config, onImport, onClose }: Props) {
  const { t } = useTranslation();
  const [jsonText, setJsonText] = useState(exportConfigJSON(config));
  const [error, setError] = useState('');

  const handleImport = () => {
    const parsed = importConfigJSON(jsonText);
    if (!parsed) {
      setError(t('importExport.invalidJson'));
      return;
    }
    onImport(parsed);
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(exportConfigJSON(config));
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-lg w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">{t('importExport.title')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        <textarea
          value={jsonText}
          onChange={(e) => {
            setJsonText(e.target.value);
            setError('');
          }}
          className="flex-1 min-h-[200px] w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-emerald-500 resize-none"
          spellCheck={false}
        />

        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {t('importExport.copy')}
          </button>
          <button
            onClick={handleImport}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {t('importExport.import')}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors ml-auto"
          >
            {t('importExport.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
