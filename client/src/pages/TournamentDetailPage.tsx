import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTournament, deleteTournament, updateTournament } from '../api/tournaments.api.js';
import { createRound, updateRound, deleteRound } from '../api/matches.api.js';
import { fetchEventInfo, fetchEventRounds, extractEventId } from '../api/ravensburger.api.js';
import type { RavensburgerEventInfo, EventRoundsData, EventRound, EventStanding, EventMatch } from '../api/ravensburger.api.js';
import { useAuth } from '../context/AuthContext.js';
import { DeckBadges, ScoutDeckBadges } from '../components/ui/InkBadge.js';
import { getEventScoutReports } from '../api/scouting.api.js';
import type { Tournament, Round, Game, MatchResult, ScoutReport, InkColor } from '@lorcana/shared';

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
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('rounds');
  const [roundsScoutMap, setRoundsScoutMap] = useState<Map<string, ScoutReport>>(new Map());

  const load = () => {
    getTournament(id!).then(t => {
      setTournament(t);

      // Build scout map from local round data + remote scout reports
      const map = new Map<string, ScoutReport>();
      // Local rounds as fallback
      for (const r of (t.rounds || [])) {
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

      // Load remote scout reports (override local)
      if (t.eventLink) {
        const eid = extractEventId(t.eventLink);
        if (eid) {
          getEventScoutReports(eid).then(reports => {
            const merged = new Map(map);
            for (const r of reports) merged.set(r.playerName.toLowerCase(), r);
            setRoundsScoutMap(merged);
          }).catch(() => {});
        }
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleDeleteTournament = async () => {
    if (!confirm('Supprimer ce tournoi et toutes ses rondes ?')) return;
    await deleteTournament(id!);
    navigate('/tournaments');
  };

  const handleDeleteRound = async (roundId: string) => {
    if (!confirm('Supprimer cette ronde ?')) return;
    await deleteRound(id!, roundId);
    load();
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
    if (syncData.playerCount) updates.playerCount = syncData.playerCount;
    if (syncData.swissRounds) updates.swissRounds = syncData.swissRounds;
    if (Object.keys(updates).length > 0) {
      await updateTournament(id!, updates);
      load();
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to="/tournaments" className="text-sm text-ink-500 hover:text-gold-400 transition-colors">&larr; Retour</Link>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-ink-100 tracking-wide mt-1 truncate">{tournament.name}</h1>
          <p className="text-ink-400 text-sm mt-1">
            {new Date(tournament.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {tournament.location && ` — ${tournament.location}`}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <a
              href={tournament.eventLink || 'https://tcg.ravensburgerplay.com/my-events'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-lorcana-sapphire hover:text-blue-300 transition-colors"
            >
              {tournament.eventLink ? 'Voir sur Ravensburger Play Hub' : 'Mes événements Ravensburger'}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
            {hasEventLink && (
              <button
                onClick={handleRefreshEvent}
                disabled={refreshing}
                className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-gold-400 transition-colors disabled:opacity-50"
                title="Rafraîchir les infos du tournoi"
              >
                <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? 'Mise à jour...' : 'Actualiser'}
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-6">
          <Link to={`/tournaments/${id}/edit`} className="text-sm text-ink-400 hover:text-gold-400 transition-colors">Modifier</Link>
          <button onClick={handleDeleteTournament} className="text-sm text-lorcana-ruby/70 hover:text-lorcana-ruby transition-colors">Supprimer</button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
        <InfoCard label="Deck" value={
          tournament.myDeckLink ? (
            <a href={tournament.myDeckLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:opacity-80">
              <DeckBadges colors={tournament.myDeckColors as any} />
              <svg className="w-3 h-3 text-ink-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          ) : (
            <DeckBadges colors={tournament.myDeckColors as any} />
          )
        } className="col-span-2 sm:col-span-1" />
        <InfoCard label="Format" value={FORMAT_LABELS[tournament.format]} />
        <InfoCard label="Bilan" value={
          <span className="text-sm">
            <span className="text-green-400">{wins}V</span>
            {' '}
            <span className="text-red-400">{losses}D</span>
            {draws > 0 && <>{' '}<span className="text-ink-400">{draws}N</span></>}
          </span>
        } />
        <InfoCard label="Top Cut" value={TOPCUT_LABELS[tournament.topCut]} className="hidden sm:block" />
        <InfoCard label="Joueurs" value={tournament.playerCount ?? '—'} className="hidden sm:block" />
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

      {tournament.placement && (
        <div className="ink-card p-3 sm:p-4 text-center text-sm border-gold-500/20">
          <span className="text-gold-400 font-medium">Classement final : #{tournament.placement}</span>
          {tournament.playerCount && (
            <span className="text-gold-500/70"> / {tournament.playerCount} joueurs</span>
          )}
        </div>
      )}

      {tournament.notes && (
        <div className="ink-card p-3 sm:p-4 text-sm text-ink-400">{tournament.notes}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-ink-800/50">
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
        {hasEventLink && (
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
        )}
      </div>

      {/* Tab content */}
      {tab === 'rounds' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="ink-section-title">Rondes</h2>
            <Link to={`/tournaments/${id}/rounds/new`} className="ink-btn-primary text-sm px-4 py-2">+ Ronde</Link>
          </div>

          {rounds.length === 0 ? (
            <div className="ink-card p-8 text-center text-ink-400">Aucune ronde enregistrée</div>
          ) : (
            <>
              {swissRounds.length > 0 && (
                <RoundsList title="Rondes suisses" rounds={swissRounds} tournamentId={id!} format={tournament.format} onDelete={handleDeleteRound} scoutMap={roundsScoutMap} />
              )}
              {topCutRounds.length > 0 && (
                <RoundsList title="Top Cut" rounds={topCutRounds} tournamentId={id!} format={tournament.format} onDelete={handleDeleteRound} scoutMap={roundsScoutMap} />
              )}
            </>
          )}
        </div>
      )}

      {tab === 'bracket' && hasEventLink && (
        <BracketTab
          eventLink={tournament.eventLink!}
          username={user?.username || ''}
          tournamentId={id!}
          existingRounds={rounds}
          onRoundsChanged={load}
        />
      )}

      {/* Sync confirmation modal */}
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

function BracketTab({ eventLink, username, tournamentId, existingRounds, onRoundsChanged }: {
  eventLink: string;
  username: string;
  tournamentId: string;
  existingRounds: Round[];
  onRoundsChanged: () => void;
}) {
  const eventId = extractEventId(eventLink)!;
  const [data, setData] = useState<EventRoundsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'standings' | 'matches'>('standings');
  const [scoutReports, setScoutReports] = useState<ScoutReport[]>([]);

  // Build a lookup map: playerName (lowercase) -> ScoutReport
  // Merge scout reports + local round opponentDeckColors as fallback
  const scoutMap = new Map<string, ScoutReport>();
  // First, add local round data as pseudo-reports
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
  // Then, scout reports override local data (more authoritative, from team)
  for (const r of scoutReports) {
    scoutMap.set(r.playerName.toLowerCase(), r);
  }

  const loadRounds = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      const result = await fetchEventRounds(eventId, refresh);
      setData(result);
      if (result.rounds.length > 0) {
        const completedRounds = result.rounds.filter(r => r.status === 'COMPLETE');
        const defaultRound = completedRounds.length > 0
          ? completedRounds[completedRounds.length - 1].roundNumber
          : result.rounds[result.rounds.length - 1].roundNumber;
        setSelectedRound(prev => prev ?? defaultRound);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventId]);

  useEffect(() => { loadRounds(); }, [loadRounds]);

  // Load scout reports
  useEffect(() => {
    getEventScoutReports(eventId).then(setScoutReports).catch(() => {});
  }, [eventId]);

  // Compute sync diff
  const syncDiff = data && username ? data.rounds
    .filter(r => r.status === 'COMPLETE' && r.roundType === 'SWISS')
    .map(r => {
      const myMatch = findMyMatch(r.matches, username);
      if (!myMatch) return null;
      const existing = existingRounds.find(er => er.roundNumber === r.roundNumber && !er.isTopCut);
      const needsCreate = !existing;
      const needsUpdate = existing && (
        existing.result !== myMatch.result ||
        (existing.opponentName || '') !== myMatch.opponentName
      );
      if (!needsCreate && !needsUpdate) return null;
      return {
        roundNumber: r.roundNumber,
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
      roundNumber: number; opponentName: string; result: MatchResult;
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
          isTopCut: false,
          opponentName: diff.opponentName,
          result: diff.result,
          games: diff.isBye ? undefined : [{
            gameNumber: 1,
            result: diff.result,
            myScore: diff.result === 'WIN' ? 20 : 0,
            opponentScore: diff.result === 'LOSS' ? 20 : 0,
          }, ...(diff.gamesWon + diff.gamesLost > 1 ? [{
            gameNumber: 2,
            result: (diff.gamesWon >= 2 ? 'WIN' : 'LOSS') as MatchResult,
            myScore: diff.gamesWon >= 2 ? 20 : 0,
            opponentScore: diff.gamesWon >= 2 ? 0 : 20,
          }] : []), ...(diff.gamesWon + diff.gamesLost > 2 ? [{
            gameNumber: 3,
            result: diff.result,
            myScore: diff.result === 'WIN' ? 20 : 0,
            opponentScore: diff.result === 'LOSS' ? 20 : 0,
          }] : [])],
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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-400"></div>
      </div>
    );
  }

  if (!data || data.rounds.length === 0) {
    return <div className="ink-card p-8 text-center text-ink-400">Aucune donnée de tournoi disponible</div>;
  }

  const currentRound = data.rounds.find(r => r.roundNumber === selectedRound) || data.rounds[data.rounds.length - 1];

  // Check if username was found in any match
  const userFound = username && data.rounds.some(r => r.matches.some(m => m.players.some(p => p.playerName.toLowerCase() === username.toLowerCase())));

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
                Depuis le Play Hub ({username})
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
              <div key={d.roundNumber} className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-ink-900/50">
                <span className="text-ink-400">
                  R{d.roundNumber} vs <span className="text-ink-200">{d.opponentName}</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className={d.result === 'WIN' ? 'text-green-400' : d.result === 'LOSS' ? 'text-red-400' : 'text-ink-400'}>
                    {d.result === 'WIN' ? 'V' : d.result === 'LOSS' ? 'D' : 'N'}
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

      {userFound === false && username && (
        <div className="ink-card p-3 text-sm text-ink-500 text-center">
          Pseudo &quot;{username}&quot; non trouvé dans ce tournoi. Vérifiez que votre pseudo InkTracker correspond à celui du Play Hub.
        </div>
      )}

      {/* Round filter + refresh */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {data.rounds.map(r => (
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

      {/* View mode toggle */}
      <div className="flex gap-1">
        <button
          onClick={() => setViewMode('standings')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            viewMode === 'standings' ? 'bg-ink-700/50 text-ink-100' : 'text-ink-500 hover:text-ink-300'
          }`}
        >
          Classement
        </button>
        <button
          onClick={() => setViewMode('matches')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            viewMode === 'matches' ? 'bg-ink-700/50 text-ink-100' : 'text-ink-500 hover:text-ink-300'
          }`}
        >
          Matchs
        </button>
      </div>

      {viewMode === 'standings' ? (
        <StandingsView standings={currentRound.standings} roundNumber={currentRound.roundNumber} username={username} scoutMap={scoutMap} />
      ) : (
        <MatchesView matches={currentRound.matches} roundNumber={currentRound.roundNumber} username={username} scoutMap={scoutMap} />
      )}
    </div>
  );
}

function StandingsView({ standings, roundNumber, username, scoutMap }: { standings: EventStanding[]; roundNumber: number; username: string; scoutMap: Map<string, ScoutReport> }) {
  if (standings.length === 0) {
    return <div className="ink-card p-6 text-center text-ink-400">Aucun classement pour cette ronde</div>;
  }

  const isMe = (name: string) => username && name.toLowerCase() === username.toLowerCase();
  const getScout = (name: string) => scoutMap.get(name.toLowerCase());

  return (
    <div className="space-y-3">
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
            {standings.map((s, i) => {
              const me = isMe(s.playerName);
              const scout = getScout(s.playerName);
              return (
                <tr key={i} className={me ? 'bg-gold-400/10 border-l-2 border-l-gold-400' : i < 3 ? 'bg-gold-400/5' : ''}>
                  <td className="text-center px-3 py-2.5 font-bold text-ink-500">{s.rank}</td>
                  <td className={`px-3 py-2.5 font-medium max-w-[250px] ${me ? 'text-gold-400' : 'text-ink-100'}`}>
                    <div className="truncate">{s.playerName}</div>
                    {scout && (
                      <div className="mt-0.5">
                        <ScoutDeckBadges scout={scout} />
                      </div>
                    )}
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
        {standings.map((s, i) => {
          const me = isMe(s.playerName);
          const scout = getScout(s.playerName);
          return (
            <div key={i} className={`ink-card px-3 py-2.5 flex items-center gap-3 ${me ? 'border-gold-500/30 bg-gold-400/5' : i < 3 ? 'border-gold-500/20' : ''}`}>
              <span className="text-sm font-bold text-ink-500 w-6 text-center shrink-0">{s.rank}</span>
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm truncate ${me ? 'text-gold-400' : 'text-ink-100'}`}>{s.playerName}</div>
                {scout && (
                  <div className="mt-0.5">
                    <ScoutDeckBadges scout={scout} />
                  </div>
                )}
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
    </div>
  );
}

function MatchesView({ matches, roundNumber, username, scoutMap }: { matches: EventMatch[]; roundNumber: number; username: string; scoutMap: Map<string, ScoutReport> }) {
  if (matches.length === 0) {
    return <div className="ink-card p-6 text-center text-ink-400">Aucun match pour cette ronde</div>;
  }

  const isMe = (name: string) => username && name.toLowerCase() === username.toLowerCase();
  const getScout = (name: string) => scoutMap.get(name.toLowerCase());

  // Sort so the user's match appears first
  const sorted = username
    ? [...matches].sort((a, b) => {
        const aIsMe = a.players.some(p => isMe(p.playerName));
        const bIsMe = b.players.some(p => isMe(p.playerName));
        return aIsMe === bIsMe ? 0 : aIsMe ? -1 : 1;
      })
    : matches;

  return (
    <div className="space-y-2">
      {sorted.map(m => {
        const p1 = m.players[0];
        const p2 = m.players[1];
        const p1Wins = m.winnerId === p1?.playerId;
        const p2Wins = m.winnerId === p2?.playerId;
        const myMatch = m.players.some(p => isMe(p.playerName));
        const scout1 = p1 ? getScout(p1.playerName) : undefined;
        const scout2 = p2 ? getScout(p2.playerName) : undefined;

        if (m.isBye) {
          const byeIsMe = isMe(p1?.playerName || '');
          return (
            <div key={m.matchId} className={`ink-card px-3 sm:px-4 py-3 flex items-center justify-between ${byeIsMe ? 'border-gold-500/30 bg-gold-400/5' : ''}`}>
              <div className="flex items-center gap-2">
                {m.table > 0 && <span className="text-xs text-ink-600">T{m.table}</span>}
                <span className={`font-medium text-sm ${byeIsMe ? 'text-gold-400' : 'text-ink-100'}`}>{p1?.playerName || 'Inconnu'}</span>
              </div>
              <span className="text-xs text-ink-500 bg-ink-800/50 px-2 py-0.5 rounded-full">BYE</span>
            </div>
          );
        }

        return (
          <div key={m.matchId} className={`ink-card px-3 sm:px-4 py-3 ${myMatch ? 'border-gold-500/30 bg-gold-400/5' : ''}`}>
            <div className="flex items-center gap-2">
              {m.table > 0 && <span className="text-xs text-ink-600 shrink-0 w-7">T{m.table}</span>}
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <div className="flex-1 min-w-0">
                  <span className={`text-sm truncate block ${isMe(p1?.playerName || '') ? 'font-bold text-gold-400' : p1Wins ? 'font-bold text-green-400' : 'text-ink-300'}`}>
                    {p1?.playerName || 'Inconnu'}
                  </span>
                  {scout1 && <div className="mt-0.5"><ScoutDeckBadges scout={scout1} /></div>}
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
                  <span className={`text-sm truncate block ${isMe(p2?.playerName || '') ? 'font-bold text-gold-400' : p2Wins ? 'font-bold text-green-400' : 'text-ink-300'}`}>
                    {p2?.playerName || 'Inconnu'}
                  </span>
                  {scout2 && <div className="mt-0.5"><ScoutDeckBadges scout={scout2} /></div>}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function pct(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${Math.round(value * 100)}%`;
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
      <p className="text-[10px] sm:text-xs text-ink-500 mb-0.5 sm:mb-1">{label}</p>
      <div className="font-medium text-ink-100 text-sm">{value}</div>
    </div>
  );
}

function RoundsList({ title, rounds, tournamentId, format, onDelete, scoutMap }: { title: string; rounds: Round[]; tournamentId: string; format: string; onDelete: (id: string) => void; scoutMap: Map<string, ScoutReport> }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-ink-400">{title}</h3>
      {rounds.map(round => (
        <RoundCard key={round.id} round={round} tournamentId={tournamentId} format={format} onDelete={onDelete} scoutMap={scoutMap} />
      ))}
    </div>
  );
}

function RoundCard({ round, tournamentId, format, onDelete, scoutMap }: { round: Round; tournamentId: string; format: string; onDelete: (id: string) => void; scoutMap: Map<string, ScoutReport> }) {
  const navigate = useNavigate();
  const result = RESULT_STYLES[round.result];
  const games = round.games || [];
  const gamesWon = games.filter(g => g.result === 'WIN').length;
  const gamesLost = games.filter(g => g.result === 'LOSS').length;

  const hasLocalColors = round.opponentDeckColors && round.opponentDeckColors.length > 0;
  const scout = round.opponentName ? scoutMap.get(round.opponentName.toLowerCase()) : undefined;
  const showScoutColors = !hasLocalColors && scout;

  return (
    <div className="ink-card overflow-hidden cursor-pointer transition-all duration-200 hover:border-gold-500/25" onClick={() => navigate(`/tournaments/${tournamentId}/rounds/${round.id}/edit`)}>
      <div className="px-3 sm:px-4 py-3 border-b border-ink-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-sm font-bold text-ink-500 shrink-0">R{round.roundNumber}</span>
            <span className="font-medium text-ink-100 truncate">{round.opponentName || 'Inconnu'}</span>
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
            <button onClick={(e) => { e.stopPropagation(); onDelete(round.id); }} className="text-ink-600 hover:text-lorcana-ruby text-sm transition-colors p-1">&times;</button>
          </div>
        </div>
        {hasLocalColors && (
          <div className="mt-1.5 ml-8 sm:ml-10"><DeckBadges colors={round.opponentDeckColors as any} /></div>
        )}
        {showScoutColors && (
          <div className="mt-1.5 ml-8 sm:ml-10">
            <ScoutDeckBadges scout={scout} />
          </div>
        )}
      </div>
      {games.length > 0 && (
        <div className="px-3 sm:px-4 py-2 bg-ink-900/50">
          <div className="flex gap-2 sm:gap-3 flex-wrap">{games.map(game => <GameBadge key={game.id} game={game} />)}</div>
        </div>
      )}
      {round.notes && <div className="px-3 sm:px-4 py-2 text-xs text-ink-500 border-t border-ink-800/50">{round.notes}</div>}
    </div>
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
