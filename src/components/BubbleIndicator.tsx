import { useTranslation } from '../i18n';

interface Props {
  isBubble: boolean;
  showItmFlash: boolean;
  addOnWindowOpen: boolean;
  addOnCost: number;
  addOnChips: number;
}

export function BubbleIndicator({ isBubble, showItmFlash, addOnWindowOpen, addOnCost, addOnChips }: Props) {
  const { t } = useTranslation();

  return (
    <>
      {showItmFlash && (
        <div className="w-full max-w-xl px-4 py-3 bg-emerald-900/40 border-2 border-emerald-500 rounded-xl text-center animate-itm-flash backdrop-blur-sm" role="status" aria-live="assertive">
          <p className="text-emerald-300 text-lg font-bold">
            💰 {t('bubble.inTheMoney')} 💰
          </p>
        </div>
      )}

      {addOnWindowOpen && (
        <div className="w-full max-w-xl px-4 py-3 bg-amber-900/30 border-2 border-amber-500 rounded-xl text-center animate-addon-pulse backdrop-blur-sm" role="status" aria-live="polite">
          <p className="text-amber-300 text-lg font-bold">
            🎰 {t('addOn.announcement')} 🎰
          </p>
          <p className="text-amber-400/70 text-xs mt-1">
            {t('addOn.announcementDetail', { cost: addOnCost, chips: addOnChips.toLocaleString() })}
          </p>
        </div>
      )}

      {isBubble && (
        <div className="w-full max-w-xl px-4 py-3 bg-red-900/30 border-2 border-red-500 rounded-xl text-center animate-bubble-pulse backdrop-blur-sm" role="alert" aria-live="assertive">
          <p className="text-red-300 text-xl font-bold tracking-wider">
            🫧 {t('bubble.bubble')} 🫧
          </p>
          <p className="text-red-400/70 text-xs mt-1">
            {t('bubble.bubbleHint')}
          </p>
        </div>
      )}
    </>
  );
}
