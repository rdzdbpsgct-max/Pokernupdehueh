import { useState, useCallback, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RemoteHost, RemoteController } from '../domain/remote';
import type { RemoteCommand, RemoteState } from '../domain/remote';
import { useTranslation } from '../i18n';
import { useTheme } from '../theme';
import { formatTime } from '../domain/logic';

// ---------------------------------------------------------------------------
// Host Modal — shown on the main display to allow a controller to connect
// ---------------------------------------------------------------------------

interface HostProps {
  onCommand: (cmd: RemoteCommand) => void;
  onClose: () => void;
  /** Called with the RemoteHost instance when connected, so App can send state */
  onHostReady: (host: RemoteHost) => void;
}

export function RemoteHostModal({ onCommand, onClose, onHostReady }: HostProps) {
  const { t } = useTranslation();
  const { resolved } = useTheme();
  const [offerQR, setOfferQR] = useState<string | null>(null);
  const [status, setStatus] = useState<'generating' | 'waiting' | 'connected' | 'error'>('generating');
  const [answerInput, setAnswerInput] = useState('');
  const hostRef = useRef<RemoteHost | null>(null);

  // Generate offer on mount
  useEffect(() => {
    const host = new RemoteHost({
      onCommand,
      onConnected: () => {
        setStatus('connected');
        onHostReady(host);
      },
      onDisconnected: () => setStatus('waiting'),
    });
    hostRef.current = host;

    host.createOffer().then((offer) => {
      setOfferQR(offer);
      setStatus('waiting');
    }).catch(() => {
      setStatus('error');
    });

    return () => {
      host.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAcceptAnswer = useCallback(async () => {
    if (!hostRef.current || !answerInput.trim()) return;
    try {
      await hostRef.current.acceptAnswer(answerInput.trim());
    } catch {
      setStatus('error');
    }
  }, [answerInput]);

  const handlePasteAnswer = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setAnswerInput(text.trim());
        if (hostRef.current) {
          await hostRef.current.acceptAnswer(text.trim());
        }
      }
    } catch {
      // Clipboard not available
    }
  }, []);

  const qrFg = resolved === 'dark' ? '#e5e7eb' : '#111827';
  const qrBg = resolved === 'dark' ? '#1f2937' : '#ffffff';

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 dark:bg-gray-900/95 border border-gray-300 dark:border-gray-700/50 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('remote.hostTitle')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">&times;</button>
        </div>

        {status === 'generating' && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {t('remote.generating')}...
          </div>
        )}

        {status === 'waiting' && offerQR && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('remote.scanQR')}</p>
            <div className="flex justify-center">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl">
                <QRCodeSVG
                  value={offerQR}
                  size={200}
                  fgColor={qrFg}
                  bgColor={qrBg}
                  level="L"
                />
              </div>
            </div>
            <div className="text-center">
              <button
                onClick={() => {
                  try { navigator.clipboard.writeText(offerQR); } catch { /* ignore */ }
                }}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline"
              >
                {t('remote.copyOffer')}
              </button>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700/40 pt-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('remote.pasteAnswer')}</p>
              <div className="flex gap-2">
                <input
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  placeholder={t('remote.answerPlaceholder')}
                  className="flex-1 px-3 py-2 bg-white dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700/60 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/25 focus:outline-none"
                />
                <button
                  onClick={handlePasteAnswer}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm"
                  title={t('remote.paste')}
                >
                  📋
                </button>
                <button
                  onClick={handleAcceptAnswer}
                  disabled={!answerInput.trim()}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {t('remote.connect')}
                </button>
              </div>
            </div>
          </div>
        )}

        {status === 'connected' && (
          <div className="text-center py-6 space-y-3">
            <div className="text-4xl">✅</div>
            <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{t('remote.connected')}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('remote.connectedHint')}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-6 space-y-3">
            <div className="text-4xl">❌</div>
            <p className="text-sm text-red-500">{t('remote.error')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Controller View — smartphone remote control UI
// ---------------------------------------------------------------------------

interface ControllerProps {
  offerData: string;
  onClose: () => void;
}

export function RemoteControllerView({ offerData, onClose }: ControllerProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'connecting' | 'needAnswer' | 'connected' | 'error'>('connecting');
  const [state, setState] = useState<RemoteState['data'] | null>(null);
  const [answerQR, setAnswerQR] = useState<string | null>(null);
  const controllerRef = useRef<RemoteController | null>(null);
  const { resolved } = useTheme();

  useEffect(() => {
    const ctrl = new RemoteController({
      onState: (s) => setState(s),
      onConnected: () => setStatus('connected'),
      onDisconnected: () => setStatus('error'),
    });
    controllerRef.current = ctrl;

    ctrl.connect(offerData).then((answer) => {
      setAnswerQR(answer);
      setStatus('needAnswer');
    }).catch(() => {
      setStatus('error');
    });

    return () => ctrl.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendCmd = useCallback((action: RemoteCommand['action']) => {
    controllerRef.current?.sendCommand(action);
  }, []);

  const qrFg = resolved === 'dark' ? '#e5e7eb' : '#111827';
  const qrBg = resolved === 'dark' ? '#1f2937' : '#ffffff';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
      <div className="max-w-sm mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('remote.controllerTitle')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&times;</button>
        </div>

        {status === 'connecting' && (
          <div className="text-center py-8 text-gray-500">{t('remote.connecting')}...</div>
        )}

        {status === 'needAnswer' && answerQR && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('remote.showAnswerQR')}</p>
            <div className="flex justify-center">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl">
                <QRCodeSVG value={answerQR} size={180} fgColor={qrFg} bgColor={qrBg} level="L" />
              </div>
            </div>
            <button
              onClick={() => {
                try { navigator.clipboard.writeText(answerQR); } catch { /* ignore */ }
              }}
              className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium"
            >
              {t('remote.copyAnswer')}
            </button>
          </div>
        )}

        {status === 'connected' && (
          <div className="space-y-4">
            {/* Status info */}
            {state && (
              <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700/40 space-y-2">
                {state.tournamentName && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center">{state.tournamentName}</p>
                )}
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">{state.levelLabel}</div>
                  <div className="text-3xl font-mono font-bold text-gray-900 dark:text-white tabular-nums">
                    {formatTime(state.remainingSeconds)}
                  </div>
                  <div className="text-lg font-mono text-gray-600 dark:text-gray-300">
                    {state.smallBlind}/{state.bigBlind}
                    {state.ante ? ` (${state.ante})` : ''}
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{state.activePlayerCount}/{state.totalPlayerCount} {t('remote.players')}</span>
                  <span className={`font-medium ${state.timerStatus === 'running' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {state.timerStatus === 'running' ? '▶' : '⏸'}
                  </span>
                </div>
                {state.isBubble && (
                  <div className="text-center text-xs font-bold text-red-500 animate-pulse">BUBBLE!</div>
                )}
              </div>
            )}

            {/* Control buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => sendCmd('prev')}
                className="aspect-square flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-xl text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-transform shadow-sm"
                title={t('remote.prev')}
              >
                ⏮
              </button>
              <button
                onClick={() => sendCmd('toggle')}
                className="aspect-square flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-3xl active:scale-95 transition-transform shadow-lg shadow-emerald-900/30"
                title={state?.timerStatus === 'running' ? t('remote.pause') : t('remote.play')}
              >
                {state?.timerStatus === 'running' ? '⏸' : '▶️'}
              </button>
              <button
                onClick={() => sendCmd('next')}
                className="aspect-square flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-xl text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-transform shadow-sm"
                title={t('remote.next')}
              >
                ⏭
              </button>
            </div>

            {/* Secondary actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => sendCmd('call-the-clock')}
                className="px-4 py-3 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-xl text-sm font-medium active:scale-95 transition-transform border border-amber-200 dark:border-amber-700/40"
              >
                ⏱ {t('remote.callClock')}
              </button>
              <button
                onClick={() => sendCmd('reset')}
                className="px-4 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm font-medium active:scale-95 transition-transform border border-red-200 dark:border-red-700/40"
              >
                🔄 {t('remote.reset')}
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-8 space-y-3">
            <div className="text-4xl">❌</div>
            <p className="text-sm text-red-500">{t('remote.error')}</p>
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg text-sm">
              {t('app.cancel')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
