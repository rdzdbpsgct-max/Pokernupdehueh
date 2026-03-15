export type Platform = 'android' | 'ios' | 'desktop';
export type DesktopOS = 'macos' | 'windows' | 'chromeos' | 'linux' | 'unknown';

export function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
  return 'desktop';
}

export function detectDesktopOS(): DesktopOS {
  const platform = navigator.platform || '';
  const ua = navigator.userAgent;
  if (/Mac/i.test(platform)) return 'macos';
  if (/Win/i.test(platform)) return 'windows';
  if (/CrOS/i.test(ua)) return 'chromeos';
  if (/Linux/i.test(platform)) return 'linux';
  return 'unknown';
}
