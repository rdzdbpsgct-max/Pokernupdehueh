import type { TournamentConfig } from './types';
import { parseConfigObject } from './configPersistence';
import { getCached, setCachedItem, deleteCachedItem } from './storage';

// ---------------------------------------------------------------------------
// Tournament Templates (backed by IndexedDB cache layer)
// ---------------------------------------------------------------------------

export interface TournamentTemplate {
  id: string;
  name: string;
  createdAt: string;
  config: TournamentConfig;
}

/** Load all tournament templates from storage cache. */
export function loadTemplates(): TournamentTemplate[] {
  return getCached('templates');
}

/** Save a new tournament template. Returns the created template. */
export function saveTemplate(name: string, config: TournamentConfig): TournamentTemplate {
  const template: TournamentTemplate = {
    id: `tmpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    createdAt: new Date().toISOString(),
    config,
  };
  setCachedItem('templates', template);
  return template;
}

/** Delete a tournament template by id. */
export function deleteTemplate(id: string): void {
  deleteCachedItem('templates', id);
}

/**
 * Serialize a tournament config to JSON for file export.
 */
export function exportTemplateToJSON(name: string, config: TournamentConfig): string {
  return JSON.stringify({ name, createdAt: new Date().toISOString(), config }, null, 2);
}

/**
 * Parse a JSON string from a template file.
 * Accepts two formats:
 * 1. Template format: { name, config: { levels, ... } }
 * 2. Direct config format: { name, levels: [...], ... }
 * Returns the parsed name + config, or null if invalid.
 */
export function parseTemplateFile(json: string): { name: string; config: TournamentConfig } | null {
  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object') return null;

    // Template format: { name, config: { ... } }
    if (
      parsed.config &&
      typeof parsed.config === 'object' &&
      Array.isArray((parsed.config as Record<string, unknown>).levels)
    ) {
      const config = parseConfigObject(parsed.config as Record<string, unknown>);
      if (!config) return null;
      const name = typeof parsed.name === 'string' ? parsed.name : config.name;
      return { name, config };
    }

    // Direct config format: { name, levels: [...], ... }
    if (Array.isArray(parsed.levels)) {
      const config = parseConfigObject(parsed as Record<string, unknown>);
      if (!config) return null;
      return { name: config.name, config };
    }

    return null;
  } catch {
    return null;
  }
}
