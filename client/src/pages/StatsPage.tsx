import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOverview, getMatchups, getDeckPerformance, getGoingFirstStats, getTournamentHistory } from '../api/stats.api.js';
import { listMatchupNotes, upsertMatchupNote, deleteMatchupNote } from '../api/matchupNotes.api.js';
import { DeckBadges, HollowLozenge } from '../components/ui/InkBadge.js';
import { RecordLine } from '../components/ui/ResultChip.js';
import { DateFilterBar, useDateFilter } from '../components/ui/DateFilterBar.js';
import { HelpButton } from '../components/ui/HelpButton.js';
import { SkeletonStatPanel, SkeletonRows } from '../components/ui/Skeleton.js';
import { Reveal, FolioHero, CountUpPercent, GildedDivider } from '../components/ui/folio.js';
import { StatCell } from '../components/ui/StatCell.js';
import { WinRateBar } from '../components/ui/WinRateBar.js';
import type { OverviewStats, MatchupStat, DeckPerformance, GoingFirstStats, InkColor, MatchupNote } from '@lorcana/shared';

export function StatsPage() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [matchups, setMatchups] = useState<MatchupStat[]>([]);
  const [deckPerf, setDeckPerf] = useState<DeckPerformance[]>([]);
  const [goingFirst, setGoingFirst] = useState<GoingFirstStats | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const dateFilter = useDateFilter();

  // Matchup notes — personal notes per opponent color combination
  const { data: matchupNotes = [] } = useQuery({
    queryKey: ['matchup-notes'],
    queryFn: listMatchupNotes,
  });

  const findNote = useCallback((colors: InkColor[]): MatchupNote | undefined => {
    const sorted = [...colors].sort().join(',');
    return matchupNotes.find(n => [...n.opponentColors].sort().join(',') === sorted);
  }, [matchupNotes]);

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
                  <tr key={`${d.deckColors.join('-')}-${d.archetypeName ?? ''}`} className={i % 2 ? 'bg-ink-900/40' : ''}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <DeckBadges colors={d.deckColors as any} />
                        {d.archetypeName && <span className="text-xs text-ink-500 truncate">{d.archetypeName}</span>}
                      </div>
                    </td>
                    <td className="text-center px-4 py-3 ink-num text-ink-300">{d.tournaments}</td>
                    <td className="text-center px-4 py-3"><RecordLine wins={d.wins} losses={d.losses} draws={d.draws} /></td>
                    <td className="px-4 py-3"><div className="flex justify-center"><WinRateBar rate={d.winRate} /></div></td>
                  </tr>
                ))}
              </Ledger>
              <CardList items={deckPerf} keyOf={d => `${d.deckColors.join('-')}-${d.archetypeName ?? ''}`} colorsOf={d => d.deckColors} metaOf={d => `${d.tournaments} tournois`} subtitleOf={d => d.archetypeName} render={d => (
                <><RecordLine wins={d.wins} losses={d.losses} draws={d.draws} /><WinRateBar rate={d.winRate} /></>
              )} />
            </section>
          )}

          {matchups.length > 0 && <GildedDivider className="my-1" />}

          {/* Matchups */}
          {matchups.length > 0 && (
            <section>
              <h2 className="rubric-label mb-3">Matchups</h2>
              <Ledger headers={['Deck adverse', 'Parties', 'Bilan', 'Win Rate', 'Note']}>
                {[...matchups].sort((a, b) => b.total - a.total).map((m, i) => (
                  <tr key={m.opponentDeckColors.join('-')} className={i % 2 ? 'bg-ink-900/40' : ''}>
                    <td className="px-4 py-3"><DeckBadges colors={m.opponentDeckColors as any} /></td>
                    <td className="text-center px-4 py-3 ink-num text-ink-300">{m.total}</td>
                    <td className="text-center px-4 py-3"><RecordLine wins={m.wins} losses={m.losses} draws={m.draws} /></td>
                    <td className="px-4 py-3"><div className="flex justify-center"><WinRateBar rate={m.winRate} /></div></td>
                    <td className="text-center px-4 py-3">
                      <div className="flex justify-center">
                        <MatchupNoteButton colors={m.opponentDeckColors as InkColor[]} note={findNote(m.opponentDeckColors as InkColor[])} />
                      </div>
                    </td>
                  </tr>
                ))}
              </Ledger>
              <CardList items={[...matchups].sort((a, b) => b.total - a.total)} keyOf={m => m.opponentDeckColors.join('-')} colorsOf={m => m.opponentDeckColors} metaOf={m => `${m.total} parties`} render={m => (
                <><RecordLine wins={m.wins} losses={m.losses} draws={m.draws} /><WinRateBar rate={m.winRate} /></>
              )} extra={m => (
                <MatchupNoteButton colors={m.opponentDeckColors as InkColor[]} note={findNote(m.opponentDeckColors as InkColor[])} />
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
function CardList<T>({ items, keyOf, colorsOf, metaOf, subtitleOf, render, extra }: {
  items: T[];
  keyOf: (t: T) => string;
  colorsOf: (t: T) => any;
  metaOf: (t: T) => string;
  subtitleOf?: (t: T) => string | null | undefined;
  render: (t: T) => React.ReactNode;
  extra?: (t: T) => React.ReactNode;
}) {
  return (
    <div className="sm:hidden space-y-2">
      {items.map(item => {
        const subtitle = subtitleOf?.(item);
        return (
          <div key={keyOf(item)} className="ink-card p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <DeckBadges colors={colorsOf(item)} />
                {subtitle && <span className="text-xs text-ink-500 truncate">{subtitle}</span>}
              </div>
              <span className="ink-num text-xs text-ink-500 shrink-0">{metaOf(item)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              {render(item)}
              {extra?.(item)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* Note button + inline edit panel for a matchup's color combination */
function MatchupNoteButton({ colors, note }: { colors: InkColor[]; note: MatchupNote | undefined }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(note?.content ?? '');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['matchup-notes'] });

  const saveMutation = useMutation({
    mutationFn: () => upsertMatchupNote({ opponentColors: colors, content: content.trim() }),
    onSuccess: () => {
      invalidate();
      setOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteMatchupNote(note!.id),
    onSuccess: () => {
      invalidate();
      setContent('');
      setOpen(false);
    },
  });

  const toggleOpen = () => {
    if (!open) setContent(note?.content ?? '');
    setOpen(o => !o);
  };

  return (
    <>
      <button
        type="button"
        onClick={toggleOpen}
        title={note ? 'Modifier la note de matchup' : 'Ajouter une note de matchup'}
        aria-label={note ? 'Modifier la note de matchup' : 'Ajouter une note de matchup'}
        className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
          note
            ? 'border-gold-500/40 bg-gold-500/10 text-gold-400'
            : 'border-rule text-ink-500 hover:text-gold-400 hover:border-gold-500/40'
        }`}
      >
        <span className="text-sm">{note ? '📝' : '✎'}</span>
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-ink-950/70 veil-enter" />
          <div className="relative w-full sm:max-w-sm ink-card-hero rounded-t-xl sm:rounded-xl p-5 sm:p-6 sheet-enter" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 p-2 rounded-lg text-ink-500 hover:text-ink-300 hover:bg-ink-800/50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-semibold text-ink-100">Note de matchup</h3>
                <div className="flex items-center gap-1.5 mt-1.5"><DeckBadges colors={colors} /></div>
              </div>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Ex: Mulligan agressif, attention aux removals au tour 3..."
                rows={4}
                maxLength={500}
                className="ink-input resize-none text-sm"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                {note && (
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 mr-auto"
                  >
                    Supprimer
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="ink-btn-secondary text-xs px-3 py-1.5"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || !content.trim()}
                  className="ink-btn-primary text-xs px-3 py-1.5"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

