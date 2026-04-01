import { useState, useCallback, useRef, useEffect } from 'react';

const MAX_LORE = 20;
const GROUP_DELAY_MS = 3000;
const DEFAULT_TIMER = 50 * 60; // 50 minutes en secondes

interface RawLoreEntry {
  player: 'me' | 'opponent';
  delta: number;
  newValue: number;
  timestamp: number;
}

interface GroupedLoreEntry {
  player: 'me' | 'opponent';
  totalDelta: number;
  fromValue: number;
  toValue: number;
  count: number;
  timestamp: number;
}

function groupHistory(raw: RawLoreEntry[]): GroupedLoreEntry[] {
  if (raw.length === 0) return [];
  const groups: GroupedLoreEntry[] = [];
  let current: GroupedLoreEntry & { lastTimestamp: number } = {
    player: raw[0].player,
    totalDelta: raw[0].delta,
    fromValue: raw[0].newValue - raw[0].delta,
    toValue: raw[0].newValue,
    count: 1,
    timestamp: raw[0].timestamp,
    lastTimestamp: raw[0].timestamp,
  };
  for (let i = 1; i < raw.length; i++) {
    const entry = raw[i];
    const samePlayer = entry.player === current.player;
    const sameDirection = (entry.delta > 0) === (current.totalDelta > 0);
    const withinDelay = entry.timestamp - current.lastTimestamp < GROUP_DELAY_MS;
    if (samePlayer && sameDirection && withinDelay) {
      current.totalDelta += entry.delta;
      current.toValue = entry.newValue;
      current.count++;
      current.lastTimestamp = entry.timestamp;
    } else {
      const { lastTimestamp: _, ...group } = current;
      groups.push(group);
      current = { player: entry.player, totalDelta: entry.delta, fromValue: entry.newValue - entry.delta, toValue: entry.newValue, count: 1, timestamp: entry.timestamp, lastTimestamp: entry.timestamp };
    }
  }
  const { lastTimestamp: _, ...lastGroup } = current;
  groups.push(lastGroup);
  return groups;
}

export interface LoreState {
  myLore: number;
  opponentLore: number;
  history: RawLoreEntry[];
  winner: 'me' | 'opponent' | null;
}

export interface LoreResult {
  myScore: number;
  opponentScore: number;
  winner: 'me' | 'opponent' | null;
  state: LoreState;
}

export interface TimerState {
  seconds: number;
  running: boolean;
}

interface LoreCounterProps {
  onClose: (result: LoreResult) => void;
  initialState?: LoreState;
  timerState?: TimerState;
  onTimerChange?: (state: TimerState) => void;
}

export function LoreCounter({ onClose, initialState, timerState, onTimerChange }: LoreCounterProps) {
  const [myLore, setMyLore] = useState(initialState?.myLore ?? 0);
  const [opponentLore, setOpponentLore] = useState(initialState?.opponentLore ?? 0);
  const [rawHistory, setRawHistory] = useState<RawLoreEntry[]>(initialState?.history ?? []);
  const [showHistory, setShowHistory] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [winner, setWinner] = useState<'me' | 'opponent' | null>(initialState?.winner ?? null);
  const winnerRef = useRef<'me' | 'opponent' | null>(initialState?.winner ?? null);
  const myLoreRef = useRef(initialState?.myLore ?? 0);
  const opponentLoreRef = useRef(initialState?.opponentLore ?? 0);

  // Timer géré par le parent si timerState/onTimerChange fournis, sinon local
  const [localTimerSeconds, setLocalTimerSeconds] = useState(DEFAULT_TIMER);
  const [localTimerRunning, setLocalTimerRunning] = useState(false);
  const timerSeconds = timerState?.seconds ?? localTimerSeconds;
  const timerRunning = timerState?.running ?? localTimerRunning;

  const setTimerSeconds = (val: number | ((s: number) => number)) => {
    const next = typeof val === 'function' ? val(timerSeconds) : val;
    if (onTimerChange) onTimerChange({ seconds: next, running: timerRunning });
    else setLocalTimerSeconds(next);
  };
  const setTimerRunning = (val: boolean | ((r: boolean) => boolean)) => {
    const next = typeof val === 'function' ? val(timerRunning) : val;
    if (onTimerChange) onTimerChange({ seconds: timerSeconds, running: next });
    else setLocalTimerRunning(next);
  };

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerSecondsRef = useRef(timerSeconds);
  timerSecondsRef.current = timerSeconds;

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        const newSeconds = timerSecondsRef.current - 1;
        if (newSeconds <= 0) {
          if (onTimerChange) onTimerChange({ seconds: 0, running: false });
          else { setLocalTimerSeconds(0); setLocalTimerRunning(false); }
          clearInterval(timerRef.current!);
        } else {
          if (onTimerChange) onTimerChange({ seconds: newSeconds, running: true });
          else setLocalTimerSeconds(newSeconds);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const timerExpired = timerSeconds === 0;
  const timerColor = timerSeconds <= 60 ? '#d85b5b' : timerSeconds <= 5 * 60 ? '#f5c842' : 'rgba(255,255,255,0.5)';

  const changeLore = useCallback((player: 'me' | 'opponent', delta: number) => {
    if (winnerRef.current) return;
    const ref = player === 'me' ? myLoreRef : opponentLoreRef;
    const setter = player === 'me' ? setMyLore : setOpponentLore;
    const prev = ref.current;
    const next = Math.max(0, Math.min(MAX_LORE, prev + delta));
    if (next === prev) return;
    ref.current = next;
    setter(next);
    setRawHistory(h => [...h, { player, delta: next - prev, newValue: next, timestamp: Date.now() }]);
    if (next >= MAX_LORE) { winnerRef.current = player; setWinner(player); }
  }, []);

  const resetAll = () => {
    setMyLore(0); setOpponentLore(0);
    myLoreRef.current = 0; opponentLoreRef.current = 0;
    setRawHistory([]); setWinner(null); winnerRef.current = null;
    setTimerSeconds(DEFAULT_TIMER); setTimerRunning(false);
    setShowMenu(false);
  };

  const undoLast = () => {
    if (rawHistory.length === 0) return;
    const last = rawHistory[rawHistory.length - 1];
    const ref = last.player === 'me' ? myLoreRef : opponentLoreRef;
    const setter = last.player === 'me' ? setMyLore : setOpponentLore;
    const restored = last.newValue - last.delta;
    ref.current = restored;
    setter(restored);
    setRawHistory(h => h.slice(0, -1));
    if (winner) { setWinner(null); winnerRef.current = null; }
  };

  const handleClose = () => {
    onClose({ myScore: myLore, opponentScore: opponentLore, winner, state: { myLore, opponentLore, history: rawHistory, winner } });
  };

  const grouped = groupHistory(rawHistory);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col select-none overflow-hidden"
      style={{ touchAction: 'manipulation', background: 'radial-gradient(ellipse at 50% 50%, #1a1035 0%, #0c0a14 70%)' }}
    >
      {/* Étoiles décoratives */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {[...Array(24)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: i % 4 === 0 ? 2 : 1,
              height: i % 4 === 0 ? 2 : 1,
              top: `${(i * 37 + 11) % 100}%`,
              left: `${(i * 53 + 7) % 100}%`,
              opacity: 0.15 + (i % 5) * 0.07,
            }}
          />
        ))}
      </div>


      {/* Winner overlay */}
      {winner && (
        <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-sm" style={{ background: 'rgba(12,10,20,0.85)' }}>
          <div className="text-center space-y-5 px-8">
            <div className="text-6xl mb-2">{winner === 'me' ? '✨' : '💫'}</div>
            <div className={`font-display text-4xl font-bold tracking-wide ${winner === 'me' ? 'text-gold-400' : 'text-ink-400'}`}>
              {winner === 'me' ? 'Victoire !' : 'Défaite'}
            </div>
            <div className="text-ink-400 text-lg font-display tracking-widest">
              <span className="text-[#5ba8d8]">{myLore}</span>
              <span className="text-gold-600/50 mx-3">✦</span>
              <span className="text-[#d85b5b]">{opponentLore}</span>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button onClick={handleClose} className="px-7 py-3 rounded-xl font-semibold text-ink-950 text-base" style={{ background: 'linear-gradient(135deg, #f5c842, #e8a800)' }}>
                Valider
              </button>
              <button onClick={() => { setWinner(null); winnerRef.current = null; }} className="px-6 py-3 rounded-xl text-ink-300 text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zones de jeu */}
      <div className="flex-1 flex flex-col">
        {/* Adversaire — retourné */}
        <div className="flex-1 flex flex-col rotate-180">
          <PlayerSide label="Adversaire" lore={opponentLore} color="ruby" onChangeLore={(d) => changeLore('opponent', d)} disabled={!!winner} />
        </div>

        {/* Séparateur central */}
        <div className="relative flex items-center justify-center h-14 shrink-0" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.08), transparent)' }}>
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.3) 30%, rgba(212,175,55,0.5) 50%, rgba(212,175,55,0.3) 70%, transparent 100%)' }} />

          <div className="relative z-10 flex items-center gap-0 rounded-full overflow-hidden" style={{ background: '#0f0c1e', border: '1px solid rgba(212,175,55,0.2)' }}>

            {/* Groupe gauche : fermer + historique */}
            <button onClick={handleClose} className="p-2.5 text-white/30 hover:text-white/70 transition-colors hover:bg-white/5" aria-label="Fermer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <button onClick={() => { setShowHistory(!showHistory); }} className="p-2.5 text-white/30 hover:text-white/70 transition-colors hover:bg-white/5" aria-label="Historique">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>

            <div className="w-px h-5 bg-white/10 mx-0.5" />

            {/* Timer : play/pause */}
            <button
              onClick={() => !timerExpired && setTimerRunning(r => !r)}
              className="flex items-center gap-1.5 px-2 py-1.5 transition-colors hover:bg-white/5"
              aria-label={timerRunning ? 'Pause' : 'Démarrer'}
            >
              {timerExpired ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="#d85b5b" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ) : timerRunning ? (
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" style={{ color: timerColor }}><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" style={{ color: timerColor }}><path d="M8 5v14l11-7z"/></svg>
              )}
              <span className="font-mono text-sm font-semibold tabular-nums" style={{ color: timerColor, minWidth: '3.5rem', textAlign: 'center' }}>
                {formatTimer(timerSeconds)}
              </span>
            </button>
            {/* Reset timer — visible uniquement si en pause et pas à 50min */}
            {!timerRunning && timerSeconds !== DEFAULT_TIMER && (
              <button
                onClick={() => { setTimerSeconds(DEFAULT_TIMER); setTimerRunning(false); }}
                className="p-2 text-white/30 hover:text-white/70 transition-colors hover:bg-white/5"
                aria-label="Réinitialiser le timer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
            )}

            <div className="w-px h-5 bg-white/10 mx-0.5" />

            {/* Groupe droite : annuler + reset */}
            <button onClick={undoLast} disabled={rawHistory.length === 0} className="p-2.5 text-white/30 hover:text-white/70 transition-colors hover:bg-white/5 disabled:opacity-20" aria-label="Annuler">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l4-4m-4 4l4 4" /></svg>
            </button>
            <button onClick={resetAll} className="p-2.5 text-white/30 hover:text-white/70 transition-colors hover:bg-white/5" aria-label="Réinitialiser">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>
        </div>

        {/* Moi */}
        <div className="flex-1 flex flex-col">
          <PlayerSide label="Moi" lore={myLore} color="sapphire" onChangeLore={(d) => changeLore('me', d)} disabled={!!winner} />
        </div>
      </div>


      {/* Panneau historique */}
      {showHistory && (
        <div className="absolute inset-0 z-30 flex flex-col" style={{ background: 'rgba(12,10,20,0.97)', backdropFilter: 'blur(8px)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h2 className="font-display font-bold text-ink-100 tracking-wide">Historique</h2>
            <button onClick={() => setShowHistory(false)} className="p-2 text-white/40 hover:text-white/70 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {grouped.length === 0 ? (
              <p className="text-center text-ink-500 py-8">Aucun changement</p>
            ) : (
              <div className="space-y-1.5">
                {[...grouped].reverse().map((entry, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-ink-600 font-mono w-14 shrink-0">
                        {new Date(entry.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${entry.player === 'me' ? 'bg-[#5ba8d8]/15 text-[#5ba8d8]' : 'bg-[#d85b5b]/15 text-[#d85b5b]'}`}>
                        {entry.player === 'me' ? 'Moi' : 'Adv.'}
                      </span>
                      <span className={`text-sm font-bold ${entry.totalDelta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {entry.totalDelta > 0 ? '+' : ''}{entry.totalDelta}
                      </span>
                    </div>
                    <span className="text-sm text-ink-400 font-medium">{entry.fromValue} → {entry.toValue}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerSide({
  label, lore, color, onChangeLore, disabled,
}: {
  label: string;
  lore: number;
  color: 'sapphire' | 'ruby';
  onChangeLore: (delta: number) => void;
  disabled: boolean;
}) {
  const accent = color === 'sapphire' ? '#5ba8d8' : '#d85b5b';
  const accentDim = color === 'sapphire' ? 'rgba(91,168,216,0.12)' : 'rgba(216,91,91,0.12)';
  const accentBorder = color === 'sapphire' ? 'rgba(91,168,216,0.2)' : 'rgba(216,91,91,0.2)';
  const glow = color === 'sapphire' ? '0 0 40px rgba(91,168,216,0.25)' : '0 0 40px rgba(216,91,91,0.25)';

  return (
    <div className="flex-1 flex flex-col" style={{ background: `radial-gradient(ellipse at 50% 50%, ${accentDim} 0%, transparent 70%)` }}>
      {/* Label */}
      <div className="text-center pt-2 pb-1">
        <span className="text-xs font-medium tracking-[0.2em] uppercase" style={{ color: `${accent}99` }}>{label}</span>
      </div>

      {/* Zone principale — moitié gauche − / moitié droite + */}
      <div className="flex-1 flex relative">
        {/* Zone − */}
        <button
          className="flex-1 h-full flex items-center justify-start pl-6 transition-all duration-150 active:opacity-50 disabled:opacity-20"
          onClick={() => onChangeLore(-1)}
          disabled={disabled || lore === 0}
          aria-label="-1"
        >
          <span className="text-6xl font-thin leading-none" style={{ color: `${accent}50` }}>−</span>
        </button>

        {/* Score en overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-3">
          <span
            className="font-display font-bold leading-none tabular-nums"
            style={{ fontSize: 'clamp(5rem, 22vw, 11rem)', color: accent, textShadow: glow }}
          >
            {lore}
          </span>
          {/* Barre de progression — losanges Lorcana */}
          <div className="flex gap-0.5 items-center flex-wrap justify-center max-w-[260px]">
            {Array.from({ length: MAX_LORE }).map((_, i) => (
              <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25.83 32" className="transition-all duration-200" style={{ width: 10, height: 13 }}>
                {i < lore ? (
                  /* Losange actif : contour + remplissage intérieur */
                  <>
                    <path d="M12.91 0 0 16l12.91 16 12.91-16L12.91 0ZM1.28 16 12.91 1.59 24.54 16 12.91 30.41 1.28 16Z" fill={accent} />
                    <path d="m21.99 16-9.08 11.25L3.83 16l9.08-11.25L21.99 16z" fill={accent} />
                  </>
                ) : (
                  /* Losange inactif : silhouette */
                  <path d="m12.91 0 12.91 16-12.91 16L0 16 12.91 0Z" fill={`${accent}25`} />
                )}
              </svg>
            ))}
          </div>
        </div>

        {/* Zone + */}
        <button
          className="flex-1 h-full flex items-center justify-end pr-6 transition-all duration-150 active:opacity-50 disabled:opacity-20"
          onClick={() => onChangeLore(1)}
          disabled={disabled || lore >= MAX_LORE}
          aria-label="+1"
        >
          <span className="text-6xl font-thin leading-none" style={{ color: `${accent}50` }}>+</span>
        </button>
      </div>

      {/* ±5 secondaires */}
      <div className="flex justify-between px-5 pb-2 gap-3">
        <button
          onClick={() => onChangeLore(-5)}
          disabled={disabled || lore === 0}
          className="flex-1 h-8 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95 disabled:opacity-25"
          style={{ background: accentDim, color: accent, border: `1px solid ${accentBorder}` }}
        >
          −5
        </button>
        <button
          onClick={() => onChangeLore(5)}
          disabled={disabled || lore >= MAX_LORE}
          className="flex-1 h-8 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95 disabled:opacity-25"
          style={{ background: accentDim, color: accent, border: `1px solid ${accentBorder}` }}
        >
          +5
        </button>
      </div>
    </div>
  );
}
