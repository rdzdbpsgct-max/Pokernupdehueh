import { useState, useCallback, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RemoteController, buildRemoteUrl } from '../domain/remote';
import type { RemoteCommand, RemoteState, HostStatus, ControllerStatus } from '../domain/remote';
import { useTranslation } from '../i18n';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { useTheme } from '../theme';
import { formatTime } from '../domain/logic';

// ---------------------------------------------------------------------------
// Host Modal — pure display component (host lifecycle managed by useRemoteControl hook)
// ---------------------------------------------------------------------------

interface HostProps {
  /** Peer ID of the running host */
  peerId: string;
  /** HMAC secret for authentication */
  secret?: string;
  /** Current host connection status */
  status: HostStatus | null;
  onClose: () => void;
}

export function RemoteHostModal({ peerId, secret, status, onClose }: HostProps) {
  const { t } = useTranslation();
  const dialogRef = useDialogA11y(onClose);
  const { resolved } = useTheme();

  const qrUrl = peerId ? buildRemoteUrl(peerId, secret) : '';

  const qrFg = resolved === 'dark' ? '#e5e7eb' : '#111827';
  const qrBg = resolved === 'dark' ? '#1f2937' : '#ffffff';

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="remote-host-title" className="bg-white/95 dark:bg-gray-900/95 border border-gray-300 dark:border-gray-700/50 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between">
          <h3 id="remote-host-title" className="text-lg font-bold text-gray-900 dark:text-white">{t('remote.hostTitle')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">&times;</button>
        </div>

        {(status === 'initializing' || status === null) && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 animate-pulse">
            {t('remote.waitingForConnection')}
          </div>
        )}

        {(status === 'ready' || status === 'connected') && qrUrl && (
          <div className="space-y-4">
            {status === 'ready' && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('remote.scanQR')}</p>
            )}

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl">
                <QRCodeSVG
                  value={qrUrl}
                  size={220}
                  fgColor={qrFg}
                  bgColor={qrBg}
                  level="M"
                />
              </div>
            </div>

            {/* Peer ID display */}
            <div className="text-center space-y-1">
              <p className="text-xs text-gray-400 dark:text-gray-500">{t('remote.peerId')}</p>
              <p className="text-2xl font-mono font-bold tracking-widest text-gray-900 dark:text-white select-all">
                {peerId}
              </p>
            </div>

            {/* Connection status */}
            {status === 'connected' && (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 py-2">
                  <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-500)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--accent-text)' }}>
                    {t('remote.connected')}
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                  {t('remote.canClose')}
                </p>
              </div>
            )}

            {status === 'ready' && (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                {t('remote.waitingForConnection')}
              </p>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-6 space-y-3">
            <div className="text-4xl">{String.fromCodePoint(0x274C)}</div>
            <p className="text-sm text-red-500">{t('remote.error')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Controller View — smartphone remote control UI (touch-optimized fullscreen)
// ---------------------------------------------------------------------------

interface ControllerProps {
  hostPeerId: string;
  /** HMAC secret for command authentication */
  secret?: string | null;
  onClose: () => void;
}

export function RemoteControllerView({ hostPeerId, secret, onClose }: ControllerProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<ControllerStatus>('connecting');
  const [state, setState] = useState<RemoteState['data'] | null>(null);
  const controllerRef = useRef<RemoteController | null>(null);

  useEffect(() => {
    const ctrl = new RemoteController(hostPeerId, {
      onState: (s) => setState(s),
      onStatusChange: (s) => setStatus(s),
    }, secret);
    controllerRef.current = ctrl;

    // Request Wake Lock to keep screen on
    let wakeLock: WakeLockSentinel | null = null;
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then(wl => { wakeLock = wl; }).catch(() => { /* ignore */ });
    }

    return () => {
      ctrl.destroy();
      if (wakeLock) { wakeLock.release().catch(() => { /* ignore */ }); }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendCmd = useCallback((action: RemoteCommand['action']) => {
    controllerRef.current?.sendCommand(action);
  }, []);

  const handleRetry = useCallback(() => {
    controllerRef.current?.retry();
  }, []);

  // Force dark mode on controller via class
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, []);

  return (
    <div
      className="min-h-screen bg-gray-950 text-white flex flex-col select-none"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Connection status banner */}
      {status === 'reconnecting' && (
        <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-2 text-center text-sm text-amber-400">
          {t('remote.reconnecting')}
        </div>
      )}

      {/* Connecting state */}
      {status === 'connecting' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 animate-pulse">
            <div className="text-5xl">{String.fromCodePoint(0x1F4F1)}</div>
            <p className="text-lg text-gray-400">{t('remote.connecting')}</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 px-6">
            <div className="text-5xl">{String.fromCodePoint(0x274C)}</div>
            <p className="text-lg text-red-400">{t('remote.reconnectFailed')}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleRetry}
                className="px-6 py-3 text-white rounded-xl text-sm font-medium active:scale-95 transition-transform"
                style={{ backgroundColor: 'var(--accent-600)' }}
              >
                {t('remote.retry')}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-800 text-gray-300 rounded-xl text-sm font-medium active:scale-95 transition-transform border border-gray-700/60"
              >
                {t('remote.disconnect')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connected state — full controller UI */}
      {(status === 'connected' || (status === 'reconnecting' && state)) && (
        <div className="flex-1 flex flex-col px-4 py-3 max-w-md mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1 min-w-0">
              {state?.tournamentName && (
                <h2 className="text-sm font-medium text-gray-400 truncate">{state.tournamentName}</h2>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: status === 'connected' ? 'var(--accent-500)' : '#f59e0b' }}
              />
              <span className="text-xs text-gray-500">
                {status === 'connected' ? t('remote.connected') : t('remote.reconnecting')}
              </span>
            </div>
          </div>

          {/* Timer display */}
          {state && (
            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 mb-4">
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-1">{state.levelLabel}</div>
                <div className="text-5xl font-mono font-bold tabular-nums tracking-tight mb-2">
                  {formatTime(state.remainingSeconds)}
                </div>
                <div className="text-xl font-mono text-gray-300">
                  {state.smallBlind}/{state.bigBlind}
                  {state.ante ? ` (${state.ante})` : ''}
                </div>
              </div>

              {/* Status row */}
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-800">
                <span className="text-xs text-gray-500">
                  {state.activePlayerCount}/{state.totalPlayerCount} {t('remote.players')}
                </span>
                <div className="flex items-center gap-2">
                  {state.isBubble && (
                    <span className="text-xs font-bold text-red-400 animate-pulse">BUBBLE!</span>
                  )}
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={state.timerStatus === 'running'
                      ? { backgroundColor: 'color-mix(in srgb, var(--accent-500) 20%, transparent)', color: 'var(--accent-400)' }
                      : { backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }
                    }
                  >
                    {state.timerStatus === 'running' ? t('remote.play') : t('remote.pause')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Main control buttons */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <button
              onClick={() => sendCmd('prev')}
              className="aspect-square flex items-center justify-center bg-gray-800 border border-gray-700/60 rounded-xl text-2xl active:scale-95 transition-transform"
              title={t('remote.prev')}
              aria-label={t('remote.prev')}
            >
              {String.fromCodePoint(0x23EE)}
            </button>
            <button
              onClick={() => sendCmd('toggle')}
              className="aspect-square flex items-center justify-center text-white rounded-xl text-3xl active:scale-95 transition-transform shadow-lg"
              style={{ backgroundColor: 'var(--accent-600)', boxShadow: '0 10px 15px -3px var(--accent-900)' }}
              title={state?.timerStatus === 'running' ? t('remote.pause') : t('remote.play')}
              aria-label={state?.timerStatus === 'running' ? t('remote.pause') : t('remote.play')}
            >
              {state?.timerStatus === 'running' ? String.fromCodePoint(0x23F8) : String.fromCodePoint(0x25B6, 0xFE0F)}
            </button>
            <button
              onClick={() => sendCmd('next')}
              className="aspect-square flex items-center justify-center bg-gray-800 border border-gray-700/60 rounded-xl text-2xl active:scale-95 transition-transform"
              title={t('remote.next')}
              aria-label={t('remote.next')}
            >
              {String.fromCodePoint(0x23ED)}
            </button>
          </div>

          {/* Secondary actions */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => sendCmd('advanceDealer')}
              className="px-4 py-3 bg-gray-800 text-gray-300 rounded-xl text-sm font-medium active:scale-95 transition-transform border border-gray-700/40"
            >
              {String.fromCodePoint(0x1F3B2)} {t('remote.dealer')}
            </button>
            <button
              onClick={() => sendCmd('toggleSound')}
              className="px-4 py-3 bg-gray-800 text-gray-300 rounded-xl text-sm font-medium active:scale-95 transition-transform border border-gray-700/40"
            >
              {state?.soundEnabled ? String.fromCodePoint(0x1F50A) : String.fromCodePoint(0x1F507)} {t('remote.sound')}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => sendCmd('call-the-clock')}
              className="px-4 py-3 bg-amber-900/30 text-amber-400 rounded-xl text-sm font-medium active:scale-95 transition-transform border border-amber-700/40"
            >
              {String.fromCodePoint(0x23F1)} {t('remote.callClock')}
            </button>
            <button
              onClick={() => sendCmd('reset')}
              className="px-4 py-3 bg-red-900/30 text-red-400 rounded-xl text-sm font-medium active:scale-95 transition-transform border border-red-700/40"
            >
              {String.fromCodePoint(0x1F504)} {t('remote.reset')}
            </button>
          </div>

          {/* Footer with disconnect */}
          <div className="mt-auto pt-3">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-gray-800/60 text-gray-500 rounded-xl text-sm active:scale-95 transition-transform border border-gray-700/30"
            >
              {t('remote.disconnect')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
