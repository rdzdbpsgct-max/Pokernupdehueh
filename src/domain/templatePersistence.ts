import type { TournamentConfig } from './types';
import { parseConfigObject } from './configPersistence';

// ---------------------------------------------------------------------------
// Tournament Templates
// ---------------------------------------------------------------------------

export interface TournamentTemplate {
  id: string;
  name: string;
  createdAt: string;
  config: TournamentConfig;
}

const TEMPLATES_KEY = 'poker-timer-templates';

export function loadTemplates(): TournamentTemplate[] {
  const raw = localStorage.getItem(TEMPLATES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t: unknown) => {
        if (t === null || typeof t !== 'object') return false;
        const rec = t as Record<string, unknown>;
        if (typeof rec.id !== 'string' || typeof rec.name !== 'string') return false;
        // Validate nested config if present
        if (rec.config !== undefined && typeof rec.config === 'object' && rec.config !== null) {
          const validated = parseConfigObject(rec.config as Record<string, unknown>);
          if (!validated) {
            console.warn(`[persistence] Template "${rec.name}" has invalid config, skipping`);
            return false;
          }
        }
        return true;
      },
    ) as TournamentTemplate[];
  } catch {
    return [];
  }
}

export function saveTemplate(name: string, config: TournamentConfig): TournamentTemplate {
  const templates = loadTemplates();
  const template: TournamentTemplate = {
    id: `tmpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    createdAt: new Date().toISOString(),
    config,
  };
  templates.push(template);
  try {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  } catch {
    // localStorage unavailable
  }
  return template;
}

export function deleteTemplate(id: string): void {
  const templates = loadTemplates().filter((t) => t.id !== id);
  try {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  } catch {
    // localStorage unavailable
  }
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
