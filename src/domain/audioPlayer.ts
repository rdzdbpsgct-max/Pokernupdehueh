// MP3 audio playback engine — sequential file playback for pre-recorded announcements

let currentAudio: HTMLAudioElement | null = null;

function getBasePath(): string {
  // import.meta.env.BASE_URL always ends with '/'
  return `${import.meta.env.BASE_URL}audio/de/`;
}

/**
 * Play a sequence of MP3 files one after another.
 * Preloads all files upfront to minimize gaps between sequential playback.
 * Resolves when all files have finished. Rejects on the first error.
 */
export function playAudioSequence(files: string[]): Promise<void> {
  if (files.length === 0) return Promise.resolve();
  if (typeof window === 'undefined' || typeof Audio === 'undefined') {
    return Promise.reject(new Error('Audio not available'));
  }

  const basePath = getBasePath();

  // Preload all audio elements upfront — reduces gaps between sequential files
  const audioElements = files.map((file) => {
    const audio = new Audio(basePath + file);
    audio.preload = 'auto';
    return audio;
  });

  return new Promise<void>((resolve, reject) => {
    let index = 0;

    function playNext(): void {
      if (index >= audioElements.length) {
        currentAudio = null;
        resolve();
        return;
      }

      const audio = audioElements[index];
      currentAudio = audio;

      audio.onended = () => {
        index++;
        playNext();
      };

      audio.onerror = () => {
        currentAudio = null;
        reject(new Error(`Failed to play: ${files[index]}`));
      };

      audio.play().catch((err) => {
        currentAudio = null;
        reject(err);
      });
    }

    playNext();
  });
}

/**
 * Stop any currently playing audio immediately.
 */
export function cancelAudioPlayback(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}
