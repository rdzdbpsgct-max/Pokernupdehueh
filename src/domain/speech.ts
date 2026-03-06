// Voice announcements — ElevenLabs MP3 for German + English, Web Speech API fallback

import type { Language, TranslationKey } from '../i18n/translations';
import { playAudioSequence, cancelAudioPlayback, setAudioLanguage } from './audioPlayer';

type TranslateFn = (key: TranslationKey, params?: Record<string, string | number>) => string;

let preferredVoice: SpeechSynthesisVoice | null = null;
let voiceLanguage: Language = 'de';
let voicesLoaded = false;

// ---------------------------------------------------------------------------
// Audio file manifest — known pre-recorded files (identical for DE + EN)
// ---------------------------------------------------------------------------

const BLIND_PAIRS = new Set([
  '1-2','1-3','2-3','2-4','2-5','3-5','3-6','4-8','5-10','6-11','7-13','8-15','8-16',
  '10-19','10-20','12-23','13-25','15-25','15-30','19-38','20-40',
  '23-45','25-45','25-50','30-60','32-63','38-75','40-75','40-80','45-90',
  '50-100','55-110','60-120','65-130','75-125','75-150','80-160','90-180','95-190',
  '100-175','100-200','120-230','120-240','125-250','130-250','150-300','160-310','190-380',
  '200-400','230-450','250-450','250-500','300-550','300-600','320-630','350-650','350-700','380-750',
  '400-750','400-800','450-900','500-950','500-1000','550-1100','600-1200','650-1300',
  '750-1500','800-1600','900-1800','950-1900','1000-2000','1200-2300','1200-2400','1300-2500','1300-2600',
  '1500-3000','1600-3100','1600-3200','1900-3800','2000-4000','2300-4500','2300-4600','2500-5000',
  '3000-6000','3200-6300','3300-6500','3300-6600','3800-7500','3800-7600','4000-8000','4500-9000','5000-10000',
  '6000-12000','6500-12500','6500-13000','7500-15000','8000-16000','10000-20000',
  '12000-24000','12500-25000','13000-25000','15000-30000','20000-40000','25000-50000',
  '30000-60000','40000-80000','50000-100000','60000-120000','80000-160000','100000-200000',
]);

const ANTE_VALUES = new Set([
  '1','1.5','2','2.5','5','10','15','20','25','50',
  '100','150','200','250','500','1000','1500','2000','2500','5000',
]);

const MAX_BREAK_MINUTES = 30;
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
  setAudioLanguage(lang);
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
      .catch((err) => {
        // MP3 failed — try Web Speech API fallback
        console.error('[speech] MP3 playback failed, falling back to Web Speech API:', err, 'files:', next.files);
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
// Convenience functions — both DE and EN have MP3 audio files
// ---------------------------------------------------------------------------

/** Level change — "Level 5" + "Blinds" + "200 to 400" [+ "Ante" + "25"] */
export function announceLevelChange(
  levelNumber: number,
  smallBlind: number,
  bigBlind: number,
  ante: number | undefined,
  t: TranslateFn,
): void {
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
      files.push(`ante/ante-${ante}.mp3`);
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

/** Break start — "Break — 10 minutes" / "Pause — 10 Minuten" */
export function announceBreakStart(
  durationMinutes: number,
  t: TranslateFn,
): void {
  if (durationMinutes >= 1 && durationMinutes <= MAX_BREAK_MINUTES) {
    const file = `breaks/break-${String(durationMinutes).padStart(2, '0')}min.mp3`;
    enqueue(audioOrSpeech([file], t('voice.breakStart', { minutes: durationMinutes })));
  } else {
    enqueue({ mode: 'speech', text: t('voice.breakStart', { minutes: durationMinutes }) });
  }
}

/** Break warning — "30 seconds left in the break" */
export function announceBreakWarning(t: TranslateFn): void {
  enqueue(audioOrSpeech(['fixed/break-warning.mp3'], t('voice.breakWarning')));
}

/**
 * Countdown number (last 10 seconds) — uses immediate mode.
 * Returns true so caller knows voice is handling it (no beep needed).
 */
export function announceCountdown(second: number): boolean {
  if (second >= 1 && second <= MAX_COUNTDOWN) {
    const file = `countdown/countdown-${String(second).padStart(2, '0')}.mp3`;
    enqueueImmediate(audioOrSpeech([file], String(second), { rate: 0.85 }));
  } else {
    enqueueImmediate({ mode: 'speech', text: String(second), options: { rate: 0.85 } });
  }
  return true;
}

/** Bubble — "We're on the bubble!" */
export function announceBubble(t: TranslateFn): void {
  enqueue(audioOrSpeech(['fixed/bubble.mp3'], t('voice.bubble')));
}

/** In The Money — "In the money! Congratulations!" */
export function announceInTheMoney(t: TranslateFn): void {
  enqueue(audioOrSpeech(['fixed/itm.mp3'], t('voice.inTheMoney')));
}

/** Player eliminated — generic announcement without player name */
export function announceElimination(t: TranslateFn): void {
  enqueue(audioOrSpeech(['fixed/player-eliminated.mp3'], t('voice.playerEliminated')));
}

/** Tournament winner — generic announcement without player name */
export function announceWinner(t: TranslateFn): void {
  enqueue(audioOrSpeech(['fixed/tournament-winner.mp3'], t('voice.winner')));
}

/** Bounty collected — "Bounty collected! What a knockout!" */
export function announceBounty(t: TranslateFn): void {
  enqueue(audioOrSpeech(['fixed/bounty-collected.mp3'], t('voice.bountyCollected')));
}

/** Add-On available */
export function announceAddOn(t: TranslateFn): void {
  enqueue(audioOrSpeech(['fixed/addon-available.mp3'], t('voice.addOnAvailable')));
}

/** Rebuy available — reminder after elimination during rebuy phase */
export function announceRebuyAvailable(t: TranslateFn): void {
  enqueue(audioOrSpeech(['fixed/rebuy-available.mp3'], t('voice.rebuyAvailable')));
}

/** Rebuy phase ended */
export function announceRebuyEnded(t: TranslateFn): void {
  enqueue(audioOrSpeech(['fixed/rebuy-ended.mp3'], t('voice.rebuyEnded')));
}

/** Color-Up — "Color-Up: Chips will be colored up" */
export function announceColorUp(chipLabels: string, t: TranslateFn): void {
  enqueue(audioOrSpeech(
    ['building-blocks/color-up.mp3', 'fixed/colorup-action.mp3'],
    t('voice.colorUp', { chips: chipLabels }),
  ));
}

/** Tournament start — "Shuffle up and deal!" */
export function announceTournamentStart(t: TranslateFn): void {
  enqueue(audioOrSpeech(['fixed/shuffle-up-and-deal.mp3'], t('voice.tournamentStart')));
}

/** Heads-Up — "Heads-Up!" */
export function announceHeadsUp(t: TranslateFn): void {
  enqueue(audioOrSpeech(['fixed/heads-up.mp3'], t('voice.headsUp')));
}

/** Last hand of the level (or before break) */
export function announceLastHand(nextIsBreak: boolean, t: TranslateFn): void {
  if (nextIsBreak) {
    enqueue(audioOrSpeech(['fixed/last-hand-before-break.mp3'], t('voice.lastHandBeforeBreak')));
  } else {
    enqueue(audioOrSpeech(['fixed/last-hand.mp3'], t('voice.lastHand')));
  }
}

/** Five minutes remaining in this level */
export function announceFiveMinutes(t: TranslateFn): void {
  enqueue(audioOrSpeech(['fixed/five-minutes.mp3'], t('voice.fiveMinutes')));
}

/** Three players remaining */
export function announceThreeRemaining(t: TranslateFn): void {
  enqueue(audioOrSpeech(['fixed/three-remaining.mp3'], t('voice.threeRemaining')));
}

/** N players remaining (dynamic count for paidPlaces milestones) */
export function announcePlayersRemaining(count: number, t: TranslateFn): void {
  if (count >= 4 && count <= 10) {
    enqueue(audioOrSpeech(
      [`fixed/${count}-remaining.mp3`],
      t('voice.playersRemaining', { n: count }),
    ));
  } else {
    enqueue({ mode: 'speech', text: t('voice.playersRemaining', { n: count }) });
  }
}

/** Break is over — please take your seats */
export function announceBreakOver(t: TranslateFn): void {
  enqueue(audioOrSpeech(['fixed/break-over.mp3'], t('voice.breakOver')));
}

/** Color-Up warning — next break */
export function announceColorUpWarning(t: TranslateFn): void {
  enqueue(audioOrSpeech(['fixed/colorup-next-break.mp3'], t('voice.colorUpNextBreak')));
}

/** Timer paused */
export function announceTimerPaused(t: TranslateFn): void {
  enqueue(audioOrSpeech(['fixed/paused.mp3'], t('voice.paused')));
}

/** Timer resumed */
export function announceTimerResumed(t: TranslateFn): void {
  enqueue(audioOrSpeech(['fixed/resumed.mp3'], t('voice.resumed')));
}

/** Hand-for-Hand mode activated */
export function announceHandForHand(t: TranslateFn): void {
  enqueue(audioOrSpeech(['fixed/hand-for-hand.mp3'], t('voice.handForHand')));
}
