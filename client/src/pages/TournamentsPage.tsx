import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { listTournaments, getTeamPresence, deleteTournament, shareTournament } from '../api/tournaments.api.js';
import { DeckBadges } from '../components/ui/InkBadge.js';
import { HelpButton } from '../components/ui/HelpButton.js';
import type { Tournament } from '@lorcana/shared';

const FORMAT_LABELS: Record<string, string> = { BO1: 'Bo1', BO3: 'Bo3', BO5: 'Bo5' };

function ResultBadge({ wins, losses, draws }: { wins: number; losses: number; draws: number }) {
  if (wins === 0 && losses === 0 && draws === 0) return <span className="text-xs text-ink-600">—</span>;
  return (
    <span className="text-sm font-semibold tabular-nums">
      <span className="text-green-400">{wins}</span>
      <span className="text-ink-600">–</span>
      <span className="text-red-400">{losses}</span>
      {draws > 0 && <><span className="text-ink-600">–</span><span className="text-ink-400">{draws}</span></>}
    </span>
  );
}

function CardMenu({ tournament, onDeleted }: { tournament: Tournament; onDeleted: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current && !btnRef.current.contains(target)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = btnRef.current!.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.right - 160 });
    setOpen(v => !v);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    try {
      const shareId = await shareTournament(tournament.id);
      await navigator.clipboard.writeText(`${window.location.origin}/t/${shareId}`);
      alert('Lien copié !');
    } catch { alert('Erreur lors du partage'); }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    if (!confirm(`Supprimer « ${tournament.name} » ?`)) return;
    try {
      await deleteTournament(tournament.id);
      onDeleted(tournament.id);
    } catch { alert('Erreur lors de la suppression'); }
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="p-1.5 rounded-lg text-ink-500 hover:text-ink-200 hover:bg-ink-700/50 transition-colors"
        aria-label="Actions"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>
      {open && createPortal(
        <div
          className="fixed bg-ink-900 border border-ink-700/50 rounded-xl shadow-xl shadow-ink-950/50 py-1 z-[200]"
          style={{ top: pos.top, left: pos.left, width: 160 }}
        >
          <button onClick={e => { e.stopPropagation(); navigate(`/tournaments/${tournament.id}/edit`); setOpen(false); }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-ink-300 hover:text-ink-100 hover:bg-ink-800/50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-1.414a2 2 0 01.586-1.414z" />
            </svg>
            Modifier
          </button>
          <button onClick={handleShare}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-ink-300 hover:text-ink-100 hover:bg-ink-800/50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Partager
          </button>
          <div className="my-1 border-t border-ink-800/50" />
          <button onClick={handleDelete}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Supprimer
          </button>
        </div>,
        document.body
      )}
    </>
  );
}

function TournamentCard({ tournament, presence, onDeleted }: {
  tournament: Tournament;
  presence?: { count: number; members: string[] };
  onDeleted: (id: string) => void;
}) {
  const wins = tournament.rounds?.filter(r => r.result === 'WIN').length ?? 0;
  const losses = tournament.rounds?.filter(r => r.result === 'LOSS').length ?? 0;
  const draws = tournament.rounds?.filter(r => r.result === 'DRAW').length ?? 0;
  const total = wins + losses + draws;
  const date = new Date(tournament.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  return (
    <div className="ink-card overflow-hidden hover:border-gold-500/20 transition-colors group">
      <div className="p-4">
        {/* Ligne 1 : nom + menu */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <Link to={`/tournaments/${tournament.id}`} className="font-semibold text-ink-100 group-hover:text-gold-400 transition-colors truncate leading-tight flex-1">
            {tournament.name}
          </Link>
          <div className="flex items-center gap-1.5 shrink-0">
            {tournament.placement && (
              <span className="text-xs font-bold text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded-full">
                #{tournament.placement}{tournament.playerCount ? `/${tournament.playerCount}` : ''}
              </span>
            )}
            <CardMenu tournament={tournament} onDeleted={onDeleted} />
          </div>
        </div>

        {/* Ligne 2 : date + lieu */}
        <p className="text-xs text-ink-500 mb-3 flex items-center gap-1.5">
          {date}
          {tournament.location && (
            <><span className="text-ink-700">·</span><span className="truncate">{tournament.location}</span></>
          )}
        </p>

        {/* Ligne 3 : deck + stats */}
        <div className="flex items-center justify-between gap-2">
          <DeckBadges colors={tournament.myDeckColors as any} />
          <div className="flex items-center gap-2 shrink-0">
            {presence && (
              <span className="flex items-center gap-1 text-xs text-blue-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {presence.count}
              </span>
            )}
            <span className="text-xs text-ink-600">{FORMAT_LABELS[tournament.format]}</span>
            {total > 0 && <ResultBadge wins={wins} losses={losses} draws={draws} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TournamentsPage() {
  const queryClient = useQueryClient();

  const { data: tournamentsData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['tournaments', 1, 50],
    queryFn: () => listTournaments(1, 50),
  });

  const { data: presence = {} } = useQuery({
    queryKey: ['team-presence'],
    queryFn: getTeamPresence,
  });

  const tournaments = tournamentsData?.tournaments ?? [];

  const handleDeleted = (id: string) => {
    queryClient.setQueryData(['tournaments', 1, 50], (old: any) => {
      if (!old) return old;
      return { ...old, tournaments: old.tournaments.filter((t: any) => t.id !== id) };
    });
  };

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-lg text-ink-400 hover:text-ink-100 hover:bg-ink-700/50 transition-colors disabled:opacity-40"
            aria-label="Rafraîchir"
          >
            <svg className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <Link to="/tournaments/new" className="ink-btn-primary text-sm px-4 py-2">+ Nouveau</Link>
        </div>
      </div>

      {tournaments.length === 0 ? (
        <div className="ink-card p-8 sm:p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gold-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h14l-1.4 8.4A5 5 0 0112.6 16h-.8a5 5 0 01-5-4.6L5 3zM8 16h8m-4 0v4m-3 0h6" />
            </svg>
          </div>
          <p className="text-base font-semibold text-ink-100">Aucun tournoi enregistré</p>
          <p className="mt-1 text-sm text-ink-400">Commencez par créer votre premier tournoi.</p>
          <Link to="/tournaments/new" className="ink-btn-primary inline-block mt-5 px-6 py-2.5 text-sm">+ Créer un tournoi</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tournaments.map(t => (
            <TournamentCard
              key={t.id}
              tournament={t}
              presence={presence[t.id]}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
