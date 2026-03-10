import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from '../i18n';
import { useTheme } from '../theme';

export function SetupQRCode() {
  const { t } = useTranslation();
  const { resolved: theme } = useTheme();
  return (
    <div className="flex flex-col items-center gap-2 pt-2 pb-4">
      <QRCodeSVG
        value={`${window.location.origin}${import.meta.env.BASE_URL || '/'}`}
        size={100}
        level="L"
        bgColor={theme === 'dark' ? '#111827' : '#f9fafb'}
        fgColor={theme === 'dark' ? '#e5e7eb' : '#111827'}
      />
      <span className="text-xs text-gray-400 dark:text-gray-500 text-center">
        {t('finished.qrApp')}
      </span>
    </div>
  );
}
