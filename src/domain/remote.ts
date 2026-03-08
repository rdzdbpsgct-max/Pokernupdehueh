/**
 * PeerJS-based remote control for poker tournament timer.
 *
 * Architecture:
 * - Host (TV/main display): creates PeerJS peer, shows QR code with short URL
 * - Controller (smartphone): scans QR → opens app → connects via PeerJS → sends commands
 * - Data channel: bidirectional JSON messages over WebRTC (brokered by PeerJS Cloud)
 *
 * Signaling flow:
 * 1. Host creates Peer with generated ID (PKR-XXXXX)
 * 2. QR code contains app URL with #remote=PKR-XXXXX hash
 * 3. Phone scans QR → opens app → auto-connects to host peer
 * 4. Bidirectional data channel established
 *
 * One QR scan — no second scan or paste required.
 */

import Peer from 'peerjs';
import type { DataConnection } from 'peerjs';

// ---------------------------------------------------------------------------
// Peer ID generation
// ---------------------------------------------------------------------------

/** Alphabet without confusable characters (no I, O, 0, 1) */
const PEER_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PEER_ID_LENGTH = 5;
const PEER_PREFIX = 'PKR-';

/** Generate a readable peer ID like "PKR-X7K3M" */
export function generatePeerId(): string {
  let id = '';
  const array = new Uint8Array(PEER_ID_LENGTH);
  crypto.getRandomValues(array);
  for (let i = 0; i < PEER_ID_LENGTH; i++) {
    id += PEER_ALPHABET[array[i] % PEER_ALPHABET.length];
  }
  return PEER_PREFIX + id;
}

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

/** Build a scannable app URL with the peer ID as hash parameter */
export function buildRemoteUrl(peerId: string): string {
  const base = import.meta.env.BASE_URL || '/';
  return `${window.location.origin}${base}#remote=${peerId}`;
}

/** Extract peer ID from URL hash, e.g. "#remote=PKR-X7K3M" → "PKR-X7K3M" */
export function parseRemoteHash(hash: string): string | null {
  if (!hash.startsWith('#remote=')) return null;
  const id = hash.slice('#remote='.length).trim();
  // Validate format: PKR- followed by 5 alphanumeric chars
  if (/^PKR-[A-Z2-9]{5}$/.test(id)) return id;
  return null;
}

// ---------------------------------------------------------------------------
// Message types
// ---------------------------------------------------------------------------

/** Commands sent from Controller → Host */
export interface RemoteCommand {
  type: 'command';
  action:
    | 'play'
    | 'pause'
    | 'toggle'
    | 'next'
    | 'prev'
    | 'reset'
    | 'call-the-clock'
    | 'advanceDealer'
    | 'toggleSound';
  payload?: Record<string, unknown>;
}

/** State updates sent from Host → Controller */
export interface RemoteState {
  type: 'state';
  data: {
    timerStatus: 'running' | 'paused' | 'finished';
    remainingSeconds: number;
    currentLevelIndex: number;
    levelLabel: string;
    smallBlind: number;
    bigBlind: number;
    ante?: number;
    activePlayerCount: number;
    totalPlayerCount: number;
    isBubble: boolean;
    tournamentName?: string;
    soundEnabled?: boolean;
  };
}

/** Ping/pong for keepalive */
export interface RemotePing {
  type: 'ping' | 'pong';
}

export type RemoteMessage = RemoteCommand | RemoteState | RemotePing;

export type HostStatus = 'initializing' | 'ready' | 'connected' | 'error';
export type ControllerStatus = 'connecting' | 'connected' | 'reconnecting' | 'error';

// ---------------------------------------------------------------------------
// Remote Host (TV/Main Display)
// ---------------------------------------------------------------------------

export interface RemoteHostCallbacks {
  onCommand: (cmd: RemoteCommand) => void;
  onStatusChange: (status: HostStatus) => void;
  onError?: (error: string) => void;
}

export class RemoteHost {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private callbacks: RemoteHostCallbacks;
  private keepaliveInterval: ReturnType<typeof setInterval> | null = null;
  private _status: HostStatus = 'initializing';
  private _peerId: string;

  constructor(callbacks: RemoteHostCallbacks) {
    this.callbacks = callbacks;
    this._peerId = generatePeerId();
    this.init();
  }

  get peerId(): string {
    return this._peerId;
  }

  get status(): HostStatus {
    return this._status;
  }

  get connected(): boolean {
    return this._status === 'connected';
  }

  private setStatus(status: HostStatus): void {
    this._status = status;
    this.callbacks.onStatusChange(status);
  }

  private init(): void {
    try {
      this.peer = new Peer(this._peerId);

      this.peer.on('open', () => {
        this.setStatus('ready');
      });

      this.peer.on('connection', (conn) => {
        // Accept incoming connection from controller
        this.conn = conn;
        this.setupConnection(conn);
      });

      this.peer.on('error', (err) => {
        // If ID is taken, generate a new one and retry
        if (err.type === 'unavailable-id') {
          this._peerId = generatePeerId();
          this.peer?.destroy();
          this.peer = null;
          this.init();
          return;
        }
        this.setStatus('error');
        this.callbacks.onError?.(err.message || 'Connection error');
      });

      this.peer.on('disconnected', () => {
        // Try to reconnect to signaling server
        if (this.peer && !this.peer.destroyed) {
          try {
            this.peer.reconnect();
          } catch {
            // Already destroyed
          }
        }
      });
    } catch {
      this.setStatus('error');
      this.callbacks.onError?.('Failed to create peer');
    }
  }

  private setupConnection(conn: DataConnection): void {
    conn.on('open', () => {
      this.setStatus('connected');
      this.startKeepalive();
    });

    conn.on('data', (raw) => {
      try {
        const msg = (typeof raw === 'string' ? JSON.parse(raw) : raw) as RemoteMessage;
        if (msg.type === 'command') {
          this.callbacks.onCommand(msg);
        } else if (msg.type === 'pong') {
          // Keepalive response
        }
      } catch {
        // Invalid message
      }
    });

    conn.on('close', () => {
      this.stopKeepalive();
      this.conn = null;
      // Go back to 'ready' — waiting for new connection
      if (this._status !== 'error') {
        this.setStatus('ready');
      }
    });

    conn.on('error', () => {
      this.stopKeepalive();
      this.conn = null;
      if (this._status !== 'error') {
        this.setStatus('ready');
      }
    });
  }

  private startKeepalive(): void {
    this.stopKeepalive();
    this.keepaliveInterval = setInterval(() => {
      if (this.conn?.open) {
        try {
          this.conn.send(JSON.stringify({ type: 'ping' }));
        } catch {
          // Connection lost
        }
      }
    }, 10_000);
  }

  private stopKeepalive(): void {
    if (this.keepaliveInterval) {
      clearInterval(this.keepaliveInterval);
      this.keepaliveInterval = null;
    }
  }

  /** Send state update to connected controller */
  sendState(state: RemoteState['data']): void {
    if (!this.conn?.open) return;
    try {
      this.conn.send(JSON.stringify({ type: 'state', data: state } satisfies RemoteState));
    } catch {
      // Connection lost
    }
  }

  /** Close the connection and destroy peer */
  destroy(): void {
    this.stopKeepalive();
    if (this.conn) {
      try { this.conn.close(); } catch { /* ignore */ }
      this.conn = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch { /* ignore */ }
      this.peer = null;
    }
  }
}

// ---------------------------------------------------------------------------
// Remote Controller (Smartphone)
// ---------------------------------------------------------------------------

export interface RemoteControllerCallbacks {
  onState: (state: RemoteState['data']) => void;
  onStatusChange: (status: ControllerStatus) => void;
  onError?: (error: string) => void;
}

export class RemoteController {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private callbacks: RemoteControllerCallbacks;
  private hostPeerId: string;
  private _status: ControllerStatus = 'connecting';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  constructor(hostPeerId: string, callbacks: RemoteControllerCallbacks) {
    this.callbacks = callbacks;
    this.hostPeerId = hostPeerId;
    this.connect();
  }

  get status(): ControllerStatus {
    return this._status;
  }

  get connected(): boolean {
    return this._status === 'connected';
  }

  private setStatus(status: ControllerStatus): void {
    this._status = status;
    this.callbacks.onStatusChange(status);
  }

  private connect(): void {
    if (this.destroyed) return;

    try {
      this.peer = new Peer();

      this.peer.on('open', () => {
        if (this.destroyed || !this.peer) return;
        // Connect to host
        const conn = this.peer.connect(this.hostPeerId, { reliable: true });
        this.conn = conn;
        this.setupConnection(conn);
      });

      this.peer.on('error', (err) => {
        if (this.destroyed) return;
        if (err.type === 'peer-unavailable') {
          // Host not found — try reconnect
          this.handleDisconnect();
          return;
        }
        this.setStatus('error');
        this.callbacks.onError?.(err.message || 'Connection error');
      });

      this.peer.on('disconnected', () => {
        if (this.destroyed) return;
        this.handleDisconnect();
      });
    } catch {
      this.setStatus('error');
      this.callbacks.onError?.('Failed to create peer');
    }
  }

  private setupConnection(conn: DataConnection): void {
    conn.on('open', () => {
      this.setStatus('connected');
      this.reconnectAttempts = 0;
    });

    conn.on('data', (raw) => {
      try {
        const msg = (typeof raw === 'string' ? JSON.parse(raw) : raw) as RemoteMessage;
        if (msg.type === 'state') {
          this.callbacks.onState(msg.data);
        } else if (msg.type === 'ping') {
          // Reply to keepalive
          if (conn.open) {
            try {
              conn.send(JSON.stringify({ type: 'pong' }));
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // Invalid message
      }
    });

    conn.on('close', () => {
      if (!this.destroyed) {
        this.handleDisconnect();
      }
    });

    conn.on('error', () => {
      if (!this.destroyed) {
        this.handleDisconnect();
      }
    });
  }

  private handleDisconnect(): void {
    if (this.destroyed) return;

    this.conn = null;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.setStatus('reconnecting');
      const delay = Math.pow(2, this.reconnectAttempts + 1) * 1000; // 2s, 4s, 8s
      this.reconnectTimer = setTimeout(() => {
        if (this.destroyed) return;
        this.reconnectAttempts++;
        // Destroy old peer and create fresh connection
        if (this.peer) {
          try { this.peer.destroy(); } catch { /* ignore */ }
          this.peer = null;
        }
        this.connect();
      }, delay);
    } else {
      this.setStatus('error');
      this.callbacks.onError?.('Connection failed after multiple attempts');
    }
  }

  /** Retry connection (called manually after error) */
  retry(): void {
    this.reconnectAttempts = 0;
    this.destroyed = false;
    if (this.peer) {
      try { this.peer.destroy(); } catch { /* ignore */ }
      this.peer = null;
    }
    this.setStatus('connecting');
    this.connect();
  }

  /** Send command to host */
  sendCommand(action: RemoteCommand['action'], payload?: Record<string, unknown>): void {
    if (!this.conn?.open) return;
    try {
      this.conn.send(JSON.stringify({ type: 'command', action, payload } satisfies RemoteCommand));
    } catch {
      // Connection lost
    }
  }

  /** Close the connection and destroy peer */
  destroy(): void {
    this.destroyed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.conn) {
      try { this.conn.close(); } catch { /* ignore */ }
      this.conn = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch { /* ignore */ }
      this.peer = null;
    }
  }
}
