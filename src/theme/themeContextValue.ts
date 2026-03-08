import { createContext } from 'react';
import type { BackgroundImage } from '../domain/types';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolved: 'light' | 'dark';
  backgroundImage: BackgroundImage;
  setBackgroundImage: (bg: BackgroundImage) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
