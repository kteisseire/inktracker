import { useQuery } from '@tanstack/react-query';
import { getMetagameOverview } from '../api/metagame.api.js';
import { DeckBadges, HollowLozenge } from '../components/ui/InkBadge.js';
import { WinRateBar } from '../components/ui/WinRateBar.js';
import { DateFilterBar, useDateFilter } from '../components/ui/DateFilterBar.js';
import { SkeletonRows } from '../components/ui/Skeleton.js';
import { Reveal } from '../components/ui/folio.js';
import type { InkColor, MetagameEntry } from '@lorcana/shared';

export function MetagamePage() {
  const dateFilter = useDateFilter();
  const filter = dateFilter.getDateFilter();

  const { data, isLoading } = useQuery({
    queryKey: ['metagame-overview', filter?.from, filter?.to],
    queryFn: () => getMetagameOverview(filter),
  });

  const entries = data?.entries ?? [];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="font-display text-2xl text-ink-50 tracking-[0.03em]">Métagame</h1>
        <p className="text-sm text-ink-500 mt-1">
          Données communautaires anonymisées — agrégées depuis l'ensemble des rondes enregistrées sur GlimmerLog.
        </p>
      </div>

      <DateFilterBar state={dateFilter} />

      {isLoading ? (
        <SkeletonRows count={6} />
      ) : entries.length > 0 ? (
        <Reveal i={0}>
          <p className="text-xs text-ink-500 mb-3">
            <span className="ink-num">{data?.totalRounds}</span> rondes analysées · combinaisons avec au moins{' '}
            <span className="ink-num">{data?.minRoundsThreshold}</span> rondes affichées
          </p>

          {/* Desktop ledger */}
          <div className="ink-card overflow-hidden hidden sm:block">
            <table className="w-full text-sm">
              <thead className="text-ink-500 uppercase text-[0.7rem] tracking-[0.1em] border-b border-rule">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Deck</th>
                  <th className="text-center px-4 py-3 font-medium">Part du méta</th>
                  <th className="text-center px-4 py-3 font-medium">Win rate</th>
                  <th className="text-center px-4 py-3 font-medium">Parties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {entries.map((entry, i) => (
                  <MetagameRow key={entry.opponentDeckColors.join('-')} entry={entry} zebra={i % 2 === 1} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {entries.map(entry => (
              <MetagameCard key={entry.opponentDeckColors.join('-')} entry={entry} />
            ))}
          </div>
        </Reveal>
      ) : (
        <div className="section-wash flex flex-col items-center text-center py-12 gap-3">
          <HollowLozenge size={26} />
          <p className="font-display text-lg text-ink-50 tracking-[0.02em]">Pas encore assez de données</p>
          <p className="text-ink-500 text-sm">
            {dateFilter.filterMode !== 'all'
              ? 'Aucune combinaison de decks ne dépasse le seuil minimum pour cette période.'
              : 'Le métagame communautaire s\'affichera dès que suffisamment de rondes auront été enregistrées.'}
          </p>
        </div>
      )}
    </div>
  );
}

function MetagameRow({ entry, zebra }: { entry: MetagameEntry; zebra: boolean }) {
  return (
    <tr className={zebra ? 'bg-ink-900/40' : ''}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <DeckBadges colors={entry.opponentDeckColors as InkColor[]} />
          {entry.archetypeName && <span className="text-xs text-ink-500 truncate">{entry.archetypeName}</span>}
        </div>
      </td>
      <td className="text-center px-4 py-3 ink-num text-ink-300">{entry.metaShare}%</td>
      <td className="px-4 py-3"><div className="flex justify-center"><WinRateBar rate={entry.winRate} /></div></td>
      <td className="text-center px-4 py-3 ink-num text-ink-300">{entry.total}</td>
    </tr>
  );
}

function MetagameCard({ entry }: { entry: MetagameEntry }) {
  return (
    <div className="ink-card p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <DeckBadges colors={entry.opponentDeckColors as InkColor[]} />
          {entry.archetypeName && <span className="text-xs text-ink-500 truncate">{entry.archetypeName}</span>}
        </div>
        <span className="ink-num text-xs text-ink-500 shrink-0">{entry.total} parties</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="ink-num text-xs text-ink-400">{entry.metaShare}% du méta</span>
        <WinRateBar rate={entry.winRate} />
      </div>
    </div>
  );
}
