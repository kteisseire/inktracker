import { useState, useCallback, useRef } from 'react';

const MAX_LORE = 20;
const GROUP_DELAY_MS = 3000;

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

interface LoreCounterProps {
  onClose: (result: LoreResult) => void;
  initialState?: LoreState;
}

export function LoreCounter({ onClose, initialState }: LoreCounterProps) {
  const [myLore, setMyLore] = useState(initialState?.myLore ?? 0);
  const [opponentLore, setOpponentLore] = useState(initialState?.opponentLore ?? 0);
  const [rawHistory, setRawHistory] = useState<RawLoreEntry[]>(initialState?.history ?? []);
  const [showHistory, setShowHistory] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [winner, setWinner] = useState<'me' | 'opponent' | null>(initialState?.winner ?? null);
  const winnerRef = useRef<'me' | 'opponent' | null>(initialState?.winner ?? null);
  const myLoreRef = useRef(initialState?.myLore ?? 0);
  const opponentLoreRef = useRef(initialState?.opponentLore ?? 0);

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

      {/* Bouton fermer — coin haut gauche, discret */}
      <button
        onClick={handleClose}
        className="absolute top-3 left-3 z-20 p-2 rounded-full bg-white/5 text-white/30 hover:text-white/60 hover:bg-white/10 transition-all"
        aria-label="Fermer"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

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

        {/* Séparateur central ornemental */}
        <div className="relative flex items-center justify-center h-10 shrink-0" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.08), transparent)' }}>
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.3) 30%, rgba(212,175,55,0.5) 50%, rgba(212,175,55,0.3) 70%, transparent 100%)' }} />
          <span className="relative z-10 text-gold-500/60 text-sm px-3" style={{ background: 'radial-gradient(ellipse at 50% 50%, #1a1035 0%, #0c0a14 100%)' }}>✦</span>
        </div>

        {/* Moi */}
        <div className="flex-1 flex flex-col">
          <PlayerSide label="Moi" lore={myLore} color="sapphire" onChangeLore={(d) => changeLore('me', d)} disabled={!!winner} />
        </div>
      </div>

      {/* Barre d'actions flottante en bas — clairement séparée des zones de jeu */}
      <div className="shrink-0 flex items-center justify-center gap-2 pb-4 pt-2 px-6" style={{ background: 'linear-gradient(to top, rgba(12,10,20,0.95) 70%, transparent)' }}>
        <button
          onClick={() => { setShowHistory(!showHistory); setShowMenu(false); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white/40 hover:text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          aria-label="Historique"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Historique
        </button>
        <button
          onClick={undoLast}
          disabled={rawHistory.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white/40 hover:text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-25"
          aria-label="Annuler"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l4-4m-4 4l4 4" />
          </svg>
          Annuler
        </button>
        <button
          onClick={() => { setShowMenu(!showMenu); setShowHistory(false); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white/40 hover:text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          aria-label="Options"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Options
        </button>

        {/* Menu options */}
        {showMenu && (
          <div className="absolute bottom-16 right-6 z-30 bg-ink-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
            <button onClick={resetAll} className="w-full px-5 py-3.5 text-left text-sm text-ink-200 hover:bg-white/5 transition-colors">
              Réinitialiser la partie
            </button>
          </div>
        )}
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
          {/* Barre de progression ornementale */}
          <div className="flex gap-1">
            {Array.from({ length: MAX_LORE }).map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-200"
                style={{
                  width: 6,
                  height: i < lore ? 8 : 4,
                  background: i < lore ? accent : `${accent}25`,
                  alignSelf: 'flex-end',
                }}
              />
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
