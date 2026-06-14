import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { Trophy, Pencil, Share2, Trash2, Users, RefreshCw, Plus, MoreVertical } from 'lucide-react';
import { useDismiss } from '../hooks/useDismiss.js';
import { listTournaments, getTeamPresence, deleteTournament, shareTournament } from '../api/tournaments.api.js';
import { DeckBadges } from '../components/ui/InkBadge.js';
import { RecordLine } from '../components/ui/ResultChip.js';
import { HelpButton } from '../components/ui/HelpButton.js';
import { SkeletonRows } from '../components/ui/Skeleton.js';
import { useToast } from '../components/ui/Toast.js';
import { useConfirm } from '../components/ui/ConfirmDialog.js';
import { getQrCodeUrl } from '../lib/qrcode.js';
import { Reveal } from '../components/ui/folio.js';
import type { Tournament } from '@lorcana/shared';

const FORMAT_LABELS: Record<string, string> = { BO1: 'Bo1', BO3: 'Bo3', BO5: 'Bo5' };

function CardMenu({ tournament, onDeleted }: { tournament: Tournament; onDeleted: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Inclure le panneau (portail) dans les zones "intérieures" : sinon le mousedown
  // sur un item ferme le menu avant que son onClick ne se déclenche.
  useDismiss(open, [btnRef, menuRef], () => setOpen(false));

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
    setShareModalOpen(true);
    if (shareUrl) return; // déjà généré
    setShareLoading(true);
    try {
      const shareId = await shareTournament(tournament.id);
      setShareUrl(`${window.location.origin}/t/${shareId}`);
    } catch {
      toast('Erreur lors du partage', 'error');
      setShareModalOpen(false);
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyShareUrl = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    const ok = await confirm({
      title: 'Supprimer le tournoi',
      message: `Supprimer « ${tournament.name} » et toutes ses rondes ? Cette action est définitive.`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteTournament(tournament.id);
      onDeleted(tournament.id);
      toast('Tournoi supprimé', 'success');
    } catch { toast('Erreur lors de la suppression', 'error'); }
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="touch-compact p-1.5 rounded-md text-ink-500 hover:text-ink-200 hover:bg-ink-700/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/50"
        aria-label="Actions"
      >
        <MoreVertical className="w-4 h-4" strokeWidth={2} />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          className="fixed bg-ink-900 border border-rule rounded-lg shadow-card-hover py-1 z-[200]"
          style={{ top: pos.top, left: pos.left, width: 160 }}
        >
          <button onClick={e => { e.stopPropagation(); navigate(`/tournaments/${tournament.id}/edit`); setOpen(false); }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-ink-300 hover:text-ink-100 hover:bg-ink-800/50 transition-colors">
            <Pencil className="w-4 h-4" strokeWidth={1.8} />
            Modifier
          </button>
          <button onClick={handleShare}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-ink-300 hover:text-ink-100 hover:bg-ink-800/50 transition-colors">
            <Share2 className="w-4 h-4" strokeWidth={1.8} />
            Partager
          </button>
          <div className="my-1 ink-divider" />
          <button onClick={handleDelete}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-300 hover:text-red-200 hover:bg-lorcana-ruby/10 transition-colors">
            <Trash2 className="w-4 h-4" strokeWidth={1.8} />
            Supprimer
          </button>
        </div>,
        document.body
      )}

      {/* Modale de partage avec QR code (identique au partage dans un tournoi) */}
      {shareModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={() => setShareModalOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full sm:max-w-sm bg-ink-900 border border-ink-700/50 rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-6" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShareModalOpen(false)}
              className="absolute top-3 right-3 p-2 rounded-lg text-ink-500 hover:text-ink-300 hover:bg-ink-800/50 transition-colors"
              aria-label="Fermer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-ink-100 truncate pr-6">Partager « {tournament.name} »</h3>
              {shareLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-400" />
                </div>
              ) : shareUrl ? (
                <>
                  <div className="flex justify-center">
                    <img src={getQrCodeUrl(shareUrl)} alt="QR Code" className="w-48 h-48 rounded-xl" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="flex-1 bg-ink-800/50 border border-ink-700/50 rounded-xl text-sm text-ink-300 px-3 py-2.5 focus:outline-none select-all"
                      onClick={e => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      onClick={handleCopyShareUrl}
                      className="shrink-0 px-3 py-2.5 rounded-xl bg-gold-500/20 text-gold-400 hover:bg-gold-500/30 text-sm font-medium transition-colors"
                    >
                      {shareCopied ? 'Copié !' : 'Copier'}
                    </button>
                  </div>
                  <p className="text-xs text-ink-500 text-center">
                    Toute personne avec ce lien pourra voir votre tournoi
                  </p>
                </>
              ) : null}
            </div>
          </div>
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
    <div className="ink-card-hover overflow-hidden group relative">
      {/* Toute la carte est cliquable (lien étiré) — le menu passe au-dessus */}
      <Link to={`/tournaments/${tournament.id}`} className="card-hit" aria-label={tournament.name} />
      <div className="p-4">
        {/* Line 1: name + placement medal + menu */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="font-display text-[0.95rem] tracking-[0.02em] text-ink-100 group-hover:text-gold-400 transition-colors truncate leading-tight flex-1">
            {tournament.name}
          </span>
          <div className="flex items-center gap-1.5 shrink-0 relative z-10">
            {tournament.placement && (
              <span className="ink-num text-xs text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded-full">
                #{tournament.placement}{tournament.playerCount ? `/${tournament.playerCount}` : ''}
              </span>
            )}
            <CardMenu tournament={tournament} onDeleted={onDeleted} />
          </div>
        </div>

        {/* Line 2: date · location */}
        <p className="text-xs text-ink-500 mb-3 flex items-center gap-1.5">
          <span className="ink-num">{date}</span>
          {tournament.location && (
            <><span className="text-ink-700">·</span><span className="truncate">{tournament.location}</span></>
          )}
        </p>

        {/* Line 3: deck + presence + format + record */}
        <div className="flex items-center justify-between gap-2">
          <DeckBadges colors={tournament.myDeckColors as any} />
          <div className="flex items-center gap-2.5 shrink-0">
            {presence && (
              <span className="flex items-center gap-1 text-xs text-lorcana-sapphire">
                <Users className="w-3.5 h-3.5" strokeWidth={2} />
                <span className="ink-num">{presence.count}</span>
              </span>
            )}
            <span className="text-[0.7rem] uppercase tracking-[0.08em] text-ink-500">{FORMAT_LABELS[tournament.format]}</span>
            {total > 0 && <RecordLine wins={wins} losses={losses} draws={draws} />}
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
    staleTime: 1000 * 30, // 30s
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

  return (
    <div className="space-y-6">
      <Reveal i={0} className="flex items-end justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="folio-title">Mes tournois</h1>
          {tournaments.length > 0 && <span className="ink-num text-sm text-ink-400 mb-1.5">{tournaments.length}</span>}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="touch-compact p-1.5 mb-1 rounded-md text-ink-500 hover:text-gold-400 hover:bg-ink-800/50 transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/50"
            aria-label="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} strokeWidth={2} />
          </button>
          <span className="mb-1"><HelpButton sections={['Tournois']} /></span>
        </div>
        <Link to="/tournaments/new" className="ink-btn-primary text-sm px-4 py-2 shrink-0 mb-1 inline-flex items-center gap-1.5"><Plus className="w-4 h-4" strokeWidth={2.2} /> Nouveau</Link>
      </Reveal>

      {isLoading ? (
        <SkeletonRows count={6} />
      ) : tournaments.length === 0 ? (
        <div className="section-wash flex flex-col items-center text-center py-12 gap-3">
          <span className="grid place-items-center w-14 h-14 rounded-2xl bg-gold-400/10 text-gold-400 shadow-edge-lit">
            <Trophy className="w-7 h-7" strokeWidth={1.6} />
          </span>
          <p className="font-display text-lg text-ink-50 tracking-[0.02em]">Aucun tournoi enregistré</p>
          <p className="text-sm text-ink-400 max-w-xs">Commencez par créer votre premier tournoi.</p>
          <Link to="/tournaments/new" className="ink-btn-primary inline-flex items-center gap-1.5 mt-1 px-6 py-2.5 text-sm">
            <Plus className="w-4 h-4" strokeWidth={2.2} /> Créer un tournoi
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tournaments.map((t, i) => (
            <Reveal key={t.id} i={i}>
              <TournamentCard
                tournament={t}
                presence={presence[t.id]}
                onDeleted={handleDeleted}
              />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
