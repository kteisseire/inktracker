import { useState } from 'react';
import { getRecommendedSwissRounds, getRecommendedTopCut } from '@lorcana/shared';
import { HelpButton } from '../components/ui/HelpButton.js';
import { ToolsSubNav } from '../components/layout/ToolsSubNav.js';
import { Seo } from '../components/Seo.js';

const TOPCUT_VALUES: Record<string, number> = { NONE: 0, TOP4: 4, TOP8: 8, TOP16: 16, TOP32: 32 };

// Points Lorcana : victoire = 3, nul = 1, défaite = 0.
const WIN_PTS = 3;
const DRAW_PTS = 1;
// Taux de nuls par défaut (inclut les nuls "naturels" et les matchs nuls
// intentionnels / poignées de main des dernières rondes). Réglable.
const DEFAULT_DRAW_RATE = 10; // %

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
  combos: Combo[];        // records (W-L-D) menant à ce total de points
  count: number;          // joueurs attendus à ce total (somme des records)
  cumulative: number;     // joueurs cumulés à >= ce total
  status: 'safe' | 'bubble' | 'out';
}

// Modèle : chaque match est gagné/perdu/nul de façon indépendante avec
// p(nul) = drawRate et p(victoire) = p(défaite) = (1 - drawRate) / 2.
// On somme les probabilités multinomiales par TOTAL DE POINTS (3W + D), car le
// cut se décide aux points (les départages affinent à l'intérieur d'un palier).
function calculate(players: number, rounds: number, topCut: number, drawRate: number): PointRow[] {
  const pd = Math.min(Math.max(drawRate, 0), 0.9);
  const pw = (1 - pd) / 2;
  const pl = (1 - pd) / 2;

  const byPoints = new Map<number, { count: number; combos: Combo[] }>();

  for (let w = rounds; w >= 0; w--) {
    for (let d = rounds - w; d >= 0; d--) {
      const l = rounds - w - d;
      const points = WIN_PTS * w + DRAW_PTS * d;
      // multinomial(rounds; w, l, d) = C(rounds, w) * C(rounds - w, d)
      const ways = binomial(rounds, w) * binomial(rounds - w, d);
      const prob = ways * Math.pow(pw, w) * Math.pow(pl, l) * Math.pow(pd, d);
      const expected = players * prob;
      const entry = byPoints.get(points) ?? { count: 0, combos: [] };
      entry.count += expected;
      entry.combos.push({ wins: w, losses: l, draws: d });
      byPoints.set(points, entry);
    }
  }

  const sortedPoints = [...byPoints.keys()].sort((a, b) => b - a);
  const rows: PointRow[] = [];
  let cumulative = 0;

  for (const points of sortedPoints) {
    const { count, combos } = byPoints.get(points)!;
    // On masque les paliers dont la population estimée est négligeable et qui
    // sont DÉJÀ hors cut, pour éviter d'allonger le tableau avec des records
    // quasi impossibles (ex. 6 nuls). On garde toujours la zone du cut.
    if (count < 0.05 && cumulative > topCut) continue;
    cumulative += count;

    let status: 'safe' | 'bubble' | 'out';
    if (cumulative <= topCut) status = 'safe';
    else if (cumulative - count < topCut) status = 'bubble';
    else status = 'out';

    combos.sort((a, b) => b.wins - a.wins || b.draws - a.draws);
    rows.push({ points, combos, count, cumulative, status });
  }

  return rows;
}

function formatCombos(combos: Combo[]): string {
  // Affiche les records pertinents (W-L-D), du plus de victoires au moins.
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
  const [drawRate, setDrawRate] = useState(String(DEFAULT_DRAW_RATE));
  const [results, setResults] = useState<PointRow[] | null>(null);

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
    const dr = (parseFloat(drawRate) || 0) / 100;
    if (!p || !r || p < 2 || r < 1) return;
    setResults(calculate(p, r, Math.max(t || 0, 0), dr));
  };

  const applyPreset = (preset: typeof COMMON_PRESETS[0]) => {
    setPlayers(String(preset.players));
    setRounds(String(preset.rounds));
    setTopCut(String(preset.topCut));
    const dr = (parseFloat(drawRate) || 0) / 100;
    setResults(calculate(preset.players, preset.rounds, preset.topCut, dr));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Seo
        title="Calculateur Top Cut"
        description="Calculez quels records et totaux de points passent le cut en format Suisse Lorcana, nuls et matchs nuls intentionnels (ID) inclus."
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
          Estimez quels totaux de points passent le cut en format Suisse, nuls compris
          (victoire = 3, nul = 1). Inclut les matchs nuls intentionnels (poignée de main).
        </p>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="ink-label">Joueurs</label>
            <input
              type="number"
              min="2"
              value={players}
              onChange={e => handlePlayersChange(e.target.value)}
              placeholder="64"
              className="ink-input"
              required
            />
          </div>
          <div>
            <label className="ink-label">Rondes</label>
            <input
              type="number"
              min="1"
              value={rounds}
              onChange={e => setRounds(e.target.value)}
              placeholder="6"
              className="ink-input"
              required
            />
          </div>
          <div>
            <label className="ink-label">Top Cut</label>
            <input
              type="number"
              min="1"
              value={topCut}
              onChange={e => setTopCut(e.target.value)}
              placeholder="8"
              className="ink-input"
              required
            />
          </div>
          <div>
            <label className="ink-label">Nuls (%)</label>
            <input
              type="number"
              min="0"
              max="50"
              value={drawRate}
              onChange={e => setDrawRate(e.target.value)}
              placeholder="10"
              className="ink-input"
            />
          </div>
        </div>
        <p className="text-xs text-ink-500 mt-2">
          Taux de nuls : part des matchs nuls (naturels + handshakes). À 0 %, seuls les
          totaux multiples de 3 apparaissent ; augmentez-le pour voir des paliers comme
          13 pts (4-1-1) ou 11 pts (3-0-2).
        </p>
        <button type="submit" className="ink-btn-primary w-full mt-4">
          Calculer
        </button>
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
                  <th className="text-center px-4 py-3">Joueurs</th>
                  <th className="text-center px-4 py-3">Cumulé</th>
                  <th className="text-center px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800/50">
                {results.map(r => (
                  <tr key={r.points} className={rowBg(r.status)}>
                    <td className="px-4 py-3 font-semibold text-gold-400 ink-num">
                      {r.points}
                    </td>
                    <td className="px-4 py-3 text-ink-200 ink-num">
                      {formatCombos(r.combos)}
                    </td>
                    <td className="text-center px-4 py-3 text-ink-300">
                      {formatCount(r.count)}
                    </td>
                    <td className="text-center px-4 py-3 text-ink-300">
                      {formatCount(r.cumulative)}
                    </td>
                    <td className="text-center px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
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
                  <span>{formatCount(r.count)} joueurs</span>
                  <span>Cumulé : {formatCount(r.cumulative)}</span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-ink-500 text-center">
            Estimation statistique (les nuls sont supposés répartis uniformément ; les IDs
            se concentrent en réalité près de la bulle). Les départages (OWP) décident à
            l'intérieur d'un palier de points. Les résultats réels peuvent varier.
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
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/15 text-green-400">Qualifié</span>;
  }
  if (status === 'bubble') {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gold-400/15 text-gold-400">Bubble</span>;
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-ink-700/50 text-ink-500">Éliminé</span>;
}
