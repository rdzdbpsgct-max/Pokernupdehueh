// MP3 audio playback engine — Web Audio API for gapless sequential playback

let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let cancelRequested = false;

function getOrCreateContext(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null;
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function getBasePath(): string {
  // import.meta.env.BASE_URL always ends with '/'
  return `${import.meta.env.BASE_URL}audio/de/`;
}

/**
 * Play a sequence of MP3 files one after another using Web Audio API.
 * Decodes all files upfront, then schedules gapless playback.
 * Resolves when all files have finished. Rejects on the first error.
 */
export function playAudioSequence(files: string[]): Promise<void> {
  if (files.length === 0) return Promise.resolve();
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Audio not available'));
  }

  cancelRequested = false;
  const maybeCtx = getOrCreateContext();
  if (!maybeCtx) return Promise.reject(new Error('AudioContext not available'));
  const ctx = maybeCtx;
  const basePath = getBasePath();

  // Resume context if suspended (autoplay policy)
  const resumePromise = ctx.state === 'suspended' ? ctx.resume() : Promise.resolve();

  return resumePromise.then(() => {
    // Fetch and decode all audio files in parallel
    const decodePromises = files.map((file) =>
      fetch(basePath + file)
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch: ${file}`);
          return res.arrayBuffer();
        })
        .then((buf) => ctx.decodeAudioData(buf)),
    );

    return Promise.all(decodePromises);
  }).then((buffers) => {
    if (cancelRequested) return;

    return new Promise<void>((resolve, reject) => {
      let index = 0;

      function playNext(): void {
        if (cancelRequested || index >= buffers.length) {
          currentSource = null;
          resolve();
          return;
        }

        try {
          const source = ctx.createBufferSource();
          source.buffer = buffers[index];
          source.connect(ctx.destination);
          currentSource = source;

          source.onended = () => {
            index++;
            playNext();
          };

          source.start(0);
        } catch (err) {
          currentSource = null;
          reject(err);
        }
      }

      playNext();
    });
  });
}

/**
 * Stop any currently playing audio immediately.
 */
export function cancelAudioPlayback(): void {
  cancelRequested = true;
  if (currentSource) {
    try {
      currentSource.stop();
    } catch {
      // already stopped
    }
    currentSource = null;
  }
}

/**
 * Initialize AudioContext from a user gesture (unlocks autoplay).
 */
export function initAudioContext(): void {
  try {
    const ctx = getOrCreateContext();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  } catch {
    // Web Audio API not available
  }
}
