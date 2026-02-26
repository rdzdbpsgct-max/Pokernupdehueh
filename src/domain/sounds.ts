// Sound effects using Web Audio API (no external files needed)

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Pre-initialize audio context from a user gesture (required by Safari).
 * Call this from click/touch handlers (e.g. Play button) so the AudioContext
 * is unlocked before any programmatic sound playback.
 */
export function initAudio(): void {
  try {
    getAudioContext();
  } catch {
    // audio not available
  }
}

function playNote(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  volume = 0.3,
  type: OscillatorType = 'sine',
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

/** Simple beep for countdown and level-end (used by useTimer) */
export function playBeep(frequency: number, durationMs: number): void {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch {
    // audio not available
  }
}

/** Victory melody for tournament winner */
export function playVictorySound() {
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    // Siegesmelodie: G4-C5-E5 - G5-E5-G5-C6
    playNote(ctx, 392, t, 0.15, 0.2, 'triangle');        // G4
    playNote(ctx, 523, t + 0.15, 0.15, 0.2, 'triangle');  // C5
    playNote(ctx, 659, t + 0.30, 0.15, 0.2, 'triangle');  // E5
    playNote(ctx, 784, t + 0.50, 0.2, 0.25, 'triangle');  // G5
    playNote(ctx, 659, t + 0.70, 0.15, 0.2, 'triangle');  // E5
    playNote(ctx, 784, t + 0.85, 0.2, 0.25, 'triangle');  // G5
    playNote(ctx, 1047, t + 1.10, 0.6, 0.3, 'triangle');  // C6 (lang)
  } catch {
    // audio not available
  }
}

/** Tension sound for reaching the bubble */
export function playBubbleSound() {
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    playNote(ctx, 440, t, 0.3, 0.25, 'sawtooth');         // A4
    playNote(ctx, 554, t + 0.35, 0.3, 0.25, 'sawtooth');  // C#5
    playNote(ctx, 440, t + 0.70, 0.2, 0.2, 'sawtooth');   // A4
    playNote(ctx, 554, t + 0.95, 0.5, 0.3, 'sawtooth');   // C#5 (held)
  } catch {
    // audio not available
  }
}

/** Short celebratory fanfare for reaching In The Money */
export function playInTheMoneySound() {
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    playNote(ctx, 523, t, 0.15, 0.2, 'triangle');         // C5
    playNote(ctx, 659, t + 0.15, 0.15, 0.2, 'triangle');  // E5
    playNote(ctx, 784, t + 0.30, 0.4, 0.25, 'triangle');  // G5 (held)
  } catch {
    // audio not available
  }
}
