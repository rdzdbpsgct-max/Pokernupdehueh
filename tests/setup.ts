import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { resetStorage } from '../src/domain/storage';

const originalEmitWarning = process.emitWarning.bind(process);
const originalConsoleWarn = console.warn.bind(console);

process.emitWarning = ((warning: string | Error, ...args: unknown[]) => {
  const message = typeof warning === 'string' ? warning : warning?.message ?? '';
  // Environment-level noise from jsdom/node runtime in this workspace.
  if (message.includes('--localstorage-file was provided without a valid path')) {
    return;
  }
  originalEmitWarning(warning, ...(args as [unknown?]));
}) as typeof process.emitWarning;

function filteredWarn(...args: unknown[]) {
  const first = typeof args[0] === 'string' ? args[0] : '';
  // Keep test output focused: these warnings are expected in test scenarios.
  if (
    first.startsWith('[audio]')
    || first.startsWith('[audioPlayer]')
    || first.startsWith('[tables]')
    || first.startsWith('[i18n]')
  ) {
    return;
  }
  originalConsoleWarn(...args);
}

// Reset storage cache before each test to ensure isolation
beforeEach(async () => {
  vi.spyOn(console, 'warn').mockImplementation(filteredWarn);
  await resetStorage();
  // Clear IndexedDB databases between tests
  if (typeof indexedDB !== 'undefined' && indexedDB.databases) {
    try {
      const dbs = await indexedDB.databases();
      for (const db of dbs) {
        if (db.name) indexedDB.deleteDatabase(db.name);
      }
    } catch { /* ignore */ }
  }
});

// Mock window.matchMedia for theme provider tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

if (typeof HTMLMediaElement !== 'undefined') {
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    value: vi.fn(() => Promise.reject(new Error('Not implemented'))),
  });
}
