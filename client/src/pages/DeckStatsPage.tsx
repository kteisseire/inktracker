import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDeckStatsById } from '../api/stats.api.js';
import { DeckBadges } from '../components/ui/InkBadge.js';
import { DateFilterBar, useDateFilter } from '../components/ui/DateFilterBar.js';
import type { Deck, OverviewStats, MatchupStat, GoingFirstStats } from '@lorcana/shared';

interface TournamentHistoryEntry {
  id: string; name: string; date: string;
  playerCount: number | null; placement: number | null;
  wins: number; losses: number; draws: number;
  totalRounds: number; winRate: number;
}

export function DeckStatsPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [matchups, setMatchups] = useState<MatchupStat[]>([]);
  const [goingFirst, setGoingFirst] = useState<GoingFirstStats | null>(null);
  const [history, setHistory] = useState<TournamentHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const dateFilter = useDateFilter();

  const fetchStats = useCallback(() => {
    if (!deckId) return;
    setLoading(true);
    const filter = dateFilter.getDateFilter();
    getDeckStatsById(deckId, filter).then(data => {
      setDeck(data.deck);
      setOverview(data.overview);
      setMatchups(data.matchups);
      setGoingFirst(data.goingFirst);
      setHistory(data.history);
    }).finally(() => setLoading(false));
  }, [deckId, dateFilter.getDateFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading && !deck) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-400"></div></div>;
  }

  if (!deck) {
    return <div className="text-center py-12 text-ink-400">Deck non trouvé</div>;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-start gap-3 sm:gap-4">
        <Link to="/decks" className="text-ink-500 hover:text-gold-400 transition-colors mt-1 shrink-0">&larr;</Link>
        <div className="min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <h1 className="font-display text-2xl font-bold text-ink-100 tracking-wide">
              {deck.name}
            </h1>
            <DeckBadges colors={deck.colors as any} />
          </div>
          {deck.link && (
            <a href={deck.link} target="_blank" rel="noopener noreferrer"
              className="text-xs text-lorcana-sapphire hover:text-blue-300 transition-colors truncate block mt-1">
              {deck.link}
            </a>
          )}
        </div>
      </div>

      <DateFilterBar state={dateFilter} />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-400"></div>
        </div>
      ) : (
        <>
          {/* Overview */}
          {overview && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <StatCard label="Tournois" value={overview.totalTournaments} />
              <StatCard label="Rondes" value={overview.totalRounds} />
              <StatCard label="Win Rate" value={`${overview.overallWinRate}%`} highlight />
              <StatCard label="V / D / N" value={`${overview.wins}/${overview.losses}/${overview.draws}`} />
            </div>
          )}

          {/* Going first */}
          {goingFirst && (goingFirst.firstTotal > 0 || goingFirst.secondTotal > 0) && (
            <div>
              <h2 className="ink-section-title mb-3">Impact du premier joueur</h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="ink-card p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-ink-400">En commençant</p>
                  <p className="text-xl sm:text-2xl font-bold text-lorcana-sapphire mt-1">{goingFirst.firstWinRate}%</p>
                  <p className="text-xs text-ink-500 mt-1">{goingFirst.firstTotal} parties</p>
                </div>
                <div className="ink-card p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-ink-400">En second</p>
                  <p className="text-xl sm:text-2xl font-bold text-lorcana-amethyst mt-1">{goingFirst.secondWinRate}%</p>
                  <p className="text-xs text-ink-500 mt-1">{goingFirst.secondTotal} parties</p>
                </div>
              </div>
            </div>
          )}

          {/* Matchups */}
          {matchups.length > 0 && (
            <div>
              <h2 className="ink-section-title mb-3">Matchups</h2>
              <div className="ink-card overflow-hidden hidden sm:block">
                <table className="w-full text-sm">
                  <thead className="bg-ink-800/50 text-ink-400 uppercase text-xs">
                    <tr>
                      <th className="text-left px-4 py-3">Deck adverse</th>
                      <th className="text-center px-4 py-3">Parties</th>
                      <th className="text-center px-4 py-3">Bilan</th>
                      <th className="text-center px-4 py-3">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-800/50">
                    {matchups.sort((a, b) => b.total - a.total).map(m => (
                      <tr key={m.opponentDeckColors.join('-')}>
                        <td className="px-4 py-3"><DeckBadges colors={m.opponentDeckColors as any} /></td>
                        <td className="text-center px-4 py-3 text-ink-300">{m.total}</td>
                        <td className="text-center px-4 py-3">
                          <span className="text-green-400">{m.wins}</span><span className="text-ink-600"> / </span>
                          <span className="text-red-400">{m.losses}</span>
                          {m.draws > 0 && <><span className="text-ink-600"> / </span><span className="text-ink-400">{m.draws}</span></>}
                        </td>
                        <td className="text-center px-4 py-3"><WinRateBar rate={m.winRate} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="sm:hidden space-y-2">
                {matchups.sort((a, b) => b.total - a.total).map(m => (
                  <div key={m.opponentDeckColors.join('-')} className="ink-card p-3">
                    <div className="flex items-center justify-between mb-2">
                      <DeckBadges colors={m.opponentDeckColors as any} />
                      <span className="text-xs text-ink-500">{m.total} parties</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        <span className="text-green-400">{m.wins}</span>
                        <span className="text-ink-600">/</span>
                        <span className="text-red-400">{m.losses}</span>
                        {m.draws > 0 && <><span className="text-ink-600">/</span><span className="text-ink-400">{m.draws}</span></>}
                      </span>
                      <WinRateBar rate={m.winRate} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tournament history */}
          {history.length > 0 && (
            <div>
              <h2 className="ink-section-title mb-3">Tournois avec ce deck</h2>
              <div className="ink-card overflow-hidden hidden sm:block">
                <table className="w-full text-sm">
                  <thead className="bg-ink-800/50 text-ink-400 uppercase text-xs">
                    <tr>
                      <th className="text-left px-4 py-3">Tournoi</th>
                      <th className="text-center px-4 py-3">Bilan</th>
                      <th className="text-center px-4 py-3">Win Rate</th>
                      <th className="text-center px-4 py-3">Place</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-800/50">
                    {history.map(h => (
                      <tr key={h.id}>
                        <td className="px-4 py-3">
                          <Link to={`/tournaments/${h.id}`} className="font-medium text-ink-100 hover:text-gold-400 transition-colors">{h.name}</Link>
                          <div className="text-xs text-ink-500">{new Date(h.date).toLocaleDateString('fr-FR')}</div>
                        </td>
                        <td className="text-center px-4 py-3">
                          <span className="text-green-400">{h.wins}</span><span className="text-ink-600"> / </span>
                          <span className="text-red-400">{h.losses}</span>
                          {h.draws > 0 && <><span className="text-ink-600"> / </span><span className="text-ink-400">{h.draws}</span></>}
                        </td>
                        <td className="text-center px-4 py-3"><WinRateBar rate={h.winRate} /></td>
                        <td className="text-center px-4 py-3 font-medium text-gold-400">
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
                        <Link to={`/tournaments/${h.id}`} className="font-medium text-ink-100 text-sm hover:text-gold-400 transition-colors truncate block">{h.name}</Link>
                        <div className="text-xs text-ink-500">{new Date(h.date).toLocaleDateString('fr-FR')}</div>
                      </div>
                      {h.placement && <span className="text-sm font-medium text-gold-400 shrink-0">#{h.placement}</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        <span className="text-green-400">{h.wins}</span>
                        <span className="text-ink-600">/</span>
                        <span className="text-red-400">{h.losses}</span>
                      </span>
                      <WinRateBar rate={h.winRate} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {overview && overview.totalRounds === 0 && (
            <div className="ink-card p-8 sm:p-12 text-center text-ink-400">
              <p className="text-lg">Pas encore de données pour ce deck</p>
              <p className="mt-2 text-ink-500">
                {dateFilter.filterMode !== 'all'
                  ? 'Aucun tournoi trouvé pour cette période.'
                  : 'Utilisez ce deck dans un tournoi pour voir les statistiques'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="ink-card p-3 sm:p-4">
      <p className="text-xs sm:text-sm text-ink-400">{label}</p>
      <p className={`text-xl sm:text-2xl font-bold mt-1 ${highlight ? 'text-gold-400' : 'text-ink-100'}`}>{value}</p>
    </div>
  );
}

function WinRateBar({ rate }: { rate: number }) {
  const color = rate >= 60 ? 'bg-green-500' : rate >= 45 ? 'bg-gold-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <div className="w-12 sm:w-16 h-2 bg-ink-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${rate}%` }} />
      </div>
      <span className="text-xs font-medium text-ink-300">{rate}%</span>
    </div>
  );
}
