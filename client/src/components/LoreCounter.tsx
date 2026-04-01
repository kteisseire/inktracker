import { useState, useCallback, useRef, useEffect } from 'react';

const MAX_LORE = 20;
const GROUP_DELAY_MS = 3000;
const DEFAULT_TIMER = 50 * 60;

// ─── Thèmes ────────────────────────────────────────────────────────────────
interface Theme {
  id: string;
  name: string;
  bg: string;           // background CSS du container
  bgOverlay?: string;   // overlay en plus (radial gradient)
  separator: string;    // couleur de la ligne séparateur
  separatorGlow: string;// gradient complet de la ligne
  pill: string;         // background de la pilule centrale
  pillBorder: string;   // border de la pilule
  meAccent: string;     // couleur accent joueur "moi"
  oppAccent: string;    // couleur accent joueur "adversaire"
  stars?: boolean;      // étoiles décoratives
  particles?: 'bubbles' | 'sparks' | 'none';
  labelFont?: string;   // classe tailwind pour les labels
}

const THEMES: Theme[] = [
  {
    id: 'default',
    name: 'Défaut',
    bg: 'radial-gradient(ellipse at 50% 50%, #1a1035 0%, #0c0a14 70%)',
    separator: 'rgba(212,175,55,0.5)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.3) 30%, rgba(212,175,55,0.5) 50%, rgba(212,175,55,0.3) 70%, transparent 100%)',
    pill: '#0f0c1e',
    pillBorder: 'rgba(212,175,55,0.2)',
    meAccent: '#5ba8d8',
    oppAccent: '#d85b5b',
    stars: true,
  },
  {
    id: 'set1',
    name: 'The First Chapter',
    bg: 'linear-gradient(160deg, #1a0e2e 0%, #0d1a0e 50%, #1a0a0e 100%)',
    separator: 'rgba(245,178,2,0.6)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(245,178,2,0.2) 20%, rgba(245,178,2,0.6) 50%, rgba(245,178,2,0.2) 80%, transparent 100%)',
    pill: '#110d20',
    pillBorder: 'rgba(245,178,2,0.3)',
    meAccent: '#0189C4',
    oppAccent: '#D3082F',
    stars: true,
  },
  {
    id: 'set2',
    name: 'Rise of the Floodborn',
    bg: 'radial-gradient(ellipse at 30% 70%, #1a0a2e 0%, #060412 60%, #0a0a1a 100%)',
    separator: 'rgba(160,80,220,0.5)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(100,40,180,0.3) 20%, rgba(160,80,220,0.6) 50%, rgba(100,40,180,0.3) 80%, transparent 100%)',
    pill: '#0d0820',
    pillBorder: 'rgba(150,70,210,0.35)',
    meAccent: '#7b4fd4',
    oppAccent: '#c44fd4',
    stars: true,
    particles: 'bubbles',
  },
  {
    id: 'set3',
    name: 'Into the Inklands',
    bg: 'linear-gradient(135deg, #0d1a10 0%, #0a1520 50%, #1a1205 100%)',
    separator: 'rgba(42,137,52,0.5)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(42,137,52,0.2) 20%, rgba(80,180,90,0.6) 50%, rgba(42,137,52,0.2) 80%, transparent 100%)',
    pill: '#091510',
    pillBorder: 'rgba(42,137,52,0.35)',
    meAccent: '#2A8934',
    oppAccent: '#c8a020',
    stars: false,
    particles: 'none',
  },
  {
    id: 'set4',
    name: "Ursula's Return",
    bg: 'radial-gradient(ellipse at 50% 80%, #0a0520 0%, #04060f 60%, #000408 100%)',
    bgOverlay: 'radial-gradient(ellipse at 50% 100%, rgba(0,80,120,0.3) 0%, transparent 60%)',
    separator: 'rgba(0,180,210,0.4)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(0,120,180,0.2) 20%, rgba(0,200,230,0.5) 50%, rgba(0,120,180,0.2) 80%, transparent 100%)',
    pill: '#050510',
    pillBorder: 'rgba(0,160,200,0.3)',
    meAccent: '#00b4d8',
    oppAccent: '#7b2fd4',
    stars: true,
    particles: 'bubbles',
  },
  {
    id: 'set5',
    name: 'Shimmering Skies',
    bg: 'linear-gradient(135deg, #1a0a30 0%, #0a1040 40%, #200a20 100%)',
    separator: 'rgba(255,200,50,0.6)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(255,100,150,0.3) 15%, rgba(255,200,50,0.7) 50%, rgba(100,150,255,0.3) 85%, transparent 100%)',
    pill: '#120820',
    pillBorder: 'rgba(255,180,50,0.35)',
    meAccent: '#60b0ff',
    oppAccent: '#ff6090',
    stars: true,
    particles: 'sparks',
  },
  {
    id: 'set6',
    name: 'Azurite Sea',
    bg: 'linear-gradient(180deg, #040c1a 0%, #061428 50%, #081830 100%)',
    bgOverlay: 'radial-gradient(ellipse at 50% 100%, rgba(0,60,120,0.4) 0%, transparent 60%)',
    separator: 'rgba(30,140,200,0.5)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(20,80,160,0.3) 20%, rgba(40,160,220,0.6) 50%, rgba(20,80,160,0.3) 80%, transparent 100%)',
    pill: '#040e20',
    pillBorder: 'rgba(30,120,200,0.4)',
    meAccent: '#1e8cc8',
    oppAccent: '#6040c0',
    stars: false,
    particles: 'bubbles',
  },
  {
    id: 'set7',
    name: "Archazia's Island",
    bg: 'linear-gradient(135deg, #1a0f08 0%, #0f1a08 50%, #08100a 100%)',
    separator: 'rgba(180,130,30,0.5)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(120,80,20,0.3) 20%, rgba(200,150,40,0.6) 50%, rgba(120,80,20,0.3) 80%, transparent 100%)',
    pill: '#120c06',
    pillBorder: 'rgba(160,120,30,0.35)',
    meAccent: '#c89020',
    oppAccent: '#508030',
    stars: false,
  },
  {
    id: 'set8',
    name: 'Reign of Jafar',
    bg: 'radial-gradient(ellipse at 50% 30%, #1a0800 0%, #0a0400 60%, #000000 100%)',
    bgOverlay: 'radial-gradient(ellipse at 50% 0%, rgba(180,60,0,0.2) 0%, transparent 50%)',
    separator: 'rgba(200,80,0,0.5)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(150,40,0,0.3) 20%, rgba(220,100,0,0.6) 50%, rgba(150,40,0,0.3) 80%, transparent 100%)',
    pill: '#0f0400',
    pillBorder: 'rgba(180,60,0,0.35)',
    meAccent: '#e06010',
    oppAccent: '#c0c0c0',
    stars: true,
  },
  {
    id: 'set9',
    name: 'Fabled',
    bg: 'linear-gradient(150deg, #1a1208 0%, #120e06 50%, #1a1508 100%)',
    separator: 'rgba(210,170,80,0.6)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(180,130,40,0.3) 20%, rgba(220,180,80,0.7) 50%, rgba(180,130,40,0.3) 80%, transparent 100%)',
    pill: '#130f06',
    pillBorder: 'rgba(200,160,60,0.4)',
    meAccent: '#d4aa50',
    oppAccent: '#c87040',
    stars: false,
  },
  {
    id: 'set10',
    name: 'Whispers in the Well',
    bg: 'radial-gradient(ellipse at 50% 40%, #0e0818 0%, #04020a 70%, #000000 100%)',
    bgOverlay: 'radial-gradient(ellipse at 30% 60%, rgba(80,20,120,0.2) 0%, transparent 50%)',
    separator: 'rgba(140,80,200,0.5)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(80,30,140,0.3) 15%, rgba(160,100,220,0.5) 35%, rgba(200,230,255,0.7) 50%, rgba(160,100,220,0.5) 65%, rgba(80,30,140,0.3) 85%, transparent 100%)',
    pill: '#08040f',
    pillBorder: 'rgba(140,80,200,0.35)',
    meAccent: '#a060d8',
    oppAccent: '#60c8d8',
    stars: true,
    particles: 'sparks',
  },
  {
    id: 'set11',
    name: 'Winterspell',
    bg: 'linear-gradient(160deg, #060c18 0%, #08101e 50%, #040810 100%)',
    bgOverlay: 'radial-gradient(ellipse at 50% 0%, rgba(160,210,255,0.08) 0%, transparent 60%)',
    separator: 'rgba(140,200,255,0.5)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(100,160,220,0.3) 20%, rgba(180,220,255,0.7) 50%, rgba(100,160,220,0.3) 80%, transparent 100%)',
    pill: '#05090f',
    pillBorder: 'rgba(140,200,255,0.3)',
    meAccent: '#80c8f0',
    oppAccent: '#a0d8c8',
    stars: true,
    particles: 'sparks',
  },
  {
    id: 'set12',
    name: 'Wilds Unknown',
    bg: 'linear-gradient(150deg, #061208 0%, #0a1a08 40%, #101408 100%)',
    bgOverlay: 'radial-gradient(ellipse at 70% 80%, rgba(40,100,20,0.2) 0%, transparent 50%)',
    separator: 'rgba(100,180,60,0.5)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(60,120,30,0.3) 20%, rgba(120,200,60,0.6) 50%, rgba(60,120,30,0.3) 80%, transparent 100%)',
    pill: '#060e05',
    pillBorder: 'rgba(80,160,40,0.35)',
    meAccent: '#70c040',
    oppAccent: '#c0a030',
    stars: false,
    particles: 'none',
  },
];

// ─── Particules décoratives ────────────────────────────────────────────────
function Particles({ type }: { type: 'bubbles' | 'sparks' }) {
  const items = Array.from({ length: 12 });
  if (type === 'bubbles') return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {items.map((_, i) => (
        <div key={i} className="absolute rounded-full border border-white/10"
          style={{
            width: 4 + (i % 5) * 3, height: 4 + (i % 5) * 3,
            left: `${(i * 47 + 13) % 90 + 5}%`,
            top: `${(i * 31 + 7) % 85 + 5}%`,
            opacity: 0.08 + (i % 4) * 0.04,
          }} />
      ))}
    </div>
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {items.map((_, i) => (
        <div key={i} className="absolute rounded-full"
          style={{
            width: 2, height: 2,
            left: `${(i * 53 + 9) % 95 + 2}%`,
            top: `${(i * 37 + 5) % 90 + 5}%`,
            background: i % 3 === 0 ? '#ffcc00' : i % 3 === 1 ? '#ff80b0' : '#80b0ff',
            opacity: 0.2 + (i % 5) * 0.06,
            boxShadow: `0 0 4px 1px currentColor`,
          }} />
      ))}
    </div>
  );
}

// ─── Types ─────────────────────────────────────────────────────────────────
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
    player: raw[0].player, totalDelta: raw[0].delta,
    fromValue: raw[0].newValue - raw[0].delta, toValue: raw[0].newValue,
    count: 1, timestamp: raw[0].timestamp, lastTimestamp: raw[0].timestamp,
  };
  for (let i = 1; i < raw.length; i++) {
    const entry = raw[i];
    if (entry.player === current.player && (entry.delta > 0) === (current.totalDelta > 0) && entry.timestamp - current.lastTimestamp < GROUP_DELAY_MS) {
      current.totalDelta += entry.delta; current.toValue = entry.newValue; current.count++; current.lastTimestamp = entry.timestamp;
    } else {
      const { lastTimestamp: _, ...group } = current; groups.push(group);
      current = { player: entry.player, totalDelta: entry.delta, fromValue: entry.newValue - entry.delta, toValue: entry.newValue, count: 1, timestamp: entry.timestamp, lastTimestamp: entry.timestamp };
    }
  }
  const { lastTimestamp: _, ...lastGroup } = current; groups.push(lastGroup);
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

const THEME_STORAGE_KEY = 'glimmerlog_lore_theme';
const TIMER_SIDE_KEY = 'glimmerlog_timer_side';

// ─── Composant principal ───────────────────────────────────────────────────
export function LoreCounter({ onClose, initialState, timerState, onTimerChange }: LoreCounterProps) {
  const [myLore, setMyLore] = useState(initialState?.myLore ?? 0);
  const [opponentLore, setOpponentLore] = useState(initialState?.opponentLore ?? 0);
  const [rawHistory, setRawHistory] = useState<RawLoreEntry[]>(initialState?.history ?? []);
  const [showHistory, setShowHistory] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editingTimer, setEditingTimer] = useState(false);
  const [timerInput, setTimerInput] = useState('50:00');
  const [themeId, setThemeId] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) ?? 'default');
  const [timerSide, setTimerSide] = useState<'left' | 'right'>(() => (localStorage.getItem(TIMER_SIDE_KEY) as 'left' | 'right') ?? 'right');
  const [winner, setWinner] = useState<'me' | 'opponent' | null>(initialState?.winner ?? null);
  const winnerRef = useRef<'me' | 'opponent' | null>(initialState?.winner ?? null);
  const myLoreRef = useRef(initialState?.myLore ?? 0);
  const opponentLoreRef = useRef(initialState?.opponentLore ?? 0);

  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];

  // Timer
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

  const formatTimer = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const timerExpired = timerSeconds === 0;
  const timerColor = timerSeconds <= 60 ? '#d85b5b' : timerSeconds <= 5 * 60 ? '#f5c842' : 'rgba(255,255,255,0.5)';

  const changeLore = useCallback((player: 'me' | 'opponent', delta: number) => {
    if (winnerRef.current) return;
    const ref = player === 'me' ? myLoreRef : opponentLoreRef;
    const setter = player === 'me' ? setMyLore : setOpponentLore;
    const prev = ref.current;
    const next = Math.max(0, Math.min(MAX_LORE, prev + delta));
    if (next === prev) return;
    ref.current = next; setter(next);
    setRawHistory(h => [...h, { player, delta: next - prev, newValue: next, timestamp: Date.now() }]);
    if (next >= MAX_LORE) { winnerRef.current = player; setWinner(player); }
  }, []);

  const resetAll = () => {
    setMyLore(0); setOpponentLore(0);
    myLoreRef.current = 0; opponentLoreRef.current = 0;
    setRawHistory([]); setWinner(null); winnerRef.current = null;
    if (!onTimerChange) setLocalTimerSeconds(DEFAULT_TIMER);
  };

  const undoLast = () => {
    if (rawHistory.length === 0) return;
    const last = rawHistory[rawHistory.length - 1];
    const ref = last.player === 'me' ? myLoreRef : opponentLoreRef;
    const setter = last.player === 'me' ? setMyLore : setOpponentLore;
    ref.current = last.newValue - last.delta; setter(last.newValue - last.delta);
    setRawHistory(h => h.slice(0, -1));
    if (winner) { setWinner(null); winnerRef.current = null; }
  };

  const handleClose = () => onClose({ myScore: myLore, opponentScore: opponentLore, winner, state: { myLore, opponentLore, history: rawHistory, winner } });
  const grouped = groupHistory(rawHistory);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col select-none overflow-hidden" style={{ touchAction: 'manipulation', background: theme.bg }}>
      {/* Overlay secondaire */}
      {theme.bgOverlay && <div className="absolute inset-0 pointer-events-none" style={{ background: theme.bgOverlay }} />}

      {/* Étoiles */}
      {theme.stars && (
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          {[...Array(24)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white" style={{ width: i % 4 === 0 ? 2 : 1, height: i % 4 === 0 ? 2 : 1, top: `${(i * 37 + 11) % 100}%`, left: `${(i * 53 + 7) % 100}%`, opacity: 0.1 + (i % 5) * 0.06 }} />
          ))}
        </div>
      )}
      {theme.particles && theme.particles !== 'none' && <Particles type={theme.particles} />}

      {/* Winner overlay */}
      {winner && (
        <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="text-center space-y-5 px-8">
            <div className="text-6xl mb-2">{winner === 'me' ? '✨' : '💫'}</div>
            <div className="font-display text-4xl font-bold tracking-wide" style={{ color: winner === 'me' ? theme.meAccent : 'rgba(255,255,255,0.4)' }}>
              {winner === 'me' ? 'Victoire !' : 'Défaite'}
            </div>
            <div className="text-lg font-display tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <span style={{ color: theme.meAccent }}>{myLore}</span>
              <span className="mx-3" style={{ color: theme.separator }}>✦</span>
              <span style={{ color: theme.oppAccent }}>{opponentLore}</span>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button onClick={handleClose} className="px-7 py-3 rounded-xl font-semibold text-black text-base" style={{ background: `linear-gradient(135deg, ${theme.meAccent}, ${theme.meAccent}cc)` }}>Valider</button>
              <button onClick={() => { setWinner(null); winnerRef.current = null; }} className="px-6 py-3 rounded-xl text-white/60 text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition-all">Continuer</button>
            </div>
          </div>
        </div>
      )}

      {/* Zones de jeu */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col rotate-180">
          <PlayerSide label="Adversaire" lore={opponentLore} accent={theme.oppAccent} onChangeLore={(d) => changeLore('opponent', d)} disabled={!!winner} />
        </div>

        {/* Séparateur */}
        <div className="relative flex items-center justify-center h-20 shrink-0">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px" style={{ background: theme.separatorGlow }} />
          <div className="relative z-10 flex items-center gap-0 rounded-full overflow-hidden" style={{ background: theme.pill, border: `1px solid ${theme.pillBorder}` }}>

            {/* Fermer */}
            <button onClick={handleClose} className="p-3 text-white/30 hover:text-white/70 transition-colors hover:bg-white/5" aria-label="Fermer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="w-px h-6 bg-white/10 mx-0.5" />

            {/* Play/Pause */}
            <button onClick={() => !timerExpired && setTimerRunning(r => !r)} className="p-3 transition-colors hover:bg-white/5" aria-label={timerRunning ? 'Pause' : 'Démarrer'}>
              {timerExpired ? (
                <svg className="w-5 h-5" fill="none" stroke="#d85b5b" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ) : timerRunning ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" style={{ color: timerColor }}><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" style={{ color: timerColor }}><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>

            <div className="w-px h-6 bg-white/10 mx-0.5" />

            {/* Burger menu */}
            <button onClick={() => setShowMenu(true)} className="p-3 text-white/30 hover:text-white/70 transition-colors hover:bg-white/5" aria-label="Menu">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>

        {/* Timer vertical — côté gauche ou droit, lisible par les deux joueurs */}
        <div
          className="absolute top-0 bottom-0 z-10 flex items-center justify-center pointer-events-none"
          style={{ [timerSide]: 0, width: '2.5rem' }}
        >
          <div
            className="flex flex-col items-center gap-2 pointer-events-auto"
            style={{ transform: timerSide === 'left' ? 'rotate(180deg)' : 'none' }}
          >
            {/* Affichage du temps — clic pour éditer quand en pause */}
            {editingTimer ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const parts = timerInput.split(':');
                  const mins = parseInt(parts[0] ?? '0', 10);
                  const secs = parseInt(parts[1] ?? '0', 10);
                  const total = (isNaN(mins) ? 0 : mins) * 60 + (isNaN(secs) ? 0 : secs);
                  if (total > 0) { setTimerSeconds(total); setTimerRunning(false); }
                  setEditingTimer(false);
                }}
                style={{ writingMode: 'vertical-rl' }}
              >
                <input
                  autoFocus
                  type="text"
                  value={timerInput}
                  onChange={(e) => setTimerInput(e.target.value)}
                  onBlur={() => setEditingTimer(false)}
                  className="font-mono font-bold tabular-nums bg-transparent text-center outline-none border-b border-white/30"
                  style={{ color: timerColor, fontSize: '1rem', width: '4.5rem', writingMode: 'vertical-rl' }}
                  placeholder="mm:ss"
                />
              </form>
            ) : (
              <button
                onClick={() => {
                  if (!timerRunning) {
                    setTimerInput(formatTimer(timerSeconds));
                    setEditingTimer(true);
                  } else {
                    setTimerRunning(false);
                  }
                }}
                className="transition-colors"
                aria-label="Modifier le timer"
                style={{ writingMode: 'vertical-rl', letterSpacing: '0.05em' }}
              >
                <span
                  className="font-mono font-bold tabular-nums"
                  style={{ color: timerColor, fontSize: 'clamp(0.85rem, 3vw, 1.1rem)' }}
                >
                  {formatTimer(timerSeconds)}
                </span>
              </button>
            )}
            {/* Reset timer si en pause et ≠ default */}
            {!timerRunning && !editingTimer && timerSeconds !== DEFAULT_TIMER && (
              <button
                onClick={() => setTimerSeconds(DEFAULT_TIMER)}
                className="text-white/25 hover:text-white/60 transition-colors"
                aria-label="Réinitialiser le timer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <PlayerSide label="Moi" lore={myLore} accent={theme.meAccent} onChangeLore={(d) => changeLore('me', d)} disabled={!!winner} />
        </div>
      </div>

      {/* Burger menu panel */}
      {showMenu && (
        <div className="absolute inset-0 z-30 flex flex-col justify-end" onClick={() => setShowMenu(false)} style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-t-2xl overflow-hidden" style={{ background: theme.pill, border: `1px solid ${theme.pillBorder}`, borderBottom: 'none' }} onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mt-3 mb-1" />
            <div className="px-4 py-3 space-y-1">
              {/* Thème */}
              <button onClick={() => { setShowMenu(false); setShowThemes(true); }} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all hover:bg-white/8 text-left" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <svg className="w-5 h-5 text-white/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white/80">Thème</p>
                  <p className="text-xs text-white/30">{THEMES.find(t => t.id === themeId)?.name}</p>
                </div>
                <svg className="w-4 h-4 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              {/* Historique */}
              <button onClick={() => { setShowMenu(false); setShowHistory(true); }} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all hover:bg-white/8 text-left" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <svg className="w-5 h-5 text-white/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white/80">Historique</p>
                  <p className="text-xs text-white/30">{rawHistory.length} action{rawHistory.length !== 1 ? 's' : ''}</p>
                </div>
                <svg className="w-4 h-4 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              {/* Annuler dernière action */}
              <button onClick={() => { undoLast(); setShowMenu(false); }} disabled={rawHistory.length === 0} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all hover:bg-white/8 text-left disabled:opacity-30" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <svg className="w-5 h-5 text-white/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l4-4m-4 4l4 4" /></svg>
                <p className="text-sm font-medium text-white/80">Annuler la dernière action</p>
              </button>
              {/* Réinitialiser le score */}
              <button onClick={() => { resetAll(); setShowMenu(false); }} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all hover:bg-white/8 text-left" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <svg className="w-5 h-5 text-white/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                <p className="text-sm font-medium text-white/80">Réinitialiser le score</p>
              </button>
              {/* Côté du timer */}
              <button
                onClick={() => {
                  const next = timerSide === 'right' ? 'left' : 'right';
                  setTimerSide(next);
                  localStorage.setItem(TIMER_SIDE_KEY, next);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all hover:bg-white/8 text-left"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <svg className="w-5 h-5 text-white/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: timerSide === 'right' ? 'scaleX(-1)' : 'none' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" /></svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white/80">Timer — côté {timerSide === 'right' ? 'droit' : 'gauche'}</p>
                  <p className="text-xs text-white/30">Basculer à {timerSide === 'right' ? 'gauche' : 'droite'}</p>
                </div>
              </button>
            </div>
            <div className="h-6" />
          </div>
        </div>
      )}

      {/* Panneau thèmes */}
      {showThemes && (
        <div className="absolute inset-0 z-30 flex flex-col" style={{ background: 'rgba(0,0,0,0.96)', backdropFilter: 'blur(8px)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h2 className="font-display font-bold text-white tracking-wide">Thème</h2>
            <button onClick={() => setShowThemes(false)} className="p-2 text-white/40 hover:text-white/70 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setThemeId(t.id);
                    localStorage.setItem(THEME_STORAGE_KEY, t.id);
                    setShowThemes(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left"
                  style={{
                    background: themeId === t.id ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${themeId === t.id ? t.pillBorder : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  {/* Aperçu couleurs */}
                  <div className="flex gap-1 shrink-0">
                    <div className="w-4 h-4 rounded-full" style={{ background: t.meAccent }} />
                    <div className="w-4 h-4 rounded-full" style={{ background: t.oppAccent }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white/80">{t.name}</p>
                  </div>
                  {themeId === t.id && (
                    <svg className="w-4 h-4 text-white/60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Panneau historique */}
      {showHistory && (
        <div className="absolute inset-0 z-30 flex flex-col" style={{ background: 'rgba(0,0,0,0.97)', backdropFilter: 'blur(8px)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h2 className="font-display font-bold text-white tracking-wide">Historique</h2>
            <button onClick={() => setShowHistory(false)} className="p-2 text-white/40 hover:text-white/70 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {grouped.length === 0 ? (
              <p className="text-center text-white/30 py-8">Aucun changement</p>
            ) : (
              <div className="space-y-1.5">
                {[...grouped].reverse().map((entry, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-white/30 font-mono w-14 shrink-0">{new Date(entry.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${entry.player === 'me' ? theme.meAccent : theme.oppAccent}20`, color: entry.player === 'me' ? theme.meAccent : theme.oppAccent }}>
                        {entry.player === 'me' ? 'Moi' : 'Adv.'}
                      </span>
                      <span className="text-sm font-bold" style={{ color: entry.totalDelta > 0 ? '#4ade80' : '#f87171' }}>
                        {entry.totalDelta > 0 ? '+' : ''}{entry.totalDelta}
                      </span>
                    </div>
                    <span className="text-sm text-white/40 font-medium">{entry.fromValue} → {entry.toValue}</span>
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

// ─── PlayerSide ────────────────────────────────────────────────────────────
function PlayerSide({ label, lore, accent, onChangeLore, disabled }: {
  label: string; lore: number; accent: string; onChangeLore: (delta: number) => void; disabled: boolean;
}) {
  const accentDim = `${accent}18`;
  const accentBorder = `${accent}30`;
  const glow = `0 0 40px ${accent}40`;

  return (
    <div className="flex-1 flex flex-col" style={{ background: `radial-gradient(ellipse at 50% 50%, ${accent}12 0%, transparent 70%)` }}>
      <div className="text-center pt-2 pb-1">
        <span className="text-xs font-medium tracking-[0.2em] uppercase" style={{ color: `${accent}99` }}>{label}</span>
      </div>

      <div className="flex-1 flex relative">
        <button className="flex-1 h-full flex items-center justify-start pl-6 transition-all duration-150 active:opacity-50 disabled:opacity-20" onClick={() => onChangeLore(-1)} disabled={disabled || lore === 0} aria-label="-1">
          <span className="text-6xl font-thin leading-none" style={{ color: `${accent}50` }}>−</span>
        </button>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-3">
          <span className="font-display font-bold leading-none tabular-nums" style={{ fontSize: 'clamp(5rem, 22vw, 11rem)', color: accent, textShadow: glow }}>
            {lore}
          </span>
          {/* Losanges Lorcana */}
          <div className="flex gap-0.5 items-center flex-wrap justify-center max-w-[260px]">
            {Array.from({ length: MAX_LORE }).map((_, i) => (
              <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25.83 32" className="transition-all duration-200" style={{ width: 10, height: 13 }}>
                {i < lore ? (
                  <><path d="M12.91 0 0 16l12.91 16 12.91-16L12.91 0ZM1.28 16 12.91 1.59 24.54 16 12.91 30.41 1.28 16Z" fill={accent} /><path d="m21.99 16-9.08 11.25L3.83 16l9.08-11.25L21.99 16z" fill={accent} /></>
                ) : (
                  <path d="m12.91 0 12.91 16-12.91 16L0 16 12.91 0Z" fill={`${accent}25`} />
                )}
              </svg>
            ))}
          </div>
        </div>

        <button className="flex-1 h-full flex items-center justify-end pr-6 transition-all duration-150 active:opacity-50 disabled:opacity-20" onClick={() => onChangeLore(1)} disabled={disabled || lore >= MAX_LORE} aria-label="+1">
          <span className="text-6xl font-thin leading-none" style={{ color: `${accent}50` }}>+</span>
        </button>
      </div>

      <div className="flex justify-between px-5 pb-2 gap-3">
        <button onClick={() => onChangeLore(-5)} disabled={disabled || lore === 0} className="flex-1 h-8 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95 disabled:opacity-25" style={{ background: accentDim, color: accent, border: `1px solid ${accentBorder}` }}>−5</button>
        <button onClick={() => onChangeLore(5)} disabled={disabled || lore >= MAX_LORE} className="flex-1 h-8 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95 disabled:opacity-25" style={{ background: accentDim, color: accent, border: `1px solid ${accentBorder}` }}>+5</button>
      </div>
    </div>
  );
}
