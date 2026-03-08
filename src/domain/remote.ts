/**
 * WebRTC-based remote control for poker tournament timer.
 *
 * Architecture:
 * - Host (TV/main display): generates QR code with WebRTC offer
 * - Controller (smartphone): scans QR → connects → sends commands
 * - Data channel: bidirectional JSON messages
 *
 * Signaling is done via QR code (no server needed):
 * 1. Host creates RTCPeerConnection + data channel → generates SDP offer
 * 2. Offer compressed → QR code shown on screen
 * 3. Controller scans QR → creates answer SDP → sends via second QR or clipboard
 * 4. Connection established → bidirectional data channel
 *
 * Fallback: BroadcastChannel for same-browser same-device tabs.
 */

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
    | 'eliminate'
    | 'rebuy'
    | 'call-the-clock';
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
    players?: { id: string; name: string; status: string }[];
  };
}

/** Ping/pong for keepalive */
export interface RemotePing {
  type: 'ping' | 'pong';
}

export type RemoteMessage = RemoteCommand | RemoteState | RemotePing;

// ---------------------------------------------------------------------------
// SDP compression utilities
// ---------------------------------------------------------------------------

/**
 * Compress SDP string for QR code using DEFLATE (CompressionStream API)
 * with Base64 fallback for browsers without CompressionStream support.
 * Returns a prefixed string: "D:" for DEFLATE-compressed, "B:" for Base64-only.
 */
export async function compressSDP(sdp: string): Promise<string> {
  // Strip empty lines to reduce size before compression
  const stripped = sdp
    .split('\n')
    .filter(line => line.trim().length > 0)
    .join('\n');

  // Try DEFLATE compression via CompressionStream API
  if (typeof CompressionStream !== 'undefined') {
    try {
      const encoder = new TextEncoder();
      const input = encoder.encode(stripped);
      const cs = new CompressionStream('deflate-raw');
      const writer = cs.writable.getWriter();
      writer.write(input);
      writer.close();
      const reader = cs.readable.getReader();
      const chunks: Uint8Array[] = [];
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      const totalLength = chunks.reduce((s, c) => s + c.length, 0);
      const compressed = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        compressed.set(chunk, offset);
        offset += chunk.length;
      }
      // Convert to Base64 for QR-safe transport
      let binary = '';
      for (let i = 0; i < compressed.length; i++) {
        binary += String.fromCharCode(compressed[i]);
      }
      return 'D:' + btoa(binary);
    } catch {
      // Fallback to Base64-only
    }
  }

  // Fallback: Base64-only encoding
  try {
    return 'B:' + btoa(unescape(encodeURIComponent(stripped)));
  } catch {
    return 'B:' + btoa(stripped);
  }
}

/**
 * Decompress SDP string from QR code.
 * Handles both DEFLATE-compressed ("D:" prefix) and Base64-only ("B:" prefix) formats.
 * Also handles legacy format (no prefix) for backward compatibility.
 */
export async function decompressSDP(compressed: string): Promise<string> {
  // DEFLATE-compressed format
  if (compressed.startsWith('D:')) {
    try {
      const base64 = compressed.slice(2);
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const ds = new DecompressionStream('deflate-raw');
      const writer = ds.writable.getWriter();
      writer.write(bytes);
      writer.close();
      const reader = ds.readable.getReader();
      const chunks: Uint8Array[] = [];
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      const totalLength = chunks.reduce((s, c) => s + c.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      return new TextDecoder().decode(result);
    } catch {
      // If decompression fails, return the raw data
      return compressed;
    }
  }

  // Base64-only format (with prefix)
  if (compressed.startsWith('B:')) {
    const base64 = compressed.slice(2);
    try {
      return decodeURIComponent(escape(atob(base64)));
    } catch {
      try { return atob(base64); } catch { return base64; }
    }
  }

  // Legacy format (no prefix) — backward compatibility
  try {
    return decodeURIComponent(escape(atob(compressed)));
  } catch {
    try {
      return atob(compressed);
    } catch {
      return compressed;
    }
  }
}

// ---------------------------------------------------------------------------
// Remote Host (TV/Main Display)
// ---------------------------------------------------------------------------

export interface RemoteHostCallbacks {
  onCommand: (cmd: RemoteCommand) => void;
  onConnected: () => void;
  onDisconnected: () => void;
}

export class RemoteHost {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private callbacks: RemoteHostCallbacks;
  private keepaliveInterval: ReturnType<typeof setInterval> | null = null;
  private _connected = false;

  constructor(callbacks: RemoteHostCallbacks) {
    this.callbacks = callbacks;
  }

  get connected() {
    return this._connected;
  }

  /** Create offer SDP for QR code display */
  async createOffer(): Promise<string> {
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    // Create data channel
    this.dc = this.pc.createDataChannel('remote-control', { ordered: true });
    this.setupDataChannel(this.dc);

    // Gather all ICE candidates before returning offer
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    // Wait for ICE gathering to complete
    await new Promise<void>((resolve) => {
      if (this.pc!.iceGatheringState === 'complete') {
        resolve();
        return;
      }
      this.pc!.onicegatheringstatechange = () => {
        if (this.pc!.iceGatheringState === 'complete') resolve();
      };
      // Timeout after 5 seconds
      setTimeout(resolve, 5000);
    });

    const sdp = this.pc.localDescription?.sdp ?? '';
    return compressSDP(sdp);
  }

  /** Accept answer SDP from controller (scanned from QR or pasted) */
  async acceptAnswer(compressedAnswer: string): Promise<void> {
    if (!this.pc) throw new Error('No peer connection');
    const sdp = await decompressSDP(compressedAnswer);
    await this.pc.setRemoteDescription({ type: 'answer', sdp });
  }

  /** Send state update to connected controller */
  sendState(state: RemoteState['data']): void {
    if (!this.dc || this.dc.readyState !== 'open') return;
    try {
      this.dc.send(JSON.stringify({ type: 'state', data: state } satisfies RemoteState));
    } catch {
      // Channel closed
    }
  }

  /** Close the connection */
  close(): void {
    if (this.keepaliveInterval) {
      clearInterval(this.keepaliveInterval);
      this.keepaliveInterval = null;
    }
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    this._connected = false;
  }

  private setupDataChannel(dc: RTCDataChannel): void {
    dc.onopen = () => {
      this._connected = true;
      this.callbacks.onConnected();
      // Start keepalive pings
      this.keepaliveInterval = setInterval(() => {
        if (dc.readyState === 'open') {
          dc.send(JSON.stringify({ type: 'ping' }));
        }
      }, 10000);
    };

    dc.onclose = () => {
      this._connected = false;
      this.callbacks.onDisconnected();
      if (this.keepaliveInterval) {
        clearInterval(this.keepaliveInterval);
        this.keepaliveInterval = null;
      }
    };

    dc.onmessage = (event) => {
      try {
        const msg: RemoteMessage = JSON.parse(event.data);
        if (msg.type === 'command') {
          this.callbacks.onCommand(msg);
        } else if (msg.type === 'pong') {
          // Keepalive response received
        }
      } catch {
        // Invalid message
      }
    };
  }
}

// ---------------------------------------------------------------------------
// Remote Controller (Smartphone)
// ---------------------------------------------------------------------------

export interface RemoteControllerCallbacks {
  onState: (state: RemoteState['data']) => void;
  onConnected: () => void;
  onDisconnected: () => void;
}

export class RemoteController {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private callbacks: RemoteControllerCallbacks;
  private _connected = false;

  constructor(callbacks: RemoteControllerCallbacks) {
    this.callbacks = callbacks;
  }

  get connected() {
    return this._connected;
  }

  /** Connect to host using compressed offer SDP, returns compressed answer SDP */
  async connect(compressedOffer: string): Promise<string> {
    const offerSDP = await decompressSDP(compressedOffer);

    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    // Listen for data channel from host
    this.pc.ondatachannel = (event) => {
      this.dc = event.channel;
      this.setupDataChannel(this.dc);
    };

    await this.pc.setRemoteDescription({ type: 'offer', sdp: offerSDP });
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);

    // Wait for ICE gathering to complete
    await new Promise<void>((resolve) => {
      if (this.pc!.iceGatheringState === 'complete') {
        resolve();
        return;
      }
      this.pc!.onicegatheringstatechange = () => {
        if (this.pc!.iceGatheringState === 'complete') resolve();
      };
      setTimeout(resolve, 5000);
    });

    const sdp = this.pc.localDescription?.sdp ?? '';
    return compressSDP(sdp);
  }

  /** Send command to host */
  sendCommand(action: RemoteCommand['action'], payload?: Record<string, unknown>): void {
    if (!this.dc || this.dc.readyState !== 'open') return;
    try {
      this.dc.send(JSON.stringify({ type: 'command', action, payload } satisfies RemoteCommand));
    } catch {
      // Channel closed
    }
  }

  /** Close the connection */
  close(): void {
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    this._connected = false;
  }

  private setupDataChannel(dc: RTCDataChannel): void {
    dc.onopen = () => {
      this._connected = true;
      this.callbacks.onConnected();
    };

    dc.onclose = () => {
      this._connected = false;
      this.callbacks.onDisconnected();
    };

    dc.onmessage = (event) => {
      try {
        const msg: RemoteMessage = JSON.parse(event.data);
        if (msg.type === 'state') {
          this.callbacks.onState(msg.data);
        } else if (msg.type === 'ping') {
          // Reply to keepalive
          if (dc.readyState === 'open') {
            dc.send(JSON.stringify({ type: 'pong' }));
          }
        }
      } catch {
        // Invalid message
      }
    };
  }
}
