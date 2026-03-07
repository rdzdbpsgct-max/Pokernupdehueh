import type { Level } from './types';
import { t as moduleT } from '../i18n/translations';

// ---------------------------------------------------------------------------
// Format
// ---------------------------------------------------------------------------

export function formatTime(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatElapsedTime(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = clamped % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Level label helpers
// ---------------------------------------------------------------------------

export function getLevelLabel(level: Level, index: number, levels: Level[], t = moduleT): string {
  if (level.type === 'break') {
    return level.label || t('logic.defaultBreakLabel');
  }
  const playLevels = levels.slice(0, index + 1).filter(l => l.type === 'level');
  return t('logic.levelN', { n: playLevels.length });
}

export function getBlindsText(level: Level, t = moduleT): string {
  if (level.type === 'break') return '';
  const parts = [`${level.smallBlind ?? 0} / ${level.bigBlind ?? 0}`];
  if (level.ante && level.ante > 0) {
    parts.push(`${t('logic.ante')} ${level.ante}`);
  }
  return parts.join(' - ');
}
