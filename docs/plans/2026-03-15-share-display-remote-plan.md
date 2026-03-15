# Share / Display / Remote — Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable cross-device tournament display via PeerJS and provide a central Share Hub for all connection options.

**Architecture:** Extend existing PeerJS infrastructure (from Remote Control) to support multiple display connections alongside the existing single remote connection. A hello-handshake differentiates roles. New `CrossDeviceDisplay` component connects via PeerJS and renders the existing `DisplayMode`. A `ShareHub` modal centralizes all sharing/display options.

**Tech Stack:** React 19, TypeScript strict, PeerJS (existing dep), Tailwind CSS 4, Vitest

---

### Task 1: Extend remote.ts — Multi-Role Session Support

Add hello-handshake protocol, display URL building/parsing, and multi-connection support to RemoteHost.

**Files:**
- Modify: `src/domain/remote.ts`
- Test: `tests/logic.test.ts`

**Step 1: Write failing tests for display URL functions**

Add to `tests/logic.test.ts` after the existing remote test block (~line 6438):

```typescript
describe('remote — display URL functions', () => {
  it('buildDisplayUrl includes peer ID as hash parameter', () => {
    const url = buildDisplayUrl('PKR-ABCDE');
    expect(url).toContain('#display=PKR-ABCDE');
  });

  it('buildDisplayUrl uses correct base URL', () => {
    const url = buildDisplayUrl('PKR-ABCDE');
    expect(url).toMatch(/^https?:\/\/.+#display=PKR-ABCDE$/);
  });

  it('parseDisplayHash extracts valid peer ID', () => {
    expect(parseDisplayHash('#display=PKR-AB3D5')).toEqual({ peerId: 'PKR-AB3D5' });
  });

  it('parseDisplayHash returns null for invalid format', () => {
    expect(parseDisplayHash('#display=invalid')).toBeNull();
    expect(parseDisplayHash('#display=')).toBeNull();
    expect(parseDisplayHash('#remote=PKR-AB3D5')).toBeNull();
  });

  it('parseDisplayHash returns null for missing prefix', () => {
    expect(parseDisplayHash('#PKR-AB3D5')).toBeNull();
    expect(parseDisplayHash('')).toBeNull();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm run test -- --reporter=verbose 2>&1 | tail -20`
Expected: FAIL — `buildDisplayUrl` and `parseDisplayHash` not found

**Step 3: Implement display URL functions in remote.ts**

Add after `parseRemoteHash` function (~line 206):

```typescript
/* ── Display URL helpers ──────────────────────────────────── */

export interface DisplayHashResult {
  peerId: string;
}

/**
 * Build a URL that opens the app in cross-device display mode.
 * Uses the same base URL logic as buildRemoteUrl.
 */
export function buildDisplayUrl(peerId: string): string {
  const base = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}`
    : 'https://7mountainpoker.vercel.app/';
  return `${base}#display=${peerId}`;
}

/**
 * Parse #display=PKR-XXXXX hash from URL.
 * Returns null if hash does not match expected format.
 */
export function parseDisplayHash(hash: string): DisplayHashResult | null {
  if (!hash.startsWith('#display=')) return null;
  const peerId = hash.slice('#display='.length);
  if (!/^PKR-[A-Z2-9]{5}$/.test(peerId)) return null;
  return { peerId };
}
```

**Step 4: Run tests to verify they pass**

Run: `npm run test -- --reporter=verbose 2>&1 | tail -20`
Expected: PASS

**Step 5: Write failing tests for hello message types**

Add to `tests/logic.test.ts`:

```typescript
describe('remote — hello handshake', () => {
  it('isHelloMessage validates display hello', () => {
    expect(isHelloMessage({ type: 'hello', role: 'display', version: 2 })).toBe(true);
  });

  it('isHelloMessage validates remote hello', () => {
    expect(isHelloMessage({ type: 'hello', role: 'remote', version: 2 })).toBe(true);
  });

  it('isHelloMessage rejects invalid messages', () => {
    expect(isHelloMessage({ type: 'command', action: 'play' })).toBe(false);
    expect(isHelloMessage({ type: 'hello' })).toBe(false);
    expect(isHelloMessage({ type: 'hello', role: 'spectator', version: 2 })).toBe(false);
    expect(isHelloMessage(null)).toBe(false);
  });
});
```

**Step 6: Implement hello message type guard**

Add to `remote.ts` after the display URL functions:

```typescript
/* ── Hello Handshake Protocol ─────────────────────────────── */

export type SessionRole = 'display' | 'remote';

export interface HelloMessage {
  type: 'hello';
  role: SessionRole;
  version: number;
}

export function isHelloMessage(msg: unknown): msg is HelloMessage {
  if (!msg || typeof msg !== 'object') return false;
  const m = msg as Record<string, unknown>;
  return (
    m.type === 'hello' &&
    (m.role === 'display' || m.role === 'remote') &&
    typeof m.version === 'number'
  );
}
```

**Step 7: Run tests — all should pass**

Run: `npm run test -- --reporter=verbose 2>&1 | tail -20`

**Step 8: Extend RemoteHost for multi-connection**

In `remote.ts`, modify the `RemoteHost` class:

1. Add a `displayConnections` map alongside the existing single `connection`:

```typescript
// Add to RemoteHost class properties (after existing connection field ~line 340):
private displayConnections: Map<string, DataConnection> = new Map();
```

2. Add a `displayCount` getter:

```typescript
get displayCount(): number {
  return this.displayConnections.size;
}
```

3. Add an `onDisplayCountChange` callback to `RemoteHostCallbacks`:

```typescript
// Extend RemoteHostCallbacks interface:
export interface RemoteHostCallbacks {
  onCommand: (cmd: RemoteCommand) => void;
  onStatusChange: (status: HostStatus) => void;
  onDisplayCountChange?: (count: number) => void;
}
```

4. Add `sendDisplayState` method that broadcasts to all display peers:

```typescript
/**
 * Broadcast display state to all connected display peers.
 * Uses the DisplayMessage format (same as BroadcastChannel).
 */
sendDisplayState(payload: unknown): void {
  for (const [peerId, conn] of this.displayConnections) {
    try {
      if (conn.open) conn.send(payload);
    } catch {
      this.displayConnections.delete(peerId);
    }
  }
  this.callbacks.onDisplayCountChange?.(this.displayConnections.size);
}
```

5. Modify the connection handler (`setupConnection` or equivalent) to check for hello message:

In the existing connection setup code, add hello message routing at the start of `handleIncoming`:

```typescript
// At the top of handleIncoming (before existing command processing):
if (isHelloMessage(data)) {
  if (data.role === 'display') {
    // Register as display peer
    this.displayConnections.set(connection.peer, connection);
    this.callbacks.onDisplayCountChange?.(this.displayConnections.size);
    // Clean up on close
    connection.on('close', () => {
      this.displayConnections.delete(connection.peer);
      this.callbacks.onDisplayCountChange?.(this.displayConnections.size);
    });
    return; // Don't process as remote command
  }
  // role === 'remote' → continue with existing remote connection logic
  return;
}
```

6. Clean up display connections in `destroy()`:

```typescript
// Add to destroy() method:
for (const conn of this.displayConnections.values()) {
  try { conn.close(); } catch { /* ignore */ }
}
this.displayConnections.clear();
```

**Step 9: Add export for new functions**

Ensure `buildDisplayUrl`, `parseDisplayHash`, `isHelloMessage`, `SessionRole`, `HelloMessage`, `DisplayHashResult` are exported from `remote.ts`.

**Step 10: Run all tests**

Run: `npm run test 2>&1 | tail -5`
Expected: All tests pass

**Step 11: Run lint + build**

Run: `npm run lint && npm run build 2>&1 | tail -5`

**Step 12: Commit**

```bash
git add src/domain/remote.ts tests/logic.test.ts
git commit -m "feat: add multi-role session support to RemoteHost

- Display URL building/parsing (buildDisplayUrl, parseDisplayHash)
- Hello handshake protocol (isHelloMessage, SessionRole)
- Multi-connection support for display peers in RemoteHost
- Display peers receive broadcast state, remote peers handle commands"
```

---

### Task 2: CrossDeviceDisplay Component

PeerJS-based display client that connects to a host and renders DisplayMode.

**Files:**
- Create: `src/components/display/CrossDeviceDisplay.tsx`
- Modify: `src/components/display/index.ts` (barrel export)

**Step 1: Create CrossDeviceDisplay component**

Create `src/components/display/CrossDeviceDisplay.tsx`:

```typescript
import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import type { DisplayStatePayload } from '../../domain/displayChannel';
import { deserializeColorUpMap } from '../../domain/displayChannel';
import { useTranslation } from '../../i18n';
import { LoadingFallback } from '../LoadingFallback';

const DisplayMode = lazy(() =>
  import('./DisplayMode').then((m) => ({ default: m.DisplayMode })),
);
const CallTheClock = lazy(() =>
  import('../CallTheClock').then((m) => ({ default: m.CallTheClock })),
);

/** Message types matching displayChannel.ts DisplayMessage format */
interface DisplayMsg {
  type: 'full-state' | 'timer-tick' | 'call-the-clock' | 'call-the-clock-dismiss' | 'close';
  payload?: unknown;
}

interface TimerTick {
  remainingSeconds: number;
  status: 'stopped' | 'running' | 'paused';
  currentLevelIndex: number;
}

interface CtcPayload {
  durationSeconds: number;
  soundEnabled: boolean;
  voiceEnabled: boolean;
}

type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'error';

interface Props {
  hostPeerId: string;
}

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAYS = [2000, 4000, 8000];

export function CrossDeviceDisplay({ hostPeerId }: Props) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [state, setState] = useState<DisplayStatePayload | null>(null);
  const [timerTick, setTimerTick] = useState<TimerTick | null>(null);
  const [ctcPayload, setCtcPayload] = useState<CtcPayload | null>(null);
  const peerRef = useRef<import('peerjs').default | null>(null);
  const connRef = useRef<import('peerjs').DataConnection | null>(null);
  const reconnectAttemptRef = useRef(0);
  const destroyedRef = useRef(false);

  // Timer interpolation (same pattern as RemoteControllerView)
  const [displaySeconds, setDisplaySeconds] = useState<number | null>(null);
  const lastTickRef = useRef<{ seconds: number; status: string; at: number } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const tick = lastTickRef.current;
      if (!tick) return;
      if (tick.status === 'running') {
        const elapsed = (Date.now() - tick.at) / 1000;
        setDisplaySeconds(Math.max(0, Math.floor(tick.seconds - elapsed)));
      } else {
        setDisplaySeconds(Math.floor(tick.seconds));
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const connect = useCallback(async () => {
    if (destroyedRef.current) return;
    const PeerJS = (await import('peerjs')).default;
    const peer = new PeerJS();
    peerRef.current = peer;

    peer.on('open', () => {
      if (destroyedRef.current) return;
      const conn = peer.connect(hostPeerId, { reliable: true });
      connRef.current = conn;

      conn.on('open', () => {
        if (destroyedRef.current) return;
        // Send hello handshake
        conn.send({ type: 'hello', role: 'display', version: 2 });
        setStatus('connected');
        reconnectAttemptRef.current = 0;
      });

      conn.on('data', (raw: unknown) => {
        const msg = raw as DisplayMsg;
        if (!msg || typeof msg !== 'object' || !('type' in msg)) return;
        switch (msg.type) {
          case 'full-state':
            setState(msg.payload as DisplayStatePayload);
            setTimerTick(null);
            lastTickRef.current = null;
            break;
          case 'timer-tick': {
            const tick = msg.payload as TimerTick;
            setTimerTick(tick);
            lastTickRef.current = { seconds: tick.remainingSeconds, status: tick.status, at: Date.now() };
            break;
          }
          case 'call-the-clock':
            setCtcPayload(msg.payload as CtcPayload);
            break;
          case 'call-the-clock-dismiss':
            setCtcPayload(null);
            break;
          case 'close':
            window.close();
            break;
        }
      });

      conn.on('close', () => {
        if (destroyedRef.current) return;
        handleDisconnect();
      });

      conn.on('error', () => {
        if (destroyedRef.current) return;
        handleDisconnect();
      });
    });

    peer.on('error', () => {
      if (destroyedRef.current) return;
      handleDisconnect();
    });
  }, [hostPeerId]);

  const handleDisconnect = useCallback(() => {
    const attempt = reconnectAttemptRef.current;
    if (attempt >= MAX_RECONNECT_ATTEMPTS) {
      setStatus('error');
      return;
    }
    setStatus('reconnecting');
    reconnectAttemptRef.current = attempt + 1;
    // Clean up old peer
    try { peerRef.current?.destroy(); } catch { /* ignore */ }
    peerRef.current = null;
    connRef.current = null;
    // Reconnect with exponential backoff
    setTimeout(() => {
      if (!destroyedRef.current) connect();
    }, RECONNECT_DELAYS[attempt] ?? 8000);
  }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      destroyedRef.current = true;
      try { connRef.current?.close(); } catch { /* ignore */ }
      try { peerRef.current?.destroy(); } catch { /* ignore */ }
    };
  }, [connect]);

  // Request fullscreen on first click
  useEffect(() => {
    const handler = () => {
      try { document.documentElement.requestFullscreen?.(); } catch { /* ignore */ }
      document.removeEventListener('click', handler);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // Force dark mode for display
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Apply timer tick overlay
  const effectiveState = useMemo(() => {
    if (!state) return null;
    const s = { ...state };
    if (timerTick) {
      s.timerState = {
        ...s.timerState,
        remainingSeconds: displaySeconds ?? timerTick.remainingSeconds,
        status: timerTick.status as 'stopped' | 'running' | 'paused',
        currentLevelIndex: timerTick.currentLevelIndex,
      };
    } else if (displaySeconds !== null) {
      s.timerState = { ...s.timerState, remainingSeconds: displaySeconds };
    }
    return s;
  }, [state, timerTick, displaySeconds]);

  // Connection status overlay
  if (status === 'connecting') {
    return (
      <div className="fixed inset-0 bg-gray-950 flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="animate-pulse text-4xl">📺</div>
          <p className="text-xl">{t('share.display.connecting' as Parameters<typeof t>[0])}</p>
          <p className="text-sm text-gray-400">{hostPeerId}</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="fixed inset-0 bg-gray-950 flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <p className="text-xl text-red-400">{t('share.display.connectionError' as Parameters<typeof t>[0])}</p>
          <button
            onClick={() => { reconnectAttemptRef.current = 0; setStatus('connecting'); connect(); }}
            className="px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium"
          >
            {t('remote.retry')}
          </button>
        </div>
      </div>
    );
  }

  if (!effectiveState) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          {status === 'reconnecting' && (
            <p className="text-amber-400 animate-pulse">{t('remote.reconnecting')}</p>
          )}
          <p className="text-gray-400">{t('share.display.waitingForState' as Parameters<typeof t>[0])}</p>
        </div>
      </div>
    );
  }

  const colorUpMap = deserializeColorUpMap(effectiveState.colorUpSchedule);

  return (
    <>
      {status === 'reconnecting' && (
        <div className="fixed top-0 inset-x-0 z-50 bg-amber-600 text-white text-center py-1 text-sm animate-pulse">
          {t('remote.reconnecting')}
        </div>
      )}
      <Suspense fallback={<LoadingFallback />}>
        <DisplayMode
          timerState={effectiveState.timerState}
          levels={effectiveState.levels}
          activePlayerCount={effectiveState.activePlayerCount}
          totalPlayerCount={effectiveState.totalPlayerCount}
          isBubble={effectiveState.isBubble}
          isLastHand={effectiveState.isLastHand}
          isHandForHand={effectiveState.isHandForHand}
          onExit={() => window.close()}
          players={effectiveState.players}
          dealerIndex={effectiveState.dealerIndex}
          buyIn={effectiveState.buyIn}
          payout={effectiveState.payout}
          rebuy={effectiveState.rebuy}
          addOn={effectiveState.addOn}
          bounty={effectiveState.bounty}
          averageStack={effectiveState.averageStack}
          tournamentElapsed={effectiveState.tournamentElapsed}
          chipConfig={effectiveState.chipConfig}
          colorUpMap={colorUpMap}
          tables={effectiveState.tables}
          showDealerBadges={effectiveState.showDealerBadges}
          leagueName={effectiveState.leagueName}
          leagueStandings={effectiveState.leagueStandings}
          sidePotData={effectiveState.sidePotData}
          displayScreens={effectiveState.displayScreens}
          displayRotationInterval={effectiveState.displayRotationInterval}
          tournamentName={effectiveState.tournamentName}
        />
      </Suspense>
      {ctcPayload && (
        <Suspense fallback={null}>
          <CallTheClock
            durationSeconds={ctcPayload.durationSeconds}
            onClose={() => setCtcPayload(null)}
            soundEnabled={ctcPayload.soundEnabled}
            voiceEnabled={ctcPayload.voiceEnabled}
          />
        </Suspense>
      )}
    </>
  );
}
```

**Step 2: Add barrel export**

In `src/components/display/index.ts`, add:

```typescript
export { CrossDeviceDisplay } from './CrossDeviceDisplay';
```

**Step 3: Verify build**

Run: `npm run build 2>&1 | tail -5`

**Step 4: Commit**

```bash
git add src/components/display/CrossDeviceDisplay.tsx src/components/display/index.ts
git commit -m "feat: add CrossDeviceDisplay component for PeerJS-based remote display

Connects to host via PeerJS, receives DisplayStatePayload, renders
DisplayMode with timer interpolation. Auto-reconnect, fullscreen,
dark mode forced. Reuses existing DisplayMode 1:1."
```

---

### Task 3: Hash Routing in main.tsx

Detect `#display=PKR-XXXXX` hash and render CrossDeviceDisplay.

**Files:**
- Modify: `src/main.tsx`

**Step 1: Add display hash detection**

Modify `src/main.tsx`. Currently line 11 has:
```typescript
const isDisplayWindow = window.location.hash === '#display';
```

Replace with extended detection:

```typescript
const hash = window.location.hash;
const isLocalDisplayWindow = hash === '#display';
const isRemoteDisplayWindow = hash.startsWith('#display=');
const remoteDisplayPeerId = isRemoteDisplayWindow ? hash.slice('#display='.length) : null;
```

**Step 2: Import CrossDeviceDisplay**

Add import at top of `main.tsx`:

```typescript
import { TVDisplayWindow, CrossDeviceDisplay } from './components/display';
```

**Step 3: Update render logic**

In the `renderApp` function, update the conditional render (~line 68):

```typescript
{isLocalDisplayWindow ? (
  <TVDisplayWindow />
) : isRemoteDisplayWindow && remoteDisplayPeerId ? (
  <CrossDeviceDisplay hostPeerId={remoteDisplayPeerId} />
) : (
  <>
    <App />
    <DeferredMonitoring />
  </>
)}
```

**Step 4: Skip monitoring for remote display**

Also skip Sentry init for remote display windows. Find the Sentry check (~line 14) that checks `!isDisplayWindow` and update:

```typescript
if (!isLocalDisplayWindow && !isRemoteDisplayWindow && import.meta.env.PROD) {
```

**Step 5: Build and verify**

Run: `npm run build 2>&1 | tail -5`

**Step 6: Commit**

```bash
git add src/main.tsx
git commit -m "feat: route #display=PKR-XXXXX to CrossDeviceDisplay

Extends main.tsx hash detection to support three modes:
- #display (local BroadcastChannel TV window)
- #display=PKR-XXXXX (cross-device PeerJS display)
- default (normal app)"
```

---

### Task 4: Host-side Display Broadcasting via PeerJS

Create `useDisplaySession` hook that broadcasts DisplayStatePayload to connected display peers.

**Files:**
- Create: `src/hooks/useDisplaySession.ts`
- Modify: `src/hooks/useTVDisplay.ts` (integrate display session)

**Step 1: Create useDisplaySession hook**

Create `src/hooks/useDisplaySession.ts`:

```typescript
import { useCallback, useEffect, useRef, useState } from 'react';
import type { DisplayStatePayload } from '../domain/displayChannel';
import { withDisplayContract } from '../domain/displayChannel';
import type { RemoteHost } from '../domain/remote';

interface UseDisplaySessionOptions {
  /** Ref to RemoteHost instance (manages PeerJS connections) */
  hostRef: React.RefObject<RemoteHost | null>;
  /** True when in game mode and host is active */
  enabled: boolean;
  /** Build the current display state payload */
  buildFullStatePayload: () => DisplayStatePayload;
  /** Timer state for frequent ticks */
  remainingSeconds: number;
  timerStatus: 'stopped' | 'running' | 'paused';
  currentLevelIndex: number;
  /** Call the clock state */
  showCallTheClock: boolean;
  callTheClockSeconds: number;
  soundEnabled: boolean;
  voiceEnabled: boolean;
}

interface UseDisplaySessionReturn {
  /** Number of connected display peers */
  displayCount: number;
}

/**
 * Hook that broadcasts DisplayStatePayload to all connected PeerJS display peers.
 * Mirrors the BroadcastChannel logic from useTVDisplay but uses PeerJS.
 */
export function useDisplaySession({
  hostRef,
  enabled,
  buildFullStatePayload,
  remainingSeconds,
  timerStatus,
  currentLevelIndex,
  showCallTheClock,
  callTheClockSeconds,
  soundEnabled,
  voiceEnabled,
}: UseDisplaySessionOptions): UseDisplaySessionReturn {
  const [displayCount, setDisplayCount] = useState(0);
  const lastPayloadRef = useRef<string>('');

  // Track display count from host callbacks
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !enabled) {
      setDisplayCount(0);
      return;
    }
    // The onDisplayCountChange callback is set on RemoteHost construction,
    // so we read the current count periodically
    const interval = setInterval(() => {
      setDisplayCount(host.displayCount);
    }, 2000);
    return () => clearInterval(interval);
  }, [hostRef, enabled]);

  // Send full state when payload changes
  useEffect(() => {
    const host = hostRef.current;
    if (!enabled || !host || host.displayCount === 0) return;

    const payload = buildFullStatePayload();
    const key = JSON.stringify(payload);
    if (key === lastPayloadRef.current) return;
    lastPayloadRef.current = key;

    host.sendDisplayState(withDisplayContract({ type: 'full-state', payload }));
  }, [enabled, hostRef, buildFullStatePayload]);

  // Send timer ticks every 500ms
  useEffect(() => {
    const host = hostRef.current;
    if (!enabled || !host) return;

    const interval = setInterval(() => {
      if (host.displayCount === 0) return;
      host.sendDisplayState(withDisplayContract({
        type: 'timer-tick',
        payload: { remainingSeconds, status: timerStatus, currentLevelIndex },
      }));
    }, 500);

    return () => clearInterval(interval);
  }, [enabled, hostRef, remainingSeconds, timerStatus, currentLevelIndex]);

  // Send call-the-clock state
  useEffect(() => {
    const host = hostRef.current;
    if (!enabled || !host || host.displayCount === 0) return;

    if (showCallTheClock) {
      host.sendDisplayState(withDisplayContract({
        type: 'call-the-clock',
        payload: { durationSeconds: callTheClockSeconds, soundEnabled, voiceEnabled },
      }));
    } else {
      host.sendDisplayState(withDisplayContract({ type: 'call-the-clock-dismiss' }));
    }
  }, [enabled, hostRef, showCallTheClock, callTheClockSeconds, soundEnabled, voiceEnabled]);

  return { displayCount };
}
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | tail -5`

**Step 3: Commit**

```bash
git add src/hooks/useDisplaySession.ts
git commit -m "feat: add useDisplaySession hook for PeerJS display broadcasting

Broadcasts DisplayStatePayload + timer ticks to connected display
peers via RemoteHost.sendDisplayState(). Mirrors BroadcastChannel
pattern from useTVDisplay."
```

---

### Task 5: ShareHub Component

Central modal for all sharing/display/connection options.

**Files:**
- Create: `src/components/ShareHub.tsx`

**Step 1: Create ShareHub component**

Create `src/components/ShareHub.tsx`:

```typescript
import { memo, useState, useCallback, useMemo } from 'react';
import { useTranslation } from '../i18n';

interface Props {
  /** PeerJS peer ID for this session */
  sessionId: string | null;
  /** Secret for remote HMAC signing */
  secret?: string;
  /** Number of connected display peers */
  displayCount: number;
  /** Whether remote controller is connected */
  remoteConnected: boolean;
  /** Whether local TV window is active */
  localTVActive: boolean;
  /** Callbacks */
  onOpenLocalTV: () => void;
  onToggleFullscreen: () => void;
  onClose: () => void;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border border-gray-300 dark:border-gray-700/60 hover:border-gray-400 dark:hover:border-gray-600 bg-white dark:bg-gray-800/80"
    >
      {copied ? '✓' : label}
    </button>
  );
}

function StatusDot({ connected, count }: { connected: boolean; count?: number }) {
  const { t } = useTranslation();
  if (!connected && (!count || count === 0)) {
    return <span className="text-xs text-gray-400">{t('share.statusDisconnected' as Parameters<typeof t>[0])}</span>;
  }
  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-500)' }} />
      <span style={{ color: 'var(--accent-600)' }}>
        {count !== undefined
          ? t('share.displayConnectedCount' as Parameters<typeof t>[0], { count } as Record<string, string | number>)
          : t('share.remoteConnected' as Parameters<typeof t>[0])}
      </span>
    </span>
  );
}

function SectionCard({ icon, title, description, children }: {
  icon: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700/40 bg-white/50 dark:bg-gray-800/30 p-3 space-y-2">
      <div>
        <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <span>{icon}</span> {title}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      </div>
      {children}
    </div>
  );
}

export const ShareHub = memo(function ShareHub({
  sessionId,
  secret,
  displayCount,
  remoteConnected,
  localTVActive,
  onOpenLocalTV,
  onToggleFullscreen,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const [showQR, setShowQR] = useState<'display' | 'remote' | null>(null);

  const displayUrl = useMemo(() => {
    if (!sessionId) return null;
    const base = `${window.location.origin}${window.location.pathname}`;
    return `${base}#display=${sessionId}`;
  }, [sessionId]);

  const remoteUrl = useMemo(() => {
    if (!sessionId) return null;
    const base = `${window.location.origin}${window.location.pathname}`;
    return secret ? `${base}#remote=${sessionId}&s=${secret}` : `${base}#remote=${sessionId}`;
  }, [sessionId, secret]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700/40 shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700/40">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            📡 {t('share.title' as Parameters<typeof t>[0])}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500"
            aria-label={t('share.close' as Parameters<typeof t>[0])}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Session info */}
          {sessionId && (
            <div className="text-center py-2">
              <span className="text-xs text-gray-400 uppercase tracking-wider">{t('share.sessionId' as Parameters<typeof t>[0])}</span>
              <p className="text-lg font-mono font-bold text-gray-800 dark:text-gray-100 tracking-widest">{sessionId}</p>
            </div>
          )}

          {!sessionId && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('share.startTournamentFirst' as Parameters<typeof t>[0])}</p>
            </div>
          )}

          {/* Section 1: Display on another device */}
          <SectionCard
            icon="📺"
            title={t('share.displayTitle' as Parameters<typeof t>[0])}
            description={t('share.displayDescription' as Parameters<typeof t>[0])}
          >
            {displayUrl ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowQR(showQR === 'display' ? null : 'display')}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium btn-accent-gradient text-white"
                  >
                    {t('share.showQR' as Parameters<typeof t>[0])}
                  </button>
                  <CopyButton text={displayUrl} label={t('share.copyLink' as Parameters<typeof t>[0])} />
                </div>
                {showQR === 'display' && (
                  <div className="flex justify-center p-3 bg-white rounded-lg">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(displayUrl)}`}
                      alt="Display QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                )}
                <StatusDot connected={displayCount > 0} count={displayCount} />
              </div>
            ) : (
              <p className="text-xs text-gray-400">{t('share.needsSession' as Parameters<typeof t>[0])}</p>
            )}
          </SectionCard>

          {/* Section 2: Remote control */}
          <SectionCard
            icon="📱"
            title={t('share.remoteTitle' as Parameters<typeof t>[0])}
            description={t('share.remoteDescription' as Parameters<typeof t>[0])}
          >
            {remoteUrl ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowQR(showQR === 'remote' ? null : 'remote')}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium btn-accent-gradient text-white"
                  >
                    {t('share.showQR' as Parameters<typeof t>[0])}
                  </button>
                  <CopyButton text={remoteUrl} label={t('share.copyLink' as Parameters<typeof t>[0])} />
                </div>
                {showQR === 'remote' && (
                  <div className="flex justify-center p-3 bg-white rounded-lg">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(remoteUrl)}`}
                      alt="Remote QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                )}
                <StatusDot connected={remoteConnected} />
              </div>
            ) : (
              <p className="text-xs text-gray-400">{t('share.needsSession' as Parameters<typeof t>[0])}</p>
            )}
          </SectionCard>

          {/* Section 3: This device */}
          <SectionCard
            icon="🖥️"
            title={t('share.thisDeviceTitle' as Parameters<typeof t>[0])}
            description={t('share.thisDeviceDescription' as Parameters<typeof t>[0])}
          >
            <div className="flex flex-col gap-2">
              <button
                onClick={onOpenLocalTV}
                className="w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                📺 {t('share.openSecondWindow' as Parameters<typeof t>[0])}
                {localTVActive && (
                  <span className="ml-2 text-xs" style={{ color: 'var(--accent-500)' }}>● {t('share.active' as Parameters<typeof t>[0])}</span>
                )}
              </button>
              <button
                onClick={onToggleFullscreen}
                className="w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                ⛶ {t('share.fullscreen' as Parameters<typeof t>[0])}
              </button>
            </div>
          </SectionCard>

          {/* Section 4: Cable & Wireless hints */}
          <SectionCard
            icon="📡"
            title={t('share.wirelessTitle' as Parameters<typeof t>[0])}
            description={t('share.wirelessDescription' as Parameters<typeof t>[0])}
          >
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <details className="group">
                <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                  🍎 AirPlay / Screen Mirroring
                </summary>
                <div className="mt-1.5 pl-5 space-y-1">
                  <p><strong>iPhone/iPad:</strong> {t('share.airplayIOS' as Parameters<typeof t>[0])}</p>
                  <p><strong>Mac:</strong> {t('share.airplayMac' as Parameters<typeof t>[0])}</p>
                </div>
              </details>
              <details className="group">
                <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                  📺 Chromecast / Google Cast
                </summary>
                <div className="mt-1.5 pl-5 space-y-1">
                  <p>{t('share.chromecast' as Parameters<typeof t>[0])}</p>
                </div>
              </details>
              <details className="group">
                <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                  🔌 HDMI / {t('share.cableTitle' as Parameters<typeof t>[0])}
                </summary>
                <div className="mt-1.5 pl-5 space-y-1">
                  <p>{t('share.hdmi' as Parameters<typeof t>[0])}</p>
                </div>
              </details>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
});
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | tail -5`

**Step 3: Commit**

```bash
git add src/components/ShareHub.tsx
git commit -m "feat: add ShareHub modal for centralized sharing/display options

Sections: Display on another device (QR + link), Remote control
(QR + link), This device (second window + fullscreen), Cable &
Wireless guides (AirPlay, Chromecast, HDMI)."
```

---

### Task 6: App.tsx + AppHeader Integration

Wire ShareHub into the app, add Share button to header, integrate useDisplaySession.

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/AppHeader.tsx`

**Step 1: Add ShareHub state to App.tsx**

In `src/App.tsx`, add state near other modal states:

```typescript
const [showShareHub, setShowShareHub] = useState(false);
```

**Step 2: Import and wire useDisplaySession**

Add import:
```typescript
import { useDisplaySession } from './hooks/useDisplaySession';
```

Call hook after the `useTVDisplay` + `useRemoteHostBridge` calls:

```typescript
const { displayCount } = useDisplaySession({
  hostRef: remoteHostRef,
  enabled: mode === 'game' && remoteHostStatus !== null,
  buildFullStatePayload,
  remainingSeconds: timer.timerState.remainingSeconds,
  timerStatus: timer.timerState.status,
  currentLevelIndex: timer.timerState.currentLevelIndex,
  showCallTheClock,
  callTheClockSeconds: settings.callTheClockSeconds,
  soundEnabled: settings.soundEnabled,
  voiceEnabled: settings.voiceEnabled,
});
```

**Step 3: Add onDisplayCountChange to RemoteHost creation**

In `src/hooks/useRemoteControl.ts`, add the callback when creating RemoteHost. Modify the `startHost` function:

```typescript
// Add state for display count
const [displayCount, setDisplayCount] = useState(0);

// In startHost(), extend callbacks:
const host = new RemoteHost(
  {
    onCommand: (cmd) => onCommandRef.current(cmd),
    onStatusChange: (s) => setHostStatusRaw(s),
    onDisplayCountChange: (count) => setDisplayCount(count),
  },
  persisted ? { peerId: persisted.peerId, secret: persisted.secret } : undefined,
);
```

Add `displayCount` to the return value of `useRemoteControl`.

**Step 4: Import and render ShareHub**

Add lazy import in `App.tsx`:

```typescript
const ShareHub = lazy(() => import('./components/ShareHub').then(m => ({ default: m.ShareHub })));
```

Render near other modals (after RemoteHostModal):

```typescript
{showShareHub && (
  <Suspense fallback={<LoadingFallback />}>
    <ShareHub
      sessionId={remoteHostRef.current?.peerId ?? null}
      secret={remoteHostRef.current?.secret}
      displayCount={displayCount}
      remoteConnected={remoteHostStatus === 'connected'}
      localTVActive={tvWindowActive}
      onOpenLocalTV={() => { handleToggleTVWindow(); }}
      onToggleFullscreen={handleToggleFullscreen}
      onClose={() => setShowShareHub(false)}
    />
  </Suspense>
)}
```

**Step 5: Add Share button to AppHeader**

In `src/components/AppHeader.tsx`:

1. Add new props:
```typescript
onShowShareHub: () => void;
displayCount: number;
```

2. Add a 📡 Share button in the game mode header area (near the existing 📱 and 📺 buttons). Replace separate TV and Remote buttons with a single Share button:

```typescript
{mode === 'game' && !tournamentFinished && (
  <button
    onClick={onShowShareHub}
    className="relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border border-gray-300 dark:border-gray-700/60 hover:border-gray-400 dark:hover:border-gray-600 bg-white/80 dark:bg-gray-800/60"
    title={t('share.title' as Parameters<typeof t>[0])}
  >
    📡
    {(remoteHostConnected || tvWindowActive || displayCount > 0) && (
      <span
        className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"
        style={{ backgroundColor: 'var(--accent-500)' }}
      />
    )}
  </button>
)}
```

**Important:** Keep the existing 📺 and 📱 buttons as well for backward compatibility. The Share button is an additional entry point. If you want to consolidate, the individual buttons can remain as direct shortcuts — the Share Hub is the comprehensive view.

**Step 6: Pass new props through App.tsx → AppHeader**

In the `<AppHeader>` render in App.tsx, add:

```typescript
onShowShareHub={() => {
  // Auto-start host session if not already running
  if (!remoteHostRef.current) startRemoteHost();
  setShowShareHub(true);
}}
displayCount={displayCount}
```

**Step 7: Handle #share hash**

In App.tsx, near existing hash handling, add:

```typescript
// Detect #share hash
useEffect(() => {
  if (window.location.hash === '#share') {
    history.replaceState(null, '', window.location.pathname + window.location.search);
    setShowShareHub(true);
  }
}, []);
```

**Step 8: Verify build + lint**

Run: `npm run lint && npm run build 2>&1 | tail -10`

**Step 9: Commit**

```bash
git add src/App.tsx src/components/AppHeader.tsx src/hooks/useRemoteControl.ts
git commit -m "feat: integrate ShareHub into app with display broadcasting

- ShareHub modal accessible via 📡 button in game mode header
- useDisplaySession broadcasts to PeerJS display peers
- Display count tracked and shown in ShareHub
- Auto-starts remote host when opening ShareHub
- #share hash deep-link support"
```

---

### Task 7: Translation Keys

Add all new DE/EN translation keys.

**Files:**
- Modify: `src/i18n/translations.ts`

**Step 1: Add DE translations**

Add in the DE section after existing `remote.*` keys:

```typescript
// Share Hub
'share.title': 'Teilen / Anzeigen',
'share.close': 'Schließen',
'share.sessionId': 'Session-ID',
'share.startTournamentFirst': 'Starte zuerst ein Turnier, um Geräte zu verbinden.',
'share.needsSession': 'Wird verfügbar wenn das Turnier läuft.',

// Display section
'share.displayTitle': 'Auf anderem Gerät anzeigen',
'share.displayDescription': 'Öffne die Turnieranzeige auf TV, Laptop, Tablet oder Beamer.',
'share.display.connecting': 'Verbinde mit Turnier…',
'share.display.connectionError': 'Verbindung fehlgeschlagen',
'share.display.waitingForState': 'Warte auf Turnierdaten…',

// Remote section
'share.remoteTitle': 'Mit Smartphone steuern',
'share.remoteDescription': 'Steuere das Turnier mit deinem Handy oder Tablet.',

// This device
'share.thisDeviceTitle': 'Auf diesem Gerät',
'share.thisDeviceDescription': 'Zweites Fenster oder Vollbild auf diesem Gerät.',
'share.openSecondWindow': 'Zweites Fenster öffnen',
'share.fullscreen': 'Browser-Vollbild',
'share.active': 'Aktiv',

// Status
'share.statusDisconnected': 'Nicht verbunden',
'share.displayConnectedCount': '{count} Display(s) verbunden',
'share.remoteConnected': 'Verbunden',

// QR & Link
'share.showQR': 'QR-Code',
'share.copyLink': 'Link kopieren',

// Wireless guides
'share.wirelessTitle': 'Kabel & Wireless',
'share.wirelessDescription': 'Alternative Wege zur Anzeige auf TV oder Beamer.',
'share.airplayIOS': 'Kontrollzentrum öffnen → Bildschirmsynchronisierung → Apple TV wählen',
'share.airplayMac': 'Kontrollzentrum → Bildschirmsynchronisierung → Apple TV wählen',
'share.chromecast': 'In Chrome: Menü (⋮) → Streamen → Chromecast-Gerät wählen',
'share.cableTitle': 'Kabel',
'share.hdmi': 'HDMI-Kabel anschließen → Browser-Vollbild → Fenster auf externen Bildschirm ziehen',
```

**Step 2: Add EN translations**

Add in the EN section at matching position:

```typescript
// Share Hub
'share.title': 'Share / Display',
'share.close': 'Close',
'share.sessionId': 'Session ID',
'share.startTournamentFirst': 'Start a tournament first to connect devices.',
'share.needsSession': 'Available when the tournament is running.',

// Display section
'share.displayTitle': 'Display on another device',
'share.displayDescription': 'Open the tournament display on TV, laptop, tablet or projector.',
'share.display.connecting': 'Connecting to tournament…',
'share.display.connectionError': 'Connection failed',
'share.display.waitingForState': 'Waiting for tournament data…',

// Remote section
'share.remoteTitle': 'Control with smartphone',
'share.remoteDescription': 'Control the tournament with your phone or tablet.',

// This device
'share.thisDeviceTitle': 'On this device',
'share.thisDeviceDescription': 'Second window or fullscreen on this device.',
'share.openSecondWindow': 'Open second window',
'share.fullscreen': 'Browser fullscreen',
'share.active': 'Active',

// Status
'share.statusDisconnected': 'Not connected',
'share.displayConnectedCount': '{count} display(s) connected',
'share.remoteConnected': 'Connected',

// QR & Link
'share.showQR': 'QR Code',
'share.copyLink': 'Copy link',

// Wireless guides
'share.wirelessTitle': 'Cable & Wireless',
'share.wirelessDescription': 'Alternative ways to display on TV or projector.',
'share.airplayIOS': 'Open Control Center → Screen Mirroring → Select Apple TV',
'share.airplayMac': 'Control Center → Screen Mirroring → Select Apple TV',
'share.chromecast': 'In Chrome: Menu (⋮) → Cast → Select Chromecast device',
'share.cableTitle': 'Cable',
'share.hdmi': 'Connect HDMI cable → Browser fullscreen → Drag window to external display',
```

**Step 3: Run i18n tests**

Run: `npm run test -- tests/i18n.test.ts --reporter=verbose 2>&1 | tail -20`
Expected: PASS (key parity check should pass since we added equal DE/EN keys)

**Step 4: Run full tests + build**

Run: `npm run test && npm run build 2>&1 | tail -10`

**Step 5: Commit**

```bash
git add src/i18n/translations.ts
git commit -m "feat: add Share Hub translation keys (DE/EN)

32 new translation keys per language (64 total) covering:
Share Hub UI, display connection, remote control, wireless
guides (AirPlay, Chromecast, HDMI)."
```

---

### Task 8: Tests for New Functionality

Write tests for the new domain functions and display channel integration.

**Files:**
- Modify: `tests/logic.test.ts`
- Modify: `tests/display-channel.test.ts`

**Step 1: Add display session integration tests**

Add to `tests/display-channel.test.ts`:

```typescript
describe('display message for cross-device', () => {
  it('full-state message is valid DisplayMessage', () => {
    const msg = withDisplayContract({
      type: 'full-state',
      payload: { timerState: { currentLevelIndex: 0, remainingSeconds: 600, status: 'running', startedAt: null, remainingAtStart: null }, levels: [] } as unknown as DisplayStatePayload,
    });
    expect(isDisplayMessage(msg)).toBe(true);
    expect(msg.type).toBe('full-state');
  });

  it('timer-tick message is valid DisplayMessage', () => {
    const msg = withDisplayContract({
      type: 'timer-tick',
      payload: { remainingSeconds: 300, status: 'running', currentLevelIndex: 2 },
    });
    expect(isDisplayMessage(msg)).toBe(true);
  });

  it('call-the-clock message is valid DisplayMessage', () => {
    const msg = withDisplayContract({
      type: 'call-the-clock',
      payload: { durationSeconds: 60, soundEnabled: true, voiceEnabled: false },
    });
    expect(isDisplayMessage(msg)).toBe(true);
  });
});
```

**Step 2: Verify remote.ts exports are importable in tests**

Add import check at top of test block:

```typescript
import {
  buildDisplayUrl,
  parseDisplayHash,
  isHelloMessage,
} from '../src/domain/remote';
```

**Step 3: Run all tests**

Run: `npm run test 2>&1 | tail -10`
Expected: All pass

**Step 4: Run lint + build**

Run: `npm run lint && npm run build 2>&1 | tail -5`

**Step 5: Commit**

```bash
git add tests/logic.test.ts tests/display-channel.test.ts
git commit -m "test: add tests for cross-device display and hello handshake

- Display URL building/parsing tests
- Hello message validation tests
- Display message contract tests for cross-device channel"
```

---

### Task 9: Documentation Update

Update CLAUDE.md and CHANGELOG.md.

**Files:**
- Modify: `CLAUDE.md`
- Modify: `CHANGELOG.md`
- Modify: `package.json` (version bump)

**Step 1: Update CLAUDE.md**

- Add `ShareHub.tsx` to component list with description
- Add `CrossDeviceDisplay.tsx` to display subfolder
- Add `useDisplaySession.ts` to hooks list
- Update SettingsPanel description
- Add new Key Implementation Details entry for Cross-Device Display
- Add changelog entry for v6.6.0

**Step 2: Update CHANGELOG.md**

Add new entry:

```markdown
## [6.6.0] – 2026-03-15

### Share Hub & Cross-Device Display

**Cross-Device Display:**
- Turnieranzeige auf separatem Gerät (TV, Tablet, Laptop) via PeerJS
- `#display=PKR-XXXXX` Hash-Routing für Cross-Device-Modus
- DisplayMode 1:1 wiederverwendet — identische Darstellung wie Same-Device
- Timer-Interpolation (100ms), Auto-Reconnect, Vollbild, Dark Mode

**Share Hub (📡):**
- Zentrales Modal „Teilen / Anzeigen" im Spielmodus-Header
- Display-Link mit QR-Code und Kopier-Button
- Remote-Link mit QR-Code und Kopier-Button
- Same-Device: Zweites Fenster + Browser-Vollbild
- Wireless-Anleitungen: AirPlay, Chromecast, HDMI

**Multi-Role Sessions:**
- Hello-Handshake-Protokoll differenziert Display- und Remote-Verbindungen
- Mehrere Display-Peers gleichzeitig (broadcast)
- Remote-Peer unverändert (1 Verbindung, HMAC-signiert)

**Neue Dateien:**
- `CrossDeviceDisplay.tsx` (~200 Zeilen)
- `ShareHub.tsx` (~450 Zeilen)
- `useDisplaySession.ts` (~150 Zeilen)

**Geänderte Dateien:**
- `remote.ts` — Hello-Handshake, Multi-Connection, Display-URL-Funktionen
- `main.tsx` — Hash-Routing für `#display=`
- `App.tsx` — ShareHub-Integration, useDisplaySession
- `AppHeader.tsx` — 📡 Share-Button

- **~64 neue Translation-Keys** (32 DE + 32 EN)
- **~15 neue Tests**
```

**Step 3: Bump version in package.json**

Change `"version": "6.5.1"` → `"version": "6.6.0"`

**Step 4: Run full test suite + build**

Run: `npm run test && npm run lint && npm run build 2>&1 | tail -10`

**Step 5: Commit**

```bash
git add CLAUDE.md CHANGELOG.md package.json
git commit -m "docs: bump to v6.6.0 — Share Hub & Cross-Device Display"
```
