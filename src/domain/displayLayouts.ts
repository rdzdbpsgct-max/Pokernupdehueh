import type { DisplayLayout } from './types';

export interface LayoutConfig {
  timerFlex: number;
  secondaryFlex: number;
  showSecondary: boolean;
  showTicker: boolean;
  /** Font scale multiplier for timer countdown (1 = standard). */
  timerFontScale: number;
  /** Font scale multiplier for blinds text (1 = standard). */
  blindsFontScale: number;
  /** Whether to show the next-level hint below progress bar. */
  showNextLevel: boolean;
  /** Whether to show the bottom rotation hint bar. */
  showRotationHint: boolean;
}

const STANDARD: LayoutConfig = {
  timerFlex: 55,
  secondaryFlex: 45,
  showSecondary: true,
  showTicker: true,
  timerFontScale: 1,
  blindsFontScale: 1,
  showNextLevel: true,
  showRotationHint: true,
};

const COMPACT: LayoutConfig = {
  timerFlex: 40,
  secondaryFlex: 60,
  showSecondary: true,
  showTicker: true,
  timerFontScale: 0.75,
  blindsFontScale: 0.75,
  showNextLevel: true,
  showRotationHint: true,
};

const TIMER_ONLY: LayoutConfig = {
  timerFlex: 100,
  secondaryFlex: 0,
  showSecondary: false,
  showTicker: false,
  timerFontScale: 1.5,
  blindsFontScale: 1.3,
  showNextLevel: true,
  showRotationHint: false,
};

const ULTRA_LARGE: LayoutConfig = {
  timerFlex: 70,
  secondaryFlex: 30,
  showSecondary: true,
  showTicker: true,
  timerFontScale: 1.25,
  blindsFontScale: 1.15,
  showNextLevel: false,
  showRotationHint: true,
};

const LAYOUT_MAP: Record<DisplayLayout, LayoutConfig> = {
  standard: STANDARD,
  compact: COMPACT,
  'timer-only': TIMER_ONLY,
  'ultra-large': ULTRA_LARGE,
};

export function getLayoutConfig(layout: DisplayLayout | undefined): LayoutConfig {
  return LAYOUT_MAP[layout ?? 'standard'];
}

export interface DisplayLayoutOption {
  id: DisplayLayout;
  labelKey: string;
  descKey: string;
}

export const DISPLAY_LAYOUTS: DisplayLayoutOption[] = [
  { id: 'standard', labelKey: 'display.layout.standard', descKey: 'display.layout.standardDesc' },
  { id: 'compact', labelKey: 'display.layout.compact', descKey: 'display.layout.compactDesc' },
  { id: 'timer-only', labelKey: 'display.layout.timerOnly', descKey: 'display.layout.timerOnlyDesc' },
  { id: 'ultra-large', labelKey: 'display.layout.ultraLarge', descKey: 'display.layout.ultraLargeDesc' },
];
