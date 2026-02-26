import { useState } from 'react';
import type { TournamentConfig } from '../domain/types';
import type { TournamentTemplate } from '../domain/logic';
import { loadTemplates, saveTemplate, deleteTemplate } from '../domain/logic';
import { useTranslation } from '../i18n';

interface Props {
  config: TournamentConfig;
  onLoad: (config: TournamentConfig) => void;
  onClose: () => void;
}

export function TemplateManager({ config, onLoad, onClose }: Props) {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<TournamentTemplate[]>(() => loadTemplates());
  const [newName, setNewName] = useState(config.name || '');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleSave = () => {
    if (!newName.trim()) return;
    saveTemplate(newName.trim(), config);
    setTemplates(loadTemplates());
    setNewName('');
  };

  const handleDelete = (id: string) => {
    deleteTemplate(id);
    setTemplates(loadTemplates());
    setConfirmDeleteId(null);
  };

  const handleLoad = (template: TournamentTemplate) => {
    onLoad(template.config);
    onClose();
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full space-y-4 max-h-[80vh] flex flex-col">
        <h3 className="text-lg font-bold text-white">{t('templates.title')}</h3>

        {/* Save current config as template */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400 uppercase tracking-wider">
            {t('templates.saveCurrent')}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder={t('templates.namePlaceholder')}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleSave}
              disabled={!newName.trim()}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
            >
              {t('templates.save')}
            </button>
          </div>
        </div>

        {/* Template list */}
        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {templates.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">
              {t('templates.noTemplates')}
            </p>
          ) : (
            templates.map((tmpl) => (
              <div
                key={tmpl.id}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{tmpl.name}</p>
                  <p className="text-gray-500 text-xs">
                    {formatDate(tmpl.createdAt)}
                    {' · '}
                    {t('templates.players', { n: tmpl.config.players.length })}
                    {' · '}
                    {t('templates.levels', { n: tmpl.config.levels.filter((l) => l.type === 'level').length })}
                  </p>
                </div>
                <button
                  onClick={() => handleLoad(tmpl)}
                  className="px-3 py-1.5 bg-emerald-700/50 hover:bg-emerald-600 text-emerald-200 rounded text-xs font-medium transition-colors"
                >
                  {t('templates.load')}
                </button>
                {confirmDeleteId === tmpl.id ? (
                  <button
                    onClick={() => handleDelete(tmpl.id)}
                    className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded text-xs font-medium transition-colors"
                  >
                    {t('templates.yes')}
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(tmpl.id)}
                    className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800 text-red-300 rounded text-xs font-medium transition-colors"
                  >
                    {t('templates.delete')}
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {t('templates.close')}
        </button>
      </div>
    </div>
  );
}
