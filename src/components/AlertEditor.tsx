import type { AlertConfig, AlertTrigger } from '../domain/types';
import { createDefaultAlert } from '../domain/alertEngine';
import { useTranslation } from '../i18n';
import { NumberStepper } from './NumberStepper';

interface Props {
  alerts: AlertConfig[];
  onChange: (alerts: AlertConfig[]) => void;
}

const TRIGGER_OPTIONS: { value: AlertTrigger; labelKey: string }[] = [
  { value: 'level_start', labelKey: 'alerts.triggerLevelStart' },
  { value: 'time_remaining', labelKey: 'alerts.triggerTimeRemaining' },
  { value: 'break_start', labelKey: 'alerts.triggerBreakStart' },
  { value: 'player_count', labelKey: 'alerts.triggerPlayerCount' },
];

const SOUND_OPTIONS: { value: AlertConfig['sound']; labelKey: string }[] = [
  { value: 'none', labelKey: 'alerts.soundNone' },
  { value: 'beep', labelKey: 'alerts.soundBeep' },
  { value: 'chime', labelKey: 'alerts.soundChime' },
];

export function AlertEditor({ alerts, onChange }: Props) {
  const { t } = useTranslation();

  const updateAlert = (id: string, patch: Partial<AlertConfig>) => {
    onChange(alerts.map(a => a.id === id ? { ...a, ...patch } : a));
  };

  const deleteAlert = (id: string) => {
    onChange(alerts.filter(a => a.id !== id));
  };

  const addAlert = () => {
    onChange([...alerts, createDefaultAlert('level_start')]);
  };

  return (
    <div className="space-y-3">
      {alerts.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500 italic">{t('alerts.empty')}</p>
      )}

      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="p-3 rounded-lg border border-gray-200 dark:border-gray-700/40 bg-gray-50/50 dark:bg-gray-800/30 space-y-2"
        >
          {/* Row 1: Enable + Trigger + Delete */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={alert.enabled}
              onClick={() => updateAlert(alert.id, { enabled: !alert.enabled })}
              className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all duration-200 ${
                alert.enabled
                  ? 'shadow-sm'
                  : 'bg-gray-200 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600/60'
              }`}
              style={alert.enabled ? { background: 'linear-gradient(to bottom, var(--accent-400), var(--accent-600))', boxShadow: '0 1px 2px var(--accent-glow)' } : undefined}
            >
              {alert.enabled && (
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            <select
              value={alert.trigger}
              onChange={(e) => updateAlert(alert.id, { trigger: e.target.value as AlertTrigger })}
              className="flex-1 text-sm bg-white dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700/60 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-[var(--accent-ring)] focus:outline-none text-gray-700 dark:text-gray-300"
            >
              {TRIGGER_OPTIONS.map((tr) => (
                <option key={tr.value} value={tr.value}>
                  {t(tr.labelKey as Parameters<typeof t>[0])}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => deleteAlert(alert.id)}
              className="p-1.5 rounded-md text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors"
              aria-label={t('alerts.delete')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          {/* Row 2: Trigger-specific field */}
          {alert.trigger === 'level_start' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{t('alerts.level')}</span>
              <NumberStepper
                value={(alert.levelIndex ?? 0) + 1}
                onChange={(v) => updateAlert(alert.id, { levelIndex: Math.max(0, v - 1) })}
                min={1}
                max={99}
                step={1}
                inputClassName="w-14"
              />
            </div>
          )}
          {alert.trigger === 'time_remaining' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{t('alerts.seconds')}</span>
              <NumberStepper
                value={alert.secondsBefore ?? 60}
                onChange={(v) => updateAlert(alert.id, { secondsBefore: Math.max(1, v) })}
                min={1}
                max={3600}
                step={5}
                inputClassName="w-16"
              />
              <span className="text-xs text-gray-400 dark:text-gray-500">s</span>
            </div>
          )}
          {alert.trigger === 'player_count' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{t('alerts.playerCount')}</span>
              <NumberStepper
                value={alert.playerCount ?? 2}
                onChange={(v) => updateAlert(alert.id, { playerCount: Math.max(1, v) })}
                min={1}
                max={999}
                step={1}
                inputClassName="w-14"
              />
            </div>
          )}

          {/* Row 3: Text input */}
          <div>
            <input
              type="text"
              value={alert.text}
              onChange={(e) => updateAlert(alert.id, { text: e.target.value })}
              placeholder={t('alerts.textHint')}
              className="w-full text-sm bg-white dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700/60 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-[var(--accent-ring)] focus:outline-none text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-600"
            />
          </div>

          {/* Row 4: Voice + Sound */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={alert.voice}
                onChange={(e) => updateAlert(alert.id, { voice: e.target.checked })}
                className="rounded"
                style={{ accentColor: 'var(--accent-500)' }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">{t('alerts.voice')}</span>
            </label>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('alerts.sound')}</span>
              <select
                value={alert.sound}
                onChange={(e) => updateAlert(alert.id, { sound: e.target.value as AlertConfig['sound'] })}
                className="text-xs bg-white dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700/60 rounded-md px-1.5 py-1 focus:ring-2 focus:ring-[var(--accent-ring)] focus:outline-none text-gray-700 dark:text-gray-300"
              >
                {SOUND_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {t(s.labelKey as Parameters<typeof t>[0])}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addAlert}
        className="w-full px-3 py-2 text-sm font-medium rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700/60 text-gray-500 dark:text-gray-400 hover:border-[var(--accent-500)] hover:text-[var(--accent-500)] transition-colors"
      >
        + {t('alerts.add')}
      </button>
    </div>
  );
}
