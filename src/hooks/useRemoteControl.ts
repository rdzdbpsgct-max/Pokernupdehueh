import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { RemoteHost, parseRemoteHash } from '../domain/remote';

interface UseRemoteControlOptions {
  enabled: boolean; // typically: mode === 'game'
}

interface UseRemoteControlReturn {
  /** Ref to the RemoteHost instance (for sending state updates) */
  hostRef: React.RefObject<RemoteHost | null>;
  /** Whether the host modal should be shown */
  showRemoteModal: boolean;
  setShowRemoteModal: (v: boolean) => void;
  /** True if this window was opened via #remote= hash (controller mode) */
  isControllerMode: boolean;
  /** The host peer ID to connect to (only set in controller mode) */
  controllerPeerId: string | null;
  /** Handler to set the host ref when RemoteHostModal reports ready */
  handleHostReady: (host: RemoteHost) => void;
}

/**
 * Hook to manage remote control state.
 *
 * - Detects #remote= hash on mount → enters controller mode
 * - Manages RemoteHost ref for state updates from App
 * - Cleans up on mode switch / unmount
 */
export function useRemoteControl({ enabled }: UseRemoteControlOptions): UseRemoteControlReturn {
  const hostRef = useRef<RemoteHost | null>(null);
  const [showRemoteModalRaw, setShowRemoteModal] = useState(false);

  // Derive effective modal visibility — only show when enabled (game mode)
  const showRemoteModal = useMemo(() => showRemoteModalRaw && enabled, [showRemoteModalRaw, enabled]);

  // Detect controller mode from URL hash (only once on mount)
  const [controllerPeerId] = useState<string | null>(() => {
    const hash = window.location.hash;
    const peerId = parseRemoteHash(hash);
    if (peerId) {
      // Clear hash from URL
      history.replaceState(null, '', window.location.pathname + window.location.search);
      return peerId;
    }
    return null;
  });

  const isControllerMode = controllerPeerId !== null;

  const handleHostReady = useCallback((host: RemoteHost) => {
    hostRef.current = host;
  }, []);

  // Cleanup host when switching away from game mode
  useEffect(() => {
    if (!enabled && hostRef.current) {
      hostRef.current.destroy();
      hostRef.current = null;
    }
  }, [enabled]);

  return {
    hostRef,
    showRemoteModal,
    setShowRemoteModal,
    isControllerMode,
    controllerPeerId,
    handleHostReady,
  };
}
