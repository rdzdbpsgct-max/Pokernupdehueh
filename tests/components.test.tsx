import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { LanguageProvider } from '../src/i18n';
import { ThemeProvider } from '../src/theme';
import { NumberStepper } from '../src/components/NumberStepper';
import { CollapsibleSection } from '../src/components/CollapsibleSection';
import { PrintView } from '../src/components/PrintView';
import type { TournamentConfig, TournamentResult } from '../src/domain/types';
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
