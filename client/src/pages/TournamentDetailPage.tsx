import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getTournament, deleteTournament, updateTournament, shareTournament } from '../api/tournaments.api.js';
import { createRound, updateRound, deleteRound } from '../api/matches.api.js';
import { fetchEventInfo, fetchEventRounds, extractEventId } from '../api/ravensburger.api.js';
import type { RavensburgerEventInfo, EventRoundsData, EventRound, EventStanding, EventMatch } from '../api/ravensburger.api.js';
import { useAuth } from '../context/AuthContext.js';
import { DeckBadges, ScoutDeckBadges, ScoutPicker } from '../components/ui/InkBadge.js';
import { INK_COLORS_CONFIG } from '../lib/colors.js';
import { getEventScoutReports, upsertScoutReport, createPotentialDecks as createPotentialDecksApi } from '../api/scouting.api.js';
import { listMyTeams } from '../api/team.api.js';
import { INK_COLORS, getRecommendedSwissRounds, getRecommendedTopCut } from '@lorcana/shared';
import type { Tournament, Round, Game, MatchResult, ScoutReport, InkColor, Team, PotentialDeck } from '@lorcana/shared';
import { HelpButton } from '../components/ui/HelpButton.js';
import { exportTournamentImage } from '../lib/exportTournamentImage.js';
import { getQrCodeUrl } from '../lib/qrcode.js';

const FORMAT_LABELS: Record<string, string> = { BO1: 'Bo1', BO3: 'Bo3', BO5: 'Bo5' };
const TOPCUT_LABELS: Record<string, string> = { NONE: 'Aucun', TOP4: 'Top 4', TOP8: 'Top 8', TOP16: 'Top 16', TOP32: 'Top 32' };
const TOPCUT_VALUES: Record<string, number> = { TOP4: 4, TOP8: 8, TOP16: 16, TOP32: 32 };
const RESULT_STYLES: Record<string, { label: string; cls: string }> = {
  WIN: { label: 'V', cls: 'bg-green-500/15 text-green-400' },
  LOSS: { label: 'D', cls: 'bg-red-500/15 text-red-400' },
  DRAW: { label: 'N', cls: 'bg-ink-700/50 text-ink-400' },
};

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

function getTopCutThresholds(players: number, rounds: number, topCutSize: number): { safe: number; bubble: number } {
  let cumulative = 0;
  let safe = rounds;
  let bubble = rounds;
  for (let wins = rounds; wins >= 0; wins--) {
    const count = players * binomial(rounds, wins) / Math.pow(2, rounds);
    const prevCumulative = cumulative;
    cumulative += count;
    if (prevCumulative < topCutSize && cumulative <= topCutSize) {
      safe = wins;
    }
    if (prevCumulative < topCutSize && cumulative > topCutSize) {
      bubble = wins;
      break;
    }
  }
  return { safe, bubble };
}

type Tab = 'rounds' | 'bracket';

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('rounds');
  const [roundsScoutMap, setRoundsScoutMap] = useState<Map<string, ScoutReport>>(new Map());
  const [roundsPotentialDecks, setRoundsPotentialDecks] = useState<PotentialDeck[]>([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const { data: tournament = null, isLoading: loading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => getTournament(id!),
    enabled: !!id,
  });

  const reload = () => queryClient.invalidateQueries({ queryKey: ['tournament', id] });

  // Build scout map + load remote reports when tournament changes
  useEffect(() => {
    if (!tournament) return;

    const map = new Map<string, ScoutReport>();
    for (const r of (tournament.rounds || [])) {
      if (r.opponentName && r.opponentDeckColors && r.opponentDeckColors.length > 0) {
        const key = r.opponentName.toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            id: '', teamId: '', eventId: '', playerName: r.opponentName,
            deckColors: r.opponentDeckColors as InkColor[],
            reportedById: '', reportedBy: { id: '', username: 'moi' },
            createdAt: r.createdAt, updatedAt: r.updatedAt,
          });
        }
      }
    }
    setRoundsScoutMap(map);

    if (tournament.eventLink) {
      const eid = extractEventId(tournament.eventLink);
      if (eid) {
        getEventScoutReports(eid).then(({ reports, potentialDecks: pd }) => {
          const merged = new Map(map);
          for (const r of reports) merged.set(r.playerName.toLowerCase(), r);
          setRoundsScoutMap(merged);
          setRoundsPotentialDecks(pd);
        }).catch(() => {});
      }
    }
  }, [tournament]);

  // Auto-estimate placement from W/L record when no Play Hub link
  useEffect(() => {
    if (!tournament || !tournament.playerCount) return;
    const hasEvent = !!(tournament.eventLink && extractEventId(tournament.eventLink));
    if (hasEvent) return;
    const rounds = tournament.rounds || [];
    const w = rounds.filter(r => r.result === 'WIN').length;
    const l = rounds.filter(r => r.result === 'LOSS').length;
    const d = rounds.filter(r => r.result === 'DRAW').length;
    const totalPlayed = w + l + d;
    if (totalPlayed === 0) return;
    const myPoints = w * 3 + d;
    const maxPoints = totalPlayed * 3;
    const estimated = Math.max(1, Math.round(tournament.playerCount * (1 - myPoints / maxPoints) + 0.5));
    if (estimated !== tournament.placement) {
      updateTournament(id!, { placement: estimated }).then(() => reload()).catch(() => {});
    }
  }, [tournament]);

  // Build possibleDecks for "Mes rondes" from potentialDecks
  // For a player: if they have a certain ScoutReport, show that. Otherwise show all PotentialDecks where they appear.
  const roundsPossibleDecks = useMemo(() => {
    const pd = new Map<string, PotentialDeck[]>();
    for (const deck of roundsPotentialDecks) {
      const p1 = deck.player1Name.toLowerCase();
      const p2 = deck.player2Name.toLowerCase();
      // Only show potential decks if the player doesn't have a certain scout report
      if (!roundsScoutMap.has(p1) || roundsScoutMap.get(p1)!.id === '') {
        if (!pd.has(p1)) pd.set(p1, []);
        pd.get(p1)!.push(deck);
      }
      if (!roundsScoutMap.has(p2) || roundsScoutMap.get(p2)!.id === '') {
        if (!pd.has(p2)) pd.set(p2, []);
        pd.get(p2)!.push(deck);
      }
    }
    return pd;
  }, [roundsScoutMap, roundsPotentialDecks]);

  const handleDeleteTournament = async () => {
    if (!confirm('Supprimer ce tournoi et toutes ses rondes ?')) return;
    try {
      await deleteTournament(id!);
      navigate('/tournaments');
    } catch (err: any) {
      alert(`Erreur lors de la suppression : ${err?.response?.data?.error || err?.message || 'Erreur inconnue'}`);
    }
  };

  const handleShare = async () => {
    setShareModalOpen(true);
    if (shareUrl) return; // Already generated
    setShareLoading(true);
    try {
      const sid = await shareTournament(id!);
      const baseUrl = window.location.origin;
      setShareUrl(`${baseUrl}/t/${sid}`);
    } catch {
      // fail silently
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

  const handleDeleteRound = async (roundId: string) => {
    if (!confirm('Supprimer cette ronde ?')) return;
    await deleteRound(id!, roundId);
    reload();
  };

  const [refreshing, setRefreshing] = useState(false);
  const [syncData, setSyncData] = useState<RavensburgerEventInfo | null>(null);

  const handleRefreshEvent = async () => {
    if (!tournament?.eventLink) return;
    const eventId = extractEventId(tournament.eventLink);
    if (!eventId) return;

    setRefreshing(true);
    try {
      const info = await fetchEventInfo(eventId);
      setSyncData(info);
    } catch {
      // silently fail
    } finally {
      setRefreshing(false);
    }
  };

  const applySyncData = async () => {
    if (!syncData) return;
    const updates: Record<string, any> = {};
    if (syncData.name) updates.name = syncData.name;
    if (syncData.date) updates.date = syncData.date.split('T')[0];
    if (syncData.location) updates.location = syncData.location;
    if (syncData.playerCount) {
      updates.playerCount = syncData.playerCount;
      updates.swissRounds = syncData.swissRounds || getRecommendedSwissRounds(syncData.playerCount);
      updates.topCut = getRecommendedTopCut(syncData.playerCount);
    } else if (syncData.swissRounds) {
      updates.swissRounds = syncData.swissRounds;
    }
    if (Object.keys(updates).length > 0) {
      await updateTournament(id!, updates);
      reload();
    }
    setSyncData(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-400"></div>
      </div>
    );
  }

  if (!tournament) {
    return <div className="text-center py-20 text-ink-400">Tournoi non trouvé</div>;
  }

  const rounds = tournament.rounds || [];
  const swissRounds = rounds.filter(r => !r.isTopCut);
  const topCutRounds = rounds.filter(r => r.isTopCut);
  const wins = rounds.filter(r => r.result === 'WIN').length;
  const losses = rounds.filter(r => r.result === 'LOSS').length;
  const draws = rounds.filter(r => r.result === 'DRAW').length;

  const hasEventLink = !!(tournament.eventLink && extractEventId(tournament.eventLink));

  return (
    <div className="space-y-4">
      {/* Card principale du tournoi */}
      <div className="ink-card overflow-hidden">
        {/* Ligne du haut : nom + menu */}
        <div className="flex items-start justify-between gap-3 p-4 pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="min-w-0">
              <h1 className="font-display text-xl font-bold text-ink-100 tracking-wide truncate">{tournament.name}</h1>
              <p className="text-ink-500 text-xs mt-0.5">
                {new Date(tournament.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                {tournament.location && <span className="text-ink-600"> · {tournament.location}</span>}
              </p>
            </div>
            <HelpButton sections={['Tournois', 'Arbre du tournoi et scouting']} />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {hasEventLink && (
              <button
                onClick={handleRefreshEvent}
                disabled={refreshing}
                className="p-1.5 rounded-lg text-ink-500 hover:text-gold-400 transition-colors disabled:opacity-40"
                title="Rafraîchir les infos du tournoi"
              >
                <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            <DropdownMenu
              items={[
                { label: 'Partager', onClick: handleShare },
                { label: 'Exporter image', onClick: () => exportTournamentImage(tournament, user?.username || 'Joueur') },
                { label: 'Modifier', onClick: () => navigate(`/tournaments/${id}/edit`) },
                { label: 'Supprimer', onClick: handleDeleteTournament, danger: true },
              ]}
            />
          </div>
        </div>

        {/* Séparateur */}
        <div className="h-px bg-ink-800/60 mx-4" />

        {/* Grille de stats */}
        <div className="grid grid-cols-4 divide-x divide-ink-800/60 px-0">
          {/* Bilan */}
          <div className="flex flex-col items-center justify-center py-3 px-2 gap-0.5">
            <span className="text-xs text-ink-600 uppercase tracking-wider">Bilan</span>
            <span className="text-sm font-semibold">
              <span className="text-green-400">{wins}</span>
              <span className="text-ink-600 mx-0.5">-</span>
              <span className="text-red-400">{losses}</span>
              {draws > 0 && <><span className="text-ink-600 mx-0.5">-</span><span className="text-ink-400">{draws}</span></>}
            </span>
          </div>

          {/* Format */}
          <div className="flex flex-col items-center justify-center py-3 px-2 gap-0.5">
            <span className="text-xs text-ink-600 uppercase tracking-wider">Format</span>
            <span className="text-sm font-semibold text-ink-200">{FORMAT_LABELS[tournament.format]}</span>
          </div>

          {/* Joueurs */}
          <div className="flex flex-col items-center justify-center py-3 px-2 gap-0.5">
            <span className="text-xs text-ink-600 uppercase tracking-wider">Joueurs</span>
            <span className="text-sm font-semibold text-ink-200">{tournament.playerCount ?? '—'}</span>
          </div>

          {/* Classement ou Deck */}
          <div className="flex flex-col items-center justify-center py-3 px-2 gap-0.5">
            {tournament.placement ? (
              <>
                <span className="text-xs text-ink-600 uppercase tracking-wider">Classement</span>
                <span className="text-sm font-bold text-gold-400">#{tournament.placement}</span>
              </>
            ) : tournament.myDeckColors?.length > 0 ? (
              <>
                <span className="text-xs text-ink-600 uppercase tracking-wider">Deck</span>
                {tournament.myDeckLink ? (
                  <a href={tournament.myDeckLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:opacity-80">
                    <DeckBadges colors={tournament.myDeckColors as any} />
                    <svg className="w-2.5 h-2.5 text-ink-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                ) : (
                  <DeckBadges colors={tournament.myDeckColors as any} />
                )}
              </>
            ) : (
              <>
                <span className="text-xs text-ink-600 uppercase tracking-wider">Deck</span>
                <span className="text-sm text-ink-600">—</span>
              </>
            )}
          </div>
        </div>

        {/* Notes si présentes */}
        {tournament.notes && (
          <>
            <div className="h-px bg-ink-800/60 mx-4" />
            <p className="px-4 py-3 text-xs text-ink-500">{tournament.notes}</p>
          </>
        )}
      </div>

      {/* Top Cut Progress */}
      {tournament.topCut !== 'NONE' && tournament.playerCount && tournament.swissRounds > 0 && (
        <TopCutProgress
          playerCount={tournament.playerCount}
          swissRounds={tournament.swissRounds}
          topCutSize={TOPCUT_VALUES[tournament.topCut] || 8}
          swissWins={swissRounds.filter(r => r.result === 'WIN').length}
          swissPlayed={swissRounds.filter(r => r.result).length}
        />
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-ink-800/50 sticky top-14 z-30 bg-ink-950/95 backdrop-blur-md -mx-3 sm:-mx-4 px-3 sm:px-4">
        <button
          onClick={() => setTab('rounds')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === 'rounds'
              ? 'text-gold-400 border-gold-500'
              : 'text-ink-400 border-transparent hover:text-ink-200'
          }`}
        >
          Mes rondes
        </button>
        <button
          onClick={() => setTab('bracket')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === 'bracket'
              ? 'text-gold-400 border-gold-500'
              : 'text-ink-400 border-transparent hover:text-ink-200'
          }`}
        >
          Arbre du tournoi
        </button>
      </div>

      {/* Tab content */}
      {tab === 'rounds' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="ink-section-title">Rondes</h2>
            <Link to={`/tournaments/${id}/rounds/new`} className="shrink-0 whitespace-nowrap text-sm font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-ink-950 hover:from-gold-400 hover:to-gold-300 transition-all">+ Ronde</Link>
          </div>

          {rounds.length === 0 ? (
            <div className="ink-card p-8 text-center text-ink-400">Aucune ronde enregistrée</div>
          ) : (
            <>
              {swissRounds.length > 0 && (
                <RoundsList title="Rondes suisses" rounds={swissRounds} tournamentId={id!} format={tournament.format} onDelete={handleDeleteRound} scoutMap={roundsScoutMap} possibleDecks={roundsPossibleDecks} />
              )}
              {topCutRounds.length > 0 && (
                <RoundsList title="Top Cut" rounds={topCutRounds} tournamentId={id!} format={tournament.format} onDelete={handleDeleteRound} scoutMap={roundsScoutMap} possibleDecks={roundsPossibleDecks} />
              )}
            </>
          )}

          {/* Teammate rounds from Play Hub */}
          {hasEventLink && (
            <TeammateRounds eventLink={tournament.eventLink!} myUsername={user?.username || ''} />
          )}
        </div>
      )}

      {tab === 'bracket' && (
        hasEventLink ? (
          <BracketTab
            eventLink={tournament.eventLink!}
            username={user?.username || ''}
            tournamentId={id!}
            existingRounds={rounds}
            onRoundsChanged={reload}
            currentPlacement={tournament.placement}
            playerCount={tournament.playerCount}
          />
        ) : (
          <LinkPlayHubPrompt tournamentId={id!} onLinked={reload} />
        )
      )}

      {/* Sync confirmation modal */}
      {/* Share modal with QR code */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={() => setShareModalOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full sm:max-w-sm bg-ink-900 border border-ink-700/50 rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-6" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShareModalOpen(false)}
              className="absolute top-3 right-3 p-2 rounded-lg text-ink-500 hover:text-ink-300 hover:bg-ink-800/50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="space-y-4">
              <h3 className="text-base font-semibold text-ink-100">Partager ce tournoi</h3>

              {shareLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-400" />
                </div>
              ) : shareUrl ? (
                <>
                  {/* QR Code */}
                  <div className="flex justify-center">
                    <img
                      src={getQrCodeUrl(shareUrl)}
                      alt="QR Code"
                      className="w-48 h-48 rounded-xl"
                    />
                  </div>

                  {/* URL + copy */}
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
              ) : (
                <p className="text-sm text-red-400 text-center py-4">Erreur lors de la génération du lien</p>
              )}
            </div>
          </div>
        </div>
      )}

      {syncData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 backdrop-blur-sm px-4">
          <div className="ink-card p-5 sm:p-6 max-w-md w-full space-y-4">
            <h3 className="font-display font-bold text-ink-100 text-lg">Synchroniser les informations ?</h3>
            <p className="text-sm text-ink-400">Données récupérées depuis Ravensburger Play Hub :</p>
            <div className="space-y-2 text-sm">
              {syncData.name && syncData.name !== tournament.name && (
                <SyncDiffRow label="Nom" current={tournament.name} incoming={syncData.name} />
              )}
              {syncData.date && syncData.date.split('T')[0] !== tournament.date.split('T')[0] && (
                <SyncDiffRow label="Date" current={tournament.date.split('T')[0]} incoming={syncData.date.split('T')[0]} />
              )}
              {syncData.location && syncData.location !== (tournament.location || '') && (
                <SyncDiffRow label="Lieu" current={tournament.location || '—'} incoming={syncData.location} />
              )}
              {syncData.playerCount && syncData.playerCount !== tournament.playerCount && (
                <SyncDiffRow label="Joueurs" current={String(tournament.playerCount ?? '—')} incoming={String(syncData.playerCount)} />
              )}
              {syncData.swissRounds && syncData.swissRounds !== tournament.swissRounds && (
                <SyncDiffRow label="Rondes" current={String(tournament.swissRounds)} incoming={String(syncData.swissRounds)} />
              )}
              {!(
                (syncData.name && syncData.name !== tournament.name) ||
                (syncData.date && syncData.date.split('T')[0] !== tournament.date.split('T')[0]) ||
                (syncData.location && syncData.location !== (tournament.location || '')) ||
                (syncData.playerCount && syncData.playerCount !== tournament.playerCount) ||
                (syncData.swissRounds && syncData.swissRounds !== tournament.swissRounds)
              ) && (
                <p className="text-ink-500 text-center py-2">Aucune modification détectée.</p>
              )}
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={applySyncData} className="flex-1 ink-btn-primary text-sm">Appliquer</button>
              <button onClick={() => setSyncData(null)} className="ink-btn-secondary text-sm">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Username Mismatch Banner ─── */

function UsernameMismatchBanner({ username, overrideUsername, allPlayerNames, onSelect, onReset }: {
  username: string;
  overrideUsername: string | null;
  allPlayerNames: string[];
  onSelect: (name: string) => void;
  onReset: () => void;
}) {
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = search.length > 0
    ? allPlayerNames.filter(n => n.toLowerCase().includes(search.toLowerCase()))
    : allPlayerNames;

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const handleSelect = (name: string) => {
    onSelect(name);
    setSearch('');
    setShowSuggestions(false);
  };

  return (
    <div className="ink-card p-4 border-amber-500/20 space-y-3">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div className="flex-1">
          <p className="text-sm text-ink-200">
            Pseudo <strong className="text-amber-400">&quot;{overrideUsername || username}&quot;</strong> non trouvé dans ce tournoi.
          </p>
          <p className="text-xs text-ink-500 mt-1">
            Votre pseudo Play Hub est peut-être différent. Sélectionnez votre nom dans la liste des participants :
          </p>
        </div>
      </div>

      <div className="relative" ref={containerRef}>
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Rechercher votre pseudo Play Hub..."
          className="w-full bg-ink-900/50 border border-ink-700/50 rounded-lg px-3 py-2 text-sm text-ink-100 placeholder:text-ink-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/25"
        />
        {showSuggestions && filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-ink-900 border border-ink-700/50 rounded-lg shadow-xl z-50">
            {filtered.map(name => (
              <button
                key={name}
                onClick={() => handleSelect(name)}
                className="w-full text-left px-3 py-2 text-sm text-ink-300 hover:text-ink-100 hover:bg-ink-800/50 transition-colors"
              >
                {name}
              </button>
            ))}
          </div>
        )}
        {showSuggestions && search.length > 0 && filtered.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-ink-900 border border-ink-700/50 rounded-lg shadow-xl z-50 p-3 text-sm text-ink-500 text-center">
            Aucun joueur trouvé
          </div>
        )}
      </div>

      {overrideUsername && (
        <button onClick={onReset} className="text-xs text-ink-500 hover:text-ink-300 transition-colors">
          ← Revenir à mon pseudo ({username})
        </button>
      )}
    </div>
  );
}

/* ─── Bracket Tab ─── */

/** Extract my match info from a Play Hub round */
function findMyMatch(matches: EventMatch[], username: string): {
  opponentName: string;
  result: MatchResult;
  gamesWon: number;
  gamesLost: number;
  isBye: boolean;
} | null {
  const lower = username.toLowerCase();
  for (const m of matches) {
    const meIdx = m.players.findIndex(p => p.playerName.toLowerCase() === lower);
    if (meIdx === -1) continue;

    if (m.isBye) {
      return { opponentName: 'BYE', result: 'WIN', gamesWon: 2, gamesLost: 0, isBye: true };
    }

    const opponent = m.players[meIdx === 0 ? 1 : 0];
    const iWon = m.winnerId === m.players[meIdx].playerId;
    const isDraw = m.isDraw;

    let result: MatchResult;
    if (isDraw) result = 'DRAW';
    else if (iWon) result = 'WIN';
    else result = 'LOSS';

    return {
      opponentName: opponent?.playerName || 'Inconnu',
      result,
      gamesWon: iWon ? (m.gamesWonByWinner ?? 0) : (m.gamesWonByLoser ?? 0),
      gamesLost: iWon ? (m.gamesWonByLoser ?? 0) : (m.gamesWonByWinner ?? 0),
      isBye: false,
    };
  }
  return null;
}

function LinkPlayHubPrompt({ tournamentId, onLinked }: { tournamentId: string; onLinked: () => void }) {
  const [link, setLink] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const eventId = extractEventId(link);
    if (!eventId) {
      setError('URL invalide. Exemple : https://tcg.ravensburgerplay.com/events/427780');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await updateTournament(tournamentId, { eventLink: link } as any);
      onLinked();
    } catch {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4">
      <div className="ink-card p-6 sm:p-8 max-w-md w-full space-y-5 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-ink-800/60 flex items-center justify-center">
          <svg className="w-7 h-7 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.562a4.5 4.5 0 00-6.364-6.364L4.5 8.244" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-ink-100">Connecter le Play Hub</h3>
          <p className="text-sm text-ink-400 mt-2 leading-relaxed">
            Ajoutez le lien de votre tournoi Ravensburger Play Hub pour charger l'arbre du tournoi, les classements et activer le scouting.
          </p>
        </div>

        <div className="space-y-3 text-left">
          {error && <div className="ink-error text-xs">{error}</div>}
          <div>
            <label className="ink-label">Lien du tournoi</label>
            <input
              type="url"
              value={link}
              onChange={e => { setLink(e.target.value); setError(''); }}
              placeholder="https://tcg.ravensburgerplay.com/events/..."
              className="ink-input text-sm"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={!link.trim() || saving}
            className="w-full ink-btn-primary py-2.5 text-sm"
          >
            {saving ? 'Connexion...' : 'Connecter'}
          </button>
        </div>

        <p className="text-[11px] text-ink-600 leading-relaxed">
          Retrouvez vos tournois sur{' '}
          <a href="https://tcg.ravensburgerplay.com/my-events" target="_blank" rel="noopener noreferrer" className="text-ink-400 hover:text-gold-400 transition-colors underline">
            tcg.ravensburgerplay.com
          </a>
        </p>
      </div>
    </div>
  );
}

function BracketTab({ eventLink, username, tournamentId, existingRounds, onRoundsChanged, currentPlacement, playerCount }: {
  eventLink: string;
  username: string;
  tournamentId: string;
  existingRounds: Round[];
  onRoundsChanged: () => void;
  currentPlacement: number | null;
  playerCount: number | null;
}) {
  const eventId = extractEventId(eventLink)!;
  const bracketQueryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'standings' | 'matches'>('standings');
  const [scoutReports, setScoutReports] = useState<ScoutReport[]>([]);
  const [potentialDecks, setPotentialDecks] = useState<PotentialDeck[]>([]);
  const [overrideUsername, setOverrideUsername] = useState<string | null>(null);
  const [teamFilter, setTeamFilter] = useState(false);

  const { data: data = null, isLoading: loadingPlayHub } = useQuery({
    queryKey: ['event-rounds', eventId],
    queryFn: () => fetchEventRounds(eventId),
    enabled: !!eventId,
  });

  const { data: scoutData, isLoading: loadingDb } = useQuery({
    queryKey: ['event-scouts', eventId],
    queryFn: () => getEventScoutReports(eventId).catch(() => ({ reports: [] as ScoutReport[], potentialDecks: [] as PotentialDeck[] })),
    enabled: !!eventId,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['my-teams'],
    queryFn: () => listMyTeams().catch(() => [] as Team[]),
  });

  // Sync scout data from query into local state (needed for optimistic updates)
  useEffect(() => {
    if (scoutData) {
      setScoutReports(scoutData.reports);
      setPotentialDecks(scoutData.potentialDecks);
    }
  }, [scoutData]);

  const effectiveUsername = overrideUsername || username;

  // Build set of all team member usernames (lowercase) — always available for highlighting
  // Exclude the current user so they don't appear as a "teammate" in their own tournament
  const allTeamMemberNames = useMemo(() => {
    if (teams.length === 0) return null;
    const self = effectiveUsername?.toLowerCase();
    const names = new Set<string>();
    for (const t of teams) {
      if (t.members) {
        for (const m of t.members) {
          const name = m.user.username.toLowerCase();
          if (name !== self) names.add(name);
        }
      }
    }
    return names.size > 0 ? names : null;
  }, [teams, effectiveUsername]);

  // When filter is active, use the same set for filtering; otherwise null (no filtering)
  const teamMemberNames = teamFilter ? allTeamMemberNames : null;

  // Build a lookup map: playerName (lowercase) -> ScoutReport (certain decks only)
  const scoutMap = new Map<string, ScoutReport>();
  for (const r of existingRounds) {
    if (r.opponentName && r.opponentDeckColors && r.opponentDeckColors.length > 0) {
      const key = r.opponentName.toLowerCase();
      if (!scoutMap.has(key)) {
        scoutMap.set(key, {
          id: '',
          teamId: '',
          eventId,
          playerName: r.opponentName,
          deckColors: r.opponentDeckColors as InkColor[],
          reportedById: '',
          reportedBy: { id: '', username: username || 'moi' },
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        });
      }
    }
  }
  for (const r of scoutReports) {
    scoutMap.set(r.playerName.toLowerCase(), r);
  }

  // Build possibleDecks from PotentialDeck records
  // For each player: show potential decks only if no certain ScoutReport exists
  const possibleDecks = useMemo(() => {
    const pd = new Map<string, PotentialDeck[]>();
    for (const deck of potentialDecks) {
      const p1 = deck.player1Name.toLowerCase();
      const p2 = deck.player2Name.toLowerCase();
      if (!scoutMap.has(p1) || scoutMap.get(p1)!.id === '') {
        if (!pd.has(p1)) pd.set(p1, []);
        pd.get(p1)!.push(deck);
      }
      if (!scoutMap.has(p2) || scoutMap.get(p2)!.id === '') {
        if (!pd.has(p2)) pd.set(p2, []);
        pd.get(p2)!.push(deck);
      }
    }
    return pd;
  }, [potentialDecks, scoutReports, existingRounds]);

  // Set default selected round when data loads
  useEffect(() => {
    if (!data || data.rounds.length === 0) return;
    const completedRounds = data.rounds.filter(r => r.status === 'COMPLETE');
    const defaultRound = completedRounds.length > 0
      ? completedRounds[completedRounds.length - 1].roundNumber
      : data.rounds[data.rounds.length - 1].roundNumber;
    setSelectedRound(prev => prev ?? defaultRound);
  }, [data]);

  const loadRounds = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
      try {
        const result = await fetchEventRounds(eventId, true);
        bracketQueryClient.setQueryData(['event-rounds', eventId], result);
      } finally {
        setRefreshing(false);
      }
    }
  }, [eventId, bracketQueryClient]);

  // Auto-calculate placement from Play Hub standings
  useEffect(() => {
    if (!data || !effectiveUsername) return;
    const completedRounds = data.rounds.filter(r => r.status === 'COMPLETE');
    if (completedRounds.length === 0) return;
    const lastRound = completedRounds[completedRounds.length - 1];
    if (!lastRound.standings || lastRound.standings.length === 0) return;
    const me = lastRound.standings.find(s => s.playerName.toLowerCase() === effectiveUsername.toLowerCase());
    if (!me) return;
    const rank = me.rank;
    if (rank && rank !== currentPlacement) {
      const updates: Record<string, any> = { placement: rank };
      if (!playerCount && lastRound.standings.length > 0) {
        updates.playerCount = lastRound.standings.length;
      }
      updateTournament(tournamentId, updates).then(() => onRoundsChanged()).catch(() => {});
    }
  }, [data, effectiveUsername, currentPlacement, playerCount, tournamentId, onRoundsChanged]);

  const handleScout: ScoutHandler = async (playerName, colors, teamId) => {
    const { report, deduced } = await upsertScoutReport({ teamId, eventId, playerName, deckColors: colors });
    setScoutReports(prev => {
      let next = prev.filter(r => r.playerName.toLowerCase() !== playerName.toLowerCase());
      // Also merge deduced reports from cascade
      for (const d of deduced) {
        next = next.filter(r => r.playerName.toLowerCase() !== d.playerName.toLowerCase());
      }
      return [...next, report, ...deduced];
    });
  };

  const handlePotentialDecks: PotentialDecksHandler = async (teamId, roundNumber, tableNumber, player1Name, player2Name, decks) => {
    const results = await createPotentialDecksApi({ teamId, eventId, roundNumber, tableNumber, player1Name, player2Name, decks });
    setPotentialDecks(prev => {
      // Remove old entries for this table/round, add new ones
      const filtered = prev.filter(d => !(d.roundNumber === roundNumber && d.tableNumber === tableNumber));
      return [...filtered, ...results];
    });
  };

  // Compute sync diff
  // Compute top cut round number offset (top cut rounds continue numbering from swiss)
  const topCutOffset = data ? Math.max(0, ...data.rounds.filter(r => r.roundType === 'SWISS').map(r => r.roundNumber)) : 0;

  const syncDiff = data && effectiveUsername ? data.rounds
    .filter(r => r.status === 'COMPLETE')
    .map(r => {
      const isTopCut = r.roundType !== 'SWISS';
      const myMatch = findMyMatch(r.matches, effectiveUsername);
      if (!myMatch) return null;
      // Top cut rounds: renumber starting from 1
      const roundNumber = isTopCut ? r.roundNumber - topCutOffset : r.roundNumber;
      if (roundNumber <= 0) return null;
      const existing = existingRounds.find(er => er.roundNumber === roundNumber && er.isTopCut === isTopCut);
      const needsCreate = !existing;
      // Also check if games score differs
      const existingGamesWon = existing?.games?.filter(g => g.result === 'WIN').length ?? 0;
      const existingGamesLost = existing?.games?.filter(g => g.result === 'LOSS').length ?? 0;
      const scoresDiffer = existing && (existingGamesWon !== myMatch.gamesWon || existingGamesLost !== myMatch.gamesLost);
      const needsUpdate = existing && (
        existing.result !== myMatch.result ||
        (existing.opponentName || '') !== myMatch.opponentName ||
        scoresDiffer
      );
      if (!needsCreate && !needsUpdate) return null;
      return {
        roundNumber,
        isTopCut,
        opponentName: myMatch.opponentName,
        result: myMatch.result,
        gamesWon: myMatch.gamesWon,
        gamesLost: myMatch.gamesLost,
        isBye: myMatch.isBye,
        existingRoundId: existing?.id,
        action: needsCreate ? 'create' as const : 'update' as const,
      };
    })
    .filter(Boolean) as Array<{
      roundNumber: number; isTopCut: boolean; opponentName: string; result: MatchResult;
      gamesWon: number; gamesLost: number; isBye: boolean;
      existingRoundId?: string; action: 'create' | 'update';
    }>
  : [];

  const handleSyncRounds = async () => {
    if (syncDiff.length === 0) return;
    setSyncing(true);
    try {
      for (const diff of syncDiff) {
        const payload = {
          roundNumber: diff.roundNumber,
          isTopCut: diff.isTopCut,
          opponentName: diff.opponentName,
          result: diff.result,
          games: diff.isBye ? undefined : (() => {
            const games: { gameNumber: number; result: MatchResult; myScore: number; opponentScore: number }[] = [];
            let gameNum = 1;
            // Add won games first, then lost games
            for (let i = 0; i < diff.gamesWon; i++) {
              games.push({ gameNumber: gameNum++, result: 'WIN', myScore: 20, opponentScore: 0 });
            }
            for (let i = 0; i < diff.gamesLost; i++) {
              games.push({ gameNumber: gameNum++, result: 'LOSS', myScore: 0, opponentScore: 20 });
            }
            return games.length > 0 ? games : [{ gameNumber: 1, result: diff.result, myScore: diff.result === 'WIN' ? 20 : 0, opponentScore: diff.result === 'LOSS' ? 20 : 0 }];
          })(),
        };

        if (diff.action === 'create') {
          await createRound(tournamentId, payload);
        } else if (diff.existingRoundId) {
          await updateRound(tournamentId, diff.existingRoundId, payload);
        }
      }
      onRoundsChanged();
    } catch {
      // silently fail
    } finally {
      setSyncing(false);
    }
  };

  if (loadingPlayHub || loadingDb) {
    return (
      <div className="space-y-3 py-6">
        <LoadingStep label="Chargement des données du tournoi" done={!loadingPlayHub} />
        <LoadingStep label="Chargement des rapports de scouting" done={!loadingDb} />
      </div>
    );
  }

  if (!data || data.rounds.length === 0) {
    return <div className="ink-card p-8 text-center text-ink-400">Aucune donnée de tournoi disponible</div>;
  }

  const currentRound = data.rounds.find(r => r.roundNumber === selectedRound) || data.rounds[data.rounds.length - 1];

  // Check if effectiveUsername was found in any match
  const userFound = effectiveUsername && data.rounds.some(r => r.matches.some(m => m.players.some(p => p.playerName.toLowerCase() === effectiveUsername.toLowerCase())));

  // Collect all unique player names from the tournament for autocomplete
  const allPlayerNames = data ? [...new Set(data.rounds.flatMap(r => r.matches.flatMap(m => m.players.map(p => p.playerName))).filter(Boolean))].sort() : [];

  return (
    <div className="space-y-4">
      {/* Sync banner */}
      {userFound && syncDiff.length > 0 && (
        <div className="ink-card p-3 sm:p-4 border-gold-500/20 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-ink-200">
                {syncDiff.length} ronde{syncDiff.length > 1 ? 's' : ''} à synchroniser
              </p>
              <p className="text-xs text-ink-500 mt-0.5">
                Depuis le Play Hub ({effectiveUsername})
              </p>
            </div>
            <button
              onClick={handleSyncRounds}
              disabled={syncing}
              className="ink-btn-primary text-sm px-4 py-2 shrink-0"
            >
              {syncing ? 'Synchronisation...' : 'Synchroniser'}
            </button>
          </div>
          <div className="space-y-1">
            {syncDiff.map(d => (
              <div key={`${d.isTopCut ? 'tc' : 'sw'}-${d.roundNumber}`} className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-ink-900/50">
                <span className="text-ink-400">
                  {d.isTopCut ? 'TC' : 'R'}{d.roundNumber} vs <span className="text-ink-200">{d.opponentName}</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className={d.result === 'WIN' ? 'text-green-400' : d.result === 'LOSS' ? 'text-red-400' : 'text-ink-400'}>
                    {d.result === 'WIN' ? 'V' : d.result === 'LOSS' ? 'D' : 'N'} {d.gamesWon}-{d.gamesLost}
                  </span>
                  <span className="text-ink-600">
                    {d.action === 'create' ? '+ nouveau' : '↺ mise à jour'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {userFound === false && effectiveUsername && (
        <UsernameMismatchBanner
          username={username}
          overrideUsername={overrideUsername}
          allPlayerNames={allPlayerNames}
          onSelect={setOverrideUsername}
          onReset={() => setOverrideUsername(null)}
        />
      )}

      {/* View mode toggle */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setViewMode('standings')}
          className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'standings' ? 'bg-ink-700/50 text-ink-100' : 'text-ink-500 hover:text-ink-300'
          }`}
        >
          Classement
        </button>
        <button
          onClick={() => setViewMode('matches')}
          className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'matches' ? 'bg-ink-700/50 text-ink-100' : 'text-ink-500 hover:text-ink-300'
          }`}
        >
          Matchs
        </button>

        {teams.length > 0 && (
          <>
            <div className="w-px h-5 bg-ink-800 mx-0.5" />
            <button
              onClick={() => setTeamFilter(!teamFilter)}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                teamFilter ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30' : 'text-ink-500 hover:text-ink-300'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Mon équipe
            </button>
          </>
        )}
      </div>

      {/* Round filter + refresh */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {[...data.rounds].reverse().map(r => (
            <button
              key={r.roundId}
              onClick={() => setSelectedRound(r.roundNumber)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                r.roundNumber === currentRound.roundNumber
                  ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30'
                  : 'text-ink-400 hover:text-ink-200 bg-ink-800/50 hover:bg-ink-700/50'
              }`}
            >
              R{r.roundNumber}
              {r.status !== 'COMPLETE' && <span className="ml-1 text-[10px] text-ink-500">●</span>}
            </button>
          ))}
        </div>
        <button
          onClick={() => loadRounds(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-gold-400 transition-colors disabled:opacity-50 shrink-0"
        >
          <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {viewMode === 'standings' ? (
        <StandingsView standings={currentRound.standings} roundNumber={currentRound.roundNumber} username={effectiveUsername} scoutMap={scoutMap} possibleDecks={possibleDecks} teams={teams} eventId={eventId} onScout={handleScout} teamMemberNames={teamMemberNames} allTeamMemberNames={allTeamMemberNames} />
      ) : (
        <MatchesView matches={currentRound.matches} roundNumber={currentRound.roundNumber} username={effectiveUsername} scoutMap={scoutMap} possibleDecks={possibleDecks} teams={teams} eventId={eventId} onScout={handleScout} onPotentialDecks={handlePotentialDecks} teamMemberNames={teamMemberNames} allTeamMemberNames={allTeamMemberNames} />
      )}
    </div>
  );
}

const PAGE_SIZE = 50;

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 bg-ink-900/50 border border-ink-700/50 rounded-lg text-sm text-ink-100 placeholder-ink-600 focus:outline-none focus:border-gold-500/40 transition-colors"
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300 text-xs">
          &times;
        </button>
      )}
    </div>
  );
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-1.5 rounded-lg text-xs font-medium text-ink-400 hover:text-ink-200 bg-ink-800/50 hover:bg-ink-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        &larr;
      </button>
      <span className="text-xs text-ink-500">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-1.5 rounded-lg text-xs font-medium text-ink-400 hover:text-ink-200 bg-ink-800/50 hover:bg-ink-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        &rarr;
      </button>
    </div>
  );
}

type ScoutHandler = (playerName: string, colors: InkColor[], teamId: string | null) => Promise<void>;
type PotentialDecksHandler = (teamId: string | null, roundNumber: number, tableNumber: number, player1Name: string, player2Name: string, decks: InkColor[][]) => Promise<void>;

function StandingsView({ standings, roundNumber, username, scoutMap, possibleDecks, teams, eventId, onScout, teamMemberNames, allTeamMemberNames }: { standings: EventStanding[]; roundNumber: number; username: string; scoutMap: Map<string, ScoutReport>; possibleDecks: Map<string, PotentialDeck[]>; teams: Team[]; eventId: string; onScout: ScoutHandler; teamMemberNames: Set<string> | null; allTeamMemberNames: Set<string> | null }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Reset page when search or team filter changes
  useEffect(() => { setPage(1); }, [search, teamMemberNames]);

  if (standings.length === 0) {
    return <div className="ink-card p-6 text-center text-ink-400">Aucun classement pour cette ronde</div>;
  }

  const isMe = (name: string) => username && name.toLowerCase() === username.toLowerCase();
  const isTeammate = (name: string) => allTeamMemberNames ? allTeamMemberNames.has(name.toLowerCase()) : false;
  const getScout = (name: string) => scoutMap.get(name.toLowerCase());

  const query = search.toLowerCase().trim();
  let filtered = query
    ? standings.filter(s => s.playerName.toLowerCase().includes(query))
    : standings;
  if (teamMemberNames) {
    filtered = filtered.filter(s => teamMemberNames.has(s.playerName.toLowerCase()));
  }

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-3">
      <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un joueur..." />

      {query && (
        <p className="text-xs text-ink-500">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</p>
      )}

      {/* Desktop table */}
      <div className="ink-card overflow-hidden hidden sm:block">
        <table className="w-full text-sm">
          <thead className="bg-ink-800/50 text-ink-400 uppercase text-xs">
            <tr>
              <th className="text-center px-3 py-2.5 w-12">#</th>
              <th className="text-left px-3 py-2.5">Joueur</th>
              <th className="text-center px-3 py-2.5">Bilan</th>
              <th className="text-center px-3 py-2.5">Pts</th>
              <th className="text-center px-3 py-2.5">R{roundNumber}</th>
              <th className="text-center px-3 py-2.5">OMW%</th>
              <th className="text-center px-3 py-2.5">GW%</th>
              <th className="text-center px-3 py-2.5">OGW%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800/50">
            {paginated.map((s, i) => {
              const me = isMe(s.playerName);
              const teammate = !me && isTeammate(s.playerName);
              const scout = getScout(s.playerName);
              return (
                <tr key={s.rank} className={me ? 'bg-gold-400/10 border-l-2 border-l-gold-400' : teammate ? 'bg-blue-500/5' : s.rank <= 3 ? 'bg-gold-400/5' : ''}>
                  <td className="text-center px-3 py-2.5 font-bold text-ink-500">{s.rank}</td>
                  <td className={`px-3 py-2.5 font-medium max-w-[250px] ${me ? 'text-gold-400' : teammate ? 'text-blue-400' : 'text-ink-100'}`}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{s.playerName}</span>
                      <ScoutDeckBadges scout={scout} possibleDecks={possibleDecks.get(s.playerName.toLowerCase())} />
                      <ScoutPicker playerName={s.playerName} teams={teams} eventId={eventId} existingColors={scout?.deckColors} onSaved={onScout} />
                    </div>
                  </td>
                  <td className="text-center px-3 py-2.5 text-ink-300 font-medium">{s.record}</td>
                  <td className="text-center px-3 py-2.5 text-gold-400 font-semibold">{s.totalPoints}</td>
                  <td className="text-center px-3 py-2.5 text-ink-400">{s.matchRecord}</td>
                  <td className="text-center px-3 py-2.5 text-ink-500 tabular-nums">{pct(s.omw)}</td>
                  <td className="text-center px-3 py-2.5 text-ink-500 tabular-nums">{pct(s.gw)}</td>
                  <td className="text-center px-3 py-2.5 text-ink-500 tabular-nums">{pct(s.ogw)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-1.5">
        {paginated.map((s, i) => {
          const me = isMe(s.playerName);
          const teammate = !me && isTeammate(s.playerName);
          const scout = getScout(s.playerName);
          return (
            <div key={s.rank} className={`ink-card px-3 py-2.5 flex items-center gap-3 ${me ? 'border-gold-500/30 bg-gold-400/5' : teammate ? 'border-blue-500/30 bg-blue-500/5' : s.rank <= 3 ? 'border-gold-500/20' : ''}`}>
              <span className="text-sm font-bold text-ink-500 w-6 text-center shrink-0">{s.rank}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`font-medium text-sm truncate ${me ? 'text-gold-400' : teammate ? 'text-blue-400' : 'text-ink-100'}`}>{s.playerName}</span>
                  <ScoutDeckBadges scout={scout} possibleDecks={possibleDecks.get(s.playerName.toLowerCase())} />
                  {teams.length > 0 && (
                    <ScoutPicker playerName={s.playerName} teams={teams} eventId={eventId} existingColors={scout?.deckColors} onSaved={onScout} />
                  )}
                </div>
                <div className="text-xs text-ink-500 mt-0.5">
                  R{roundNumber}: {s.matchRecord}
                  <span className="mx-1.5">·</span>
                  <span className="text-ink-400">OMW {pct(s.omw)}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-medium text-ink-300">{s.record}</div>
                <div className="text-xs font-semibold text-gold-400">{s.totalPoints} pts</div>
              </div>
            </div>
          );
        })}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

function MatchesView({ matches, roundNumber, username, scoutMap, possibleDecks, teams, eventId, onScout, onPotentialDecks, teamMemberNames, allTeamMemberNames }: { matches: EventMatch[]; roundNumber: number; username: string; scoutMap: Map<string, ScoutReport>; possibleDecks: Map<string, PotentialDeck[]>; teams: Team[]; eventId: string; onScout: ScoutHandler; onPotentialDecks: PotentialDecksHandler; teamMemberNames: Set<string> | null; allTeamMemberNames: Set<string> | null }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedMatch, setSelectedMatch] = useState<EventMatch | null>(null);

  useEffect(() => { setPage(1); }, [search, teamMemberNames]);

  if (matches.length === 0) {
    return <div className="ink-card p-6 text-center text-ink-400">Aucun match pour cette ronde</div>;
  }

  const isMe = (name: string) => username && name.toLowerCase() === username.toLowerCase();
  const isTeammate = (name: string) => allTeamMemberNames ? allTeamMemberNames.has(name.toLowerCase()) : false;
  const getScout = (name: string) => scoutMap.get(name.toLowerCase());

  // Sort so the user's match appears first, then teammates
  const sorted = username
    ? [...matches].sort((a, b) => {
        const aIsMe = a.players.some(p => isMe(p.playerName));
        const bIsMe = b.players.some(p => isMe(p.playerName));
        if (aIsMe !== bIsMe) return aIsMe ? -1 : 1;
        const aIsTeam = a.players.some(p => isTeammate(p.playerName));
        const bIsTeam = b.players.some(p => isTeammate(p.playerName));
        if (aIsTeam !== bIsTeam) return aIsTeam ? -1 : 1;
        return 0;
      })
    : matches;

  const query = search.toLowerCase().trim();
  let filtered = query
    ? sorted.filter(m => {
        if (m.players.some(p => p.playerName.toLowerCase().includes(query))) return true;
        if (m.table > 0 && `t${m.table}` === query) return true;
        if (m.table > 0 && String(m.table) === query) return true;
        return false;
      })
    : sorted;
  if (teamMemberNames) {
    filtered = filtered.filter(m => m.players.some(p => teamMemberNames.has(p.playerName.toLowerCase())));
  }

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-2">
      <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un joueur ou une table (ex: T12)..." />

      {query && (
        <p className="text-xs text-ink-500">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</p>
      )}

      {paginated.map(m => {
        const p1 = m.players[0];
        const p2 = m.players[1];
        const p1Wins = m.winnerId === p1?.playerId;
        const p2Wins = m.winnerId === p2?.playerId;
        const myMatch = m.players.some(p => isMe(p.playerName));
        const teamMatch = !myMatch && m.players.some(p => isTeammate(p.playerName));
        const scout1 = p1 ? getScout(p1.playerName) : undefined;
        const scout2 = p2 ? getScout(p2.playerName) : undefined;

        if (m.isBye) {
          const byeIsMe = isMe(p1?.playerName || '');
          const byeIsTeam = !byeIsMe && isTeammate(p1?.playerName || '');
          return (
            <div key={m.matchId} className={`ink-card px-3 sm:px-4 py-3 flex items-center justify-between ${byeIsMe ? 'border-gold-500/30 bg-gold-400/5' : byeIsTeam ? 'border-blue-500/30 bg-blue-500/5' : ''}`}>
              <div className="flex items-center gap-2">
                {m.table > 0 && <span className="text-xs text-ink-600">T{m.table}</span>}
                <span className={`font-medium text-sm ${byeIsMe ? 'text-gold-400' : byeIsTeam ? 'text-blue-400' : 'text-ink-100'}`}>{p1?.playerName || 'Inconnu'}</span>
              </div>
              <span className="text-xs text-ink-500 bg-ink-800/50 px-2 py-0.5 rounded-full">BYE</span>
            </div>
          );
        }

        return (
          <div
            key={m.matchId}
            onClick={() => setSelectedMatch(m)}
            className={`ink-card px-3 sm:px-4 py-3 cursor-pointer transition-all hover:border-gold-500/25 ${myMatch ? 'border-gold-500/30 bg-gold-400/5' : teamMatch ? 'border-blue-500/30 bg-blue-500/5' : ''}`}
          >
            <div className="flex items-center gap-2">
              {m.table > 0 && <span className="text-xs text-ink-600 shrink-0 w-7">T{m.table}</span>}
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className={`text-sm truncate ${isMe(p1?.playerName || '') ? 'font-bold text-gold-400' : isTeammate(p1?.playerName || '') ? 'font-bold text-blue-400' : p1Wins ? 'font-bold text-green-400' : 'text-ink-300'}`}>
                      {p1?.playerName || 'Inconnu'}
                    </span>
                    {p1 && <ScoutDeckBadges scout={scout1} possibleDecks={possibleDecks.get(p1.playerName.toLowerCase())} />}
                  </div>
                </div>
                <span className="text-sm font-bold text-ink-500 shrink-0">
                  {m.isDraw ? 'Nul' : (
                    <>
                      <span className={p1Wins ? 'text-green-400' : 'text-ink-400'}>
                        {p1Wins ? m.gamesWonByWinner : m.gamesWonByLoser ?? 0}
                      </span>
                      <span className="text-ink-600 mx-0.5">–</span>
                      <span className={p2Wins ? 'text-green-400' : 'text-ink-400'}>
                        {p2Wins ? m.gamesWonByWinner : m.gamesWonByLoser ?? 0}
                      </span>
                    </>
                  )}
                </span>
                <div className="flex-1 min-w-0 text-right">
                  <div className="flex items-center gap-1 min-w-0 justify-end">
                    {p2 && <ScoutDeckBadges scout={scout2} possibleDecks={possibleDecks.get(p2.playerName.toLowerCase())} />}
                    <span className={`text-sm truncate ${isMe(p2?.playerName || '') ? 'font-bold text-gold-400' : isTeammate(p2?.playerName || '') ? 'font-bold text-blue-400' : p2Wins ? 'font-bold text-green-400' : 'text-ink-300'}`}>
                      {p2?.playerName || 'Inconnu'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Match detail modal */}
      {selectedMatch && (
        <MatchDetailModal
          match={selectedMatch}
          roundNumber={roundNumber}
          isMe={isMe}
          getScout={getScout}
          possibleDecks={possibleDecks}
          teams={teams}
          eventId={eventId}
          onScout={onScout}
          onPotentialDecks={onPotentialDecks}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
}

function MatchDetailModal({ match: m, roundNumber, isMe, getScout, possibleDecks, teams, eventId, onScout, onPotentialDecks, onClose }: {
  match: EventMatch;
  roundNumber: number;
  isMe: (name: string) => boolean | '';
  getScout: (name: string) => ScoutReport | undefined;
  possibleDecks: Map<string, PotentialDeck[]>;
  teams: Team[];
  eventId: string;
  onScout: ScoutHandler;
  onPotentialDecks: PotentialDecksHandler;
  onClose: () => void;
}) {
  const p1 = m.players[0];
  const p2 = m.players[1];
  const p1Name = p1?.playerName || 'Inconnu';
  const p2Name = p2?.playerName || 'Inconnu';
  const p1Wins = m.winnerId === p1?.playerId;
  const p2Wins = m.winnerId === p2?.playerId;
  const scout1 = p1 ? getScout(p1Name) : undefined;
  const scout2 = p2 ? getScout(p2Name) : undefined;
  const p1Potentials = possibleDecks.get(p1Name.toLowerCase()) || [];
  const p2Potentials = possibleDecks.get(p2Name.toLowerCase()) || [];

  // Rules for default checkbox state:
  // - No data at all → checked (uncertain)
  // - At least one certain deck → unchecked
  // - At least one player with potential decks → unchecked (we have info to refine)
  const hasCertainScout = (scout1?.deckColors?.length ?? 0) > 0 || (scout2?.deckColors?.length ?? 0) > 0;
  const hasPotentials = p1Potentials.length > 0 || p2Potentials.length > 0;
  const [uncertainMode, setUncertainMode] = useState(hasCertainScout || hasPotentials ? false : true);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={e => { e.stopPropagation(); onClose(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-md bg-ink-900 border border-ink-700/50 rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-lg text-ink-500 hover:text-ink-300 hover:bg-ink-800/50 transition-colors z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Score header */}
        <div className="text-center">
          {m.table > 0 && <p className="text-xs text-ink-500 mb-2">Table {m.table}</p>}
          <div className="flex items-center justify-center">
            {m.isDraw ? (
              <span className="text-xl font-bold text-ink-400">Nul</span>
            ) : (
              <>
                <span className={`text-2xl font-bold ${p1Wins ? 'text-green-400' : 'text-ink-400'}`}>
                  {p1Wins ? m.gamesWonByWinner : m.gamesWonByLoser ?? 0}
                </span>
                <span className="text-xl text-ink-600 mx-2">–</span>
                <span className={`text-2xl font-bold ${p2Wins ? 'text-green-400' : 'text-ink-400'}`}>
                  {p2Wins ? m.gamesWonByWinner : m.gamesWonByLoser ?? 0}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Mode toggle */}
        <button
          type="button"
          onClick={() => setUncertainMode(!uncertainMode)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
            uncertainMode
              ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
              : 'bg-ink-800/30 border border-ink-700/30 text-ink-500 hover:text-ink-300'
          }`}
        >
          <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
            uncertainMode ? 'border-amber-400 bg-amber-400' : 'border-ink-600'
          }`}>
            {uncertainMode && (
              <svg className="w-3 h-3 text-ink-950" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </span>
          Je ne sais pas qui joue quel deck
        </button>

        {uncertainMode ? (
          <UncertainDeckPicker
            p1Name={p1Name}
            p2Name={p2Name}
            existingPotentials={p1Potentials}
            teams={teams}
            roundNumber={roundNumber}
            tableNumber={m.table}
            onPotentialDecks={onPotentialDecks}
          />
        ) : (
          <>
            <InlineScoutSection
              name={p1Name}
              isWinner={p1Wins}
              isCurrentUser={!!isMe(p1Name)}
              scout={scout1}
              potentialDecks={p1Potentials}
              teams={teams}
              eventId={eventId}
              onScout={onScout}
            />
            <InlineScoutSection
              name={p2Name}
              isWinner={p2Wins}
              isCurrentUser={!!isMe(p2Name)}
              scout={scout2}
              potentialDecks={p2Potentials}
              teams={teams}
              eventId={eventId}
              onScout={onScout}
            />
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ── Color grid shared by InlineScoutSection and UncertainDeckPicker ── */
function ColorGrid({ colors, onToggle }: { colors: InkColor[]; onToggle: (c: InkColor) => void }) {
  return (
    <div className="grid grid-cols-6 gap-1">
      {INK_COLORS.map(color => {
        const config = INK_COLORS_CONFIG[color];
        const isSelected = colors.includes(color);
        const isDisabled = !isSelected && colors.length >= 2;
        const hex = config.hex;
        return (
          <button
            key={color}
            type="button"
            onClick={() => onToggle(color)}
            disabled={isDisabled}
            className="flex flex-col items-center gap-1 py-2 rounded-xl transition-all duration-200 active:scale-95"
            style={{
              opacity: isDisabled ? 0.2 : isSelected ? 1 : 0.45,
              background: isSelected ? `${hex}12` : 'transparent',
              border: `1px solid ${isSelected ? `${hex}50` : 'transparent'}`,
            }}
          >
            <svg viewBox="0 0 25.83 32" style={{ width: 22, height: 28, filter: isSelected ? `drop-shadow(0 0 5px ${hex}99)` : 'none', transition: 'filter 0.2s' }}>
              {isSelected ? (
                <>
                  <path d="M12.91 0 0 16l12.91 16 12.91-16Z" fill={hex} opacity="0.25" />
                  <path d="M12.91 0 0 16l12.91 16 12.91-16ZM1.28 16 12.91 1.59 24.54 16 12.91 30.41Z" fill={hex} />
                  <path d="m21.99 16-9.08 11.25L3.83 16l9.08-11.25Z" fill={hex} />
                </>
              ) : (
                <path d="M12.91 0 0 16l12.91 16 12.91-16ZM1.28 16 12.91 1.59 24.54 16 12.91 30.41Z" fill={hex} />
              )}
            </svg>
            <span style={{
              fontSize: '0.55rem',
              fontWeight: isSelected ? 600 : 400,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: isSelected ? hex : 'rgba(255,255,255,0.35)',
              transition: 'color 0.2s',
              lineHeight: 1,
            }}>
              {config.label.slice(0, 4)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Possible decks reference block ── */
function PossibleDecksRef({ decks }: { decks: PotentialDeck[] }) {
  if (decks.length === 0) return null;
  return (
    <div className="rounded-lg bg-amber-500/5 border border-amber-500/15 px-3 py-2 space-y-1.5">
      <p className="text-[11px] text-amber-400/80 font-medium">Decks potentiels</p>
      {decks.map((deck, i) => (
        <div key={deck.id || i} className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-ink-500 w-12 shrink-0">Deck {String.fromCharCode(65 + i)}</span>
            <div className="flex items-center gap-1">
              {(deck.deckColors as InkColor[]).filter(c => INK_COLORS_CONFIG[c]).map(c => {
                const hex = INK_COLORS_CONFIG[c].hex;
                return (
                  <svg key={c} viewBox="0 0 25.83 32" style={{ width: 12, height: 15, filter: `drop-shadow(0 0 2px ${hex}66)` }}>
                    <path d="M12.91 0 0 16l12.91 16 12.91-16Z" fill={hex} opacity="0.2" />
                    <path d="M12.91 0 0 16l12.91 16 12.91-16ZM1.28 16 12.91 1.59 24.54 16 12.91 30.41Z" fill={hex} />
                    <path d="m21.99 16-9.08 11.25L3.83 16l9.08-11.25Z" fill={hex} />
                  </svg>
                );
              })}
            </div>
          </div>
          <p className="text-[9px] text-ink-600 ml-14">
            R{deck.roundNumber} T{deck.tableNumber} · {deck.player1Name} vs {deck.player2Name} · par {deck.reportedBy.username}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ── Uncertain mode: two deck slots for the table ── */
function UncertainDeckPicker({ p1Name, p2Name, existingPotentials, teams, roundNumber, tableNumber, onPotentialDecks }: {
  p1Name: string;
  p2Name: string;
  existingPotentials: PotentialDeck[];
  teams: Team[];
  roundNumber: number;
  tableNumber: number;
  onPotentialDecks: PotentialDecksHandler;
}) {
  // Don't pre-fill color grids — user must select from scratch each time
  const [deckA, setDeckA] = useState<InkColor[]>([]);
  const [deckB, setDeckB] = useState<InkColor[]>([]);
  const [teamId] = useState(teams[0]?.id || null);
  const [saving, setSaving] = useState(false);

  const savingRef = useRef(false);
  const autoSave = async (a: InkColor[], b: InkColor[]) => {
    if (a.length !== 2 || b.length !== 2 || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await onPotentialDecks(teamId, roundNumber, tableNumber, p1Name, p2Name, [a, b]);
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  };

  const toggleA = (color: InkColor) => {
    let next: InkColor[];
    if (deckA.includes(color)) next = deckA.filter(c => c !== color);
    else if (deckA.length < 2) next = [...deckA, color];
    else return;
    setDeckA(next);
    autoSave(next, deckB);
  };
  const toggleB = (color: InkColor) => {
    let next: InkColor[];
    if (deckB.includes(color)) next = deckB.filter(c => c !== color);
    else if (deckB.length < 2) next = [...deckB, color];
    else return;
    setDeckB(next);
    autoSave(deckA, next);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-amber-400/80 italic">
        Qualifiez les deux decks de la table — ils seront marqués comme potentiels pour les deux joueurs.
      </p>

      {/* Existing potential decks reference */}
      {existingPotentials.length > 0 && <PossibleDecksRef decks={existingPotentials} />}

      {/* Deck A */}
      <div className="rounded-xl p-3.5 space-y-2.5 bg-ink-800/50 border border-ink-700/30">
        <p className="text-xs font-semibold text-ink-300">Deck A</p>
        <ColorGrid colors={deckA} onToggle={toggleA} />
      </div>

      {/* Deck B */}
      <div className="rounded-xl p-3.5 space-y-2.5 bg-ink-800/50 border border-ink-700/30">
        <p className="text-xs font-semibold text-ink-300">Deck B</p>
        <ColorGrid colors={deckB} onToggle={toggleB} />
      </div>

      {saving && (
        <p className="text-[10px] text-gold-400/60 text-center">Enregistrement...</p>
      )}
    </div>
  );
}

function InlineScoutSection({ name, isWinner, isCurrentUser, scout, potentialDecks, teams, eventId, onScout }: {
  name: string;
  isWinner: boolean;
  isCurrentUser: boolean;
  scout?: ScoutReport;
  potentialDecks: PotentialDeck[];
  teams: Team[];
  eventId: string;
  onScout: ScoutHandler;
}) {
  const existingColors = (scout?.deckColors || []) as InkColor[];
  const [colors, setColors] = useState<InkColor[]>(existingColors);
  const [teamId, setTeamId] = useState(teams[0]?.id || null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setColors((scout?.deckColors || []) as InkColor[]); }, [scout]);

  const savingRef = useRef(false);
  const autoSave = async (newColors: InkColor[]) => {
    if (newColors.length !== 2 || savingRef.current) return;
    const same = JSON.stringify(newColors.slice().sort()) === JSON.stringify(existingColors.slice().sort());
    if (same) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await onScout(name, newColors, teamId);
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  };

  const toggle = (color: InkColor) => {
    let next: InkColor[];
    if (colors.includes(color)) {
      next = colors.filter(c => c !== color);
    } else if (colors.length < 2) {
      next = [...colors, color];
    } else {
      return;
    }
    setColors(next);
    autoSave(next);
  };

  return (
    <div className={`rounded-xl p-3.5 space-y-3 ${isCurrentUser ? 'bg-gold-500/10 border border-gold-500/20' : 'bg-ink-800/50 border border-ink-700/30'}`}>
      {/* Player name */}
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium truncate ${isCurrentUser ? 'text-gold-400' : isWinner ? 'text-green-400 font-bold' : 'text-ink-200'}`}>
          {name}
        </span>
        {isWinner && (
          <span className="text-[10px] font-semibold text-green-400 bg-green-500/15 px-1.5 py-0.5 rounded-full shrink-0">V</span>
        )}
        {scout && existingColors.length > 0 && (
          <span className="text-[10px] text-ink-500 ml-auto shrink-0">par {scout.reportedBy.username}</span>
        )}
      </div>

      {/* Potential decks reference */}
      {potentialDecks.length > 0 && <PossibleDecksRef decks={potentialDecks} />}

      {/* Color picker */}
      <ColorGrid colors={colors} onToggle={toggle} />

      {teams.length > 1 && (
        <select
          value={teamId || ''}
          onChange={e => setTeamId(e.target.value || null)}
          className="w-full bg-ink-800/50 border border-ink-700/50 rounded-lg text-xs text-ink-200 px-2.5 py-2 focus:outline-none focus:border-gold-500/40"
        >
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      )}

      {saving && (
        <p className="text-[10px] text-gold-400/60 text-center">Enregistrement...</p>
      )}
    </div>
  );
}

function DropdownMenu({ items }: { items: { label: string; onClick: () => void; danger?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.right - 160 });
    }
    setOpen(o => !o);
  };

  return (
    <div className="relative shrink-0">
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="flex items-center justify-center w-8 h-8 rounded-lg bg-gold-500/15 text-gold-400 hover:bg-gold-500/25 transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[9999] bg-ink-900 border border-ink-700/50 rounded-xl shadow-xl shadow-ink-950/50 py-1 overflow-hidden"
          style={{ top: pos.top, left: pos.left, width: '160px' }}
        >
          {items.map(item => (
            <button
              key={item.label}
              type="button"
              onClick={e => { e.stopPropagation(); setOpen(false); item.onClick(); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                item.danger
                  ? 'text-lorcana-ruby/80 hover:bg-lorcana-ruby/10 hover:text-lorcana-ruby'
                  : 'text-ink-200 hover:bg-ink-800/50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

/* ─── Teammate Rounds ─── */
function TeammateRounds({ eventLink, myUsername }: { eventLink: string; myUsername: string }) {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const eventId = extractEventId(eventLink);

  const { data: teams = [] } = useQuery({
    queryKey: ['my-teams'],
    queryFn: () => listMyTeams().catch(() => [] as Team[]),
  });

  const { data: data = null, isLoading: loading } = useQuery({
    queryKey: ['event-rounds', eventId],
    queryFn: () => fetchEventRounds(eventId!).catch(() => null),
    enabled: !!eventId,
  });

  // Gather all teammate usernames (excluding me)
  const teammates = useMemo(() => {
    const names = new Set<string>();
    for (const t of teams) {
      if (t.members) {
        for (const m of t.members) {
          if (m.user.username.toLowerCase() !== myUsername.toLowerCase()) {
            names.add(m.user.username);
          }
        }
      }
    }
    return [...names].sort();
  }, [teams, myUsername]);

  // Find which teammates are in this tournament
  const allPlayerNames = useMemo(() => {
    if (!data) return new Set<string>();
    const names = new Set<string>();
    for (const round of data.rounds) {
      for (const m of round.matches) {
        for (const p of m.players) names.add(p.playerName.toLowerCase());
      }
    }
    return names;
  }, [data]);

  const presentTeammates = useMemo(() =>
    teammates.filter(t => allPlayerNames.has(t.toLowerCase())),
    [teammates, allPlayerNames]
  );

  // Find matches for the selected teammate across all rounds
  const teammateMatches = useMemo(() => {
    if (!selectedMember || !data) return [];
    const lowerName = selectedMember.toLowerCase();
    return data.rounds
      .filter(r => r.status === 'COMPLETED' || r.status === 'STARTED')
      .map(round => {
        const match = round.matches.find(m =>
          m.players.some(p => p.playerName.toLowerCase() === lowerName)
        );
        if (!match) return null;
        const me = match.players.find(p => p.playerName.toLowerCase() === lowerName)!;
        const opp = match.players.find(p => p.playerName.toLowerCase() !== lowerName);

        let result: 'WIN' | 'LOSS' | 'DRAW' | null = null;
        if (match.isBye) result = 'WIN';
        else if (match.isDraw) result = 'DRAW';
        else if (match.winnerId != null) {
          result = match.winnerId === me.playerId ? 'WIN' : 'LOSS';
        }

        return {
          roundNumber: round.roundNumber,
          roundType: round.roundType,
          phaseName: round.phaseName,
          table: match.table,
          opponentName: match.isBye ? 'BYE' : (opp?.playerName || '—'),
          result,
          gamesWon: match.winnerId === me.playerId ? match.gamesWonByWinner : match.gamesWonByLoser,
          gamesLost: match.winnerId === me.playerId ? match.gamesWonByLoser : match.gamesWonByWinner,
        };
      })
      .filter(Boolean) as {
        roundNumber: number;
        roundType: string;
        phaseName: string;
        table: number;
        opponentName: string;
        result: 'WIN' | 'LOSS' | 'DRAW' | null;
        gamesWon: number | null;
        gamesLost: number | null;
      }[];
  }, [selectedMember, data]);

  const wins = teammateMatches.filter(m => m.result === 'WIN').length;
  const losses = teammateMatches.filter(m => m.result === 'LOSS').length;
  const draws = teammateMatches.filter(m => m.result === 'DRAW').length;

  if (loading || presentTeammates.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="ink-section-title flex items-center gap-2">
        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        Rondes coéquipiers
      </h2>

      {/* Teammate selector */}
      <div className="flex gap-2 flex-wrap">
        {presentTeammates.map(name => (
          <button
            key={name}
            onClick={() => setSelectedMember(selectedMember === name ? null : name)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              selectedMember === name
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-ink-800/50 text-ink-400 border border-ink-700/30 hover:text-ink-200'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Selected teammate matches */}
      {selectedMember && (
        <div className="space-y-2">
          {/* Record summary */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-ink-900/50 text-sm">
            <span className="text-blue-400 font-medium">{selectedMember}</span>
            <span className="text-ink-600">—</span>
            <span className="text-green-400 font-bold">{wins}V</span>
            <span className="text-red-400 font-bold">{losses}D</span>
            {draws > 0 && <span className="text-ink-400 font-bold">{draws}N</span>}
          </div>

          {/* Match list */}
          <div className="space-y-1.5">
            {teammateMatches.map((m, i) => {
              const r = m.result ? RESULT_STYLES[m.result] : null;
              return (
                <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-ink-900/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-ink-500 font-medium w-8 shrink-0 text-center">
                      {m.roundType === 'SWISS' ? `R${m.roundNumber}` : `TC${m.roundNumber}`}
                    </span>
                    <span className="text-sm text-ink-200 truncate">{m.opponentName}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {m.gamesWon != null && m.gamesLost != null && (
                      <span className="text-xs text-ink-500">{m.gamesWon}-{m.gamesLost}</span>
                    )}
                    {r ? (
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${r.cls}`}>{r.label}</span>
                    ) : (
                      <span className="text-xs text-ink-600 px-2 py-1">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function pct(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${Math.round(value * 100)}%`;
}

function LoadingStep({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 ink-card">
      {done ? (
        <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <div className="w-5 h-5 shrink-0 animate-spin rounded-full border-2 border-ink-700 border-t-gold-400" />
      )}
      <span className={`text-sm ${done ? 'text-ink-400' : 'text-ink-200'}`}>{label}</span>
    </div>
  );
}

/* ─── Shared components ─── */

function SyncDiffRow({ label, current, incoming }: { label: string; current: string; incoming: string }) {
  return (
    <div className="flex items-start gap-3 py-1.5 px-3 rounded-lg bg-ink-900/50">
      <span className="text-ink-500 font-medium w-16 shrink-0">{label}</span>
      <div className="min-w-0 flex-1">
        <div className="text-red-400/70 line-through truncate text-xs">{current}</div>
        <div className="text-green-400 truncate">{incoming}</div>
      </div>
    </div>
  );
}

function TopCutProgress({ playerCount, swissRounds, topCutSize, swissWins, swissPlayed }: {
  playerCount: number; swissRounds: number; topCutSize: number; swissWins: number; swissPlayed: number;
}) {
  const { safe, bubble } = getTopCutThresholds(playerCount, swissRounds, topCutSize);
  const safePoints = safe * 3;
  const bubblePoints = bubble * 3;
  const currentPoints = swissWins * 3;
  const roundsLeft = swissRounds - swissPlayed;
  const maxPossiblePoints = currentPoints + roundsLeft * 3;

  const isSafe = currentPoints >= safePoints;
  const isBubble = !isSafe && currentPoints >= bubblePoints;
  const canReachSafe = maxPossiblePoints >= safePoints;
  const canReachBubble = maxPossiblePoints >= bubblePoints;
  const isEliminated = !canReachBubble && roundsLeft > 0;
  const tournamentDone = roundsLeft === 0;

  let statusLabel: string;
  let statusColor: string;
  if (isSafe) { statusLabel = 'Qualifié'; statusColor = 'text-green-400'; }
  else if (isBubble) { statusLabel = 'Bubble'; statusColor = 'text-gold-400'; }
  else if (isEliminated || tournamentDone) { statusLabel = 'Éliminé'; statusColor = 'text-red-400'; }
  else {
    statusLabel = canReachSafe ? `${safePoints - currentPoints} pts pour qualif. sûre` : `${bubblePoints - currentPoints} pts pour bubble`;
    statusColor = 'text-ink-400';
  }

  const maxPoints = swissRounds * 3;
  const progress = maxPoints > 0 ? Math.min(currentPoints / maxPoints, 1) : 1;
  const bubbleProgress = maxPoints > 0 ? bubblePoints / maxPoints : 0;
  const safeProgress = maxPoints > 0 ? safePoints / maxPoints : 0;
  const barColor = isSafe ? 'bg-green-500' : isBubble ? 'bg-gold-400' : isEliminated ? 'bg-red-400' : 'bg-lorcana-sapphire';
  const hasBubble = bubblePoints < safePoints;

  return (
    <div className="ink-card p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink-300">Top Cut — Top {topCutSize}</span>
        <span className={`text-sm font-semibold ${statusColor}`}>{statusLabel}</span>
      </div>
      <div className="relative h-4 rounded-full bg-ink-800/60 overflow-hidden border border-ink-700/30">
        {hasBubble && <div className="absolute inset-y-0 left-0 bg-gold-400/8" style={{ left: `${bubbleProgress * 100}%`, width: `${(safeProgress - bubbleProgress) * 100}%` }} />}
        <div className="absolute inset-y-0 bg-green-500/8" style={{ left: 0, width: `${bubbleProgress * 100}%` }} />
        <div className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${progress * 100}%`, opacity: 0.9 }} />
        {hasBubble && <div className="absolute inset-y-0 w-[2px] z-10" style={{ left: `${bubbleProgress * 100}%` }}><div className="w-full h-full bg-gold-400/50" /></div>}
        <div className="absolute inset-y-0 w-[2px] z-10" style={{ left: `${safeProgress * 100}%` }}><div className="w-full h-full bg-green-400/50" /></div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-ink-100 tabular-nums">{currentPoints} <span className="text-xs font-normal text-ink-500">pts</span></span>
        <div className="flex items-center gap-3 text-xs text-ink-500">
          {hasBubble && <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-gold-400/40 border border-gold-400/30 inline-block" />Bubble <span className="font-semibold text-gold-400 tabular-nums">{bubblePoints}</span></span>}
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-500/40 border border-green-500/30 inline-block" />Qualif. <span className="font-semibold text-green-400 tabular-nums">{safePoints}</span></span>
          <span className="text-ink-600 tabular-nums">/ {maxPoints}</span>
        </div>
      </div>
      {roundsLeft > 0 && !isSafe && !isEliminated && (
        <p className="text-xs text-ink-500">{roundsLeft} ronde{roundsLeft > 1 ? 's' : ''} restante{roundsLeft > 1 ? 's' : ''} — max atteignable : {maxPossiblePoints} pts</p>
      )}
    </div>
  );
}

function InfoCard({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={`ink-card p-2.5 sm:p-3 ${className ?? ''}`}>
      <p className="text-xs text-ink-500 mb-0.5 sm:mb-1">{label}</p>
      <div className="font-medium text-ink-100 text-sm">{value}</div>
    </div>
  );
}

function RoundsList({ title, rounds, tournamentId, format, onDelete, scoutMap, possibleDecks }: { title: string; rounds: Round[]; tournamentId: string; format: string; onDelete: (id: string) => void; scoutMap: Map<string, ScoutReport>; possibleDecks: Map<string, PotentialDeck[]> }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-ink-400">{title}</h3>
      {rounds.map(round => (
        <RoundCard key={round.id} round={round} tournamentId={tournamentId} format={format} onDelete={onDelete} scoutMap={scoutMap} possibleDecks={possibleDecks} />
      ))}
    </div>
  );
}

function RoundCard({ round, tournamentId, format, onDelete, scoutMap, possibleDecks }: { round: Round; tournamentId: string; format: string; onDelete: (id: string) => void; scoutMap: Map<string, ScoutReport>; possibleDecks: Map<string, PotentialDeck[]> }) {
  const navigate = useNavigate();
  const result = RESULT_STYLES[round.result];
  const games = round.games || [];
  const gamesWon = games.filter(g => g.result === 'WIN').length;
  const gamesLost = games.filter(g => g.result === 'LOSS').length;

  const scout = round.opponentName ? scoutMap.get(round.opponentName.toLowerCase()) : undefined;
  // Fallback: build a pseudo-scout from local round colors if no scout report exists
  const hasLocalColors = !scout && round.opponentDeckColors && round.opponentDeckColors.length > 0;
  const displayScout: ScoutReport | undefined = scout ?? (hasLocalColors ? {
    id: '', teamId: '', eventId: '', playerName: round.opponentName || '',
    deckColors: round.opponentDeckColors as InkColor[],
    reportedById: '', reportedBy: { id: '', username: 'moi' },
    createdAt: round.createdAt, updatedAt: round.updatedAt,
  } : undefined);

  return (
    <div className="ink-card overflow-hidden cursor-pointer transition-all duration-200 hover:border-gold-500/25" onClick={() => navigate(`/tournaments/${tournamentId}/rounds/${round.id}/edit`)}>
      <div className="px-3 sm:px-4 py-3 border-b border-ink-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-sm font-bold text-ink-500 shrink-0">R{round.roundNumber}</span>
            <span className="font-medium text-ink-100 truncate">{round.opponentName || 'Inconnu'}</span>
            <ScoutDeckBadges scout={displayScout} possibleDecks={round.opponentName ? possibleDecks.get(round.opponentName.toLowerCase()) : undefined} />
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {games.length > 0 && (
              <span className="font-bold text-base sm:text-lg">
                <span className="text-green-400">{gamesWon}</span>
                <span className="text-ink-600">–</span>
                <span className="text-red-400">{gamesLost}</span>
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${result.cls}`}>{result.label}</span>
            <DropdownMenu items={[
              { label: 'Modifier', onClick: () => navigate(`/tournaments/${tournamentId}/rounds/${round.id}/edit`) },
              { label: 'Supprimer', onClick: () => onDelete(round.id), danger: true },
            ]} />
          </div>
        </div>
      </div>
      {games.length > 0 && (
        <div className="px-3 sm:px-4 py-2 bg-ink-900/50">
          <div className="flex gap-2 sm:gap-3 flex-wrap">{games.map(game => <GameBadge key={game.id} game={game} />)}</div>
        </div>
      )}
      {round.notes && <div className="px-3 sm:px-4 py-2 text-xs text-ink-500 border-t border-ink-800/50">{round.notes}</div>}
      {round.photoUrl && <RoundPhoto photoUrl={round.photoUrl} />}
    </div>
  );
}

function RoundPhoto({ photoUrl }: { photoUrl: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <div
        className="px-3 sm:px-4 py-2 border-t border-ink-800/50 cursor-pointer"
        onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
      >
        <img src={photoUrl} alt="Photo de ronde" className="w-16 h-16 object-cover rounded-lg hover:opacity-80 transition-opacity" />
      </div>
      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
        >
          <img src={photoUrl} alt="Photo de ronde" className="max-w-full max-h-full object-contain rounded-xl" />
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}

function GameBadge({ game }: { game: Game }) {
  const result = RESULT_STYLES[game.result];
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs ${result.cls}`}>
      <span className="font-bold">G{game.gameNumber}</span>
      <span>{game.myScore}–{game.opponentScore}</span>
      {game.wentFirst !== null && <span className="text-[10px] opacity-70">{game.wentFirst ? '(1er)' : '(2nd)'}</span>}
    </div>
  );
}
