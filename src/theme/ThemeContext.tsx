import { useState, useEffect, useCallback, type ReactNode } from 'react';
import type { ThemeMode } from './themeContextValue';
import { ThemeContext } from './themeContextValue';
import type { AccentColor, BackgroundImage } from '../domain/types';

const THEME_KEY = 'poker-timer-theme';
const ACCENT_KEY = 'poker-timer-accent';
const BG_KEY = 'poker-timer-bg';

/** CSS color values for each accent color */
const ACCENT_COLORS: Record<AccentColor, Record<string, string>> = {
  emerald: { '--accent-500': '#10b981', '--accent-600': '#059669', '--accent-400': '#34d399', '--accent-ring': 'rgba(16,185,129,0.25)', '--accent-glow': 'rgba(16,185,129,0.15)', '--accent-glow-strong': 'rgba(16,185,129,0.3)' },
  blue:    { '--accent-500': '#3b82f6', '--accent-600': '#2563eb', '--accent-400': '#60a5fa', '--accent-ring': 'rgba(59,130,246,0.25)', '--accent-glow': 'rgba(59,130,246,0.15)', '--accent-glow-strong': 'rgba(59,130,246,0.3)' },
  purple:  { '--accent-500': '#8b5cf6', '--accent-600': '#7c3aed', '--accent-400': '#a78bfa', '--accent-ring': 'rgba(139,92,246,0.25)', '--accent-glow': 'rgba(139,92,246,0.15)', '--accent-glow-strong': 'rgba(139,92,246,0.3)' },
  red:     { '--accent-500': '#ef4444', '--accent-600': '#dc2626', '--accent-400': '#f87171', '--accent-ring': 'rgba(239,68,68,0.25)', '--accent-glow': 'rgba(239,68,68,0.15)', '--accent-glow-strong': 'rgba(239,68,68,0.3)' },
  amber:   { '--accent-500': '#f59e0b', '--accent-600': '#d97706', '--accent-400': '#fbbf24', '--accent-ring': 'rgba(245,158,11,0.25)', '--accent-glow': 'rgba(245,158,11,0.15)', '--accent-glow-strong': 'rgba(245,158,11,0.3)' },
  cyan:    { '--accent-500': '#06b6d4', '--accent-600': '#0891b2', '--accent-400': '#22d3ee', '--accent-ring': 'rgba(6,182,212,0.25)', '--accent-glow': 'rgba(6,182,212,0.15)', '--accent-glow-strong': 'rgba(6,182,212,0.3)' },
};

function applyAccentColor(accent: AccentColor) {
  const root = document.documentElement;
  const colors = ACCENT_COLORS[accent] ?? ACCENT_COLORS.emerald;
  for (const [key, value] of Object.entries(colors)) {
    root.style.setProperty(key, value);
  }
}

/** CSS background patterns for each background image option */
const BG_PATTERNS: Record<BackgroundImage, { light: string; dark: string }> = {
  none: { light: '', dark: '' },
  'felt-green': {
    light: 'radial-gradient(ellipse at 50% 50%, rgba(22,163,74,0.12) 0%, rgba(22,163,74,0.04) 50%, transparent 80%)',
    dark:  'radial-gradient(ellipse at 50% 50%, rgba(22,163,74,0.18) 0%, rgba(22,163,74,0.06) 50%, transparent 80%)',
  },
  'felt-blue': {
    light: 'radial-gradient(ellipse at 50% 50%, rgba(37,99,235,0.10) 0%, rgba(37,99,235,0.04) 50%, transparent 80%)',
    dark:  'radial-gradient(ellipse at 50% 50%, rgba(37,99,235,0.16) 0%, rgba(37,99,235,0.06) 50%, transparent 80%)',
  },
  casino: {
    light: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.015) 0px, rgba(0,0,0,0.015) 2px, transparent 2px, transparent 12px), radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.08) 0%, transparent 60%)',
    dark:  'repeating-linear-gradient(45deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 2px, transparent 2px, transparent 12px), radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.1) 0%, transparent 60%)',
  },
  'dark-wood': {
    light: 'repeating-linear-gradient(90deg, rgba(120,80,40,0.04) 0px, transparent 1px, transparent 6px, rgba(120,80,40,0.04) 7px), linear-gradient(180deg, rgba(120,80,40,0.06) 0%, rgba(80,50,20,0.04) 100%)',
    dark:  'repeating-linear-gradient(90deg, rgba(180,130,70,0.04) 0px, transparent 1px, transparent 6px, rgba(180,130,70,0.04) 7px), linear-gradient(180deg, rgba(100,60,30,0.08) 0%, rgba(60,30,10,0.06) 100%)',
  },
  abstract: {
    light: 'radial-gradient(circle at 20% 30%, rgba(139,92,246,0.06) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(6,182,212,0.06) 0%, transparent 40%)',
    dark:  'radial-gradient(circle at 20% 30%, rgba(139,92,246,0.1) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(6,182,212,0.08) 0%, transparent 40%)',
  },
};

function applyBackgroundImage(bg: BackgroundImage, resolved: 'light' | 'dark') {
  const root = document.documentElement;
  const pattern = BG_PATTERNS[bg] ?? BG_PATTERNS.none;
  const value = resolved === 'dark' ? pattern.dark : pattern.light;
  root.style.setProperty('--bg-pattern', value || 'none');
}

function getSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    } catch {
      // localStorage unavailable
    }
    return 'dark';
  });

  const [systemPref, setSystemPref] = useState<'light' | 'dark'>(getSystemPreference);

  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    try {
      const stored = localStorage.getItem(ACCENT_KEY) as AccentColor | null;
      if (stored && stored in ACCENT_COLORS) return stored;
    } catch { /* ignore */ }
    return 'emerald';
  });

  const [backgroundImage, setBackgroundImageState] = useState<BackgroundImage>(() => {
    try {
      const stored = localStorage.getItem(BG_KEY) as BackgroundImage | null;
      if (stored && stored in BG_PATTERNS) return stored;
    } catch { /* ignore */ }
    return 'none';
  });

  const resolved = mode === 'system' ? systemPref : mode;

  // Listen for system preference changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPref(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Apply dark class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (resolved === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [resolved]);

  // Update PWA theme-color meta tag
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', resolved === 'dark' ? '#111827' : '#ffffff');
    }
  }, [resolved]);

  // Apply accent color CSS custom properties
  useEffect(() => {
    applyAccentColor(accentColor);
  }, [accentColor]);

  // Apply background image pattern
  useEffect(() => {
    applyBackgroundImage(backgroundImage, resolved);
  }, [backgroundImage, resolved]);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    try {
      localStorage.setItem(THEME_KEY, m);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const setAccentColor = useCallback((c: AccentColor) => {
    setAccentColorState(c);
    try {
      localStorage.setItem(ACCENT_KEY, c);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const setBackgroundImage = useCallback((bg: BackgroundImage) => {
    setBackgroundImageState(bg);
    try {
      localStorage.setItem(BG_KEY, bg);
    } catch {
      // localStorage unavailable
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, setMode, resolved, accentColor, setAccentColor, backgroundImage, setBackgroundImage }}>
      {children}
    </ThemeContext.Provider>
  );
}
