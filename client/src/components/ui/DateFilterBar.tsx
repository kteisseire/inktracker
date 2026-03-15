import { useState, useCallback, useEffect } from 'react';
import type { DateFilter } from '../../api/stats.api.js';

const LORCANA_SETS = [
  { label: 'Set 1 — Premier Chapitre',       from: '2023-08-18', to: '2023-11-16' },
  { label: 'Set 2 — L\'Ascension des Floodborn', from: '2023-11-17', to: '2024-02-22' },
  { label: 'Set 3 — Les Terres d\'Encres',    from: '2024-02-23', to: '2024-05-16' },
  { label: 'Set 4 — Le Retour d\'Ursula',     from: '2024-05-17', to: '2024-08-08' },
  { label: 'Set 5 — Ciel Scintillant',        from: '2024-08-09', to: '2024-11-14' },
  { label: 'Set 6 — Azurite',                 from: '2024-11-15', to: '2025-02-20' },
  { label: 'Set 7 — Archazia',                from: '2025-02-21', to: '2025-05-15' },
  { label: 'Set 8 — Illusionarium',           from: '2025-05-16', to: '2025-08-07' },
  { label: 'Set 9 — Lumière Intérieure',      from: '2025-08-08', to: '2025-11-13' },
  { label: 'Set 10 — Le Trésor des Illumineurs', from: '2025-11-14', to: '2026-02-19' },
  { label: 'Set 11 — Courant',                from: '2026-02-20', to: undefined as string | undefined },
];

type FilterMode = 'all' | 'set' | 'custom';

export function useDateFilter() {
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedSet, setSelectedSet] = useState(LORCANA_SETS.length - 1);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const getDateFilter = useCallback((): DateFilter | undefined => {
    if (filterMode === 'all') return undefined;
    if (filterMode === 'set') {
      const set = LORCANA_SETS[selectedSet];
      return { from: set.from, to: set.to };
    }
    if (filterMode === 'custom') {
      const f: DateFilter = {};
      if (customFrom) f.from = customFrom;
      if (customTo) f.to = customTo;
      return Object.keys(f).length > 0 ? f : undefined;
    }
    return undefined;
  }, [filterMode, selectedSet, customFrom, customTo]);

  return { filterMode, setFilterMode, selectedSet, setSelectedSet, customFrom, setCustomFrom, customTo, setCustomTo, getDateFilter };
}

export function DateFilterBar({ state }: {
  state: ReturnType<typeof useDateFilter>;
}) {
  const { filterMode, setFilterMode, selectedSet, setSelectedSet, customFrom, setCustomFrom, customTo, setCustomTo } = state;

  return (
    <div className="ink-card p-3 sm:p-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterMode('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filterMode === 'all' ? 'bg-gold-500/20 text-gold-400' : 'text-ink-400 hover:text-ink-200 bg-ink-800/50'
          }`}
        >
          Toutes
        </button>
        <button
          onClick={() => setFilterMode('set')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filterMode === 'set' ? 'bg-gold-500/20 text-gold-400' : 'text-ink-400 hover:text-ink-200 bg-ink-800/50'
          }`}
        >
          Par set
        </button>
        <button
          onClick={() => setFilterMode('custom')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filterMode === 'custom' ? 'bg-gold-500/20 text-gold-400' : 'text-ink-400 hover:text-ink-200 bg-ink-800/50'
          }`}
        >
          Personnalisé
        </button>
      </div>

      {filterMode === 'set' && (
        <div className="flex flex-wrap gap-1.5">
          {LORCANA_SETS.map((set, i) => (
            <button
              key={i}
              onClick={() => setSelectedSet(i)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedSet === i
                  ? 'bg-lorcana-sapphire text-white'
                  : 'text-ink-400 hover:text-ink-200 bg-ink-800/50 hover:bg-ink-700/50'
              }`}
            >
              {set.label}
            </button>
          ))}
        </div>
      )}

      {filterMode === 'custom' && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-ink-400">
            Du
            <input
              type="date"
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              className="ink-input px-2 py-1 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-400">
            Au
            <input
              type="date"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              className="ink-input px-2 py-1 text-sm"
            />
          </label>
        </div>
      )}
    </div>
  );
}
