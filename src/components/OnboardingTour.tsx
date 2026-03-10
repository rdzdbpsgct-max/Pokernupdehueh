import { useState, useEffect, useCallback, useRef } from 'react';
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

interface LayoutResult {
  rect: { top: number; left: number; width: number; height: number };
  tooltip: { top: number; left: number; arrowSide: 'top' | 'bottom' };
  arrowLeft: number;
}

/** Measure a target element and compute spotlight + tooltip positions. Pure function, no side effects. */
function computeLayout(target: string): LayoutResult | null {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;

  const r = el.getBoundingClientRect();
  // Skip if element is off-screen or has zero dimensions
  if (r.width === 0 && r.height === 0) return null;

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

export function OnboardingTour({ onComplete }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [layout, setLayout] = useState<LayoutResult | null>(null);
  const rafRef = useRef(0);

  const currentStep = TOUR_STEPS[step];

  // Recompute layout using requestAnimationFrame for accurate positioning
  const updateLayout = useCallback(() => {
    if (!currentStep) return;
    const result = computeLayout(currentStep.target);
    setLayout(result);
  }, [currentStep]);

  // Scroll target into view on step change, then recompute layout after scroll settles
  useEffect(() => {
    if (!currentStep) return;

    const el = document.querySelector(`[data-tour="${currentStep.target}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Recompute layout repeatedly until scroll settles (smooth scroll takes ~300-500ms)
    let frameCount = 0;
    const maxFrames = 30; // ~500ms at 60fps
    const pollLayout = () => {
      updateLayout();
      frameCount++;
      if (frameCount < maxFrames) {
        rafRef.current = requestAnimationFrame(pollLayout);
      }
    };
    // Start polling after a small delay to let scroll begin
    const timeoutId = setTimeout(() => {
      rafRef.current = requestAnimationFrame(pollLayout);
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafRef.current);
    };
  }, [currentStep, updateLayout]);

  // Also re-measure on resize and scroll
  useEffect(() => {
    const handleReposition = () => updateLayout();
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true); // capture phase for nested scrolls
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [updateLayout]);

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
        style={{ top: layout?.tooltip.top ?? (window.innerHeight / 2 - 80), left: layout?.tooltip.left ?? (window.innerWidth / 2 - 160) }}
        role="dialog"
        aria-modal="true"
        aria-label={t(currentStep.titleKey as never)}
      >
        {/* Arrow — only show when layout is computed */}
        {layout && (
          <div
            className={`absolute w-3 h-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 rotate-45 ${
              layout.tooltip.arrowSide === 'top'
                ? '-top-1.5 border-l border-t'
                : '-bottom-1.5 border-r border-b'
            }`}
            style={{ left: layout.arrowLeft }}
          />
        )}

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
