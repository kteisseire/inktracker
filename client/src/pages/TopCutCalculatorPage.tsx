import { useState } from 'react';
import { getRecommendedSwissRounds, getRecommendedTopCut } from '@lorcana/shared';
import { HelpButton } from '../components/ui/HelpButton.js';
import { ToolsSubNav } from '../components/layout/ToolsSubNav.js';
import { Seo } from '../components/Seo.js';

const TOPCUT_VALUES: Record<string, number> = { NONE: 0, TOP4: 4, TOP8: 8, TOP16: 16, TOP32: 32 };

// Points Lorcana : victoire = 3, nul = 1, défaite = 0.
const WIN_PTS = 3;
const DRAW_PTS = 1;
const DEFAULT_DRAW_RATE = 10; // % (mode statistique uniquement)

type Mode = 'worst' | 'stat';

function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 1; i <= k; i++) {
    result *= (n + 1 - i);
    result /= i;
  }
  return result;
}

interface Combo { wins: number; losses: number; draws: number; }

interface PointRow {
  points: number;
  combos: Combo[];
  count: number | null;   // joueurs attendus à ce total (mode stat) ; null en pire cas
  cumulative: number;     // pire cas : max joueurs à >= ce total ; stat : joueurs cumulés
  status: 'safe' | 'bubble' | 'out';
}

// Tous les records (V-D-L) menant à chaque total de points, regroupés par points.
function combosByPoints(rounds: number): Map<number, Combo[]> {
  const byPoints = new Map<number, Combo[]>();
  for (let w = rounds; w >= 0; w--) {
    for (let d = rounds - w; d >= 0; d--) {
      const l = rounds - w - d;
      const points = WIN_PTS * w + DRAW_PTS * d;
      const arr = byPoints.get(points) ?? [];
      arr.push({ wins: w, losses: l, draws: d });
      byPoints.set(points, arr);
    }
  }
  return byPoints;
}

// ─── Mode PIRE CAS ─────────────────────────────────────────────────────────
// Les meilleurs joueurs sécurisent leur place (égalités intentionnelles / IDs si
// besoin). Borne : pour atteindre P points il faut au plus L = R - ceil(P/3)
// défaites ; le nombre MAX de joueurs pouvant avoir <= L défaites après R rondes
// est le cumul binomial N·Σ C(R,i)/2^R. Un score est "garanti" si ce max tient
// dans le top cut.
function maxWithAtMostLosses(players: number, rounds: number, maxLosses: number): number {
  if (maxLosses < 0) return 0;
  let sum = 0;
  for (let i = 0; i <= Math.min(maxLosses, rounds); i++) sum += binomial(rounds, i);
  return Math.min(players, Math.round(players * sum / Math.pow(2, rounds)));
}

function calculateWorst(players: number, rounds: number, topCut: number): PointRow[] {
  const byPoints = combosByPoints(rounds);
  const points = [...byPoints.keys()].sort((a, b) => b - a);
  const rows: PointRow[] = [];

  for (const p of points) {
    const losses = Math.max(0, Math.min(rounds, rounds - Math.ceil(p / WIN_PTS)));
    const maxAtThisOrBetter = maxWithAtMostLosses(players, rounds, losses);
    const maxStrictlyBetter = maxWithAtMostLosses(players, rounds, losses - 1);

    let status: 'safe' | 'bubble' | 'out';
    if (maxAtThisOrBetter <= topCut) status = 'safe';        // tout le palier rentre → garanti
    else if (maxStrictlyBetter < topCut) status = 'bubble';  // les scores supérieurs rentrent, ce palier déborde
    else status = 'out';                                     // les scores supérieurs remplissent déjà le cut

    const combos = byPoints.get(p)!.slice().sort((a, b) => b.wins - a.wins || b.draws - a.draws);
    rows.push({ points: p, combos, count: null, cumulative: maxAtThisOrBetter, status });
  }
  return rows;
}

// ─── Mode STATISTIQUE ──────────────────────────────────────────────────────
// Estimation multinomiale : chaque match gagné/perdu/nul indépendamment, avec
// p(nul) = drawRate. Joueurs attendus par total de points.
function calculateStat(players: number, rounds: number, topCut: number, drawRate: number): PointRow[] {
  const pd = Math.min(Math.max(drawRate, 0), 0.9);
  const pw = (1 - pd) / 2;
  const pl = (1 - pd) / 2;

  const byPoints = new Map<number, { count: number; combos: Combo[] }>();
  for (let w = rounds; w >= 0; w--) {
    for (let d = rounds - w; d >= 0; d--) {
      const l = rounds - w - d;
      const pts = WIN_PTS * w + DRAW_PTS * d;
      const ways = binomial(rounds, w) * binomial(rounds - w, d);
      const prob = ways * Math.pow(pw, w) * Math.pow(pl, l) * Math.pow(pd, d);
      const entry = byPoints.get(pts) ?? { count: 0, combos: [] };
      entry.count += players * prob;
      entry.combos.push({ wins: w, losses: l, draws: d });
      byPoints.set(pts, entry);
    }
  }

  const sorted = [...byPoints.keys()].sort((a, b) => b - a);
  const rows: PointRow[] = [];
  let cumulative = 0;
  for (const p of sorted) {
    const { count, combos } = byPoints.get(p)!;
    if (count < 0.05 && cumulative > topCut) continue;
    cumulative += count;
    let status: 'safe' | 'bubble' | 'out';
    if (cumulative <= topCut) status = 'safe';
    else if (cumulative - count < topCut) status = 'bubble';
    else status = 'out';
    combos.sort((a, b) => b.wins - a.wins || b.draws - a.draws);
    rows.push({ points: p, combos, count, cumulative, status });
  }
  return rows;
}

function formatCombos(combos: Combo[]): string {
  const shown = combos.slice(0, 3).map(c => `${c.wins}-${c.losses}-${c.draws}`);
  return shown.join(' · ') + (combos.length > 3 ? ' …' : '');
}

const COMMON_PRESETS = [8, 16, 32, 64, 128, 226].map(p => ({
  label: `${p} joueurs`,
  players: p,
  rounds: getRecommendedSwissRounds(p),
  topCut: TOPCUT_VALUES[getRecommendedTopCut(p)] || 0,
}));

export function TopCutCalculatorPage() {
  const [players, setPlayers] = useState('');
  const [rounds, setRounds] = useState('');
  const [topCut, setTopCut] = useState('');
  const [mode, setMode] = useState<Mode>('worst');
  const [drawRate, setDrawRate] = useState(String(DEFAULT_DRAW_RATE));
  const [results, setResults] = useState<PointRow[] | null>(null);

  const compute = (p: number, r: number, t: number, m: Mode) =>
    m === 'worst' ? calculateWorst(p, r, t) : calculateStat(p, r, t, (parseFloat(drawRate) || 0) / 100);

  const handlePlayersChange = (value: string) => {
    setPlayers(value);
    const p = parseInt(value);
    if (p && p >= 8) {
      setRounds(String(getRecommendedSwissRounds(p)));
      setTopCut(String(TOPCUT_VALUES[getRecommendedTopCut(p)] || 0));
    }
  };

  const handleCalculate = (e?: React.FormEvent) => {
    e?.preventDefault();
    const p = parseInt(players);
    const r = parseInt(rounds);
    const t = parseInt(topCut);
    if (!p || !r || p < 2 || r < 1) return;
    setResults(compute(p, r, Math.max(t || 0, 0), mode));
  };

  const applyPreset = (preset: typeof COMMON_PRESETS[0]) => {
    setPlayers(String(preset.players));
    setRounds(String(preset.rounds));
    setTopCut(String(preset.topCut));
    setResults(compute(preset.players, preset.rounds, preset.topCut, mode));
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    const p = parseInt(players), r = parseInt(rounds), t = parseInt(topCut);
    if (p && r && p >= 2 && r >= 1) setResults(compute(p, r, Math.max(t || 0, 0), m));
  };

  const isWorst = mode === 'worst';

  return (
    <div className="max-w-2xl mx-auto">
      <Seo
        title="Calculateur Top Cut"
        description="Calculez quels records et totaux de points passent le cut en format Suisse Lorcana, dans le pire cas (égalités intentionnelles incluses)."
        path="/top-cut"
      />
      <ToolsSubNav />
      <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl text-ink-100 tracking-wide">Top Cut Calculator</h1>
          <HelpButton sections={['Outils gratuits']} />
        </div>
        <p className="text-sm text-ink-500 mt-1">
          Quels totaux de points passent le cut en format Suisse (victoire = 3, nul = 1).
          Par défaut, en <span className="text-gold-400">pire cas</span> : les meilleurs joueurs
          sécurisent leur place avec des égalités si nécessaire.
        </p>
      </div>

      {/* Mode */}
      <div className="inline-flex p-0.5 rounded-lg border border-rule bg-ink-900/40">
        <button
          onClick={() => switchMode('worst')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${isWorst ? 'bg-gold-400/15 text-gold-300' : 'text-ink-400 hover:text-ink-200'}`}
        >
          Pire cas
        </button>
        <button
          onClick={() => switchMode('stat')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${!isWorst ? 'bg-gold-400/15 text-gold-300' : 'text-ink-400 hover:text-ink-200'}`}
        >
          Statistique
        </button>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        {COMMON_PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => applyPreset(p)}
            className="px-2.5 py-1 rounded-md text-xs font-medium text-ink-400 hover:text-ink-200 bg-ink-800/50 hover:bg-ink-700/50 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleCalculate} className="ink-card p-4 sm:p-5">
        <div className={`grid gap-3 sm:gap-4 ${isWorst ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
          <div>
            <label className="ink-label">Joueurs</label>
            <input type="number" min="2" value={players} onChange={e => handlePlayersChange(e.target.value)} placeholder="64" className="ink-input" required />
          </div>
          <div>
            <label className="ink-label">Rondes</label>
            <input type="number" min="1" value={rounds} onChange={e => setRounds(e.target.value)} placeholder="6" className="ink-input" required />
          </div>
          <div>
            <label className="ink-label">Top Cut</label>
            <input type="number" min="1" value={topCut} onChange={e => setTopCut(e.target.value)} placeholder="8" className="ink-input" required />
          </div>
          {!isWorst && (
            <div>
              <label className="ink-label">Nuls (%)</label>
              <input type="number" min="0" max="50" value={drawRate} onChange={e => setDrawRate(e.target.value)} placeholder="10" className="ink-input" />
            </div>
          )}
        </div>
        <p className="text-xs text-ink-500 mt-2">
          {isWorst
            ? 'Pire cas : nombre MAXIMUM de joueurs pouvant atteindre chaque total (les meilleurs scores font égalité pour verrouiller leur place). Un score est « Garanti » seulement si ce maximum tient dans le top cut.'
            : 'Estimation statistique : part des matchs nuls (naturels + handshakes). À 0 %, seuls les multiples de 3 ; augmentez pour voir 13 pts (4-1-1) ou 11 pts (3-0-2).'}
        </p>
        <button type="submit" className="ink-btn-primary w-full mt-4">Calculer</button>
      </form>

      {/* Results */}
      {results && (
        <div className="space-y-4">
          {/* Desktop table */}
          <div className="ink-card overflow-hidden hidden sm:block">
            <table className="w-full text-sm">
              <thead className="bg-ink-800/50 text-ink-400 uppercase text-xs">
                <tr>
                  <th className="text-left px-4 py-3">Points</th>
                  <th className="text-left px-4 py-3">Records (V-D-N)</th>
                  {!isWorst && <th className="text-center px-4 py-3">Joueurs</th>}
                  <th className="text-center px-4 py-3">{isWorst ? 'Max joueurs (≥)' : 'Cumulé'}</th>
                  <th className="text-center px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800/50">
                {results.map(r => (
                  <tr key={r.points} className={rowBg(r.status)}>
                    <td className="px-4 py-3 font-semibold text-gold-400 ink-num">{r.points}</td>
                    <td className="px-4 py-3 text-ink-200 ink-num">{formatCombos(r.combos)}</td>
                    {!isWorst && <td className="text-center px-4 py-3 text-ink-300">{formatCount(r.count ?? 0)}</td>}
                    <td className="text-center px-4 py-3 text-ink-300">{formatCount(r.cumulative)}</td>
                    <td className="text-center px-4 py-3"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {results.map(r => (
              <div key={r.points} className={`ink-card p-3 ${rowBg(r.status)}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gold-400 text-lg ink-num">{r.points} pts</span>
                    <span className="text-sm text-ink-300 ink-num">{formatCombos(r.combos)}</span>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <div className="flex items-center justify-between text-xs text-ink-400">
                  {isWorst
                    ? <span>Max {formatCount(r.cumulative)} joueurs à ce score ou plus</span>
                    : <><span>{formatCount(r.count ?? 0)} joueurs</span><span>Cumulé : {formatCount(r.cumulative)}</span></>}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-ink-500 text-center">
            {isWorst
              ? 'Borne théorique (pire cas avec égalités optimales). Les départages (OWP) décident à l\'intérieur d\'un palier « Bubble ». En pratique, le cut tombe souvent un cran plus bas.'
              : 'Estimation statistique ; les IDs se concentrent en réalité près de la bulle. Les départages décident à l\'intérieur d\'un palier.'}
          </p>
        </div>
      )}
      </div>
    </div>
  );
}

function formatCount(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(1);
}

function rowBg(status: 'safe' | 'bubble' | 'out'): string {
  if (status === 'safe') return 'bg-green-500/5';
  if (status === 'bubble') return 'bg-gold-400/10';
  return '';
}

function StatusBadge({ status }: { status: 'safe' | 'bubble' | 'out' }) {
  if (status === 'safe') {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/15 text-green-400">Garanti</span>;
  }
  if (status === 'bubble') {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gold-400/15 text-gold-400">Bubble</span>;
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-ink-700/50 text-ink-500">Éliminé</span>;
}
