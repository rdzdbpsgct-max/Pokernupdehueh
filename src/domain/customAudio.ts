import type { CustomAudioFile, CustomAudioMapping } from './types';
import { generateId } from './helpers';
import { getCached, setCachedItem, deleteCachedItem } from './storage';

// ---------------------------------------------------------------------------
// Well-known announcement keys that can be customized
// ---------------------------------------------------------------------------

export const CUSTOMIZABLE_ANNOUNCEMENTS = [
  'shuffle-up',
  'level-change',
  'break-start',
  'break-warning',
  'break-over',
  'five-minutes',
  'bubble',
  'itm',
  'elimination',
  'heads-up',
  'winner',
  'rebuy-taken',
  'rebuy-ended',
  'addon',
  'color-up',
  'color-up-warning',
  'call-the-clock',
  'call-the-clock-expired',
  'late-reg-closed',
  'hand-for-hand',
  'table-move',
  'table-dissolved',
  'final-table',
  'timer-paused',
  'timer-resumed',
  'last-hand',
] as const;

export type AnnouncementKey = typeof CUSTOMIZABLE_ANNOUNCEMENTS[number];

// ---------------------------------------------------------------------------
// Audio File CRUD
// ---------------------------------------------------------------------------

export function loadCustomAudioFiles(): CustomAudioFile[] {
  return getCached('customAudio');
}

export async function saveCustomAudioFile(file: File): Promise<CustomAudioFile> {
  const data = await file.arrayBuffer();
  const audioFile: CustomAudioFile = {
    id: generateId(),
    name: file.name.replace(/\.[^.]+$/, ''),
    mimeType: file.type || 'audio/mpeg',
    sizeBytes: data.byteLength,
    data,
    createdAt: new Date().toISOString(),
  };
  setCachedItem('customAudio', audioFile);
  return audioFile;
}

export function deleteCustomAudioFile(id: string): void {
  // Also remove any mappings that reference this file
  const mappings = getCached('audioMappings');
  for (const mapping of mappings) {
    if (mapping.audioFileId === id) {
      deleteCachedItem('audioMappings', mapping.id);
    }
  }
  deleteCachedItem('customAudio', id);
}

// ---------------------------------------------------------------------------
// Audio Mapping CRUD
// ---------------------------------------------------------------------------

export function loadAudioMappings(): CustomAudioMapping[] {
  return getCached('audioMappings');
}

export function setAudioMapping(
  announcementKey: string,
  audioFileId: string,
  language: 'de' | 'en' | 'all' = 'all',
): CustomAudioMapping {
  // Remove existing mapping for this key+language
  const existing = getCached('audioMappings');
  for (const m of existing) {
    if (m.announcementKey === announcementKey && m.language === language) {
      deleteCachedItem('audioMappings', m.id);
    }
  }

  const mapping: CustomAudioMapping = {
    id: generateId(),
    announcementKey,
    audioFileId,
    language,
  };
  setCachedItem('audioMappings', mapping);
  return mapping;
}

export function removeAudioMapping(announcementKey: string, language: 'de' | 'en' | 'all' = 'all'): void {
  const existing = getCached('audioMappings');
  for (const m of existing) {
    if (m.announcementKey === announcementKey && m.language === language) {
      deleteCachedItem('audioMappings', m.id);
    }
  }
}

/**
 * Get the custom audio file for an announcement key, if mapped.
 * Returns the CustomAudioFile, or null if no mapping exists.
 */
export function getCustomAudioForAnnouncement(
  announcementKey: string,
  language: string,
): CustomAudioFile | null {
  const mappings = getCached('audioMappings');

  // Try language-specific first, then 'all'
  const mapping = mappings.find(
    m => m.announcementKey === announcementKey && m.language === language,
  ) ?? mappings.find(
    m => m.announcementKey === announcementKey && m.language === 'all',
  );

  if (!mapping) return null;

  const files = getCached('customAudio');
  return files.find(f => f.id === mapping.audioFileId) ?? null;
}

/**
 * Format file size for display (KB/MB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
