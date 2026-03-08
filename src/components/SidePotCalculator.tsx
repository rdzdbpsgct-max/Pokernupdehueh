import { useState, useCallback } from 'react';
import { computeSidePots } from '../domain/logic';
import { useTranslation } from '../i18n';
import { NumberStepper } from './NumberStepper';

interface Props {
  onClose: () => void;
}

export function SidePotCalculator({ onClose }: Props) {
  const { t } = useTranslation();
  const [stacks, setStacks] = useState<number[]>([1000, 500]);

  const handleAddPlayer = useCallback(() => {
    setStacks((prev) => [...prev, 1000]);
  }, []);

  const handleRemovePlayer = useCallback((index: number) => {
    setStacks((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleChangeStack = useCallback((index: number, value: number) => {
    setStacks((prev) => prev.map((s, i) => (i === index ? Math.max(0, value) : s)));
  }, []);

  const handleReset = useCallback(() => {
    setStacks([1000, 500]);
  }, []);

  const pots = computeSidePots(stacks.filter((s) => s > 0));
  const totalInPots = pots.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl shadow-black/20 border border-gray-200 dark:border-gray-700/40 w-full max-w-md max-h-[80vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700/40">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('sidePot.title')}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Stack inputs */}
        <div className="px-5 py-4 space-y-3">
          {stacks.map((stack, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[70px]">
                {t('sidePot.stack')} {index + 1}
              </span>
              <NumberStepper
                value={stack}
                onChange={(v) => handleChangeStack(index, v)}
                min={0}
                step={100}
                inputClassName="w-24"
              />
              {stacks.length > 2 && (
                <button
                  onClick={() => handleRemovePlayer(index)}
                  className="px-2 py-1 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                >
                  {t('sidePot.removePlayer')}
                </button>
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <button
              onClick={handleAddPlayer}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm font-medium transition-colors"
            >
              + {t('sidePot.addPlayer')}
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg text-sm transition-colors"
            >
              {t('sidePot.reset')}
            </button>
          </div>
        </div>

        {/* Results */}
        {pots.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700/40 space-y-2">
            {pots.map((pot, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/40 rounded-lg"
              >
                <div>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    {index === 0 ? t('sidePot.mainPot') : t('sidePot.sidePot', { n: index })}
                  </span>
                  <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                    {t('sidePot.eligible', { n: pot.eligiblePlayers })}
                  </span>
                </div>
                <span className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400">
                  {pot.amount.toLocaleString()}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between px-3 pt-2 border-t border-gray-200 dark:border-gray-700/40">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</span>
              <span className="text-sm font-bold font-mono text-gray-800 dark:text-gray-100">
                {totalInPots.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
