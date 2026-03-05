// MP3 audio playback engine — Web Audio API for gapless sequential playback

let audioContext: AudioContext | null = null;
let scheduledSources: AudioBufferSourceNode[] = [];
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
 * Trim trailing silence from an AudioBuffer.
 * Scans backwards from the end to find the last sample above the threshold,
 * then returns a new buffer trimmed to that point (+ small fade-out pad).
 */
function trimTrailingSilence(ctx: AudioContext, buffer: AudioBuffer): AudioBuffer {
  const threshold = 0.01;
  const fadeSamples = 128; // ~3ms fade-out to avoid clicks
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;

  // Find last non-silent sample across all channels
  let lastSample = 0;
  for (let ch = 0; ch < channels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = data.length - 1; i >= 0; i--) {
      if (Math.abs(data[i]) > threshold) {
        if (i > lastSample) lastSample = i;
        break;
      }
    }
  }

  // Add fade-out padding, but don't exceed original length
  const trimmedLength = Math.min(lastSample + fadeSamples, buffer.length);

  // Only trim if we save at least 5% of the buffer
  if (trimmedLength > buffer.length * 0.95) return buffer;

  const trimmed = ctx.createBuffer(channels, trimmedLength, sampleRate);
  for (let ch = 0; ch < channels; ch++) {
    const src = buffer.getChannelData(ch);
    const dst = trimmed.getChannelData(ch);
    // Copy data up to lastSample
    for (let i = 0; i < Math.min(lastSample + 1, trimmedLength); i++) {
      dst[i] = src[i];
    }
    // Fade out the padding region
    for (let i = lastSample + 1; i < trimmedLength; i++) {
      const fadePos = (i - lastSample) / fadeSamples;
      dst[i] = src[i] * (1 - fadePos);
    }
  }

  return trimmed;
}

/**
 * Play a sequence of MP3 files using Web Audio API with precise scheduling.
 * Decodes all files, trims trailing silence, then schedules back-to-back.
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
  }).then((rawBuffers) => {
    if (cancelRequested) return;

    // Trim trailing silence from each buffer
    const buffers = rawBuffers.map((buf) => trimTrailingSilence(ctx, buf));

    // Schedule all buffers back-to-back with precise timing
    return new Promise<void>((resolve) => {
      scheduledSources = [];
      let startTime = ctx.currentTime;

      for (let i = 0; i < buffers.length; i++) {
        const source = ctx.createBufferSource();
        source.buffer = buffers[i];
        source.connect(ctx.destination);
        scheduledSources.push(source);

        source.start(startTime);
        startTime += buffers[i].duration;
      }

      // Resolve when the last buffer finishes
      const lastSource = scheduledSources[scheduledSources.length - 1];
      lastSource.onended = () => {
        scheduledSources = [];
        resolve();
      };
    });
  });
}

/**
 * Stop any currently playing audio immediately.
 */
export function cancelAudioPlayback(): void {
  cancelRequested = true;
  for (const source of scheduledSources) {
    try {
      source.stop();
    } catch {
      // already stopped
    }
  }
  scheduledSources = [];
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
