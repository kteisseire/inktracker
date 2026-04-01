import { useState, useCallback, useRef } from 'react';

const MAX_LORE = 20;
const GROUP_DELAY_MS = 3000; // entries within 3s from the same player are grouped

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
      current = {
        player: entry.player,
        totalDelta: entry.delta,
        fromValue: entry.newValue - entry.delta,
        toValue: entry.newValue,
        count: 1,
        timestamp: entry.timestamp,
        lastTimestamp: entry.timestamp,
      };
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

    if (next >= MAX_LORE) {
      winnerRef.current = player;
      setWinner(player);
    }
  }, []);

  const resetAll = () => {
    setMyLore(0);
    setOpponentLore(0);
    myLoreRef.current = 0;
    opponentLoreRef.current = 0;
    setRawHistory([]);
    setWinner(null);
    winnerRef.current = null;
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
    if (winner) {
      setWinner(null);
      winnerRef.current = null;
    }
  };

  const handleClose = () => {
    onClose({
      myScore: myLore,
      opponentScore: opponentLore,
      winner,
      state: { myLore, opponentLore, history: rawHistory, winner },
    });
  };

  const grouped = groupHistory(rawHistory);

  return (
    <div className="fixed inset-0 z-[100] bg-ink-950 flex flex-col select-none" style={{ touchAction: 'manipulation' }}>
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-1 py-1 safe-area-top">
        <button onClick={handleClose} className="text-ink-500 hover:text-ink-300 transition-colors p-3" aria-label="Fermer">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex items-center gap-0.5">
          <button onClick={() => { setShowHistory(!showHistory); setShowMenu(false); }} className="text-ink-500 hover:text-ink-300 transition-colors p-3" aria-label="Historique">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button onClick={undoLast} disabled={rawHistory.length === 0} className="text-ink-500 hover:text-ink-300 transition-colors p-3 disabled:opacity-30" aria-label="Annuler">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l4-4m-4 4l4 4" />
            </svg>
          </button>
          <button onClick={() => { setShowMenu(!showMenu); setShowHistory(false); }} className="text-ink-500 hover:text-ink-300 transition-colors p-3" aria-label="Options">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
            </svg>
          </button>
        </div>
      </div>

      {/* Menu dropdown */}
      {showMenu && (
        <div className="absolute top-14 right-3 z-20 bg-ink-900 border border-ink-700/50 rounded-xl shadow-lg overflow-hidden">
          <button onClick={resetAll} className="w-full px-5 py-3.5 text-left text-sm text-ink-200 hover:bg-ink-800/50 transition-colors">
            Réinitialiser
          </button>
        </div>
      )}

      {/* Winner overlay */}
      {winner && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink-950/80 backdrop-blur-sm">
          <div className="text-center space-y-4 px-6">
            <div className={`font-display text-3xl sm:text-4xl font-bold ${winner === 'me' ? 'text-lorcana-sapphire' : 'text-lorcana-ruby'}`}>
              {winner === 'me' ? 'Victoire !' : 'Défaite'}
            </div>
            <div className="text-ink-400 text-lg font-display">
              <span className="text-lorcana-sapphire">{myLore}</span>
              <span className="text-ink-600 mx-2">—</span>
              <span className="text-lorcana-ruby">{opponentLore}</span>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button onClick={handleClose} className="ink-btn-primary px-6 py-3 text-base">
                Valider
              </button>
              <button onClick={() => { setWinner(null); winnerRef.current = null; }} className="ink-btn-secondary px-5 py-3 text-sm">
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main counter area */}
      <div className="flex-1 flex flex-col">
        {/* Opponent side (rotated 180°) */}
        <div className="flex-1 flex flex-col rotate-180">
          <PlayerSide label="Adversaire" lore={opponentLore} color="ruby" onChangeLore={(d) => changeLore('opponent', d)} disabled={!!winner} />
        </div>

        {/* Center divider */}
        <div className="relative h-12 sm:h-14 flex items-center justify-center bg-ink-900/80 border-y border-gold-500/20">
          <div className="flex items-center gap-4 text-xl font-display font-bold tracking-wider">
            <span className="text-lorcana-sapphire">{myLore}</span>
            <span className="text-gold-500/50">—</span>
            <span className="text-lorcana-ruby">{opponentLore}</span>
          </div>
        </div>

        {/* My side */}
        <div className="flex-1 flex flex-col">
          <PlayerSide label="Moi" lore={myLore} color="sapphire" onChangeLore={(d) => changeLore('me', d)} disabled={!!winner} />
        </div>
      </div>

      {/* History panel */}
      {showHistory && (
        <div className="absolute inset-0 z-30 bg-ink-950/95 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-800/50">
            <h2 className="font-display font-bold text-ink-100 tracking-wide">Historique</h2>
            <button onClick={() => setShowHistory(false)} className="text-ink-500 hover:text-ink-300 transition-colors p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-ink-900/50">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-ink-600 font-mono w-14 shrink-0">
                        {new Date(entry.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        entry.player === 'me'
                          ? 'bg-lorcana-sapphire/15 text-lorcana-sapphire'
                          : 'bg-lorcana-ruby/15 text-lorcana-ruby'
                      }`}>
                        {entry.player === 'me' ? 'Moi' : 'Adv.'}
                      </span>
                      <span className={`text-sm font-bold ${entry.totalDelta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {entry.totalDelta > 0 ? '+' : ''}{entry.totalDelta}
                      </span>
                    </div>
                    <span className="text-sm text-ink-400 font-medium">
                      {entry.fromValue} → {entry.toValue}
                    </span>
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
  const bgGradient = color === 'sapphire'
    ? 'from-lorcana-sapphire/5 to-transparent'
    : 'from-lorcana-ruby/5 to-transparent';

  const textColor = color === 'sapphire' ? 'text-lorcana-sapphire' : 'text-lorcana-ruby';
  const glowColor = color === 'sapphire'
    ? 'drop-shadow-[0_0_25px_rgba(52,152,219,0.3)]'
    : 'drop-shadow-[0_0_25px_rgba(231,76,60,0.3)]';

  const btnBase = 'flex items-center justify-center rounded-2xl font-bold transition-all duration-150 active:scale-95 disabled:opacity-30 disabled:active:scale-100';
  const btnMinus = color === 'sapphire'
    ? 'bg-lorcana-sapphire/10 text-lorcana-sapphire border-2 border-lorcana-sapphire/20 active:bg-lorcana-sapphire/25'
    : 'bg-lorcana-ruby/10 text-lorcana-ruby border-2 border-lorcana-ruby/20 active:bg-lorcana-ruby/25';
  const btnPlus = color === 'sapphire'
    ? 'bg-lorcana-sapphire/20 text-lorcana-sapphire border-2 border-lorcana-sapphire/30 active:bg-lorcana-sapphire/35'
    : 'bg-lorcana-ruby/20 text-lorcana-ruby border-2 border-lorcana-ruby/30 active:bg-lorcana-ruby/35';

  return (
    <div className={`flex-1 flex flex-col items-center justify-center gap-1 bg-gradient-to-b ${bgGradient} px-4`}>
      <span className="text-xs text-ink-500 font-medium uppercase tracking-widest">{label}</span>

      {/* Score + boutons sur la même ligne */}
      <div className="flex items-center justify-center gap-3 w-full">
        {/* Gauche : soustractions */}
        <div className="flex flex-col gap-2">
          <button onClick={() => onChangeLore(-1)} className={`${btnBase} ${btnMinus} w-16 h-16 text-3xl`} disabled={disabled || lore === 0}>−</button>
          <button onClick={() => onChangeLore(-5)} className={`${btnBase} ${btnMinus} w-16 h-10 text-lg`} disabled={disabled || lore === 0}>−5</button>
        </div>

        {/* Score central */}
        <div className="flex flex-col items-center gap-1 flex-1">
          <div className={`font-display font-bold leading-none ${textColor} ${glowColor}`} style={{ fontSize: 'clamp(4rem, 18vw, 10rem)' }}>
            {lore}
          </div>
          <div className="w-full max-w-[200px] h-2 rounded-full bg-ink-800/80 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${color === 'sapphire' ? 'bg-lorcana-sapphire' : 'bg-lorcana-ruby'}`}
              style={{ width: `${(lore / MAX_LORE) * 100}%` }}
            />
          </div>
        </div>

        {/* Droite : additions */}
        <div className="flex flex-col gap-2">
          <button onClick={() => onChangeLore(1)} className={`${btnBase} ${btnPlus} w-16 h-16 text-3xl`} disabled={disabled || lore >= MAX_LORE}>+</button>
          <button onClick={() => onChangeLore(5)} className={`${btnBase} ${btnPlus} w-16 h-10 text-lg`} disabled={disabled || lore >= MAX_LORE}>+5</button>
        </div>
      </div>
    </div>
  );
}
