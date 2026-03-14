# 7 Mountain Poker — Feature Roadmap Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Systematische Erweiterung der Poker-Timer-App mit zwei parallelen Spuren — funktionale Features (Track A) und technische Schulden (Track B) — nach Priorität geordnet, vollständig lokal, keine Cloud, keine Monetarisierung.

**Architecture:** Alle Features bauen auf dem bestehenden Cache-First IndexedDB-Stack auf. Track A fügt neue Domain-Module, Hooks und Komponenten hinzu. Track B konsolidiert State-Management und verbessert Robustheit bestehender Systeme. Beide Spuren sind unabhängig ausführbar.

**Tech Stack:** React 19, TypeScript strict, Vite 7, Tailwind CSS 4, Vitest, idb (IndexedDB), PeerJS, Web Audio API, ElevenLabs MP3 + Web Speech API

---

## Übersicht der Phasen

```
TRACK A — Funktionale Features
  Phase A1 (Foundation):   Event Log, Player Tracking, Payout Calculator
  Phase A2 (Remote):       Remote Contract Versioning, Reconnect Snapshot
  Phase A3 (Break Engine): Skip/Extend Break
  Phase A4 (Config):       Alert/TTS Editor, Display Customization
  Phase A5 (Advanced):     Live Duration Prognosis, Multi-Table Dealer, Random Seating
  Phase A6 (Optional):     Custom Audio Upload

TRACK B — Technische Schulden
  Phase B1 (Props):        GameModeProps Konsolidierung
  Phase B2 (UX):           Player Stack NumberStepper, Settings Reorganisation
  Phase B3 (Reliability):  Speech Queue Improvements
```

---

## Abhängigkeitsgraph

```
A1 (Event Log) ──→ A2 nichts
                ──→ A4 (Alert Editor nutzt Event-Typen)
A2 (Remote)    ──→ unabhängig
A3 (Break)     ──→ unabhängig
B1 (Props)     ──→ vor A4/A5 empfohlen (weniger Prop-Drilling)
B2 (UX)        ──→ unabhängig
B3 (Speech)    ──→ vor A4 empfohlen
```

---

# TRACK A — Funktionale Features

---

## Phase A1: Foundation

### Task A1.1 — Tournament Event Log: Typen und Storage

**Ziel:** Append-only Event-Log-System als Basis für Turnier-Log, Elimination-Tracking und verbessertem Export.

**Files:**
- Create: `src/domain/tournamentEvents.ts`
- Modify: `src/domain/types.ts`
- Modify: `src/domain/storage.ts`
- Modify: `src/domain/logic.ts`
- Test: `tests/events.test.ts`

---

**Step 1: Typen in `src/domain/types.ts` ergänzen**

Am Ende der Datei, nach `TournamentResult`:

```typescript
// ─── Tournament Event Log ───────────────────────────────────────────────────

export type TournamentEventType =
  | 'level_start'
  | 'level_skip_forward'
  | 'level_skip_backward'
  | 'timer_paused'
  | 'timer_resumed'
  | 'player_eliminated'
  | 'player_reinstated'
  | 'rebuy_taken'
  | 'addon_taken'
  | 'late_registration'
  | 're_entry'
  | 'dealer_advanced'
  | 'table_move'
  | 'table_dissolved'
  | 'call_the_clock_started'
  | 'call_the_clock_expired'
  | 'break_extended'
  | 'break_skipped'
  | 'tournament_started'
  | 'tournament_finished';

export interface TournamentEvent {
  id: string;                           // `evt_${Date.now()}_${Math.random().toString(36).slice(2,7)}`
  type: TournamentEventType;
  timestamp: number;                    // Date.now()
  levelIndex: number;                   // aktueller Level zum Zeitpunkt des Events
  data: Record<string, unknown>;        // typ-spezifische Payload (playerId, eliminatorId, etc.)
}
```

`TournamentResult` erweitern (optional, backward-compat):

```typescript
export interface TournamentResult {
  // ...existing fields (NICHT entfernen)...
  events?: TournamentEvent[];           // NEU: vollständiger Log
}
```

`Player` erweitern (optional, backward-compat):

```typescript
export interface Player {
  // ...existing fields (NICHT entfernen)...
  eliminatedAt?: number;                // NEU: timestamp
  eliminatedBy?: string;               // NEU: playerId des Eliminators
  rebuyTimestamps?: number[];          // NEU: [ts1, ts2, ...] statt nur rebuys: number
}
```

---

**Step 2: Neues Modul `src/domain/tournamentEvents.ts` erstellen**

```typescript
import type { TournamentEvent, TournamentEventType } from './types';

export function createEvent(
  type: TournamentEventType,
  levelIndex: number,
  data: Record<string, unknown> = {}
): TournamentEvent {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    timestamp: Date.now(),
    levelIndex,
    data,
  };
}

export function filterEventsByType(
  events: TournamentEvent[],
  type: TournamentEventType
): TournamentEvent[] {
  return events.filter((e) => e.type === type);
}

export function filterEventsByPlayer(
  events: TournamentEvent[],
  playerId: string
): TournamentEvent[] {
  return events.filter(
    (e) =>
      e.data['playerId'] === playerId ||
      e.data['eliminatorId'] === playerId
  );
}

export function getElimination(
  events: TournamentEvent[],
  playerId: string
): TournamentEvent | undefined {
  return events.find(
    (e) => e.type === 'player_eliminated' && e.data['playerId'] === playerId
  );
}

export function getRebuyEvents(
  events: TournamentEvent[],
  playerId: string
): TournamentEvent[] {
  return events.filter(
    (e) => e.type === 'rebuy_taken' && e.data['playerId'] === playerId
  );
}

export function formatEventTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// Kompakte Textdarstellung für WhatsApp-Export
export function formatEventAsText(
  event: TournamentEvent,
  playerNameMap: Map<string, string>
): string {
  const time = formatEventTimestamp(event.timestamp);
  const name = (id: unknown) =>
    typeof id === 'string' ? (playerNameMap.get(id) ?? id) : '?';

  switch (event.type) {
    case 'player_eliminated': {
      const victim = name(event.data['playerId']);
      const eliminator = event.data['eliminatorId']
        ? ` (von ${name(event.data['eliminatorId'])})`
        : '';
      const place = event.data['placement']
        ? ` → Platz ${event.data['placement']}`
        : '';
      return `${time} ❌ ${victim} ausgeschieden${eliminator}${place}`;
    }
    case 'rebuy_taken':
      return `${time} 🔄 ${name(event.data['playerId'])} Rebuy`;
    case 'addon_taken':
      return `${time} ➕ ${name(event.data['playerId'])} Add-On`;
    case 'level_start':
      return `${time} ▶ Level ${(event.data['levelIndex'] as number) + 1} gestartet`;
    case 'timer_paused':
      return `${time} ⏸ Timer pausiert`;
    case 'timer_resumed':
      return `${time} ▶ Timer fortgesetzt`;
    case 'break_extended':
      return `${time} ☕ Pause verlängert (+${event.data['seconds']}s)`;
    case 'break_skipped':
      return `${time} ⏭ Pause übersprungen`;
    case 'table_move':
      return `${time} 🪑 ${name(event.data['playerId'])} bewegt`;
    case 'table_dissolved':
      return `${time} 🏁 Tisch ${event.data['tableName']} aufgelöst`;
    case 'tournament_started':
      return `${time} 🃏 Turnier gestartet`;
    case 'tournament_finished':
      return `${time} 🏆 Turnier beendet`;
    default:
      return `${time} ${event.type}`;
  }
}
```

---

**Step 3: Storage-Layer erweitern (`src/domain/storage.ts`)**

In der Datei den `DB_STORES` Array um `'events'` erweitern.

Suche den Block mit den Store-Definitionen (ca. Zeile 25–50) und ergänze:

```typescript
// In der openDB-Konfiguration, im upgrade-Callback:
// Bestehende Stores: config, settings, checkpoint, templates, history, players, leagues, gameDays
// NEU hinzufügen:
if (!db.objectStoreNames.contains('events')) {
  db.createObjectStore('events', { keyPath: 'id' });
}
```

Neue Export-Funktion am Ende der Datei:

```typescript
export async function clearEvents(): Promise<void> {
  const cache = getCache();
  cache.set('events', []);
  const db = await getDb();
  if (db) {
    const tx = db.transaction('events', 'readwrite');
    await tx.store.clear();
  }
}
```

---

**Step 4: `src/domain/logic.ts` Barrel-Export ergänzen**

```typescript
export * from './tournamentEvents';
```

---

**Step 5: Test-Datei `tests/events.test.ts` erstellen**

```typescript
import { describe, it, expect } from 'vitest';
import {
  createEvent,
  filterEventsByType,
  filterEventsByPlayer,
  getElimination,
  getRebuyEvents,
  formatEventAsText,
} from '../src/domain/tournamentEvents';
import type { TournamentEvent } from '../src/domain/types';

describe('createEvent', () => {
  it('erzeugt Event mit korrektem Typ und Timestamp', () => {
    const before = Date.now();
    const event = createEvent('player_eliminated', 3, { playerId: 'p1', placement: 5 });
    const after = Date.now();

    expect(event.type).toBe('player_eliminated');
    expect(event.levelIndex).toBe(3);
    expect(event.data['playerId']).toBe('p1');
    expect(event.data['placement']).toBe(5);
    expect(event.timestamp).toBeGreaterThanOrEqual(before);
    expect(event.timestamp).toBeLessThanOrEqual(after);
    expect(event.id).toMatch(/^evt_\d+_[a-z0-9]+$/);
  });

  it('erzeugt eindeutige IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => createEvent('timer_paused', 0).id));
    expect(ids.size).toBe(100);
  });
});

describe('filterEventsByType', () => {
  const events: TournamentEvent[] = [
    createEvent('player_eliminated', 2, { playerId: 'p1' }),
    createEvent('rebuy_taken', 2, { playerId: 'p2' }),
    createEvent('player_eliminated', 3, { playerId: 'p3' }),
  ];

  it('filtert nach Typ', () => {
    const eliminations = filterEventsByType(events, 'player_eliminated');
    expect(eliminations).toHaveLength(2);
    expect(eliminations.every((e) => e.type === 'player_eliminated')).toBe(true);
  });

  it('gibt leeres Array bei keinem Treffer', () => {
    expect(filterEventsByType(events, 'tournament_finished')).toHaveLength(0);
  });
});

describe('filterEventsByPlayer', () => {
  const events: TournamentEvent[] = [
    createEvent('player_eliminated', 2, { playerId: 'p1', eliminatorId: 'p2' }),
    createEvent('rebuy_taken', 2, { playerId: 'p1' }),
    createEvent('player_eliminated', 3, { playerId: 'p3', eliminatorId: 'p1' }),
  ];

  it('findet Events als Opfer und als Eliminator', () => {
    const p1Events = filterEventsByPlayer(events, 'p1');
    expect(p1Events).toHaveLength(3);
  });

  it('findet nur direkte Events für anderen Spieler', () => {
    const p3Events = filterEventsByPlayer(events, 'p3');
    expect(p3Events).toHaveLength(1);
  });
});

describe('getElimination', () => {
  const events: TournamentEvent[] = [
    createEvent('player_eliminated', 2, { playerId: 'p1', placement: 5 }),
    createEvent('rebuy_taken', 2, { playerId: 'p1' }),
  ];

  it('findet Eliminierungsevent', () => {
    const evt = getElimination(events, 'p1');
    expect(evt).toBeDefined();
    expect(evt?.data['placement']).toBe(5);
  });

  it('gibt undefined zurück wenn kein Eliminierungsevent', () => {
    expect(getElimination(events, 'p99')).toBeUndefined();
  });
});

describe('getRebuyEvents', () => {
  const events: TournamentEvent[] = [
    createEvent('rebuy_taken', 1, { playerId: 'p1' }),
    createEvent('rebuy_taken', 2, { playerId: 'p1' }),
    createEvent('rebuy_taken', 3, { playerId: 'p2' }),
  ];

  it('gibt alle Rebuys eines Spielers zurück', () => {
    expect(getRebuyEvents(events, 'p1')).toHaveLength(2);
    expect(getRebuyEvents(events, 'p2')).toHaveLength(1);
  });
});

describe('formatEventAsText', () => {
  const nameMap = new Map([['p1', 'Alice'], ['p2', 'Bob']]);

  it('formatiert Elimination mit Eliminator', () => {
    const evt = createEvent('player_eliminated', 2, {
      playerId: 'p1',
      eliminatorId: 'p2',
      placement: 3,
    });
    const text = formatEventAsText(evt, nameMap);
    expect(text).toContain('Alice');
    expect(text).toContain('Bob');
    expect(text).toContain('Platz 3');
    expect(text).toContain('❌');
  });

  it('formatiert Rebuy', () => {
    const evt = createEvent('rebuy_taken', 1, { playerId: 'p2' });
    const text = formatEventAsText(evt, nameMap);
    expect(text).toContain('Bob');
    expect(text).toContain('🔄');
  });
});
```

---

**Step 6: Tests ausführen und prüfen**

```bash
npm run test -- --reporter=verbose tests/events.test.ts
```

Erwartetes Ergebnis: Alle Tests grün.

---

**Step 7: Commit**

```bash
git add src/domain/types.ts src/domain/tournamentEvents.ts src/domain/storage.ts src/domain/logic.ts tests/events.test.ts
git commit -m "feat: Tournament Event Log — Typen, Domain-Modul, Storage-Layer"
```

---

### Task A1.2 — Event Log in useTournamentActions einbinden

**Ziel:** Bei jeder relevanten Turnier-Aktion wird automatisch ein Event an den Log angehängt.

**Files:**
- Modify: `src/hooks/useTournamentActions.ts`
- Modify: `src/App.tsx`
- Test: `tests/tournamentActions.test.tsx` (erweitern)

---

**Step 1: `useTournamentActions.ts` — Log-State und createEvent importieren**

Am Anfang der Datei importieren:

```typescript
import { createEvent } from '../domain/tournamentEvents';
import type { TournamentEvent } from '../domain/types';
```

Dem Hook-Interface ein neues Prop hinzufügen:

```typescript
interface UseTournamentActionsProps {
  // ...existing props (NICHT entfernen)...
  onAppendEvent: (event: TournamentEvent) => void;  // NEU
}
```

---

**Step 2: Events in den Action-Callbacks erzeugen**

Im `eliminatePlayer`-Callback (nach dem State-Update):

```typescript
onAppendEvent(createEvent('player_eliminated', currentLevelIndex, {
  playerId,
  eliminatorId: eliminatorPlayerId ?? null,
  placement: computedPlacement,
}));
```

Im `handleRebuy`-Callback:

```typescript
onAppendEvent(createEvent('rebuy_taken', currentLevelIndex, { playerId }));
```

Im `handleAddOn`-Callback:

```typescript
onAppendEvent(createEvent('addon_taken', currentLevelIndex, { playerId }));
```

Im `handleLateRegistration`-Callback:

```typescript
onAppendEvent(createEvent('late_registration', currentLevelIndex, {
  playerId: newPlayer.id,
  playerName: newPlayer.name,
}));
```

Im `handleReEntry`-Callback:

```typescript
onAppendEvent(createEvent('re_entry', currentLevelIndex, {
  playerId: newPlayer.id,
  originalPlayerId: originalPlayerId,
}));
```

---

**Step 3: App.tsx — events State und onAppendEvent**

In `App.tsx` neuen State hinzufügen:

```typescript
const [tournamentEvents, setTournamentEvents] = useState<TournamentEvent[]>([]);
```

Callback erstellen:

```typescript
const handleAppendEvent = useCallback((event: TournamentEvent) => {
  setTournamentEvents((prev) => [...prev, event]);
}, []);
```

Timer-Events in `useTimer`-Callbacks hinzufügen (in den bestehenden `onLevelChange`/`onPause`/`onResume`-Callbacks):

```typescript
// Beim Level-Wechsel:
handleAppendEvent(createEvent('level_start', newLevelIndex, {}));

// Beim Pausieren:
handleAppendEvent(createEvent('timer_paused', currentLevelIndex, {}));

// Beim Fortsetzen:
handleAppendEvent(createEvent('timer_resumed', currentLevelIndex, {}));
```

Events beim Start eines Turniers (beim Wechsel von 'setup' zu 'game'):

```typescript
handleAppendEvent(createEvent('tournament_started', 0, {}));
```

Events beim Beenden des Turniers:

```typescript
handleAppendEvent(createEvent('tournament_finished', currentLevelIndex, {}));
```

Events-Reset beim Zurück zu Setup:

```typescript
setTournamentEvents([]);
```

`onAppendEvent={handleAppendEvent}` als Prop an `useTournamentActions` übergeben.

---

**Step 4: Checkpoint — Events mitpersistieren**

In der bestehenden Checkpoint-Logik (suche `saveCheckpoint` in `src/domain/configPersistence.ts`):

```typescript
// Im Checkpoint-Objekt events ergänzen:
const checkpoint = {
  // ...existing fields...
  events: tournamentEvents,  // NEU
};
```

Beim Laden des Checkpoints:

```typescript
if (checkpoint.events) {
  setTournamentEvents(checkpoint.events);
}
```

---

**Step 5: Test ergänzen in `tests/tournamentActions.test.tsx`**

```typescript
it('erzeugt player_eliminated Event beim Eliminieren', () => {
  const appendedEvents: TournamentEvent[] = [];
  // ... bestehende test setup ...
  // onAppendEvent: (evt) => appendedEvents.push(evt) als Prop übergeben

  // eliminatePlayer aufrufen
  act(() => result.current.eliminatePlayer('player-1'));

  expect(appendedEvents).toHaveLength(1);
  expect(appendedEvents[0].type).toBe('player_eliminated');
  expect(appendedEvents[0].data['playerId']).toBe('player-1');
});

it('erzeugt rebuy_taken Event beim Rebuy', () => {
  const appendedEvents: TournamentEvent[] = [];
  // onRebuy aufrufen
  act(() => result.current.handleRebuy('player-1'));

  expect(appendedEvents).toHaveLength(1);
  expect(appendedEvents[0].type).toBe('rebuy_taken');
});
```

---

**Step 6: Tests ausführen**

```bash
npm run test -- tests/tournamentActions.test.tsx
```

---

**Step 7: Commit**

```bash
git add src/hooks/useTournamentActions.ts src/App.tsx src/domain/configPersistence.ts tests/tournamentActions.test.tsx
git commit -m "feat: Event Log in Tournament Actions eingebunden"
```

---

### Task A1.3 — TournamentLog Komponente

**Ziel:** Anzeige des Turnier-Logs als lazy-geladene Modal-Komponente mit chronologischer Liste, Filter und Text-Export.

**Files:**
- Create: `src/components/TournamentLog.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/modes/GameModeContainer.tsx`
- Modify: `src/i18n/translations.ts`

---

**Step 1: Translation-Keys ergänzen (`src/i18n/translations.ts`)**

```typescript
// DE:
'log.title': 'Turnier-Log',
'log.close': 'Schließen',
'log.empty': 'Noch keine Ereignisse',
'log.copyText': 'Log kopieren',
'log.copied': 'Kopiert!',
'log.filter.all': 'Alle',
'log.filter.eliminations': 'Eliminierungen',
'log.filter.rebuys': 'Rebuys',
'log.filter.levels': 'Level',

// EN:
'log.title': 'Tournament Log',
'log.close': 'Close',
'log.empty': 'No events yet',
'log.copyText': 'Copy Log',
'log.copied': 'Copied!',
'log.filter.all': 'All',
'log.filter.eliminations': 'Eliminations',
'log.filter.rebuys': 'Rebuys',
'log.filter.levels': 'Levels',
```

---

**Step 2: `src/components/TournamentLog.tsx` erstellen**

```typescript
import { useState, useMemo } from 'react';
import { useTranslation } from '../i18n';
import { formatEventAsText, filterEventsByType } from '../domain/tournamentEvents';
import type { TournamentEvent, Player } from '../domain/types';

type FilterMode = 'all' | 'eliminations' | 'rebuys' | 'levels';

interface Props {
  events: TournamentEvent[];
  players: Player[];
  onClose: () => void;
}

export function TournamentLog({ events, players, onClose }: Props) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterMode>('all');
  const [copied, setCopied] = useState(false);

  const nameMap = useMemo(
    () => new Map(players.map((p) => [p.id, p.name])),
    [players]
  );

  const filtered = useMemo(() => {
    switch (filter) {
      case 'eliminations':
        return filterEventsByType(events, 'player_eliminated');
      case 'rebuys':
        return events.filter((e) => e.type === 'rebuy_taken' || e.type === 'addon_taken');
      case 'levels':
        return events.filter((e) => e.type === 'level_start' || e.type === 'timer_paused' || e.type === 'timer_resumed');
      default:
        return events;
    }
  }, [events, filter]);

  const handleCopy = async () => {
    const text = [...filtered]
      .reverse()
      .map((e) => formatEventAsText(e, nameMap))
      .join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filterButtons: { id: FilterMode; label: string }[] = [
    { id: 'all', label: t('log.filter.all') },
    { id: 'eliminations', label: t('log.filter.eliminations') },
    { id: 'rebuys', label: t('log.filter.rebuys') },
    { id: 'levels', label: t('log.filter.levels') },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('log.title')}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-lg bg-gray-900 sm:rounded-2xl shadow-2xl flex flex-col max-h-[85dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/40">
          <h2 className="text-base font-semibold text-gray-100">{t('log.title')}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="text-xs px-3 py-1 rounded-lg bg-gray-800 text-gray-300 hover:text-white border border-gray-700/40 transition-colors"
            >
              {copied ? t('log.copied') : t('log.copyText')}
            </button>
            <button
              onClick={onClose}
              aria-label={t('log.close')}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-1 px-4 py-2 border-b border-gray-700/40">
          {filterButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id)}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                filter === btn.id
                  ? 'bg-[var(--accent-500)] text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Event List */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">{t('log.empty')}</p>
          ) : (
            <ul className="space-y-1">
              {[...filtered].reverse().map((event) => (
                <li
                  key={event.id}
                  className="text-xs text-gray-300 py-1.5 border-b border-gray-800/60 last:border-0"
                >
                  {formatEventAsText(event, nameMap)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

**Step 3: In App.tsx lazy-laden und State hinzufügen**

```typescript
const TournamentLog = lazy(() =>
  import('./components/TournamentLog').then((m) => ({ default: m.TournamentLog }))
);

// State:
const [showTournamentLog, setShowTournamentLog] = useState(false);
```

Im JSX (im Game Mode Block):

```typescript
{showTournamentLog && (
  <Suspense fallback={<LoadingFallback />}>
    <TournamentLog
      events={tournamentEvents}
      players={config.players}
      onClose={() => setShowTournamentLog(false)}
    />
  </Suspense>
)}
```

---

**Step 4: Log-Button in GameModeContainer / AppHeader**

In `src/components/AppHeader.tsx` einen neuen Button hinzufügen (nur im Game-Mode sichtbar):

```typescript
// Props ergänzen:
onShowLog?: () => void;
showLogButton?: boolean;

// Im JSX, neben dem TV-Button:
{showLogButton && onShowLog && (
  <button
    onClick={onShowLog}
    title="Turnier-Log"
    aria-label="Turnier-Log"
    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors text-sm"
  >
    📋
  </button>
)}
```

---

**Step 5: Commit**

```bash
git add src/components/TournamentLog.tsx src/App.tsx src/components/AppHeader.tsx src/i18n/translations.ts
git commit -m "feat: TournamentLog Komponente — Filter, Kopieren, chronologische Liste"
```

---

### Task A1.4 — TournamentResult mit Events exportieren

**Ziel:** Beim Beenden eines Turniers werden Events in `TournamentResult` eingebettet und in der Historie gespeichert.

**Files:**
- Modify: `src/domain/tournament.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/TournamentHistory.tsx`
- Test: `tests/logic.test.ts` (erweitern)

---

**Step 1: `buildTournamentResult` in `tournament.ts` erweitern**

Die Funktion-Signatur um `events?` ergänzen:

```typescript
export function buildTournamentResult(
  config: TournamentConfig,
  elapsedSeconds: number,
  playCount: number,
  events?: TournamentEvent[]  // NEU
): TournamentResult {
  return {
    // ...existing result fields (NICHT entfernen)...
    events: events ?? [],  // NEU
  };
}
```

---

**Step 2: In App.tsx `tournamentEvents` an buildTournamentResult übergeben**

```typescript
const finishedResult = useMemo(() => {
  if (mode !== 'finished') return null;
  return buildTournamentResult(config, elapsedSeconds, playCount, tournamentEvents);
}, [mode, config, elapsedSeconds, playCount, tournamentEvents]);
```

---

**Step 3: TournamentHistory — Events-Tab ergänzen**

In `src/components/TournamentHistory.tsx` einen dritten Tab "Log" hinzufügen, der die Events eines ausgewählten Turniers anzeigt (analog zum bestehenden "Standings"/"Spielerstatistik"-Tab-Muster).

---

**Step 4: Test ergänzen**

```typescript
it('buildTournamentResult bettet Events ein', () => {
  const events = [createEvent('player_eliminated', 2, { playerId: 'p1' })];
  const result = buildTournamentResult(mockConfig, 3600, 8, events);
  expect(result.events).toHaveLength(1);
  expect(result.events?.[0].type).toBe('player_eliminated');
});

it('buildTournamentResult ohne Events: leeres Array', () => {
  const result = buildTournamentResult(mockConfig, 3600, 8);
  expect(result.events).toEqual([]);
});
```

---

**Step 5: Commit**

```bash
git add src/domain/tournament.ts src/App.tsx src/components/TournamentHistory.tsx tests/logic.test.ts
git commit -m "feat: TournamentResult enthält Events — Export und Historie"
```

---

### Task A1.5 — Interaktiver Payout Calculator

**Ziel:** Overlay im Game Mode, das live zeigt was jeder Platz bei der aktuellen Spielerzahl auszahlt. Spielerzahl per Slider anpassbar (Simulation "wenn jetzt X ausscheiden").

**Files:**
- Create: `src/components/PayoutOverlay.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/modes/GameModeContainer.tsx`
- Modify: `src/i18n/translations.ts`
- Test: `tests/logic.test.ts` (computePayouts Tests erweitern)

---

**Step 1: Translation-Keys**

```typescript
// DE:
'payout.overlay.title': 'Auszahlungs-Simulator',
'payout.overlay.playersLeft': 'Verbleibende Spieler',
'payout.overlay.currentPrizePool': 'Aktueller Preispool',
'payout.overlay.place': 'Platz',
'payout.overlay.amount': 'Betrag',
'payout.overlay.close': 'Schließen',
'payout.overlay.hint': 'Passe die Spielerzahl an, um die Auszahlung zu simulieren',

// EN:
'payout.overlay.title': 'Payout Simulator',
'payout.overlay.playersLeft': 'Players Remaining',
'payout.overlay.currentPrizePool': 'Current Prize Pool',
'payout.overlay.place': 'Place',
'payout.overlay.amount': 'Amount',
'payout.overlay.close': 'Close',
'payout.overlay.hint': 'Adjust player count to simulate payouts',
```

---

**Step 2: `src/components/PayoutOverlay.tsx` erstellen**

```typescript
import { useState, useMemo } from 'react';
import { useTranslation } from '../i18n';
import { computePayouts, computePrizePool } from '../domain/logic';
import type { TournamentConfig, Player } from '../domain/types';

interface Props {
  config: TournamentConfig;
  players: Player[];
  onClose: () => void;
}

export function PayoutOverlay({ config, players, onClose }: Props) {
  const { t } = useTranslation();

  const activePlayers = players.filter((p) => p.status === 'active').length;
  const totalPlayers = players.length;

  const [simulatedActive, setSimulatedActive] = useState(activePlayers);

  // Prizepool basiert immer auf tatsächlichem Spielerstand
  const actualPrizePool = useMemo(
    () => computePrizePool(players, config.buyIn, config.rebuy?.rebuyCost, config.addOn?.cost),
    [players, config]
  );

  // Paidplaces aus Payout-Config
  const paidPlaces = config.payout?.entries.length ?? 0;

  // Live Payout-Berechnung
  const payouts = useMemo(
    () => computePayouts(config.payout, actualPrizePool),
    [config.payout, actualPrizePool]
  );

  const medals = ['🏆', '🥈', '🥉'];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('payout.overlay.title')}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm bg-gray-900 sm:rounded-2xl shadow-2xl flex flex-col max-h-[80dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/40">
          <h2 className="text-base font-semibold text-gray-100">{t('payout.overlay.title')}</h2>
          <button
            onClick={onClose}
            aria-label={t('payout.overlay.close')}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Prize Pool */}
          <div className="bg-gray-800/50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400">{t('payout.overlay.currentPrizePool')}</p>
            <p className="text-2xl font-bold text-[var(--accent-400)]">
              {actualPrizePool.toLocaleString('de-DE')} €
            </p>
          </div>

          {/* Simulated Player Count Slider */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{t('payout.overlay.playersLeft')}</span>
              <span className="text-white font-semibold">
                {simulatedActive} / {totalPlayers}
              </span>
            </div>
            <input
              type="range"
              min={Math.max(1, paidPlaces)}
              max={totalPlayers}
              value={simulatedActive}
              onChange={(e) => setSimulatedActive(Number(e.target.value))}
              className="w-full accent-[var(--accent-500)]"
            />
            <p className="text-xs text-gray-500 mt-1">{t('payout.overlay.hint')}</p>
          </div>

          {/* Payout Table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-700/40">
                <th className="text-left py-1">{t('payout.overlay.place')}</th>
                <th className="text-right py-1">{t('payout.overlay.amount')}</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((amount, idx) => {
                const isCurrentBubble = simulatedActive === idx + paidPlaces;
                return (
                  <tr
                    key={idx}
                    className={`border-b border-gray-800/40 last:border-0 ${
                      isCurrentBubble ? 'bg-red-900/20' : ''
                    }`}
                  >
                    <td className="py-2 text-gray-300">
                      {medals[idx] ?? `${idx + 1}.`}
                      {isCurrentBubble && (
                        <span className="ml-2 text-xs text-red-400">Bubble</span>
                      )}
                    </td>
                    <td className="py-2 text-right font-semibold text-gray-100">
                      {amount.toLocaleString('de-DE')} €
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

---

**Step 3: In App.tsx lazy-laden**

```typescript
const PayoutOverlay = lazy(() =>
  import('./components/PayoutOverlay').then((m) => ({ default: m.PayoutOverlay }))
);
const [showPayoutOverlay, setShowPayoutOverlay] = useState(false);
```

---

**Step 4: Button in PlayerPanel oder GameModeContainer**

In `PlayerPanel.tsx` einen neuen Button neben dem Side-Pot-Rechner:

```typescript
<button
  onClick={onShowPayoutOverlay}
  className="text-xs text-gray-400 hover:text-white underline"
>
  {t('payout.overlay.title')}
</button>
```

---

**Step 5: Tests**

```typescript
it('computePayouts gibt korrektes Array zurück', () => {
  const payoutConfig = { mode: 'percent', entries: [{ place: 1, value: 50 }, { place: 2, value: 30 }, { place: 3, value: 20 }] };
  const payouts = computePayouts(payoutConfig, 300);
  expect(payouts).toEqual([150, 90, 60]);
  expect(payouts.reduce((a, b) => a + b, 0)).toBe(300);
});
```

---

**Step 6: Commit**

```bash
git add src/components/PayoutOverlay.tsx src/App.tsx src/components/PlayerPanel.tsx src/i18n/translations.ts tests/logic.test.ts
git commit -m "feat: Interaktiver Payout Calculator Overlay mit Spieleranzahl-Simulator"
```

---

## Phase A2: Remote Control Hardening

### Task A2.1 — Contract Version Mismatch Handling

**Ziel:** Wenn Host und Controller unterschiedliche `REMOTE_STATE_CONTRACT_VERSION` haben, zeigt der Controller ein deutliches Banner und verhindert falsche Interpretation von Commands.

**Files:**
- Modify: `src/domain/remote.ts`
- Modify: `src/components/RemoteControl.tsx`
- Modify: `src/i18n/translations.ts`
- Test: `tests/logic.test.ts`

---

**Step 1: Translation-Keys**

```typescript
// DE:
'remote.versionMismatch': 'App-Version veraltet',
'remote.versionMismatchHint': 'Bitte lade die App neu, um die Fernbedienung zu nutzen.',
'remote.reload': 'App neu laden',

// EN:
'remote.versionMismatch': 'App Version Outdated',
'remote.versionMismatchHint': 'Please reload the app to use the remote control.',
'remote.reload': 'Reload App',
```

---

**Step 2: `remote.ts` — Version in State-Objekt einbetten**

In der `RemoteState` Interface (in `types.ts`) ergänzen:

```typescript
export interface RemoteState {
  _v: number;  // NEU: REMOTE_STATE_CONTRACT_VERSION
  // ...existing fields (NICHT entfernen)...
}
```

In `remote.ts` beim Bauen des State-Snapshots `_v` immer mitsenden:

```typescript
private buildStatePayload(): RemoteState {
  return {
    _v: REMOTE_STATE_CONTRACT_VERSION,
    // ...existing fields...
  };
}
```

---

**Step 3: `RemoteControllerView` — Version prüfen**

In der `onState`-Callback-Logik von `RemoteControllerView`:

```typescript
const [versionMismatch, setVersionMismatch] = useState(false);

// In onState:
if (state._v !== undefined && state._v !== REMOTE_STATE_CONTRACT_VERSION) {
  setVersionMismatch(true);
  return; // kein State-Update bei Mismatch
}
setVersionMismatch(false);
// ...rest of state update
```

Banner im JSX (über den Controls):

```typescript
{versionMismatch && (
  <div className="bg-amber-900/80 border border-amber-600/40 rounded-xl p-4 mx-4 mt-4 text-center">
    <p className="text-amber-200 font-semibold text-sm">{t('remote.versionMismatch')}</p>
    <p className="text-amber-300/70 text-xs mt-1">{t('remote.versionMismatchHint')}</p>
    <button
      onClick={() => window.location.reload()}
      className="mt-3 px-4 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-medium"
    >
      {t('remote.reload')}
    </button>
  </div>
)}
```

---

**Step 4: Test**

```typescript
it('RemoteState enthält _v Feld', () => {
  const host = new RemoteHost({ /* mock config */ });
  const state = host['buildStatePayload']();
  expect(state._v).toBe(REMOTE_STATE_CONTRACT_VERSION);
  expect(typeof state._v).toBe('number');
});
```

---

**Step 5: Commit**

```bash
git add src/domain/remote.ts src/domain/types.ts src/components/RemoteControl.tsx src/i18n/translations.ts tests/logic.test.ts
git commit -m "feat: Remote Contract Version — Mismatch-Banner und sofortige Erkennung"
```

---

### Task A2.2 — Sofortiger State-Snapshot beim Reconnect

**Ziel:** Wenn ein Controller sich (neu) verbindet, bekommt er sofort den aktuellen State ohne auf den nächsten 1s-Tick warten zu müssen.

**Files:**
- Modify: `src/domain/remote.ts`
- Test: `tests/logic.test.ts`

---

**Step 1: `RemoteHost` — Snapshot on Connection**

In `remote.ts`, in der `RemoteHost`-Klasse, in der Verbindungslogik:

```typescript
private handleConnection(conn: DataConnection): void {
  // ...existing connection setup...

  // NEU: sofortigen Snapshot senden
  conn.on('open', () => {
    this.connectedPeer = conn;
    this.sendState(this.lastBuiltState);  // sofortiger Snapshot
    this.onConnectionChange?.('connected');
  });
}
```

`lastBuiltState` als Property tracken:

```typescript
private lastBuiltState: RemoteState | null = null;

private buildAndSendState(): void {
  const state = this.buildStatePayload();
  this.lastBuiltState = state;  // NEU
  this.sendState(state);
}
```

---

**Step 2: Test**

```typescript
it('sendet sofortigen State-Snapshot bei neuer Verbindung', () => {
  const sentMessages: unknown[] = [];
  // Mock connection setup
  // Verify first message after 'open' event is state snapshot
  expect(sentMessages[0]).toMatchObject({ type: 'state', data: { _v: expect.any(Number) } });
});
```

---

**Step 3: Commit**

```bash
git add src/domain/remote.ts tests/logic.test.ts
git commit -m "feat: Remote — sofortiger State-Snapshot beim Reconnect"
```

---

### Task A2.3 — Remote Controller: Reconnect-Feedback

**Ziel:** Klares visuelles Feedback während Reconnect mit "Synchronisiere..." Zustand.

**Files:**
- Modify: `src/components/RemoteControl.tsx`
- Modify: `src/i18n/translations.ts`

---

**Step 1: Translation-Keys**

```typescript
// DE:
'remote.syncing': 'Synchronisiere...',
'remote.syncComplete': 'Verbunden',

// EN:
'remote.syncing': 'Syncing...',
'remote.syncComplete': 'Connected',
```

---

**Step 2: `RemoteControllerView` — Sync-State**

```typescript
const [isSyncing, setIsSyncing] = useState(false);

// Wenn Reconnect erfolgt (connectionStatus wechselt zu 'connected'):
useEffect(() => {
  if (connectionStatus === 'connected') {
    setIsSyncing(true);
    // Nach erstem State-Update (onState) wird isSyncing auf false gesetzt
  }
}, [connectionStatus]);

// In onState Callback (wenn erster State nach Reconnect ankommt):
// setIsSyncing(false);
```

Sync-Banner im JSX (über Timer-Display, nur wenn `isSyncing`):

```typescript
{isSyncing && (
  <div className="bg-blue-900/60 text-blue-200 text-xs text-center py-1 px-4 animate-pulse">
    {t('remote.syncing')}
  </div>
)}
```

---

**Step 3: Commit**

```bash
git add src/components/RemoteControl.tsx src/i18n/translations.ts
git commit -m "feat: Remote Controller — Sync-Feedback bei Reconnect"
```

---

## Phase A3: Break Engine Erweiterungen

### Task A3.1 — Break Überspringen und Verlängern

**Ziel:** Während einer Pause kann der Turnierdirektor (und Remote-Controller) die Pause sofort überspringen oder um eine konfigurierbare Zeit verlängern.

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/hooks/useTimer.ts`
- Modify: `src/components/Controls.tsx`
- Modify: `src/domain/remote.ts`
- Modify: `src/components/RemoteControl.tsx`
- Modify: `src/i18n/translations.ts`
- Test: `tests/edge-cases.test.ts`

---

**Step 1: Translation-Keys**

```typescript
// DE:
'controls.skipBreak': 'Pause überspringen',
'controls.extendBreak': 'Verlängern',
'controls.extendBreak5': '+5 Min',
'controls.extendBreak10': '+10 Min',

// EN:
'controls.skipBreak': 'Skip Break',
'controls.extendBreak': 'Extend',
'controls.extendBreak5': '+5 min',
'controls.extendBreak10': '+10 min',
```

---

**Step 2: `useTimer.ts` — `extendCurrentLevel` und `skipToNextLevel` Funktionen prüfen/ergänzen**

`skipToNextLevel` sollte identisch mit `advanceLevel` sein (bereits vorhanden — prüfen).

Neue Funktion `extendCurrentLevel(additionalSeconds: number)`:

```typescript
export function extendCurrentLevel(
  timerState: TimerState,
  additionalSeconds: number
): TimerState {
  // Verlängert die Dauer des aktuellen Levels um additionalSeconds
  // Implementierung: endTime += additionalSeconds * 1000
  const newEndTime = (timerState.endTime ?? Date.now()) + additionalSeconds * 1000;
  return { ...timerState, endTime: newEndTime };
}
```

Im `useTimer` Hook die Funktion exportieren.

---

**Step 3: Controls.tsx — Break-Buttons anzeigen**

Break-Level erkennen: `currentLevel.type === 'break'`

```typescript
{isCurrentLevelBreak && (
  <div className="flex gap-2 justify-center mt-2">
    <button
      onClick={onSkipBreak}
      className="text-xs px-3 py-1.5 rounded-lg bg-amber-900/40 text-amber-300 border border-amber-700/40 hover:bg-amber-800/40 transition-colors"
    >
      {t('controls.skipBreak')}
    </button>
    <button
      onClick={() => onExtendBreak(300)}
      className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 border border-gray-700/40 hover:bg-gray-700 transition-colors"
    >
      {t('controls.extendBreak5')}
    </button>
    <button
      onClick={() => onExtendBreak(600)}
      className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 border border-gray-700/40 hover:bg-gray-700 transition-colors"
    >
      {t('controls.extendBreak10')}
    </button>
  </div>
)}
```

---

**Step 4: Remote Control — Break-Buttons**

In `remote.ts` neue Command-Typen:

```typescript
type RemoteCommand =
  | // ...existing commands...
  | { type: 'skipBreak' }
  | { type: 'extendBreak'; seconds: number };
```

In `RemoteControllerView` (nur während Break sichtbar):

```typescript
{remoteState?.isBreak && (
  <div className="flex gap-2">
    <button onClick={() => sendCommand({ type: 'skipBreak' })} /* ... */>
      ⏭ {t('controls.skipBreak')}
    </button>
    <button onClick={() => sendCommand({ type: 'extendBreak', seconds: 300 })} /* ... */>
      {t('controls.extendBreak5')}
    </button>
  </div>
)}
```

In `useRemoteHostBridge` die neuen Commands dispatchen:

```typescript
case 'skipBreak':
  timerControls.nextLevel();
  appendEvent(createEvent('break_skipped', currentLevelIndex, {}));
  break;
case 'extendBreak':
  timerControls.extendCurrentLevel(cmd.seconds);
  appendEvent(createEvent('break_extended', currentLevelIndex, { seconds: cmd.seconds }));
  break;
```

---

**Step 5: Tests**

```typescript
it('extendCurrentLevel verlängert die Dauer korrekt', () => {
  const state: TimerState = {
    status: 'running',
    currentLevelIndex: 2,
    endTime: Date.now() + 60000, // 60s remaining
  };
  const extended = extendCurrentLevel(state, 300);
  expect(extended.endTime).toBeGreaterThan(state.endTime!);
  expect(extended.endTime! - state.endTime!).toBeCloseTo(300000, -2);
});
```

---

**Step 6: Commit**

```bash
git add src/domain/types.ts src/hooks/useTimer.ts src/components/Controls.tsx src/domain/remote.ts src/components/RemoteControl.tsx src/hooks/useRemoteHostBridge.ts src/i18n/translations.ts tests/edge-cases.test.ts
git commit -m "feat: Break Engine — Pause überspringen und verlängern (lokal + Remote)"
```

---

## Phase A4: Konfigurierbare Announcements

### Task A4.1 — Alert/TTS Editor: Typen und Storage

**Ziel:** Nutzerdefinierbare Ankündigungen mit Zeitpunkt-Trigger, Text-Templates und TTS/Sound-Optionen.

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/domain/speech.ts`
- Create: `src/domain/alertEngine.ts`
- Modify: `src/domain/logic.ts`
- Test: `tests/events.test.ts` (erweitern)

---

**Step 1: Typen in `types.ts`**

```typescript
export type AlertTrigger =
  | 'level_start'           // wenn ein bestimmtes Level beginnt
  | 'time_remaining'        // X Sekunden vor Level-Ende
  | 'break_start'           // wenn eine Pause beginnt
  | 'player_count';         // wenn Spieleranzahl auf X fällt

export interface AlertConfig {
  id: string;
  enabled: boolean;
  trigger: AlertTrigger;
  levelIndex?: number;       // für 'level_start': welches Level (0-basiert)
  secondsBefore?: number;    // für 'time_remaining': wie viele Sekunden vorher
  playerCount?: number;      // für 'player_count': Ziel-Spieleranzahl
  text: string;              // Template: kann {level}, {bigBlind}, {smallBlind}, {players}, {ante} enthalten
  voice: boolean;            // TTS aussprechen
  sound: 'beep' | 'chime' | 'none';
}

// Settings erweitern:
export interface Settings {
  // ...existing fields (NICHT entfernen)...
  customAlerts?: AlertConfig[];
}
```

---

**Step 2: `src/domain/alertEngine.ts` erstellen**

```typescript
import type { AlertConfig, AlertTrigger, TournamentConfig, TimerState } from './types';

export function createDefaultAlert(trigger: AlertTrigger): AlertConfig {
  return {
    id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    enabled: true,
    trigger,
    text: '',
    voice: true,
    sound: 'beep',
  };
}

// Template-Variablen ersetzen
export function interpolateAlertText(
  text: string,
  context: {
    levelIndex: number;
    config: TournamentConfig;
    activePlayers: number;
  }
): string {
  const level = context.config.levels[context.levelIndex];
  if (!level) return text;

  return text
    .replace('{level}', String(context.levelIndex + 1))
    .replace('{bigBlind}', String(level.bigBlind ?? ''))
    .replace('{smallBlind}', String(level.smallBlind ?? ''))
    .replace('{ante}', String(level.ante ?? ''))
    .replace('{players}', String(context.activePlayers));
}

// Prüft, ob ein Alert für den aktuellen Spielzustand auslösen soll
export function shouldFireAlert(
  alert: AlertConfig,
  trigger: AlertTrigger,
  context: {
    levelIndex: number;
    remainingSeconds: number;
    activePlayers: number;
    prevActivePlayers: number;
  }
): boolean {
  if (!alert.enabled || alert.trigger !== trigger) return false;

  switch (trigger) {
    case 'level_start':
      return alert.levelIndex === context.levelIndex;
    case 'time_remaining':
      return (
        typeof alert.secondsBefore === 'number' &&
        context.remainingSeconds === alert.secondsBefore
      );
    case 'player_count':
      return (
        typeof alert.playerCount === 'number' &&
        context.activePlayers === alert.playerCount &&
        context.prevActivePlayers > alert.playerCount
      );
    default:
      return false;
  }
}

export function getDefaultAlerts(): AlertConfig[] {
  return [];
}
```

---

**Step 3: `logic.ts` Barrel-Export**

```typescript
export * from './alertEngine';
```

---

**Step 4: Tests**

```typescript
describe('alertEngine', () => {
  it('interpolateAlertText ersetzt alle Variablen', () => {
    const text = 'Level {level}: {smallBlind}/{bigBlind}';
    const config = { levels: [{ smallBlind: 100, bigBlind: 200, ante: 0, type: 'play', durationSeconds: 900 }] };
    const result = interpolateAlertText(text, { levelIndex: 0, config, activePlayers: 8 });
    expect(result).toBe('Level 1: 100/200');
  });

  it('shouldFireAlert: level_start triggert nur beim richtigen Level', () => {
    const alert: AlertConfig = { id: 'a1', enabled: true, trigger: 'level_start', levelIndex: 3, text: 'test', voice: true, sound: 'beep' };
    expect(shouldFireAlert(alert, 'level_start', { levelIndex: 3, remainingSeconds: 900, activePlayers: 8, prevActivePlayers: 9 })).toBe(true);
    expect(shouldFireAlert(alert, 'level_start', { levelIndex: 2, remainingSeconds: 900, activePlayers: 8, prevActivePlayers: 9 })).toBe(false);
  });

  it('shouldFireAlert: time_remaining triggert bei exakter Sekunde', () => {
    const alert: AlertConfig = { id: 'a2', enabled: true, trigger: 'time_remaining', secondsBefore: 60, text: 'test', voice: true, sound: 'beep' };
    expect(shouldFireAlert(alert, 'time_remaining', { levelIndex: 0, remainingSeconds: 60, activePlayers: 8, prevActivePlayers: 8 })).toBe(true);
    expect(shouldFireAlert(alert, 'time_remaining', { levelIndex: 0, remainingSeconds: 59, activePlayers: 8, prevActivePlayers: 8 })).toBe(false);
  });

  it('shouldFireAlert: player_count triggert nur einmal (beim Übergang)', () => {
    const alert: AlertConfig = { id: 'a3', enabled: true, trigger: 'player_count', playerCount: 5, text: 'test', voice: true, sound: 'beep' };
    // Übergang von 6 auf 5 → triggert
    expect(shouldFireAlert(alert, 'player_count', { levelIndex: 0, remainingSeconds: 900, activePlayers: 5, prevActivePlayers: 6 })).toBe(true);
    // Bleibt bei 5 → triggert nicht nochmal
    expect(shouldFireAlert(alert, 'player_count', { levelIndex: 0, remainingSeconds: 800, activePlayers: 5, prevActivePlayers: 5 })).toBe(false);
  });

  it('disabled Alert triggert nie', () => {
    const alert: AlertConfig = { id: 'a4', enabled: false, trigger: 'level_start', levelIndex: 0, text: 'test', voice: true, sound: 'beep' };
    expect(shouldFireAlert(alert, 'level_start', { levelIndex: 0, remainingSeconds: 900, activePlayers: 8, prevActivePlayers: 9 })).toBe(false);
  });
});
```

---

**Step 5: Commit**

```bash
git add src/domain/types.ts src/domain/alertEngine.ts src/domain/logic.ts tests/events.test.ts
git commit -m "feat: Alert Engine — Typen, shouldFireAlert, interpolateAlertText"
```

---

### Task A4.2 — Alert Engine in useVoiceAnnouncements integrieren

**Ziel:** Custom Alerts werden automatisch gefeuert, wenn die Trigger-Bedingungen erfüllt sind.

**Files:**
- Modify: `src/hooks/useVoiceAnnouncements.ts`
- Modify: `src/App.tsx`
- Test: `tests/hooks.test.tsx`

---

**Step 1: `useVoiceAnnouncements.ts` — Custom Alert Hook**

Neues `useEffect` für Custom Alerts hinzufügen:

```typescript
// Custom Alerts — level_start
useEffect(() => {
  if (status !== 'running') return;
  const alerts = settings.customAlerts ?? [];
  alerts.forEach((alert) => {
    if (
      shouldFireAlert(alert, 'level_start', {
        levelIndex: currentLevelIndex,
        remainingSeconds: remainingSeconds,
        activePlayers: activePlayers,
        prevActivePlayers: prevActivePlayers,
      })
    ) {
      const text = interpolateAlertText(alert.text, { levelIndex: currentLevelIndex, config, activePlayers });
      if (alert.sound !== 'none') playBeep();
      if (alert.voice && text) queueSpeech(text);
    }
  });
}, [currentLevelIndex, status]); // eslint-disable-line

// Custom Alerts — time_remaining
useEffect(() => {
  if (status !== 'running') return;
  const alerts = settings.customAlerts ?? [];
  alerts.forEach((alert) => {
    if (alert.trigger === 'time_remaining') {
      if (shouldFireAlert(alert, 'time_remaining', { levelIndex: currentLevelIndex, remainingSeconds, activePlayers, prevActivePlayers })) {
        const text = interpolateAlertText(alert.text, { levelIndex: currentLevelIndex, config, activePlayers });
        if (alert.sound !== 'none') playBeep();
        if (alert.voice && text) queueSpeech(text);
      }
    }
  });
}, [remainingSeconds]); // eslint-disable-line
```

---

**Step 2: Commit**

```bash
git add src/hooks/useVoiceAnnouncements.ts
git commit -m "feat: Custom Alerts in Voice Announcements integriert"
```

---

### Task A4.3 — AlertEditor Komponente

**Ziel:** UI zum Erstellen, Bearbeiten und Löschen von Custom Alerts im SettingsPanel.

**Files:**
- Create: `src/components/AlertEditor.tsx`
- Modify: `src/components/SettingsPanel.tsx`
- Modify: `src/i18n/translations.ts`

---

**Step 1: Translation-Keys**

```typescript
// DE:
'alerts.title': 'Benutzerdefinierte Ansagen',
'alerts.add': 'Ansage hinzufügen',
'alerts.empty': 'Keine Ansagen konfiguriert',
'alerts.trigger.level_start': 'Level-Start',
'alerts.trigger.time_remaining': 'X Sekunden vor Ende',
'alerts.trigger.break_start': 'Pause beginnt',
'alerts.trigger.player_count': 'Spieleranzahl erreicht',
'alerts.text': 'Ansagetext',
'alerts.textHint': 'Variablen: {level}, {bigBlind}, {smallBlind}, {ante}, {players}',
'alerts.voice': 'Sprachausgabe',
'alerts.sound': 'Sound',
'alerts.delete': 'Löschen',
'alerts.level': 'Level-Nummer',
'alerts.seconds': 'Sekunden vorher',
'alerts.playerCount': 'Spieleranzahl',

// EN:
'alerts.title': 'Custom Announcements',
'alerts.add': 'Add Announcement',
'alerts.empty': 'No announcements configured',
'alerts.trigger.level_start': 'Level Start',
'alerts.trigger.time_remaining': 'X seconds before end',
'alerts.trigger.break_start': 'Break starts',
'alerts.trigger.player_count': 'Player count reached',
'alerts.text': 'Announcement text',
'alerts.textHint': 'Variables: {level}, {bigBlind}, {smallBlind}, {ante}, {players}',
'alerts.voice': 'Text-to-Speech',
'alerts.sound': 'Sound',
'alerts.delete': 'Delete',
'alerts.level': 'Level number',
'alerts.seconds': 'Seconds before',
'alerts.playerCount': 'Player count',
```

---

**Step 2: `src/components/AlertEditor.tsx` erstellen**

```typescript
import { useTranslation } from '../i18n';
import { createDefaultAlert } from '../domain/alertEngine';
import { NumberStepper } from './NumberStepper';
import type { AlertConfig, AlertTrigger } from '../domain/types';

interface Props {
  alerts: AlertConfig[];
  onChange: (alerts: AlertConfig[]) => void;
}

export function AlertEditor({ alerts, onChange }: Props) {
  const { t } = useTranslation();

  const addAlert = () => {
    onChange([...alerts, createDefaultAlert('level_start')]);
  };

  const updateAlert = (id: string, patch: Partial<AlertConfig>) => {
    onChange(alerts.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };

  const deleteAlert = (id: string) => {
    onChange(alerts.filter((a) => a.id !== id));
  };

  const triggers: AlertTrigger[] = ['level_start', 'time_remaining', 'break_start', 'player_count'];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300">{t('alerts.title')}</span>
        <button
          onClick={addAlert}
          className="text-xs px-3 py-1.5 rounded-lg btn-accent-gradient text-white"
        >
          + {t('alerts.add')}
        </button>
      </div>

      {alerts.length === 0 && (
        <p className="text-xs text-gray-500 text-center py-3">{t('alerts.empty')}</p>
      )}

      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="bg-gray-800/50 rounded-xl p-3 space-y-2 border border-gray-700/30"
        >
          {/* Enable toggle */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={alert.enabled}
                onChange={(e) => updateAlert(alert.id, { enabled: e.target.checked })}
                className="w-4 h-4 rounded accent-[var(--accent-500)]"
              />
              <span className="text-xs text-gray-300">
                {t(`alerts.trigger.${alert.trigger}`)}
              </span>
            </label>
            <button
              onClick={() => deleteAlert(alert.id)}
              aria-label={t('alerts.delete')}
              className="text-gray-500 hover:text-red-400 text-xs transition-colors"
            >
              🗑
            </button>
          </div>

          {/* Trigger type */}
          <select
            value={alert.trigger}
            onChange={(e) => updateAlert(alert.id, { trigger: e.target.value as AlertTrigger })}
            className="w-full text-xs bg-gray-700/50 border border-gray-600/40 rounded-lg px-2 py-1 text-gray-200"
          >
            {triggers.map((t) => (
              <option key={t} value={t}>
                {t(`alerts.trigger.${t}`)}
              </option>
            ))}
          </select>

          {/* Trigger-spezifische Felder */}
          {alert.trigger === 'level_start' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{t('alerts.level')}</span>
              <NumberStepper
                value={(alert.levelIndex ?? 0) + 1}
                min={1}
                max={99}
                onChange={(v) => updateAlert(alert.id, { levelIndex: v - 1 })}
              />
            </div>
          )}

          {alert.trigger === 'time_remaining' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{t('alerts.seconds')}</span>
              <NumberStepper
                value={alert.secondsBefore ?? 60}
                min={5}
                max={600}
                step={5}
                onChange={(v) => updateAlert(alert.id, { secondsBefore: v })}
              />
            </div>
          )}

          {alert.trigger === 'player_count' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{t('alerts.playerCount')}</span>
              <NumberStepper
                value={alert.playerCount ?? 5}
                min={1}
                max={99}
                onChange={(v) => updateAlert(alert.id, { playerCount: v })}
              />
            </div>
          )}

          {/* Text */}
          <div>
            <input
              type="text"
              value={alert.text}
              onChange={(e) => updateAlert(alert.id, { text: e.target.value })}
              placeholder={t('alerts.text')}
              className="w-full text-xs bg-gray-700/50 border border-gray-600/40 rounded-lg px-2 py-1.5 text-gray-200 placeholder-gray-500"
            />
            <p className="text-[10px] text-gray-500 mt-1">{t('alerts.textHint')}</p>
          </div>

          {/* Voice + Sound */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={alert.voice}
                onChange={(e) => updateAlert(alert.id, { voice: e.target.checked })}
                className="w-3.5 h-3.5 rounded accent-[var(--accent-500)]"
              />
              <span className="text-xs text-gray-400">{t('alerts.voice')}</span>
            </label>
            <select
              value={alert.sound}
              onChange={(e) => updateAlert(alert.id, { sound: e.target.value as AlertConfig['sound'] })}
              className="text-xs bg-gray-700/50 border border-gray-600/40 rounded-lg px-2 py-1 text-gray-200"
            >
              <option value="none">—</option>
              <option value="beep">Beep</option>
              <option value="chime">Chime</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

**Step 3: In SettingsPanel einbinden**

```typescript
import { AlertEditor } from './AlertEditor';

// In SettingsPanel nach bestehenden Settings-Sektionen:
<CollapsibleSubSection title={t('alerts.title')} defaultOpen={false}>
  <AlertEditor
    alerts={settings.customAlerts ?? []}
    onChange={(alerts) => onSettingsChange({ ...settings, customAlerts: alerts })}
  />
</CollapsibleSubSection>
```

---

**Step 4: Commit**

```bash
git add src/components/AlertEditor.tsx src/components/SettingsPanel.tsx src/i18n/translations.ts
git commit -m "feat: Alert Editor — benutzerdefinierte Ansagen konfigurieren"
```

---

## Phase A5: Display & Advanced Features

### Task A5.1 — Display Mode Screen-Konfiguration

**Ziel:** Im SettingsPanel können Screens aktiviert/deaktiviert und das Rotationsintervall eingestellt werden.

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/components/display/DisplayMode.tsx`
- Modify: `src/components/SettingsPanel.tsx`
- Modify: `src/i18n/translations.ts`
- Test: `tests/edge-cases.test.ts`

---

**Step 1: Typen in `types.ts`**

```typescript
export type DisplayScreenId =
  | 'players'
  | 'stats'
  | 'payout'
  | 'schedule'
  | 'chips'
  | 'seating'
  | 'league';

export interface DisplayScreenConfig {
  id: DisplayScreenId;
  enabled: boolean;
}

// Settings erweitern:
export interface Settings {
  // ...existing fields (NICHT entfernen)...
  displayScreens?: DisplayScreenConfig[];
  displayRotationInterval?: number;  // Sekunden, default: 15
}
```

---

**Step 2: Default-Konfiguration in `configPersistence.ts`**

In `defaultSettings()`:

```typescript
displayScreens: [
  { id: 'players', enabled: true },
  { id: 'stats', enabled: true },
  { id: 'payout', enabled: true },
  { id: 'schedule', enabled: true },
  { id: 'chips', enabled: true },
  { id: 'seating', enabled: true },
  { id: 'league', enabled: true },
],
displayRotationInterval: 15,
```

---

**Step 3: `DisplayMode.tsx` — Screens aus Settings filtern**

```typescript
// Statt fester SCREENS-Liste:
const configuredScreens = settings.displayScreens ?? defaultScreens;
const activeScreens = configuredScreens
  .filter((sc) => sc.enabled)
  .map((sc) => sc.id);

// Rotationsintervall aus Settings:
const rotationInterval = (settings.displayRotationInterval ?? 15) * 1000;
```

---

**Step 4: SettingsPanel — Screen-Checkboxen und Interval**

```typescript
// Neue Sektion in SettingsPanel:
<CollapsibleSubSection title={t('display.screenConfig')} defaultOpen={false}>
  <div className="space-y-2">
    {(['players', 'stats', 'payout', 'schedule', 'chips', 'seating', 'league'] as DisplayScreenId[]).map((screenId) => {
      const screen = (settings.displayScreens ?? []).find((s) => s.id === screenId);
      return (
        <label key={screenId} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={screen?.enabled ?? true}
            onChange={(e) => {
              const updated = (settings.displayScreens ?? defaultDisplayScreens).map((s) =>
                s.id === screenId ? { ...s, enabled: e.target.checked } : s
              );
              onSettingsChange({ ...settings, displayScreens: updated });
            }}
            className="w-4 h-4 rounded accent-[var(--accent-500)]"
          />
          <span className="text-sm text-gray-300">{t(`display.screen.${screenId}`)}</span>
        </label>
      );
    })}
  </div>
  <div className="flex items-center gap-3 mt-3">
    <span className="text-sm text-gray-400">{t('display.rotationInterval')}</span>
    <NumberStepper
      value={settings.displayRotationInterval ?? 15}
      min={5}
      max={60}
      step={5}
      onChange={(v) => onSettingsChange({ ...settings, displayRotationInterval: v })}
    />
    <span className="text-xs text-gray-500">s</span>
  </div>
</CollapsibleSubSection>
```

---

**Step 5: Translation-Keys**

```typescript
// DE:
'display.screenConfig': 'TV-Screens konfigurieren',
'display.rotationInterval': 'Wechselintervall',
'display.screen.players': 'Spieler',
'display.screen.stats': 'Statistiken',
'display.screen.payout': 'Auszahlung',
'display.screen.schedule': 'Blindstruktur',
'display.screen.chips': 'Chips',
'display.screen.seating': 'Sitzplan',
'display.screen.league': 'Liga',

// EN:
'display.screenConfig': 'Configure TV Screens',
'display.rotationInterval': 'Rotation Interval',
'display.screen.players': 'Players',
'display.screen.stats': 'Statistics',
'display.screen.payout': 'Payouts',
'display.screen.schedule': 'Blind Structure',
'display.screen.chips': 'Chips',
'display.screen.seating': 'Seating',
'display.screen.league': 'League',
```

---

**Step 6: Tests**

```typescript
it('DisplayMode zeigt nur aktivierte Screens', () => {
  const settings = { ...defaultSettings(), displayScreens: [{ id: 'players', enabled: true }, { id: 'stats', enabled: false }] };
  // Render DisplayMode und prüfe dass nur Players-Screen in Rotation
  // ...
});
```

---

**Step 7: Commit**

```bash
git add src/domain/types.ts src/domain/configPersistence.ts src/components/display/DisplayMode.tsx src/components/SettingsPanel.tsx src/i18n/translations.ts tests/edge-cases.test.ts
git commit -m "feat: Display Mode — Screen-Konfiguration und Rotationsintervall in Settings"
```

---

### Task A5.2 — Live Turnierdauer-Prognose

**Ziel:** Dynamische Prognose der verbleibenden Turnierdauer basierend auf Spieleranzahl und Avg Stack, angezeigt in TournamentStats und TV Stats-Screen.

**Files:**
- Modify: `src/domain/blinds.ts`
- Modify: `src/domain/logic.ts`
- Modify: `src/components/TournamentStats.tsx`
- Modify: `src/components/display/StatsScreen.tsx`
- Test: `tests/edge-cases.test.ts`

---

**Step 1: `blinds.ts` — `computeLiveRemainingDuration` Funktion**

```typescript
export function computeLiveRemainingDuration(
  levels: Level[],
  currentLevelIndex: number,
  remainingCurrentLevelSeconds: number,
  activePlayers: number
): number {
  // Modell: Spieler-Eliminierungsrate basierend auf historischen Poker-Daten
  // Vereinfachtes Modell: je weniger Spieler, desto schneller die Runden
  const remainingLevels = levels.slice(currentLevelIndex + 1);

  // Restzeit des aktuellen Levels
  let totalSeconds = remainingCurrentLevelSeconds;

  // Durschnittliche Level-Dauer der verbleibenden Levels
  for (const level of remainingLevels) {
    totalSeconds += level.durationSeconds;
  }

  // Anpassungsfaktor basierend auf Spieleranzahl
  // Mehr Spieler → Turnier dauert proportional länger
  // Referenz: 9 Spieler = Faktor 1.0
  const playerFactor = Math.max(0.3, Math.min(2.0, activePlayers / 9));

  return Math.round(totalSeconds * playerFactor);
}
```

---

**Step 2: `logic.ts` Barrel-Export ergänzen**

```typescript
export { computeLiveRemainingDuration } from './blinds';
```

---

**Step 3: `TournamentStats.tsx` — Live-Prognose anzeigen**

```typescript
// Neue Props:
liveRemainingSeconds: number;

// Im JSX, neben der bestehenden Zeitanzeige:
<span title={t('stats.liveEstimate')}>
  ~{formatElapsedTime(liveRemainingSeconds)}
</span>
```

---

**Step 4: Tests**

```typescript
describe('computeLiveRemainingDuration', () => {
  it('gibt verbleibende Sekunden zurück', () => {
    const levels = [
      { type: 'play', durationSeconds: 900, smallBlind: 100, bigBlind: 200, ante: 0 },
      { type: 'play', durationSeconds: 900, smallBlind: 200, bigBlind: 400, ante: 0 },
      { type: 'break', durationSeconds: 600 },
    ];
    const result = computeLiveRemainingDuration(levels, 0, 450, 9);
    // 450 (current remaining) + 900 + 900 + 600 = 2850, * 1.0 (9 players)
    expect(result).toBe(2850);
  });

  it('skaliert mit Spieleranzahl', () => {
    const levels = [{ type: 'play', durationSeconds: 900, smallBlind: 100, bigBlind: 200, ante: 0 }];
    const with9 = computeLiveRemainingDuration(levels, 0, 900, 9);
    const with4 = computeLiveRemainingDuration(levels, 0, 900, 4);
    expect(with4).toBeLessThan(with9);
  });
});
```

---

**Step 5: Commit**

```bash
git add src/domain/blinds.ts src/domain/logic.ts src/components/TournamentStats.tsx src/components/display/StatsScreen.tsx tests/edge-cases.test.ts
git commit -m "feat: Live Turnierdauer-Prognose basierend auf Spieleranzahl"
```

---

### Task A5.3 — Multi-Table: Per-Table Dealer Tracking

**Ziel:** Jeder Tisch hat einen eigenen Dealer-Index, der beim Eliminieren und Balancieren korrekt fortgeschrieben wird.

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/domain/tables.ts`
- Modify: `src/domain/logic.ts`
- Modify: `src/components/MultiTablePanel.tsx`
- Test: `tests/logic.test.ts`

---

**Step 1: `Table` Interface erweitern**

```typescript
export interface Table {
  // ...existing fields (NICHT entfernen)...
  dealerPlayerId?: string | null;  // NEU: welcher Spieler hat den Dealer-Button
}
```

---

**Step 2: `tables.ts` — `advanceTableDealer` Funktion**

```typescript
export function advanceTableDealer(
  table: Table,
  activePlayers: Player[]
): Table {
  const tableActivePlayers = activePlayers.filter((p) =>
    table.seats.some((s) => s.playerId === p.id && p.status === 'active')
  );

  if (tableActivePlayers.length === 0) return table;

  const currentIdx = tableActivePlayers.findIndex(
    (p) => p.id === table.dealerPlayerId
  );
  const nextIdx = (currentIdx + 1) % tableActivePlayers.length;

  return {
    ...table,
    dealerPlayerId: tableActivePlayers[nextIdx].id,
  };
}

export function getTableDealer(table: Table, players: Player[]): Player | undefined {
  if (!table.dealerPlayerId) return undefined;
  return players.find((p) => p.id === table.dealerPlayerId);
}
```

---

**Step 3: MultiTablePanel — Dealer-Button pro Tisch**

Neben dem Tisch-Header einen "Dealer weiter"-Button pro Tisch hinzufügen:

```typescript
<button
  onClick={() => onAdvanceTableDealer(table.id)}
  title="Dealer weiterrücken"
  className="text-xs text-gray-400 hover:text-white px-2"
>
  D→
</button>
```

---

**Step 4: Tests**

```typescript
it('advanceTableDealer setzt nächsten aktiven Spieler als Dealer', () => {
  const table: Table = {
    id: 't1', name: 'Table 1', maxSeats: 9,
    seats: [
      { seatNumber: 1, playerId: 'p1' },
      { seatNumber: 2, playerId: 'p2' },
      { seatNumber: 3, playerId: 'p3' },
    ],
    status: 'active', dealerSeat: null, dealerPlayerId: 'p1',
  };
  const players = [
    { id: 'p1', name: 'Alice', status: 'active' },
    { id: 'p2', name: 'Bob', status: 'active' },
    { id: 'p3', name: 'Charlie', status: 'active' },
  ];
  const updated = advanceTableDealer(table, players);
  expect(updated.dealerPlayerId).toBe('p2');
});

it('advanceTableDealer überspringt eliminierte Spieler', () => {
  // p2 ist eliminiert
  // p1 ist Dealer → nächster sollte p3 sein
});
```

---

**Step 5: Commit**

```bash
git add src/domain/types.ts src/domain/tables.ts src/domain/logic.ts src/components/MultiTablePanel.tsx tests/logic.test.ts
git commit -m "feat: Multi-Table — tischspezifischer Dealer-Button"
```

---

### Task A5.4 — Table-aware Random Seating

**Ziel:** "Sitzplätze auslosen"-Funktion in der Setup-Phase verteilt Spieler gleichmäßig auf konfigurierte Tische.

**Files:**
- Modify: `src/domain/tables.ts`
- Modify: `src/domain/logic.ts`
- Modify: `src/components/PlayerManager.tsx`
- Test: `tests/logic.test.ts`

---

**Step 1: `tables.ts` — `randomlySeatedDistribution` Funktion**

```typescript
export function shufflePlayersToTables(
  playerIds: string[],
  tables: Table[]
): Table[] {
  // Fisher-Yates shuffle
  const shuffled = [...playerIds];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Verteile auf Tische mit distributePlayersToTables (bereits vorhanden)
  return distributePlayersToTables(shuffled, tables);
}
```

---

**Step 2: PlayerManager — "Zufällig auslosen"-Button (Multi-Table)**

```typescript
// Nur sichtbar wenn multiTable aktiviert:
{config.multiTable?.enabled && (
  <button
    onClick={onShuffleToTables}
    className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700/40 text-gray-300 hover:text-white"
  >
    🎲 {t('players.shuffleToTables')}
  </button>
)}
```

---

**Step 3: Tests**

```typescript
it('shufflePlayersToTables verteilt alle Spieler', () => {
  const playerIds = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
  const tables = [
    createTable('Table 1', 9),
    createTable('Table 2', 9),
  ];
  const result = shufflePlayersToTables(playerIds, tables);
  const seatedIds = result.flatMap((t) => t.seats.map((s) => s.playerId).filter(Boolean));
  expect(seatedIds).toHaveLength(6);
  expect(new Set(seatedIds).size).toBe(6); // keine Duplikate
});

it('shufflePlayersToTables verteilt gleichmäßig', () => {
  const playerIds = Array.from({ length: 10 }, (_, i) => `p${i}`);
  const tables = [createTable('T1', 9), createTable('T2', 9)];
  const result = shufflePlayersToTables(playerIds, tables);
  const counts = result.map((t) => t.seats.filter((s) => s.playerId).length);
  expect(Math.abs(counts[0] - counts[1])).toBeLessThanOrEqual(1);
});
```

---

**Step 4: Commit**

```bash
git add src/domain/tables.ts src/domain/logic.ts src/components/PlayerManager.tsx src/i18n/translations.ts tests/logic.test.ts
git commit -m "feat: Table-aware Random Seating — Spieler zufällig auf Tische auslosen"
```

---

## Phase A6: Optional — Custom Audio Upload

### Task A6.1 — Custom Audio: IndexedDB Blob Storage

**Hinweis:** Diese Phase ist komplex und optional. Sie erfordert File System Access API für Upload und Blob-Storage in IndexedDB.

**Files:**
- Create: `src/domain/audioLibrary.ts`
- Modify: `src/domain/storage.ts`
- Modify: `src/domain/speech.ts`
- Create: `src/components/AudioLibrary.tsx`

---

**Step 1: Storage Layer — Blobs speichern**

```typescript
// In storage.ts:
// Neuer Store 'audioBlobs' mit keyPath 'name'
// Vorsicht: Blobs können groß sein, Storage-Quota prüfen

export interface AudioBlobEntry {
  name: string;          // z.B. 'custom-level-start'
  blob: Blob;
  mimeType: string;      // 'audio/mp3' oder 'audio/wav'
  createdAt: number;
}

export async function saveAudioBlob(entry: AudioBlobEntry): Promise<void>
export async function loadAudioBlob(name: string): Promise<Blob | null>
export async function deleteAudioBlob(name: string): Promise<void>
export async function listAudioBlobs(): Promise<AudioBlobEntry[]>
```

---

**Step 2: `audioLibrary.ts` — Upload und Playback**

```typescript
export async function uploadAudioFile(file: File, name: string): Promise<void> {
  // Validierung: nur audio/* MIME-Typen, max 5MB
  if (!file.type.startsWith('audio/')) {
    throw new Error('Nur Audio-Dateien erlaubt');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Datei zu groß (max 5MB)');
  }
  await saveAudioBlob({ name, blob: file, mimeType: file.type, createdAt: Date.now() });
}

export async function playCustomAudio(name: string): Promise<void> {
  const blob = await loadAudioBlob(name);
  if (!blob) throw new Error(`Audio '${name}' nicht gefunden`);
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.onended = () => URL.revokeObjectURL(url);
  await audio.play();
}
```

---

**Step 3: `speech.ts` — Custom Audio vor Standard-Fallback prüfen**

In den Announcement-Funktionen: vor MP3-Playback prüfen ob ein Custom-Audio für diesen Key existiert.

---

**Step 4: Commit**

```bash
git add src/domain/audioLibrary.ts src/domain/storage.ts src/domain/speech.ts src/components/AudioLibrary.tsx
git commit -m "feat: Custom Audio Upload — IndexedDB Blob Storage für eigene Sounds"
```

---

# TRACK B — Technische Schulden

---

## Phase B1: State Management Vereinfachung

### Task B1.1 — GameModeProps Konsolidierung

**Ziel:** Die 39 einzelnen Props an `GameModeContainer` durch 5 typisierte Objekte ersetzen. Keine Logikänderungen — nur Struktur.

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/components/modes/GameModeContainer.tsx`
- Modify: `src/App.tsx`
- Test: `tests/components.test.tsx` (muss weiterhin grün sein)

---

**Step 1: Neue Interface-Typen in `types.ts`**

```typescript
// ─── Game Mode Props Interfaces ─────────────────────────────────────────────

export interface TournamentStateProps {
  config: TournamentConfig;
  activePlayerCount: number;
  prizePool: number;
  averageStack: number;
  isRebuyOpen: boolean;
  isAddOnOpen: boolean;
  isBubble: boolean;
  isItm: boolean;
  paidPlaces: number;
  colorUpMap: Map<number, string[]>;
  totalRebuys: number;
  totalAddOns: number;
}

export interface GameUiStateProps {
  showPlayerPanel: boolean;
  showSidebar: boolean;
  cleanView: boolean;
  lastHandActive: boolean;
  handForHandActive: boolean;
  showCallTheClock: boolean;
  showDealerBadges: boolean;
  sidePotData: SidePot[] | null;
  recentTableMoves: TableMove[];
}

export interface TournamentActionProps {
  onEliminatePlayer: (playerId: string, eliminatorId?: string) => void;
  onRebuy: (playerId: string) => void;
  onAddOn: (playerId: string) => void;
  onReinstate: (playerId: string) => void;
  onAdvanceDealer: () => void;
  onLateRegister: (player: Player) => void;
  onReEntry: (playerId: string) => void;
  onToggleCleanView: () => void;
  onToggleLastHand: () => void;
  onToggleHandForHand: () => void;
  onUpdatePlayerChips: (playerId: string, chips: number) => void;
  onInitializeStacks: () => void;
  onBalanceTables: () => void;
  onSidePotResultChange: (pots: SidePot[] | null) => void;
  onShowPayoutOverlay: () => void;
  onShowTournamentLog: () => void;
}
```

---

**Step 2: `GameModeContainer.tsx` Props-Interface umschreiben**

```typescript
interface Props {
  tournament: TournamentStateProps;
  timer: ReturnType<typeof useTimer>;
  ui: GameUiStateProps;
  actions: TournamentActionProps;
  settings: Settings;
  onSwitchToSetup: () => void;
  onFinishTournament: () => void;
  tournamentEvents: TournamentEvent[];
}
```

Intern: alle bestehenden Prop-Referenzen durch `props.tournament.xxx`, `props.actions.xxx`, etc. ersetzen.

---

**Step 3: App.tsx — Props-Objekte zusammenbauen**

```typescript
const tournamentStateProps: TournamentStateProps = useMemo(() => ({
  config,
  activePlayerCount,
  prizePool,
  averageStack,
  isRebuyOpen,
  isAddOnOpen,
  isBubble,
  isItm,
  paidPlaces,
  colorUpMap,
  totalRebuys,
  totalAddOns,
}), [config, activePlayerCount, /* ...alle Deps */]);

const gameUiStateProps: GameUiStateProps = useMemo(() => ({
  showPlayerPanel,
  showSidebar,
  cleanView,
  lastHandActive,
  handForHandActive,
  showCallTheClock,
  showDealerBadges,
  sidePotData,
  recentTableMoves,
}), [showPlayerPanel, showSidebar, /* ...alle Deps */]);

// TournamentActionProps: alle Callbacks (useCallback-Refs, keine deps nötig)
```

---

**Step 4: Tests ausführen — ALLE grün**

```bash
npm run test
```

Alle 966+ Tests müssen grün sein. Kein Logikänderung, nur Struktur.

---

**Step 5: Commit**

```bash
git add src/domain/types.ts src/components/modes/GameModeContainer.tsx src/App.tsx
git commit -m "refactor: GameModeProps — 39 einzelne Props → 5 typisierte Objekte"
```

---

## Phase B2: UX-Verbesserungen

### Task B2.1 — Player Stack: NumberStepper statt nativen Input

**Ziel:** Das native `<input type="number">` für Chip-Stacks im PlayerPanel durch `NumberStepper` ersetzen.

**Files:**
- Modify: `src/components/PlayerPanel.tsx`
- Test: `tests/components.test.tsx`

---

**Step 1: In `PlayerPanel.tsx` Stack-Input ersetzen**

Suche alle `<input type="number"` für Stack-Bearbeitung und ersetze durch:

```typescript
import { NumberStepper } from './NumberStepper';

// Statt:
<input
  type="number"
  value={player.chips ?? 0}
  onChange={(e) => onUpdatePlayerChips(player.id, Number(e.target.value))}
  inputMode="numeric"
  className="..."
/>

// Neu:
<NumberStepper
  value={player.chips ?? 0}
  min={0}
  step={100}
  onChange={(v) => onUpdatePlayerChips(player.id, v)}
/>
```

---

**Step 2: Test**

```typescript
it('Stack-Eingabe akzeptiert Wert-Änderung', async () => {
  // Render PlayerPanel mit Spieler mit chips: 5000
  // NumberStepper-Button klicken → Wert ändert sich
  // onUpdatePlayerChips wird mit korrektem Wert aufgerufen
});
```

---

**Step 3: Commit**

```bash
git add src/components/PlayerPanel.tsx tests/components.test.tsx
git commit -m "refactor: Player Stack — NumberStepper statt nativen number Input"
```

---

### Task B2.2 — Settings Panel Reorganisation

**Ziel:** Das SettingsPanel ist bei vielen Optionen unübersichtlich. Klare Abschnitte mit CollapsibleSubSection strukturieren.

**Files:**
- Modify: `src/components/SettingsPanel.tsx`

---

**Step 1: Abschnitte strukturieren**

```typescript
// Aktuelle flache Liste → Gruppierung:

// Gruppe 1: Audio & Ansagen (standardmäßig offen)
//   - Sound An/Aus
//   - Lautstärke
//   - Sprachansagen (Voice)
//   - Countdown-Beeps
//   - Benutzerdefinierte Ansagen (AlertEditor)

// Gruppe 2: Timer & Spielfluss (standardmäßig offen)
//   - Auto-Advance
//   - Countdown-Anzeige
//   - Call-the-Clock Dauer

// Gruppe 3: Darstellung (standardmäßig eingeklappt)
//   - Akzentfarbe
//   - Hintergrundmuster
//   - TV-Screen Konfiguration
//   - Dealer-Badges anzeigen
```

Jede Gruppe mit `<CollapsibleSubSection>` wrappen.

---

**Step 2: Commit**

```bash
git add src/components/SettingsPanel.tsx
git commit -m "refactor: SettingsPanel — Abschnitte mit CollapsibleSubSection gruppiert"
```

---

## Phase B3: Reliability

### Task B3.1 — Speech Queue Robustheit

**Ziel:** Die `onend`-basierte Speech Queue kann Announcements verlieren wenn der Browser busy ist. Fallback-Timer sichert die Queue ab.

**Files:**
- Modify: `src/domain/speech.ts`
- Test: `tests/sound-speech.test.ts`

---

**Step 1: Queue mit Timeout-Fallback absichern**

In `speech.ts`, in der Queue-Processing-Logik:

```typescript
let queueTimeoutId: ReturnType<typeof setTimeout> | null = null;

function processNext(): void {
  // ...existing processing...

  // Fallback: wenn onend nach 30s nicht feuert, nächstes Item starten
  if (queueTimeoutId) clearTimeout(queueTimeoutId);
  queueTimeoutId = setTimeout(() => {
    console.warn('[speech] onend timeout — forcing next item');
    processNext();
  }, 30_000);

  utterance.onend = () => {
    if (queueTimeoutId) clearTimeout(queueTimeoutId);
    queueTimeoutId = null;
    processNext();
  };

  utterance.onerror = (e) => {
    console.error('[speech] utterance error:', e);
    if (queueTimeoutId) clearTimeout(queueTimeoutId);
    queueTimeoutId = null;
    processNext(); // trotzdem weiter
  };
}
```

---

**Step 2: Audio Queue (MP3) — Gleiches Pattern**

In `audioPlayer.ts`, beim `source.onended`-Handler:

```typescript
let audioTimeoutId: ReturnType<typeof setTimeout> | null = null;

source.onended = () => {
  if (audioTimeoutId) clearTimeout(audioTimeoutId);
  audioTimeoutId = null;
  playNext();
};

// Fallback nach maximaler Dauer + Buffer:
const maxDuration = (buffer.duration * 1000) + 2000; // Puffer 2s
audioTimeoutId = setTimeout(() => {
  console.warn('[audioPlayer] onended timeout — forcing next');
  source.stop();
  playNext();
}, maxDuration);
```

---

**Step 3: Tests**

```typescript
it('Speech Queue setzt sich nach Fehler fort', async () => {
  // Utterance mit onerror simulieren
  // Queue sollte nächstes Item spielen
  // Kein "Hängenbleiben" der Queue
});
```

---

**Step 4: Commit**

```bash
git add src/domain/speech.ts src/domain/audioPlayer.ts tests/sound-speech.test.ts
git commit -m "fix: Speech Queue — Timeout-Fallback verhindert Hängenbleiben bei Browser-Busy"
```

---

### Task B3.2 — i18n-Parität automatisch sicherstellen

**Ziel:** Neuer Test der automatisch prüft, dass jeder neue DE-Key auch einen EN-Key hat (und umgekehrt).

**Files:**
- Modify: `tests/i18n.test.ts`

---

**Step 1: Parity-Test robuster machen**

```typescript
it('alle DE-Keys haben EN-Entsprechung und umgekehrt', () => {
  const deKeys = new Set(Object.keys(de));
  const enKeys = new Set(Object.keys(en));

  const missingInEn = [...deKeys].filter((k) => !enKeys.has(k));
  const missingInDe = [...enKeys].filter((k) => !deKeys.has(k));

  expect(missingInEn, `Fehlende EN-Keys: ${missingInEn.join(', ')}`).toHaveLength(0);
  expect(missingInDe, `Fehlende DE-Keys: ${missingInDe.join(', ')}`).toHaveLength(0);
});
```

Dieser Test schlägt sofort fehl wenn ein neuer Key nur in einer Sprache hinzugefügt wird.

---

**Step 2: Commit**

```bash
git add tests/i18n.test.ts
git commit -m "test: i18n-Parität — automatische Prüfung bei jedem neuen Translation-Key"
```

---

# Abschluss-Checks nach jeder Phase

Nach jeder abgeschlossenen Phase:

```bash
# 1. Alle Tests ausführen
npm run test

# 2. Lint
npm run lint

# 3. Build prüfen
npm run build

# 4. Test-Count dokumentieren
# In CLAUDE.md und CHANGELOG.md die neue Testzahl eintragen
```

---

# Test-Count Tracking

| Phase | Neue Tests | Gesamt (Schätzung) |
|-------|------------|-------------------|
| Ausgangspunkt | — | 966 |
| A1 (Event Log + Payout Calc) | +30 | ~996 |
| A2 (Remote Hardening) | +8 | ~1004 |
| A3 (Break Engine) | +8 | ~1012 |
| A4 (Alert Engine) | +15 | ~1027 |
| A5 (Display + Advanced) | +20 | ~1047 |
| B1–B3 (Tech Debt) | +10 | ~1057 |
| **Gesamt** | **~91 neue Tests** | **~1057** |

---

# Dateistruktur nach Umsetzung

```
src/
├── domain/
│   ├── tournamentEvents.ts   [NEU] Event-Log Modul
│   ├── alertEngine.ts        [NEU] Custom Alert Engine
│   ├── audioLibrary.ts       [NEU] Custom Audio Upload
│   └── (alle bestehenden Module unverändert)
├── components/
│   ├── TournamentLog.tsx     [NEU] Event-Log Anzeige
│   ├── PayoutOverlay.tsx     [NEU] Interaktiver Payout Calculator
│   ├── AlertEditor.tsx       [NEU] Custom Alerts konfigurieren
│   ├── AudioLibrary.tsx      [NEU] Custom Audio verwalten (Phase A6)
│   └── (alle bestehenden Komponenten, teils erweitert)
├── hooks/
│   └── (alle bestehenden Hooks, teils erweitert)
└── (Rest unverändert)

tests/
├── events.test.ts            [NEU] Event Log + Alert Engine Tests
└── (alle bestehenden Test-Dateien, erweitert)
```
