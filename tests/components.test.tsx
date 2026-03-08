import { render, screen, fireEvent, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { LanguageProvider } from '../src/i18n';
import { ThemeProvider } from '../src/theme';
import { NumberStepper } from '../src/components/NumberStepper';
import { CollapsibleSection } from '../src/components/CollapsibleSection';
import { CollapsibleSubSection } from '../src/components/CollapsibleSubSection';
import { PrintView } from '../src/components/PrintView';
import { CallTheClock } from '../src/components/CallTheClock';
import { BubbleIndicator } from '../src/components/BubbleIndicator';
import { RebuyStatus } from '../src/components/RebuyStatus';
import { ChevronIcon } from '../src/components/ChevronIcon';
import { LanguageSwitcher } from '../src/components/LanguageSwitcher';
import { ThemeSwitcher } from '../src/components/ThemeSwitcher';
import { ErrorBoundary, SectionErrorBoundary } from '../src/components/ErrorBoundary';
import { useTimer } from '../src/hooks/useTimer';
import { useConfirmDialog } from '../src/hooks/useConfirmDialog';
import type { TournamentConfig, TournamentResult, Level, Settings, RebuyConfig } from '../src/domain/types';
import { defaultConfig } from '../src/domain/logic';

// ---------------------------------------------------------------------------
// Test wrapper — provides i18n + theme contexts
// ---------------------------------------------------------------------------

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </ThemeProvider>
  );
}

function renderWithProviders(ui: ReactNode) {
  return render(ui, { wrapper: Wrapper });
}

// ===================== NumberStepper =====================

describe('NumberStepper', () => {
  it('renders value and +/- buttons', () => {
    const onChange = vi.fn();
    render(<NumberStepper value={10} onChange={onChange} min={0} max={100} />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveValue(10);
    expect(screen.getByText('+')).toBeInTheDocument();
    expect(screen.getByText('−')).toBeInTheDocument();
  });

  it('increments on + click', () => {
    const onChange = vi.fn();
    render(<NumberStepper value={5} onChange={onChange} min={0} max={10} step={1} />);
    fireEvent.pointerDown(screen.getByText('+'));
    fireEvent.pointerUp(screen.getByText('+'));
    expect(onChange).toHaveBeenCalledWith(6);
  });

  it('decrements on − click', () => {
    const onChange = vi.fn();
    render(<NumberStepper value={5} onChange={onChange} min={0} max={10} step={1} />);
    fireEvent.pointerDown(screen.getByText('−'));
    fireEvent.pointerUp(screen.getByText('−'));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('respects min boundary', () => {
    const onChange = vi.fn();
    render(<NumberStepper value={0} onChange={onChange} min={0} max={10} step={1} />);
    fireEvent.pointerDown(screen.getByText('−'));
    fireEvent.pointerUp(screen.getByText('−'));
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('respects max boundary', () => {
    const onChange = vi.fn();
    render(<NumberStepper value={10} onChange={onChange} min={0} max={10} step={1} />);
    fireEvent.pointerDown(screen.getByText('+'));
    fireEvent.pointerUp(screen.getByText('+'));
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it('uses custom step', () => {
    const onChange = vi.fn();
    render(<NumberStepper value={10} onChange={onChange} min={0} max={100} step={5} />);
    fireEvent.pointerDown(screen.getByText('+'));
    fireEvent.pointerUp(screen.getByText('+'));
    expect(onChange).toHaveBeenCalledWith(15);
  });
});

// ===================== CollapsibleSection =====================

describe('CollapsibleSection', () => {
  it('renders title and shows children when open', () => {
    renderWithProviders(
      <CollapsibleSection title="Test Section" defaultOpen>
        <div data-testid="child">Child Content</div>
      </CollapsibleSection>,
    );
    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('hides children when collapsed', () => {
    renderWithProviders(
      <CollapsibleSection title="Test Section" defaultOpen={false}>
        <div data-testid="child">Child Content</div>
      </CollapsibleSection>,
    );
    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  it('toggles on header click', () => {
    renderWithProviders(
      <CollapsibleSection title="Toggle Me" defaultOpen={false}>
        <div data-testid="child">Content</div>
      </CollapsibleSection>,
    );
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Toggle Me'));
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('displays summary when provided', () => {
    renderWithProviders(
      <CollapsibleSection title="Section" summary="Summary info" defaultOpen={false}>
        <div>Content</div>
      </CollapsibleSection>,
    );
    expect(screen.getByText('Summary info')).toBeInTheDocument();
  });
});

// ===================== PrintView =====================

describe('PrintView', () => {
  it('renders blind structure table', () => {
    const config = defaultConfig();
    renderWithProviders(<PrintView config={config} />);
    // Should render column headers
    expect(screen.getByText('SB')).toBeInTheDocument();
    expect(screen.getByText('BB')).toBeInTheDocument();
  });

  it('renders tournament results when provided', () => {
    const config = defaultConfig();
    const result: TournamentResult = {
      id: 'test-1',
      tournamentName: 'Test Tournament',
      date: new Date().toISOString(),
      playerCount: 4,
      prizePool: 40,
      totalRebuys: 0,
      totalAddOns: 0,
      totalBuyIns: 4,
      totalBountyPool: 0,
      levelCount: 3,
      players: [
        { name: 'Alice', place: 1, payout: 28, rebuys: 0, addOn: false, knockouts: 1, netBalance: 18 },
        { name: 'Bob', place: 2, payout: 12, rebuys: 0, addOn: false, knockouts: 0, netBalance: 2 },
        { name: 'Charlie', place: 3, payout: 0, rebuys: 0, addOn: false, knockouts: 0, netBalance: -10 },
        { name: 'Diana', place: 4, payout: 0, rebuys: 0, addOn: false, knockouts: 0, netBalance: -10 },
      ],
    };
    renderWithProviders(<PrintView config={config} result={result} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    // First place should have rank number
    expect(screen.getByText('1.')).toBeInTheDocument();
    expect(screen.getByText('2.')).toBeInTheDocument();
  });

  it('renders chip denominations when enabled', () => {
    const config: TournamentConfig = {
      ...defaultConfig(),
      chips: {
        enabled: true,
        denominations: [
          { id: '1', value: 25, color: '#ff0000', label: 'Red' },
          { id: '2', value: 100, color: '#0000ff', label: 'Blue' },
        ],
        colorUpEnabled: false,
        colorUpSchedule: [],
      },
    };
    renderWithProviders(<PrintView config={config} />);
    expect(screen.getByText('Red')).toBeInTheDocument();
    expect(screen.getByText('Blue')).toBeInTheDocument();
  });

  it('renders payout entries when configured', () => {
    const config: TournamentConfig = {
      ...defaultConfig(),
      payout: {
        mode: 'percent',
        entries: [
          { place: 1, value: 60 },
          { place: 2, value: 30 },
          { place: 3, value: 10 },
        ],
      },
    };
    renderWithProviders(<PrintView config={config} />);
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
  });
});

// ===================== useTimer Hook =====================

const testLevels: Level[] = [
  { id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50 },
  { id: '2', type: 'level', durationSeconds: 600, smallBlind: 50, bigBlind: 100 },
  { id: '3', type: 'break', durationSeconds: 300 },
];

const testSettings: Settings = {
  soundEnabled: false,
  voiceEnabled: false,
  countdownEnabled: false,
  autoAdvance: false,
  volume: 100,
  callTheClockSeconds: 60,
  accentColor: 'emerald',
  backgroundImage: 'none',
};

describe('useTimer hook', () => {
  it('initializes with first level and stopped status', () => {
    const { result } = renderHook(() => useTimer(testLevels, testSettings));
    expect(result.current.timerState.currentLevelIndex).toBe(0);
    expect(result.current.timerState.remainingSeconds).toBe(600);
    expect(result.current.timerState.status).toBe('stopped');
  });

  it('start() transitions to running', () => {
    const { result } = renderHook(() => useTimer(testLevels, testSettings));
    act(() => { result.current.start(); });
    expect(result.current.timerState.status).toBe('running');
    expect(result.current.timerState.startedAt).not.toBeNull();
  });

  it('pause() transitions to paused', () => {
    const { result } = renderHook(() => useTimer(testLevels, testSettings));
    act(() => { result.current.start(); });
    act(() => { result.current.pause(); });
    expect(result.current.timerState.status).toBe('paused');
    expect(result.current.timerState.startedAt).toBeNull();
  });

  it('toggleStartPause() toggles between running and paused', () => {
    const { result } = renderHook(() => useTimer(testLevels, testSettings));
    act(() => { result.current.toggleStartPause(); });
    expect(result.current.timerState.status).toBe('running');
    act(() => { result.current.toggleStartPause(); });
    expect(result.current.timerState.status).toBe('paused');
  });

  it('nextLevel() advances to next level and starts running', () => {
    const { result } = renderHook(() => useTimer(testLevels, testSettings));
    act(() => { result.current.nextLevel(); });
    expect(result.current.timerState.currentLevelIndex).toBe(1);
    expect(result.current.timerState.remainingSeconds).toBe(600);
    expect(result.current.timerState.status).toBe('running');
  });

  it('previousLevel() goes back to previous level', () => {
    const { result } = renderHook(() => useTimer(testLevels, testSettings));
    act(() => { result.current.nextLevel(); });
    expect(result.current.timerState.currentLevelIndex).toBe(1);
    act(() => { result.current.previousLevel(); });
    expect(result.current.timerState.currentLevelIndex).toBe(0);
  });

  it('resetLevel() resets remaining to full duration', () => {
    const { result } = renderHook(() => useTimer(testLevels, testSettings));
    act(() => { result.current.start(); });
    act(() => { result.current.pause(); });
    act(() => { result.current.resetLevel(); });
    expect(result.current.timerState.remainingSeconds).toBe(600);
    expect(result.current.timerState.status).toBe('stopped');
  });

  it('restart() resets to level 0', () => {
    const { result } = renderHook(() => useTimer(testLevels, testSettings));
    act(() => { result.current.nextLevel(); });
    act(() => { result.current.nextLevel(); });
    expect(result.current.timerState.currentLevelIndex).toBe(2);
    act(() => { result.current.restart(); });
    expect(result.current.timerState.currentLevelIndex).toBe(0);
    expect(result.current.timerState.status).toBe('stopped');
  });

  it('setRemainingSeconds() clamps to level duration and pauses', () => {
    const { result } = renderHook(() => useTimer(testLevels, testSettings));
    act(() => { result.current.start(); });
    act(() => { result.current.setRemainingSeconds(300); });
    expect(result.current.timerState.remainingSeconds).toBe(300);
    expect(result.current.timerState.status).toBe('paused');
  });

  it('setRemainingSeconds() clamps above level duration', () => {
    const { result } = renderHook(() => useTimer(testLevels, testSettings));
    act(() => { result.current.setRemainingSeconds(9999); });
    expect(result.current.timerState.remainingSeconds).toBe(600);
  });

  it('restoreLevel() restores specific level and remaining', () => {
    const { result } = renderHook(() => useTimer(testLevels, testSettings));
    act(() => { result.current.restoreLevel(1, 450); });
    expect(result.current.timerState.currentLevelIndex).toBe(1);
    expect(result.current.timerState.remainingSeconds).toBe(450);
    expect(result.current.timerState.status).toBe('paused');
  });

  it('restoreLevel() clamps level index to valid range', () => {
    const { result } = renderHook(() => useTimer(testLevels, testSettings));
    act(() => { result.current.restoreLevel(99, 100); });
    expect(result.current.timerState.currentLevelIndex).toBe(2); // clamped to last
  });

  it('does not start when remainingSeconds is 0', () => {
    const { result } = renderHook(() => useTimer(testLevels, testSettings));
    act(() => { result.current.setRemainingSeconds(0); });
    act(() => { result.current.toggleStartPause(); });
    expect(result.current.timerState.status).toBe('paused'); // stays paused
  });
});

// ===================== CallTheClock =====================

describe('CallTheClock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders countdown display and close button', () => {
    const onClose = vi.fn();
    renderWithProviders(
      <CallTheClock durationSeconds={60} soundEnabled={false} voiceEnabled={false} onClose={onClose} />,
    );
    expect(screen.getByText('60')).toBeInTheDocument();
    // Title "Call the Clock" should be visible
    expect(screen.getByText('Call the Clock')).toBeInTheDocument();
  });

  it('closes on Escape key', () => {
    const onClose = vi.fn();
    renderWithProviders(
      <CallTheClock durationSeconds={60} soundEnabled={false} voiceEnabled={false} onClose={onClose} />,
    );
    fireEvent.keyDown(window, { code: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on C key', () => {
    const onClose = vi.fn();
    renderWithProviders(
      <CallTheClock durationSeconds={60} soundEnabled={false} voiceEnabled={false} onClose={onClose} />,
    );
    fireEvent.keyDown(window, { code: 'KeyC' });
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on dismiss button click', () => {
    const onClose = vi.fn();
    renderWithProviders(
      <CallTheClock durationSeconds={60} soundEnabled={false} voiceEnabled={false} onClose={onClose} />,
    );
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]); // dismiss button
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on backdrop click', () => {
    const onClose = vi.fn();
    const { container } = renderWithProviders(
      <CallTheClock durationSeconds={60} soundEnabled={false} voiceEnabled={false} onClose={onClose} />,
    );
    // Click the backdrop (outermost fixed div)
    const backdrop = container.querySelector('.fixed');
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });
});

// ===================== BubbleIndicator =====================

describe('BubbleIndicator', () => {
  const defaultProps = {
    isBubble: false,
    showItmFlash: false,
    addOnWindowOpen: false,
    addOnCost: 10,
    addOnChips: 5000,
  };

  it('renders nothing when all flags are false', () => {
    const { container } = renderWithProviders(<BubbleIndicator {...defaultProps} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders bubble banner when isBubble is true', () => {
    renderWithProviders(<BubbleIndicator {...defaultProps} isBubble />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });

  it('renders ITM flash when showItmFlash is true', () => {
    renderWithProviders(<BubbleIndicator {...defaultProps} showItmFlash />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('renders last hand banner', () => {
    renderWithProviders(<BubbleIndicator {...defaultProps} lastHandActive />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('renders hand-for-hand banner', () => {
    renderWithProviders(<BubbleIndicator {...defaultProps} handForHandActive />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('renders add-on window banner', () => {
    renderWithProviders(<BubbleIndicator {...defaultProps} addOnWindowOpen addOnCost={15} addOnChips={10000} />);
    const statuses = screen.getAllByRole('status');
    expect(statuses.length).toBeGreaterThanOrEqual(1);
  });

  it('renders multiple banners simultaneously', () => {
    renderWithProviders(<BubbleIndicator {...defaultProps} isBubble lastHandActive handForHandActive />);
    // bubble (role="alert") + lastHand + handForHand (role="status")
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getAllByRole('status').length).toBe(2);
  });
});

// ===================== RebuyStatus =====================

describe('RebuyStatus', () => {
  const baseRebuy: RebuyConfig = {
    enabled: true,
    rebuyChips: 5000,
    rebuyCost: 10,
    limitType: 'levels',
    levelLimit: 4,
    timeLimit: 3600,
    maxRebuysPerPlayer: 3,
    reEntryEnabled: false,
    maxReEntries: 1,
  };

  it('returns null when rebuy is disabled', () => {
    const { container } = renderWithProviders(
      <RebuyStatus active={true} rebuy={{ ...baseRebuy, enabled: false }} currentPlayLevel={1} elapsedSeconds={0} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows active status with level info for level-based rebuy', () => {
    renderWithProviders(
      <RebuyStatus active={true} rebuy={baseRebuy} currentPlayLevel={2} elapsedSeconds={0} />,
    );
    // Should contain the active indicator text
    const container = document.querySelector('[class*="backdrop-blur"]');
    expect(container).toBeInTheDocument();
  });

  it('shows active status with time info for time-based rebuy', () => {
    const timeRebuy = { ...baseRebuy, limitType: 'time' as const, timeLimit: 3600 };
    renderWithProviders(
      <RebuyStatus active={true} rebuy={timeRebuy} currentPlayLevel={2} elapsedSeconds={1800} />,
    );
    const container = document.querySelector('[class*="backdrop-blur"]');
    expect(container).toBeInTheDocument();
  });

  it('shows ended status when not active', () => {
    renderWithProviders(
      <RebuyStatus active={false} rebuy={baseRebuy} currentPlayLevel={5} elapsedSeconds={0} />,
    );
    const container = document.querySelector('[class*="bg-gray"]');
    expect(container).toBeInTheDocument();
  });
});

// ===================== ChevronIcon =====================

describe('ChevronIcon', () => {
  it('renders an SVG with aria-hidden', () => {
    const { container } = render(<ChevronIcon open={false} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies rotate-0 when open', () => {
    const { container } = render(<ChevronIcon open={true} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('class')).toContain('rotate-0');
  });

  it('applies -rotate-90 when closed', () => {
    const { container } = render(<ChevronIcon open={false} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('class')).toContain('-rotate-90');
  });

  it('accepts custom className', () => {
    const { container } = render(<ChevronIcon open={false} className="text-red-500" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('class')).toContain('text-red-500');
  });
});

// ===================== CollapsibleSubSection =====================

describe('CollapsibleSubSection', () => {
  it('hides children when collapsed by default', () => {
    render(
      <CollapsibleSubSection title="Sub Section">
        <div data-testid="child">Content</div>
      </CollapsibleSubSection>,
    );
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  it('shows children when defaultOpen is true', () => {
    render(
      <CollapsibleSubSection title="Sub Section" defaultOpen>
        <div data-testid="child">Content</div>
      </CollapsibleSubSection>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('toggles on click', () => {
    render(
      <CollapsibleSubSection title="Toggle Sub">
        <div data-testid="child">Content</div>
      </CollapsibleSubSection>,
    );
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Toggle Sub'));
    expect(screen.getByTestId('child')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Toggle Sub'));
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  it('shows summary when collapsed', () => {
    render(
      <CollapsibleSubSection title="Section" summary="Summary text">
        <div>Content</div>
      </CollapsibleSubSection>,
    );
    expect(screen.getByText('Summary text')).toBeInTheDocument();
  });

  it('hides summary when open', () => {
    render(
      <CollapsibleSubSection title="Section" summary="Summary text" defaultOpen>
        <div>Content</div>
      </CollapsibleSubSection>,
    );
    expect(screen.queryByText('Summary text')).not.toBeInTheDocument();
  });

  it('has aria-expanded attribute', () => {
    render(
      <CollapsibleSubSection title="Section">
        <div>Content</div>
      </CollapsibleSubSection>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });
});

// ===================== LanguageSwitcher =====================

describe('LanguageSwitcher', () => {
  it('renders DE and EN buttons', () => {
    renderWithProviders(<LanguageSwitcher />);
    expect(screen.getByText('DE')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('has title attributes on buttons', () => {
    renderWithProviders(<LanguageSwitcher />);
    expect(screen.getByTitle('Deutsch')).toBeInTheDocument();
    expect(screen.getByTitle('English')).toBeInTheDocument();
  });
});

// ===================== ThemeSwitcher =====================

describe('ThemeSwitcher', () => {
  it('renders three mode buttons', () => {
    renderWithProviders(<ThemeSwitcher />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(3);
  });
});

// ===================== ErrorBoundary =====================

describe('ErrorBoundary', () => {
  // Suppress console.error for expected errors
  const originalError = console.error;
  beforeAll(() => { console.error = vi.fn(); });
  afterAll(() => { console.error = originalError; });

  function ThrowingComponent(): JSX.Element {
    throw new Error('Test error');
  }

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">OK</div>
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders fallback UI on error', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Reload')).toBeInTheDocument();
  });
});

describe('SectionErrorBoundary', () => {
  const originalError = console.error;
  beforeAll(() => { console.error = vi.fn(); });
  afterAll(() => { console.error = originalError; });

  function ThrowingComponent(): JSX.Element {
    throw new Error('Section error');
  }

  it('renders children when no error', () => {
    render(
      <SectionErrorBoundary>
        <div data-testid="child">OK</div>
      </SectionErrorBoundary>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders compact fallback with Retry button on error', () => {
    render(
      <SectionErrorBoundary>
        <ThrowingComponent />
      </SectionErrorBoundary>,
    );
    expect(screen.getByText('Failed to load this section.')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });
});

// ===================== useConfirmDialog Hook =====================

describe('useConfirmDialog', () => {
  it('starts with null confirmAction', () => {
    const { result } = renderHook(() => useConfirmDialog());
    expect(result.current.confirmAction).toBeNull();
  });

  it('confirm() sets the action', () => {
    const { result } = renderHook(() => useConfirmDialog());
    const onConfirm = vi.fn();
    act(() => { result.current.confirm('Title', 'Message', 'OK', onConfirm); });
    expect(result.current.confirmAction).toEqual({
      title: 'Title',
      message: 'Message',
      confirmLabel: 'OK',
      onConfirm,
    });
  });

  it('dismiss() clears the action', () => {
    const { result } = renderHook(() => useConfirmDialog());
    const onConfirm = vi.fn();
    act(() => { result.current.confirm('Title', 'Message', 'OK', onConfirm); });
    expect(result.current.confirmAction).not.toBeNull();
    act(() => { result.current.dismiss(); });
    expect(result.current.confirmAction).toBeNull();
  });

  it('execute() calls onConfirm and clears action', () => {
    const { result } = renderHook(() => useConfirmDialog());
    const onConfirm = vi.fn();
    act(() => { result.current.confirm('Title', 'Message', 'OK', onConfirm); });
    act(() => { result.current.execute(); });
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(result.current.confirmAction).toBeNull();
  });

  it('execute() does nothing when no action is set', () => {
    const { result } = renderHook(() => useConfirmDialog());
    act(() => { result.current.execute(); });
    expect(result.current.confirmAction).toBeNull();
  });

  it('closes on Escape key', () => {
    const { result } = renderHook(() => useConfirmDialog());
    act(() => { result.current.confirm('Title', 'Message', 'OK', vi.fn()); });
    expect(result.current.confirmAction).not.toBeNull();
    act(() => { fireEvent.keyDown(window, { key: 'Escape' }); });
    expect(result.current.confirmAction).toBeNull();
  });
});
