import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import { useTranslation } from '../i18n';
import { markTourCompleted } from '../domain/configPersistence';

interface TourStep {
  target: string; // data-tour attribute value
  titleKey: string;
  descriptionKey: string;
}

const TOUR_STEPS: TourStep[] = [
  { target: 'presets', titleKey: 'tour.step1.title', descriptionKey: 'tour.step1.desc' },
  { target: 'blind-generator', titleKey: 'tour.step2.title', descriptionKey: 'tour.step2.desc' },
  { target: 'templates', titleKey: 'tour.step3.title', descriptionKey: 'tour.step3.desc' },
  { target: 'leagues', titleKey: 'tour.step4.title', descriptionKey: 'tour.step4.desc' },
  { target: 'start-tournament', titleKey: 'tour.step5.title', descriptionKey: 'tour.step5.desc' },
];

interface Props {
  onComplete: () => void;
}

/** Measure a target element and compute spotlight + tooltip positions. Pure function, no side effects. */
function computeLayout(target: string) {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;

  const r = el.getBoundingClientRect();
  const tooltipH = 160;
  const padding = 16;
  const spaceBelow = window.innerHeight - r.bottom;

  const below = spaceBelow > tooltipH + padding;
  const tooltipTop = below ? r.bottom + padding : r.top - tooltipH - padding;
  const tooltipLeft = Math.max(16, Math.min(r.left + r.width / 2 - 160, window.innerWidth - 336));

  return {
    rect: { top: r.top, left: r.left, width: r.width, height: r.height },
    tooltip: { top: tooltipTop, left: tooltipLeft, arrowSide: below ? 'top' as const : 'bottom' as const },
    arrowLeft: Math.min(Math.max(r.left + r.width / 2 - tooltipLeft, 24), 296),
  };
}

// Simple resize counter for triggering re-renders on window resize
let resizeCount = 0;
const resizeListeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    resizeCount++;
    resizeListeners.forEach(l => l());
  });
}
function subscribeResize(cb: () => void) { resizeListeners.add(cb); return () => { resizeListeners.delete(cb); }; }
function getResizeSnapshot() { return resizeCount; }

export function OnboardingTour({ onComplete }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const scrolledRef = useRef(false);

  // Re-render on window resize
  useSyncExternalStore(subscribeResize, getResizeSnapshot);

  const currentStep = TOUR_STEPS[step];

  // Compute layout as derived value (no setState needed)
  const layout = currentStep ? computeLayout(currentStep.target) : null;

  // Scroll target into view on step change
  useEffect(() => {
    if (!currentStep) return;
    scrolledRef.current = false;
    const el = document.querySelector(`[data-tour="${currentStep.target}"]`);
    if (el && !scrolledRef.current) {
      scrolledRef.current = true;
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentStep]);

  const handleNext = useCallback(() => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      markTourCompleted();
      onComplete();
    }
  }, [step, onComplete]);

  const handleSkip = useCallback(() => {
    markTourCompleted();
    onComplete();
  }, [onComplete]);

  // Keyboard: Escape to skip, Enter/Right for next, Left for prev
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { handleSkip(); return; }
      if (e.key === 'ArrowRight' || e.key === 'Enter') { handleNext(); return; }
      if (e.key === 'ArrowLeft' && step > 0) { setStep(s => s - 1); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleNext, handleSkip, step]);

  if (!currentStep) return null;

  // Spotlight cutout using box-shadow
  const spotlightStyle: React.CSSProperties = layout ? {
    position: 'fixed',
    top: layout.rect.top - 8,
    left: layout.rect.left - 8,
    width: layout.rect.width + 16,
    height: layout.rect.height + 16,
    borderRadius: '12px',
    boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
    zIndex: 9998,
    pointerEvents: 'none',
    transition: 'all 0.3s ease',
  } : {
    position: 'fixed',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
    boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
    zIndex: 9998,
    pointerEvents: 'none',
  };

  return (
    <>
      {/* Overlay that blocks interaction except on the spotlight area */}
      <div
        className="fixed inset-0 z-[9997]"
        onClick={handleNext}
        aria-hidden="true"
      />

      {/* Spotlight cutout */}
      <div style={spotlightStyle} />

      {/* Tooltip */}
      <div
        className="fixed z-[9999] w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700/60 p-5 animate-fade-in"
        style={{ top: layout?.tooltip.top ?? 0, left: layout?.tooltip.left ?? 0 }}
        role="dialog"
        aria-modal="true"
        aria-label={t(currentStep.titleKey as never)}
      >
        {/* Arrow */}
        <div
          className={`absolute w-3 h-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 rotate-45 ${
            (layout?.tooltip.arrowSide ?? 'top') === 'top'
              ? '-top-1.5 border-l border-t'
              : '-bottom-1.5 border-r border-b'
          }`}
          style={{ left: layout?.arrowLeft ?? 160 }}
        />

        {/* Step indicator */}
        <div className="flex items-center gap-1.5 mb-3">
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? 'w-6'
                  : i < step ? 'w-1.5 bg-gray-400 dark:bg-gray-500' : 'w-1.5 bg-gray-300 dark:bg-gray-600'
              }`}
              style={i === step ? { backgroundColor: 'var(--accent-500)' } : undefined}
            />
          ))}
          <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
            {step + 1}/{TOUR_STEPS.length}
          </span>
        </div>

        {/* Content */}
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1.5">
          {t(currentStep.titleKey as never)}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
          {t(currentStep.descriptionKey as never)}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {t('tour.skip' as never)}
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg transition-colors"
              >
                {t('tour.prev' as never)}
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-4 py-1.5 text-xs text-white rounded-lg font-medium transition-colors"
              style={{ backgroundColor: 'var(--accent-600)' }}
            >
              {step < TOUR_STEPS.length - 1 ? t('tour.next' as never) : t('tour.finish' as never)}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
