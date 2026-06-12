import { useEffect, useState, useCallback } from 'react';
import { getOverview, getMatchups, getDeckPerformance, getGoingFirstStats, getTournamentHistory } from '../api/stats.api.js';
import { DeckBadges, HollowLozenge } from '../components/ui/InkBadge.js';
import { RecordLine } from '../components/ui/ResultChip.js';
import { DateFilterBar, useDateFilter } from '../components/ui/DateFilterBar.js';
import { HelpButton } from '../components/ui/HelpButton.js';
import { SkeletonStatPanel, SkeletonRows } from '../components/ui/Skeleton.js';
import { Reveal, FolioHero, CountUpPercent, GildedDivider } from '../components/ui/folio.js';
import { StatCell } from '../components/ui/StatCell.js';
import { WinRateBar } from '../components/ui/WinRateBar.js';
import type { OverviewStats, MatchupStat, DeckPerformance, GoingFirstStats } from '@lorcana/shared';

export function StatsPage() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [matchups, setMatchups] = useState<MatchupStat[]>([]);
  const [deckPerf, setDeckPerf] = useState<DeckPerformance[]>([]);
  const [goingFirst, setGoingFirst] = useState<GoingFirstStats | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const dateFilter = useDateFilter();

  const fetchStats = useCallback(() => {
    setLoading(true);
    const filter = dateFilter.getDateFilter();
    Promise.all([
      getOverview(filter),
      getMatchups(filter),
      getDeckPerformance(filter),
      getGoingFirstStats(filter),
      getTournamentHistory(filter),
    ]).then(([o, m, d, g, h]) => {
      setOverview(o);
      setMatchups(m);
      setDeckPerf(d);
      setGoingFirst(g);
      setHistory(h);
    }).finally(() => setLoading(false));
  }, [dateFilter.getDateFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center gap-2">
        <h1 className="font-display text-2xl text-ink-50 tracking-[0.03em]">Statistiques</h1>
        <HelpButton sections={['Statistiques']} />
      </div>

      <DateFilterBar state={dateFilter} />

      {loading ? (
        <div className="space-y-6">
          <SkeletonStatPanel />
          <SkeletonRows count={4} />
        </div>
      ) : (
        <Reveal i={0} className="space-y-6 sm:space-y-8">
          {/* Overview instrument panel */}
          {overview && overview.totalRounds > 0 && (
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
              <FolioHero rubric="Win rate global" tick>
                <CountUpPercent value={overview.overallWinRate} animate={false} />
              </FolioHero>
              <div className="ink-card sm:col-span-2 grid grid-cols-3 divide-x divide-rule">
                <StatCell label="Tournois" value={overview.totalTournaments} />
                <StatCell label="Rondes" value={overview.totalRounds} />
                <StatCell label="V / D / N" value={`${overview.wins}/${overview.losses}/${overview.draws}`} />
              </div>
            </div>
          )}

          {/* Going first */}
          {goingFirst && (goingFirst.firstTotal > 0 || goingFirst.secondTotal > 0) && (
            <section>
              <h2 className="rubric-label mb-3">Impact du premier joueur</h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="ink-card p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-ink-400">En commençant</p>
                  <p className="ink-num text-xl sm:text-2xl text-lorcana-sapphire mt-1">{goingFirst.firstWinRate}%</p>
                  <p className="text-xs text-ink-500 mt-1"><span className="ink-num">{goingFirst.firstTotal}</span> parties</p>
                </div>
                <div className="ink-card p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-ink-400">En second</p>
                  <p className="ink-num text-xl sm:text-2xl text-lorcana-amethyst mt-1">{goingFirst.secondWinRate}%</p>
                  <p className="text-xs text-ink-500 mt-1"><span className="ink-num">{goingFirst.secondTotal}</span> parties</p>
                </div>
              </div>
            </section>
          )}

          {/* Deck performance */}
          {deckPerf.length > 0 && (
            <section>
              <h2 className="rubric-label mb-3">Performance par deck</h2>
              <Ledger headers={['Deck', 'Tournois', 'Bilan', 'Win Rate']}>
                {deckPerf.map((d, i) => (
                  <tr key={d.deckColors.join('-')} className={i % 2 ? 'bg-ink-900/40' : ''}>
                    <td className="px-4 py-3"><DeckBadges colors={d.deckColors as any} /></td>
                    <td className="text-center px-4 py-3 ink-num text-ink-300">{d.tournaments}</td>
                    <td className="text-center px-4 py-3"><RecordLine wins={d.wins} losses={d.losses} draws={d.draws} /></td>
                    <td className="px-4 py-3"><div className="flex justify-center"><WinRateBar rate={d.winRate} /></div></td>
                  </tr>
                ))}
              </Ledger>
              <CardList items={deckPerf} keyOf={d => d.deckColors.join('-')} colorsOf={d => d.deckColors} metaOf={d => `${d.tournaments} tournois`} render={d => (
                <><RecordLine wins={d.wins} losses={d.losses} draws={d.draws} /><WinRateBar rate={d.winRate} /></>
              )} />
            </section>
          )}

          {matchups.length > 0 && <GildedDivider className="my-1" />}

          {/* Matchups */}
          {matchups.length > 0 && (
            <section>
              <h2 className="rubric-label mb-3">Matchups</h2>
              <Ledger headers={['Deck adverse', 'Parties', 'Bilan', 'Win Rate']}>
                {[...matchups].sort((a, b) => b.total - a.total).map((m, i) => (
                  <tr key={m.opponentDeckColors.join('-')} className={i % 2 ? 'bg-ink-900/40' : ''}>
                    <td className="px-4 py-3"><DeckBadges colors={m.opponentDeckColors as any} /></td>
                    <td className="text-center px-4 py-3 ink-num text-ink-300">{m.total}</td>
                    <td className="text-center px-4 py-3"><RecordLine wins={m.wins} losses={m.losses} draws={m.draws} /></td>
                    <td className="px-4 py-3"><div className="flex justify-center"><WinRateBar rate={m.winRate} /></div></td>
                  </tr>
                ))}
              </Ledger>
              <CardList items={[...matchups].sort((a, b) => b.total - a.total)} keyOf={m => m.opponentDeckColors.join('-')} colorsOf={m => m.opponentDeckColors} metaOf={m => `${m.total} parties`} render={m => (
                <><RecordLine wins={m.wins} losses={m.losses} draws={m.draws} /><WinRateBar rate={m.winRate} /></>
              )} />
            </section>
          )}

          {/* Tournament history */}
          {history.length > 0 && (
            <section>
              <h2 className="rubric-label mb-3">Historique</h2>
              <div className="ink-card overflow-hidden hidden sm:block">
                <table className="w-full text-sm">
                  <thead className="text-ink-500 uppercase text-[0.7rem] tracking-[0.1em] border-b border-rule">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Tournoi</th>
                      <th className="text-left px-4 py-3 font-medium">Deck</th>
                      <th className="text-center px-4 py-3 font-medium">Bilan</th>
                      <th className="text-center px-4 py-3 font-medium">Win Rate</th>
                      <th className="text-center px-4 py-3 font-medium">Place</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule">
                    {history.map((h, i) => (
                      <tr key={h.id} className={i % 2 ? 'bg-ink-900/40' : ''}>
                        <td className="px-4 py-3">
                          <div className="font-display tracking-[0.02em] text-ink-100">{h.name}</div>
                          <div className="ink-num text-xs text-ink-500">{new Date(h.date).toLocaleDateString('fr-FR')}</div>
                        </td>
                        <td className="px-4 py-3"><DeckBadges colors={h.myDeckColors} /></td>
                        <td className="text-center px-4 py-3"><RecordLine wins={h.wins} losses={h.losses} draws={h.draws} /></td>
                        <td className="px-4 py-3"><div className="flex justify-center"><WinRateBar rate={h.winRate} /></div></td>
                        <td className="text-center px-4 py-3 ink-num text-gold-400">
                          {h.placement ? `#${h.placement}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="sm:hidden space-y-2">
                {history.map(h => (
                  <div key={h.id} className="ink-card p-3">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0">
                        <div className="font-display tracking-[0.02em] text-ink-100 text-sm truncate">{h.name}</div>
                        <div className="ink-num text-xs text-ink-500">{new Date(h.date).toLocaleDateString('fr-FR')}</div>
                      </div>
                      {h.placement && <span className="ink-num text-sm text-gold-400 shrink-0">#{h.placement}</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <DeckBadges colors={h.myDeckColors} />
                      <div className="flex items-center gap-2">
                        <RecordLine wins={h.wins} losses={h.losses} draws={h.draws} />
                        <WinRateBar rate={h.winRate} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {overview && overview.totalRounds === 0 && (
            <div className="section-wash flex flex-col items-center text-center py-12 gap-3">
              <HollowLozenge size={26} />
              <p className="font-display text-lg text-ink-50 tracking-[0.02em]">Pas encore de données</p>
              <p className="text-ink-500 text-sm">
                {dateFilter.filterMode !== 'all'
                  ? 'Aucun tournoi trouvé pour cette période.'
                  : 'Enregistrez des tournois pour voir vos statistiques !'}
              </p>
            </div>
          )}
        </Reveal>
      )}
    </div>
  );
}

/* Desktop ledger table — rubric headers, ruled rows, zebra, no vertical borders */
function Ledger({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="ink-card overflow-hidden hidden sm:block">
      <table className="w-full text-sm">
        <thead className="text-ink-500 uppercase text-[0.7rem] tracking-[0.1em] border-b border-rule">
          <tr>
            {headers.map((h, i) => (
              <th key={h} className={`px-4 py-3 font-medium ${i === 0 ? 'text-left' : 'text-center'}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">{children}</tbody>
      </table>
    </div>
  );
}

/* Mobile card list mirror of a ledger */
function CardList<T>({ items, keyOf, colorsOf, metaOf, render }: {
  items: T[];
  keyOf: (t: T) => string;
  colorsOf: (t: T) => any;
  metaOf: (t: T) => string;
  render: (t: T) => React.ReactNode;
}) {
  return (
    <div className="sm:hidden space-y-2">
      {items.map(item => (
        <div key={keyOf(item)} className="ink-card p-3">
          <div className="flex items-center justify-between mb-2">
            <DeckBadges colors={colorsOf(item)} />
            <span className="ink-num text-xs text-ink-500">{metaOf(item)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">{render(item)}</div>
        </div>
      ))}
    </div>
  );
}

