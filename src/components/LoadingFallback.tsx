import { useTranslation } from '../i18n';

interface Props {
  className?: string;
}

export function LoadingFallback({ className = '' }: Props) {
  const { t } = useTranslation();
  return (
    <div className={`flex items-center justify-center py-8 ${className}`} role="status" aria-label={t('app.loading')}>
      <div className="flex gap-1.5">
        {[0, 150, 300].map(delay => (
          <div
            key={delay}
            className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
