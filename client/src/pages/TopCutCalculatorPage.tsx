import { useState } from 'react';

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

interface RecordRow {
  wins: number;
  losses: number;
  count: number;
  cumulative: number;
  status: 'safe' | 'bubble' | 'out';
}

function calculate(players: number, rounds: number, topCut: number): RecordRow[] {
  const rows: RecordRow[] = [];
  let cumulative = 0;

  for (let wins = rounds; wins >= 0; wins--) {
    const losses = rounds - wins;
    const count = players * binomial(rounds, wins) / Math.pow(2, rounds);
    cumulative += count;

    let status: 'safe' | 'bubble' | 'out';
    if (cumulative - count < topCut && cumulative <= topCut) {
      status = 'safe';
    } else if (cumulative - count < topCut && cumulative > topCut) {
      status = 'bubble';
    } else {
      status = 'out';
    }

    rows.push({ wins, losses, count, cumulative, status });
  }

  return rows;
}

const COMMON_PRESETS = [
  { label: '8 joueurs', players: 8, rounds: 3, topCut: 4 },
  { label: '16 joueurs', players: 16, rounds: 4, topCut: 4 },
  { label: '32 joueurs', players: 32, rounds: 5, topCut: 8 },
  { label: '64 joueurs', players: 64, rounds: 6, topCut: 8 },
  { label: '128 joueurs', players: 128, rounds: 7, topCut: 8 },
  { label: '256 joueurs', players: 256, rounds: 8, topCut: 8 },
];

export function TopCutCalculatorPage() {
  const [players, setPlayers] = useState('');
  const [rounds, setRounds] = useState('');
  const [topCut, setTopCut] = useState('');
  const [results, setResults] = useState<RecordRow[] | null>(null);

  const handleCalculate = (e?: React.FormEvent) => {
    e?.preventDefault();
    const p = parseInt(players);
    const r = parseInt(rounds);
    const t = parseInt(topCut);
    if (!p || !r || !t || p < 2 || r < 1 || t < 1 || t >= p) return;
    setResults(calculate(p, r, t));
  };

  const applyPreset = (preset: typeof COMMON_PRESETS[0]) => {
    setPlayers(String(preset.players));
    setRounds(String(preset.rounds));
    setTopCut(String(preset.topCut));
    setResults(calculate(preset.players, preset.rounds, preset.topCut));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-ink-100 tracking-wide">Top Cut Calculator</h1>
        <p className="text-sm text-ink-500 mt-1">
          Estimez quels records passent le cut dans un tournoi en format Suisse.
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
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="ink-label">Joueurs</label>
            <input
              type="number"
              min="2"
              value={players}
              onChange={e => setPlayers(e.target.value)}
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
        </div>
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
                  <th className="text-left px-4 py-3">Record</th>
                  <th className="text-center px-4 py-3">Joueurs</th>
                  <th className="text-center px-4 py-3">Cumulé</th>
                  <th className="text-center px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800/50">
                {results.map(r => (
                  <tr key={`${r.wins}-${r.losses}`} className={rowBg(r.status)}>
                    <td className="px-4 py-3 font-semibold text-ink-100">
                      {r.wins}-{r.losses}
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
              <div key={`${r.wins}-${r.losses}`} className={`ink-card p-3 ${rowBg(r.status)}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-ink-100 text-lg">{r.wins}-{r.losses}</span>
                  <StatusBadge status={r.status} />
                </div>
                <div className="flex items-center justify-between text-xs text-ink-400">
                  <span>{formatCount(r.count)} joueurs</span>
                  <span>Cumulé: {formatCount(r.cumulative)}</span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-ink-500 text-center">
            Ce calcul ne prend pas en compte les nuls, abandons ou DGL. Les résultats réels peuvent varier.
          </p>
        </div>
      )}
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
