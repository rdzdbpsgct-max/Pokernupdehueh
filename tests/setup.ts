import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { resetStorage } from '../src/domain/storage';

// Reset storage cache before each test to ensure isolation
beforeEach(async () => {
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
