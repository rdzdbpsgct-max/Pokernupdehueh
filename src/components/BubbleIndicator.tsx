import { useTranslation } from '../i18n';

interface Props {
  isBubble: boolean;
  showItmFlash: boolean;
}

export function BubbleIndicator({ isBubble, showItmFlash }: Props) {
  const { t } = useTranslation();

  if (showItmFlash) {
    return (
      <div className="w-full max-w-xl px-4 py-3 bg-emerald-900/40 border-2 border-emerald-500 rounded-lg text-center animate-pulse" role="status" aria-live="assertive">
        <p className="text-emerald-300 text-lg font-bold">
          💰 {t('bubble.inTheMoney')} 💰
        </p>
      </div>
    );
  }

  if (isBubble) {
    return (
      <div className="w-full max-w-xl px-4 py-3 bg-red-900/30 border-2 border-red-500 rounded-lg text-center animate-pulse" role="alert" aria-live="assertive">
        <p className="text-red-300 text-xl font-bold tracking-wider">
          🫧 {t('bubble.bubble')} 🫧
        </p>
        <p className="text-red-400/70 text-xs mt-1">
          {t('bubble.bubbleHint')}
        </p>
      </div>
    );
  }

  return null;
}
