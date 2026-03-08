import { useState, useEffect, useCallback, type ReactNode } from 'react';
import type { ThemeMode } from './themeContextValue';
import { ThemeContext } from './themeContextValue';
import type { BackgroundImage } from '../domain/types';

const THEME_KEY = 'poker-timer-theme';
const BG_KEY = 'poker-timer-bg';

/** CSS background patterns for each background image option — 2-3x stronger than v5.0 */
const BG_PATTERNS: Record<BackgroundImage, { light: string; dark: string }> = {
  none: { light: '', dark: '' },
  'felt-green': {
    light: 'radial-gradient(ellipse at 50% 50%, rgba(22,163,74,0.25) 0%, rgba(22,163,74,0.10) 50%, transparent 80%)',
    dark:  'radial-gradient(ellipse at 50% 50%, rgba(22,163,74,0.35) 0%, rgba(22,163,74,0.12) 50%, transparent 80%)',
  },
  'felt-blue': {
    light: 'radial-gradient(ellipse at 50% 50%, rgba(37,99,235,0.20) 0%, rgba(37,99,235,0.08) 50%, transparent 80%)',
    dark:  'radial-gradient(ellipse at 50% 50%, rgba(37,99,235,0.30) 0%, rgba(37,99,235,0.12) 50%, transparent 80%)',
  },
  'felt-red': {
    light: 'radial-gradient(ellipse at 50% 50%, rgba(185,28,28,0.18) 0%, rgba(185,28,28,0.06) 50%, transparent 80%)',
    dark:  'radial-gradient(ellipse at 50% 50%, rgba(185,28,28,0.30) 0%, rgba(185,28,28,0.10) 50%, transparent 80%)',
  },
  casino: {
    light: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.025) 0px, rgba(0,0,0,0.025) 2px, transparent 2px, transparent 12px), radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.15) 0%, transparent 60%)',
    dark:  'repeating-linear-gradient(45deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 2px, transparent 2px, transparent 12px), radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.20) 0%, transparent 60%)',
  },
  'dark-wood': {
    light: 'repeating-linear-gradient(90deg, rgba(120,80,40,0.08) 0px, transparent 1px, transparent 6px, rgba(120,80,40,0.08) 7px), linear-gradient(180deg, rgba(120,80,40,0.12) 0%, rgba(80,50,20,0.08) 100%)',
    dark:  'repeating-linear-gradient(90deg, rgba(180,130,70,0.08) 0px, transparent 1px, transparent 6px, rgba(180,130,70,0.08) 7px), linear-gradient(180deg, rgba(100,60,30,0.16) 0%, rgba(60,30,10,0.12) 100%)',
  },
  abstract: {
    light: 'radial-gradient(circle at 20% 30%, rgba(139,92,246,0.12) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(6,182,212,0.12) 0%, transparent 40%)',
    dark:  'radial-gradient(circle at 20% 30%, rgba(139,92,246,0.20) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(6,182,212,0.16) 0%, transparent 40%)',
  },
  midnight: {
    light: 'radial-gradient(ellipse at 50% 0%, rgba(30,58,138,0.15) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, rgba(88,28,135,0.10) 0%, transparent 50%)',
    dark:  'radial-gradient(ellipse at 50% 0%, rgba(30,58,138,0.30) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, rgba(88,28,135,0.20) 0%, transparent 50%)',
  },
  sunset: {
    light: 'radial-gradient(ellipse at 30% 80%, rgba(245,158,11,0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 20%, rgba(239,68,68,0.10) 0%, transparent 50%)',
    dark:  'radial-gradient(ellipse at 30% 80%, rgba(245,158,11,0.22) 0%, transparent 50%), radial-gradient(ellipse at 70% 20%, rgba(239,68,68,0.18) 0%, transparent 50%)',
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

  const setBackgroundImage = useCallback((bg: BackgroundImage) => {
    setBackgroundImageState(bg);
    try {
      localStorage.setItem(BG_KEY, bg);
    } catch {
      // localStorage unavailable
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, setMode, resolved, backgroundImage, setBackgroundImage }}>
      {children}
    </ThemeContext.Provider>
  );
}
