import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listTournaments } from '../api/tournaments.api.js';
import { DeckBadges } from '../components/ui/InkBadge.js';
import { HelpButton } from '../components/ui/HelpButton.js';
import type { Tournament } from '@lorcana/shared';

const FORMAT_LABELS: Record<string, string> = { BO1: 'Bo1', BO3: 'Bo3', BO5: 'Bo5' };
const TOPCUT_LABELS: Record<string, string> = { NONE: '—', TOP4: 'Top 4', TOP8: 'Top 8', TOP16: 'Top 16', TOP32: 'Top 32' };

export function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listTournaments(1, 50).then(r => setTournaments(r.tournaments)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-400"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-xl sm:text-2xl font-bold text-ink-100 tracking-wide">Mes tournois</h1>
          <HelpButton sections={['Tournois']} />
        </div>
        <Link to="/tournaments/new" className="ink-btn-primary text-sm px-4 py-2">+ Nouveau</Link>
      </div>

      {tournaments.length === 0 ? (
        <div className="ink-card p-8 sm:p-12 text-center text-ink-400">
          <p className="text-lg">Aucun tournoi enregistré</p>
          <p className="mt-2 text-ink-500">Commencez par créer votre premier tournoi !</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="ink-card overflow-hidden hidden md:block">
            <table className="w-full text-sm">
              <thead className="bg-ink-800/50 text-ink-400 uppercase text-xs">
                <tr>
                  <th className="text-left px-4 py-3">Tournoi</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Lieu</th>
                  <th className="text-left px-4 py-3">Deck</th>
                  <th className="text-center px-4 py-3">Format</th>
                  <th className="text-center px-4 py-3">Top Cut</th>
                  <th className="text-center px-4 py-3">Bilan</th>
                  <th className="text-center px-4 py-3">Place</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800/50">
                {tournaments.map(t => {
                  const wins = t.rounds?.filter(m => m.result === 'WIN').length || 0;
                  const losses = t.rounds?.filter(m => m.result === 'LOSS').length || 0;
                  const draws = t.rounds?.filter(m => m.result === 'DRAW').length || 0;
                  return (
                    <tr key={t.id} className="hover:bg-ink-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/tournaments/${t.id}`} className="font-medium text-ink-100 hover:text-gold-400 transition-colors">
                          {t.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-ink-400">{new Date(t.date).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3 text-ink-400">{t.location || '—'}</td>
                      <td className="px-4 py-3"><DeckBadges colors={t.myDeckColors as any} /></td>
                      <td className="px-4 py-3 text-center text-ink-300">{FORMAT_LABELS[t.format]}</td>
                      <td className="px-4 py-3 text-center text-ink-300">{TOPCUT_LABELS[t.topCut]}</td>
                      <td className="px-4 py-3 text-center font-medium">
                        <span className="text-green-400">{wins}</span>
                        <span className="text-ink-600"> / </span>
                        <span className="text-red-400">{losses}</span>
                        {draws > 0 && <><span className="text-ink-600"> / </span><span className="text-ink-400">{draws}</span></>}
                      </td>
                      <td className="px-4 py-3 text-center text-gold-400 font-medium">
                        {t.placement ? `#${t.placement}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {tournaments.map(t => {
              const wins = t.rounds?.filter(m => m.result === 'WIN').length || 0;
              const losses = t.rounds?.filter(m => m.result === 'LOSS').length || 0;
              const draws = t.rounds?.filter(m => m.result === 'DRAW').length || 0;
              return (
                <Link key={t.id} to={`/tournaments/${t.id}`} className="block ink-card-hover p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="font-medium text-ink-100 truncate">{t.name}</h3>
                      <p className="text-xs text-ink-500 mt-0.5">
                        {new Date(t.date).toLocaleDateString('fr-FR')}
                        {t.location && ` — ${t.location}`}
                      </p>
                    </div>
                    {t.placement && (
                      <span className="text-sm font-medium text-gold-400 shrink-0">#{t.placement}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <DeckBadges colors={t.myDeckColors as any} />
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-ink-500">{FORMAT_LABELS[t.format]}</span>
                      <span className="font-medium">
                        <span className="text-green-400">{wins}</span>
                        <span className="text-ink-600">/</span>
                        <span className="text-red-400">{losses}</span>
                        {draws > 0 && <><span className="text-ink-600">/</span><span className="text-ink-400">{draws}</span></>}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
