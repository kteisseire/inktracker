import { useEffect, useRef, useState } from 'react';

const DEFAULT_DURATION = 50 * 60; // 50 minutes, standard Lorcana round length
const ALERT_THRESHOLD = 5 * 60; // red blink under 5 minutes remaining

const PRESETS = [
  { label: '50 min', seconds: 50 * 60 },
  { label: '40 min', seconds: 40 * 60 },
  { label: '30 min', seconds: 30 * 60 },
];

function formatDuration(s: number): string {
  const sign = s < 0 ? '-' : '';
  const abs = Math.abs(s);
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
}

/**
 * Standalone round timer — countdown with start/pause/reset controls.
 * Configurable duration (default 50 min), red blinking alert under 5 minutes,
 * and a vibration pulse (if supported) when the alert threshold and end are reached.
 * Local state only, no backend persistence.
 */
export function RoundTimer({ className = '' }: { className?: string }) {
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [seconds, setSeconds] = useState(DEFAULT_DURATION);
  const [running, setRunning] = useState(false);
  const [editing, setEditing] = useState(false);
  const [customInput, setCustomInput] = useState(formatDuration(DEFAULT_DURATION));

  const secondsRef = useRef(seconds);
  secondsRef.current = seconds;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alertFiredRef = useRef(false);
  const endFiredRef = useRef(false);

  useEffect(() => {
    if (!running) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      const next = secondsRef.current - 1;
      setSeconds(next);

      // Vibrate once when entering the alert zone
      if (next === ALERT_THRESHOLD && !alertFiredRef.current) {
        alertFiredRef.current = true;
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200, 100, 200]);
      }

      // Vibrate when the timer hits zero, then stop auto-counting down further
      if (next === 0 && !endFiredRef.current) {
        endFiredRef.current = true;
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([400, 150, 400, 150, 400]);
      }
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);

  const toggleRunning = () => setRunning(r => !r);

  const reset = () => {
    setRunning(false);
    setSeconds(duration);
    alertFiredRef.current = false;
    endFiredRef.current = false;
  };

  const applyDuration = (newDuration: number) => {
    setDuration(newDuration);
    setSeconds(newDuration);
    setRunning(false);
    alertFiredRef.current = false;
    endFiredRef.current = false;
    setEditing(false);
  };

  const isAlert = seconds <= ALERT_THRESHOLD;
  const isExpired = seconds <= 0;

  return (
    <div className={`ink-card p-4 sm:p-5 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="rubric-label">Timer de ronde</h3>
        <button
          type="button"
          onClick={() => { setCustomInput(formatDuration(duration)); setEditing(v => !v); }}
          className="text-xs text-ink-500 hover:text-gold-400 transition-colors"
        >
          Régler
        </button>
      </div>

      {editing && (
        <div className="mb-3 space-y-2">
          <div className="flex gap-2 flex-wrap">
            {PRESETS.map(p => (
              <button
                key={p.seconds}
                type="button"
                onClick={() => applyDuration(p.seconds)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${
                  duration === p.seconds
                    ? 'border-gold-500 bg-gold-500/10 text-gold-400'
                    : 'border-ink-700/50 text-ink-400 hover:border-ink-600/50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              placeholder="MM:SS"
              className="ink-input text-sm font-mono"
            />
            <button
              type="button"
              onClick={() => {
                const parts = customInput.split(':');
                const mins = parseInt(parts[0]) || 0;
                const secs = parseInt(parts[1]) || 0;
                const total = mins * 60 + secs;
                if (total > 0) applyDuration(total);
              }}
              className="ink-btn-secondary text-xs px-3 py-1.5 shrink-0"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-3">
        <div
          className={`font-mono font-bold tabular-nums text-4xl sm:text-5xl tracking-wider ${
            isAlert ? 'text-red-400' : 'text-ink-100'
          } ${isAlert && running ? 'animate-pulse' : ''}`}
        >
          {formatDuration(seconds)}
        </div>

        {isExpired && (
          <p className="text-xs text-red-400 font-medium">Temps écoulé !</p>
        )}

        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={toggleRunning}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all border-2 ${
              running
                ? 'border-ink-700/50 text-ink-300 hover:border-ink-600/50'
                : 'border-gold-500/40 bg-gold-500/10 text-gold-400 hover:bg-gold-500/15'
            }`}
          >
            {running ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                Pause
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                Démarrer
              </>
            )}
          </button>
          <button
            type="button"
            onClick={reset}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all border-2 border-ink-700/50 text-ink-400 hover:border-ink-600/50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
}
