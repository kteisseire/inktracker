import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listTournaments, getTeamPresence } from '../api/tournaments.api.js';
import { DeckBadges } from '../components/ui/InkBadge.js';
import { HelpButton } from '../components/ui/HelpButton.js';
import type { Tournament } from '@lorcana/shared';

const FORMAT_LABELS: Record<string, string> = { BO1: 'Bo1', BO3: 'Bo3', BO5: 'Bo5' };
const TOPCUT_LABELS: Record<string, string> = { NONE: '—', TOP4: 'Top 4', TOP8: 'Top 8', TOP16: 'Top 16', TOP32: 'Top 32' };

function TeamBadge({ count, members }: { count: number; members: string[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors"
        title={`${count} coéquipier${count > 1 ? 's' : ''}`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {count}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-ink-900 border border-ink-700/50 rounded-lg shadow-xl z-50 py-1.5 min-w-[140px]">
          <p className="px-3 py-1.5 text-xs text-ink-500 uppercase tracking-wider font-medium">Équipe</p>
          {members.map(name => (
            <div key={name} className="px-3 py-2 text-sm text-ink-200">{name}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TournamentsPage() {
  const { data: tournamentsData, isLoading } = useQuery({
    queryKey: ['tournaments', 1, 50],
    queryFn: () => listTournaments(1, 50),
  });

  const { data: presence = {} } = useQuery({
    queryKey: ['team-presence'],
    queryFn: getTeamPresence,
  });

  const tournaments = tournamentsData?.tournaments ?? [];

  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-400"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-bold text-ink-100 tracking-wide">Mes tournois</h1>
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
                  const tp = presence[t.id];
                  return (
                    <tr key={t.id} className="hover:bg-ink-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link to={`/tournaments/${t.id}`} className="font-medium text-ink-100 hover:text-gold-400 transition-colors">
                            {t.name}
                          </Link>
                          {tp && <TeamBadge count={tp.count} members={tp.members} />}
                        </div>
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
              const tp = presence[t.id];
              return (
                <Link key={t.id} to={`/tournaments/${t.id}`} className="block ink-card-hover p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-ink-100 truncate">{t.name}</h3>
                        {tp && <TeamBadge count={tp.count} members={tp.members} />}
                      </div>
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
