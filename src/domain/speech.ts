// Voice announcements using Web Speech API (no external files, offline-capable)

import type { Language, TranslationKey } from '../i18n/translations';

type TranslateFn = (key: TranslationKey, params?: Record<string, string | number>) => string;

let preferredVoice: SpeechSynthesisVoice | null = null;
let englishVoice: SpeechSynthesisVoice | null = null;
let voiceLanguage: Language = 'de';
let voicesLoaded = false;

// English poker terms that should be pronounced in English even in German mode
const ENGLISH_POKER_TERMS = /\b(Level|Blinds|Blind|Ante|Bubble|Add-On|Rebuy|Color-Up|In The Money)\b/gi;

// ---------------------------------------------------------------------------
// Voice selection
// ---------------------------------------------------------------------------

function findVoice(lang: Language): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const langPrefix = lang === 'de' ? 'de' : 'en';

  // Prefer local/offline voices that match the language
  const localMatch = voices.find(v => v.lang.startsWith(langPrefix) && v.localService);
  if (localMatch) return localMatch;
  // Fallback to any matching voice (may be network-based)
  const anyMatch = voices.find(v => v.lang.startsWith(langPrefix));
  if (anyMatch) return anyMatch;
  return null;
}

function ensureVoice(): void {
  if (voicesLoaded) return;
  preferredVoice = findVoice(voiceLanguage);
  // Also find an English voice for poker terms when in German mode
  if (voiceLanguage === 'de') {
    englishVoice = findVoice('en');
  } else {
    englishVoice = null;
  }
  voicesLoaded = true;
}

/**
 * Update the preferred voice language. Call when the app language changes.
 */
export function setSpeechLanguage(lang: Language): void {
  voiceLanguage = lang;
  voicesLoaded = false;
  preferredVoice = null;
  englishVoice = null;
}

/**
 * Initialize speech synthesis voices. Call from a user gesture handler
 * (same place as initAudio()). Some browsers only populate voices after
 * user interaction or after the 'voiceschanged' event.
 */
export function initSpeech(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    // Force voice list population
    window.speechSynthesis.getVoices();
    // Chrome loads voices asynchronously
    if (!voicesLoaded) {
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        voicesLoaded = false;
        ensureVoice();
      }, { once: true });
    }
  } catch {
    // speechSynthesis not available
  }
}

// ---------------------------------------------------------------------------
// Core speech function
// ---------------------------------------------------------------------------

/**
 * Create a configured utterance for the given text and language.
 */
function createUtterance(
  text: string,
  lang: 'primary' | 'english',
  options?: { rate?: number; pitch?: number; volume?: number },
): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(text);
  if (lang === 'english' && englishVoice) {
    utterance.voice = englishVoice;
    utterance.lang = englishVoice.lang;
  } else if (preferredVoice) {
    utterance.voice = preferredVoice;
    utterance.lang = preferredVoice.lang;
  } else {
    utterance.lang = voiceLanguage === 'de' ? 'de-DE' : 'en-US';
  }
  utterance.rate = options?.rate ?? 1.0;
  utterance.pitch = options?.pitch ?? 1.0;
  utterance.volume = options?.volume ?? 0.8;
  return utterance;
}

/**
 * Split text into segments, alternating between the primary language
 * and English for known poker terms. Only applies when voiceLanguage is 'de'.
 */
function splitForMixedLang(text: string): Array<{ text: string; lang: 'primary' | 'english' }> {
  if (voiceLanguage !== 'de' || !englishVoice) {
    return [{ text, lang: 'primary' }];
  }

  const segments: Array<{ text: string; lang: 'primary' | 'english' }> = [];
  let lastIndex = 0;

  // Reset regex state
  ENGLISH_POKER_TERMS.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ENGLISH_POKER_TERMS.exec(text)) !== null) {
    // Add preceding German text
    if (match.index > lastIndex) {
      const preceding = text.slice(lastIndex, match.index).trim();
      if (preceding) segments.push({ text: preceding, lang: 'primary' });
    }
    // Add English term
    segments.push({ text: match[0], lang: 'english' });
    lastIndex = match.index + match[0].length;
  }
  // Add remaining German text
  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex).trim();
    if (remaining) segments.push({ text: remaining, lang: 'primary' });
  }

  return segments.length > 0 ? segments : [{ text, lang: 'primary' }];
}

/**
 * Speak an announcement. Cancels any currently speaking utterance first
 * to prevent overlapping. Silently does nothing if speechSynthesis is
 * unavailable.
 *
 * When in German mode, English poker terms (Level, Blinds, Ante, etc.)
 * are spoken with an English voice for correct pronunciation.
 */
export function announce(
  text: string,
  options?: { rate?: number; pitch?: number; volume?: number },
): void {
  try {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // Cancel any current speech to prevent queue buildup
    window.speechSynthesis.cancel();

    ensureVoice();

    const segments = splitForMixedLang(text);
    for (const segment of segments) {
      const utterance = createUtterance(segment.text, segment.lang, options);
      window.speechSynthesis.speak(utterance);
    }
  } catch {
    // speechSynthesis not available — silent degradation
  }
}

/**
 * Cancel any currently speaking announcement.
 */
export function cancelSpeech(): void {
  try {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
  } catch {
    // silent
  }
}

// ---------------------------------------------------------------------------
// Announcement convenience functions
// ---------------------------------------------------------------------------

/** Tier 1: Level change — "Level 5 — Blinds 200 / 400" */
export function announceLevelChange(
  levelNumber: number,
  smallBlind: number,
  bigBlind: number,
  ante: number | undefined,
  t: TranslateFn,
): void {
  const text = ante && ante > 0
    ? t('voice.levelChangeWithAnte', { level: levelNumber, sb: smallBlind, bb: bigBlind, ante })
    : t('voice.levelChange', { level: levelNumber, sb: smallBlind, bb: bigBlind });
  announce(text);
}

/** Tier 1: Break start — "Pause — 10 Minuten" */
export function announceBreakStart(
  durationMinutes: number,
  t: TranslateFn,
): void {
  announce(t('voice.breakStart', { minutes: durationMinutes }));
}

/** Tier 1: Break warning — "Noch 30 Sekunden Pause" */
export function announceBreakWarning(t: TranslateFn): void {
  announce(t('voice.breakWarning'));
}

/** Tier 1: Countdown number (last 5 seconds) */
export function announceCountdown(second: number): void {
  announce(String(second), { rate: 1.2 });
}

/** Tier 2: Bubble — "Wir sind auf der Bubble!" */
export function announceBubble(t: TranslateFn): void {
  announce(t('voice.bubble'));
}

/** Tier 2: In The Money — "In The Money! Glückwunsch!" */
export function announceInTheMoney(t: TranslateFn): void {
  announce(t('voice.inTheMoney'));
}

/** Tier 2: Player eliminated — "[Name] ausgeschieden auf Platz [X]" */
export function announceElimination(
  playerName: string,
  place: number,
  t: TranslateFn,
): void {
  announce(t('voice.playerEliminated', { name: playerName, place }));
}

/** Tier 2: Tournament winner — "[Name] gewinnt das Turnier!" */
export function announceWinner(playerName: string, t: TranslateFn): void {
  announce(t('voice.tournamentWinner', { name: playerName }));
}

/** Tier 3: Add-On available — "Add-On jetzt verfügbar!" */
export function announceAddOn(t: TranslateFn): void {
  announce(t('voice.addOnAvailable'));
}

/** Tier 3: Rebuy phase ended — "Die Rebuy-Phase ist beendet" */
export function announceRebuyEnded(t: TranslateFn): void {
  announce(t('voice.rebuyEnded'));
}

/** Tier 3: Color-Up — "Color-Up: [Chips] werden eingetauscht" */
export function announceColorUp(chipLabels: string, t: TranslateFn): void {
  announce(t('voice.colorUp', { chips: chipLabels }));
}
