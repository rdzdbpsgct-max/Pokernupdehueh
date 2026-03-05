// Voice announcements — ElevenLabs MP3 for German, Web Speech API fallback, no voice for English

import type { Language, TranslationKey } from '../i18n/translations';
import { playAudioSequence, cancelAudioPlayback } from './audioPlayer';

type TranslateFn = (key: TranslationKey, params?: Record<string, string | number>) => string;

let preferredVoice: SpeechSynthesisVoice | null = null;
let voiceLanguage: Language = 'de';
let voicesLoaded = false;

// ---------------------------------------------------------------------------
// Audio file manifest — known pre-recorded files
// ---------------------------------------------------------------------------

const BLIND_PAIRS = new Set([
  '2-3','2-4','3-5','4-8','5-10','6-11','7-13','8-15',
  '10-19','10-20','12-23','13-25','15-30','19-38','20-40',
  '23-45','25-50','30-60','32-63','38-75','40-80','45-90',
  '50-100','55-110','60-120','65-130','75-150','80-160','90-180','95-190',
  '100-200','120-230','120-240','130-250','150-300','160-310','190-380',
  '200-400','230-450','250-500','300-600','320-630','380-750',
  '400-800','450-900','500-1000','550-1100','600-1200','650-1300',
  '750-1500','800-1600','950-1900','1000-2000','1200-2300','1300-2500',
  '1500-3000','1600-3100','1900-3800','2000-4000','2300-4500','2500-5000',
  '3000-6000','3200-6300','3800-7500','4000-8000','5000-10000',
  '6500-13000','7500-15000','10000-20000','13000-25000','15000-30000',
  '20000-40000','25000-50000',
]);

const ANTE_VALUES = new Set([
  '1','1.5','2','2.5','5','10','15','20','25','50',
  '100','150','200','250','500','1000','1500','2000','2500','5000',
]);

const BREAK_MINUTES = new Set([5, 10, 15, 20, 25, 30]);
const MAX_LEVEL = 25;
const MAX_COUNTDOWN = 10;

// ---------------------------------------------------------------------------
// Unified speech queue — supports both MP3 audio and Web Speech API
// ---------------------------------------------------------------------------

type QueueItem =
  | { mode: 'audio'; files: string[]; fallbackText?: string; fallbackOptions?: { rate?: number; pitch?: number; volume?: number } }
  | { mode: 'speech'; text: string; options?: { rate?: number; pitch?: number; volume?: number } };

let speechQueue: QueueItem[] = [];
let isSpeaking = false;

// ---------------------------------------------------------------------------
// Voice selection (Web Speech API fallback)
// ---------------------------------------------------------------------------

function findVoice(lang: Language): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const langPrefix = lang === 'de' ? 'de' : 'en';

  const localMatch = voices.find(v => v.lang.startsWith(langPrefix) && v.localService);
  if (localMatch) return localMatch;
  const anyMatch = voices.find(v => v.lang.startsWith(langPrefix));
  if (anyMatch) return anyMatch;
  return null;
}

function ensureVoice(): void {
  if (voicesLoaded) return;
  preferredVoice = findVoice(voiceLanguage);
  voicesLoaded = true;
}

/**
 * Update the preferred voice language. Call when the app language changes.
 */
export function setSpeechLanguage(lang: Language): void {
  voiceLanguage = lang;
  voicesLoaded = false;
  preferredVoice = null;
}

/**
 * Initialize speech synthesis voices. Call from a user gesture handler.
 */
export function initSpeech(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.getVoices();
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
// Queue processor
// ---------------------------------------------------------------------------

function processQueue(): void {
  if (isSpeaking || speechQueue.length === 0) return;

  const next = speechQueue.shift()!;
  isSpeaking = true;

  if (next.mode === 'audio') {
    playAudioSequence(next.files)
      .then(() => {
        isSpeaking = false;
        processQueue();
      })
      .catch(() => {
        // MP3 failed — try Web Speech API fallback
        if (next.fallbackText) {
          speakUtterance(next.fallbackText, next.fallbackOptions, () => {
            isSpeaking = false;
            processQueue();
          });
        } else {
          isSpeaking = false;
          processQueue();
        }
      });
  } else {
    speakUtterance(next.text, next.options, () => {
      isSpeaking = false;
      processQueue();
    });
  }
}

function speakUtterance(
  text: string,
  options: { rate?: number; pitch?: number; volume?: number } | undefined,
  onDone: () => void,
): void {
  try {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      onDone();
      return;
    }

    ensureVoice();

    const utterance = new SpeechSynthesisUtterance(text);
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      utterance.lang = preferredVoice.lang;
    } else {
      utterance.lang = voiceLanguage === 'de' ? 'de-DE' : 'en-US';
    }
    utterance.rate = options?.rate ?? 1.0;
    utterance.pitch = options?.pitch ?? 1.0;
    utterance.volume = options?.volume ?? 0.8;

    utterance.onend = onDone;
    utterance.onerror = onDone;

    window.speechSynthesis.speak(utterance);
  } catch {
    onDone();
  }
}

// ---------------------------------------------------------------------------
// Public API — enqueue and cancel
// ---------------------------------------------------------------------------

function enqueue(item: QueueItem): void {
  speechQueue.push(item);
  if (!isSpeaking) processQueue();
}

/**
 * Cancel any currently playing announcement (audio + speech) and clear queue.
 */
export function cancelSpeech(): void {
  speechQueue = [];
  isSpeaking = false;
  cancelAudioPlayback();
  try {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  } catch {
    // silent
  }
}

/**
 * Cancel queue and enqueue a single item immediately
 * (used for countdown numbers that must not be delayed).
 */
function enqueueImmediate(item: QueueItem): void {
  cancelSpeech();
  enqueue(item);
}

// ---------------------------------------------------------------------------
// Helper — build audio item with speech fallback
// ---------------------------------------------------------------------------

function audioOrSpeech(
  files: string[],
  fallbackText: string,
  fallbackOptions?: { rate?: number; pitch?: number; volume?: number },
): QueueItem {
  return { mode: 'audio', files, fallbackText, fallbackOptions };
}

// ---------------------------------------------------------------------------
// Convenience functions
// ---------------------------------------------------------------------------

/** Level change — "Level 5" + "Blinds" + "200 auf 400" [+ "Ante" + "25"] */
export function announceLevelChange(
  levelNumber: number,
  smallBlind: number,
  bigBlind: number,
  ante: number | undefined,
  t: TranslateFn,
): void {
  if (voiceLanguage !== 'de') return;

  const pairKey = `${smallBlind}-${bigBlind}`;
  const canMp3 = levelNumber >= 1 && levelNumber <= MAX_LEVEL && BLIND_PAIRS.has(pairKey);
  const anteOk = !ante || ante <= 0 || ANTE_VALUES.has(String(ante));

  if (canMp3 && anteOk) {
    const files: string[] = [
      `levels/level-${String(levelNumber).padStart(2, '0')}.mp3`,
      'building-blocks/blinds.mp3',
      `blind-pairs/${pairKey}.mp3`,
    ];
    if (ante && ante > 0) {
      files.push('building-blocks/ante.mp3', `ante/ante-${ante}.mp3`);
    }
    const fallback = ante && ante > 0
      ? t('voice.levelChangeWithAnte', { level: levelNumber, sb: smallBlind, bb: bigBlind, ante })
      : t('voice.levelChange', { level: levelNumber, sb: smallBlind, bb: bigBlind });
    enqueue(audioOrSpeech(files, fallback));
  } else {
    const text = ante && ante > 0
      ? t('voice.levelChangeWithAnte', { level: levelNumber, sb: smallBlind, bb: bigBlind, ante })
      : t('voice.levelChange', { level: levelNumber, sb: smallBlind, bb: bigBlind });
    enqueue({ mode: 'speech', text });
  }
}

/** Break start — "Pause — 10 Minuten" */
export function announceBreakStart(
  durationMinutes: number,
  t: TranslateFn,
): void {
  if (voiceLanguage !== 'de') return;

  if (BREAK_MINUTES.has(durationMinutes)) {
    const file = `breaks/break-${String(durationMinutes).padStart(2, '0')}min.mp3`;
    enqueue(audioOrSpeech([file], t('voice.breakStart', { minutes: durationMinutes })));
  } else {
    enqueue({ mode: 'speech', text: t('voice.breakStart', { minutes: durationMinutes }) });
  }
}

/** Break warning — "Noch 30 Sekunden Pause" */
export function announceBreakWarning(t: TranslateFn): void {
  if (voiceLanguage !== 'de') return;
  enqueue(audioOrSpeech(['fixed/break-warning.mp3'], t('voice.breakWarning')));
}

/**
 * Countdown number (last 10 seconds) — uses immediate mode.
 * Returns true if voice will play (German), false otherwise (so caller can beep).
 */
export function announceCountdown(second: number): boolean {
  if (voiceLanguage !== 'de') return false;
  if (second >= 1 && second <= MAX_COUNTDOWN) {
    const file = `countdown/countdown-${String(second).padStart(2, '0')}.mp3`;
    enqueueImmediate(audioOrSpeech([file], String(second), { rate: 0.85 }));
  } else {
    enqueueImmediate({ mode: 'speech', text: String(second), options: { rate: 0.85 } });
  }
  return true;
}

/** Bubble — "Wir sind auf der Bubble!" */
export function announceBubble(t: TranslateFn): void {
  if (voiceLanguage !== 'de') return;
  enqueue(audioOrSpeech(['fixed/bubble.mp3'], t('voice.bubble')));
}

/** In The Money — "In The Money! Glückwunsch!" */
export function announceInTheMoney(t: TranslateFn): void {
  if (voiceLanguage !== 'de') return;
  enqueue(audioOrSpeech(['fixed/itm.mp3'], t('voice.inTheMoney')));
}

/** Player eliminated — always Web Speech API (dynamic player name) */
export function announceElimination(
  playerName: string,
  place: number,
  t: TranslateFn,
): void {
  if (voiceLanguage !== 'de') return;
  enqueue({ mode: 'speech', text: t('voice.playerEliminated', { name: playerName, place }) });
}

/** Tournament winner — always Web Speech API (dynamic player name) */
export function announceWinner(playerName: string, t: TranslateFn): void {
  if (voiceLanguage !== 'de') return;
  enqueue({ mode: 'speech', text: t('voice.tournamentWinner', { name: playerName }) });
}

/** Add-On available */
export function announceAddOn(t: TranslateFn): void {
  if (voiceLanguage !== 'de') return;
  enqueue(audioOrSpeech(['fixed/addon-available.mp3'], t('voice.addOnAvailable')));
}

/** Rebuy phase ended */
export function announceRebuyEnded(t: TranslateFn): void {
  if (voiceLanguage !== 'de') return;
  enqueue(audioOrSpeech(['fixed/rebuy-ended.mp3'], t('voice.rebuyEnded')));
}

/** Color-Up — "Color-Up: Chips werden eingetauscht" */
export function announceColorUp(chipLabels: string, t: TranslateFn): void {
  if (voiceLanguage !== 'de') return;
  enqueue(audioOrSpeech(
    ['building-blocks/color-up.mp3', 'fixed/colorup-action.mp3'],
    t('voice.colorUp', { chips: chipLabels }),
  ));
}

/** Tournament start — "Shuffle up and deal!" */
export function announceTournamentStart(): void {
  if (voiceLanguage !== 'de') return;
  enqueue({ mode: 'audio', files: ['fixed/shuffle-up-and-deal.mp3'] });
}

/** Heads-Up — "Heads-Up!" */
export function announceHeadsUp(): void {
  if (voiceLanguage !== 'de') return;
  enqueue({ mode: 'audio', files: ['fixed/heads-up.mp3'] });
}
