import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTournament, deleteTournament } from '../api/tournaments.api.js';
import { deleteRound } from '../api/matches.api.js';
import { DeckBadges } from '../components/ui/InkBadge.js';
import type { Tournament, Round, Game } from '@lorcana/shared';

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
  let safe = rounds; // wins where everyone at that record passes
  let bubble = rounds; // wins where at least some at that record pass
  for (let wins = rounds; wins >= 0; wins--) {
    const count = players * binomial(rounds, wins) / Math.pow(2, rounds);
    const prevCumulative = cumulative;
    cumulative += count;
    if (prevCumulative < topCutSize && cumulative <= topCutSize) {
      safe = wins; // all players at this record still fit
    }
    if (prevCumulative < topCutSize && cumulative > topCutSize) {
      bubble = wins; // this is the bubble record
      break;
    }
  }
  return { safe, bubble };
}

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    getTournament(id!).then(setTournament).finally(() => setLoading(false));
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
          {/* Event link */}
          <a
            href={tournament.eventLink || 'https://tcg.ravensburgerplay.com/my-events'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-lorcana-sapphire hover:text-blue-300 transition-colors mt-1"
          >
            {tournament.eventLink ? 'Voir sur Ravensburger Play Hub' : 'Mes événements Ravensburger'}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-6">
          <Link
            to={`/tournaments/${id}/edit`}
            className="text-sm text-ink-400 hover:text-gold-400 transition-colors"
          >
            Modifier
          </Link>
          <button
            onClick={handleDeleteTournament}
            className="text-sm text-lorcana-ruby/70 hover:text-lorcana-ruby transition-colors"
          >
            Supprimer
          </button>
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

      {/* Rounds */}
      <div className="flex items-center justify-between">
        <h2 className="ink-section-title">Rondes</h2>
        <Link
          to={`/tournaments/${id}/rounds/new`}
          className="ink-btn-primary text-sm px-4 py-2"
        >
          + Ronde
        </Link>
      </div>

      {rounds.length === 0 ? (
        <div className="ink-card p-8 text-center text-ink-400">
          Aucune ronde enregistrée
        </div>
      ) : (
        <>
          {swissRounds.length > 0 && (
            <RoundsList title="Rondes suisses" rounds={swissRounds} tournamentId={id!} format={tournament.format} onDelete={handleDeleteRound} />
          )}
          {topCutRounds.length > 0 && (
            <RoundsList title="Top Cut" rounds={topCutRounds} tournamentId={id!} format={tournament.format} onDelete={handleDeleteRound} />
          )}
        </>
      )}
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
  if (isSafe) {
    statusLabel = 'Qualifié';
    statusColor = 'text-green-400';
  } else if (isBubble) {
    statusLabel = 'Bubble';
    statusColor = 'text-gold-400';
  } else if (isEliminated) {
    statusLabel = 'Éliminé';
    statusColor = 'text-red-400';
  } else if (tournamentDone) {
    statusLabel = 'Éliminé';
    statusColor = 'text-red-400';
  } else {
    statusLabel = canReachSafe
      ? `${safePoints - currentPoints} pts pour qualif. sûre`
      : `${bubblePoints - currentPoints} pts pour bubble`;
    statusColor = 'text-ink-400';
  }

  // Progress bar relative to safe threshold
  const progress = safePoints > 0 ? Math.min(currentPoints / safePoints, 1) : 1;
  const bubbleProgress = safePoints > 0 ? Math.min(bubblePoints / safePoints, 1) : 0;
  const barColor = isSafe ? 'bg-green-500' : isBubble ? 'bg-gold-400' : isEliminated ? 'bg-red-400' : 'bg-lorcana-sapphire';

  return (
    <div className="ink-card p-3 sm:p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink-300">Top Cut — Top {topCutSize}</span>
        <span className={`text-sm font-semibold ${statusColor}`}>{statusLabel}</span>
      </div>

      {/* Progress bar with bubble marker */}
      <div className="relative">
        <div className="h-3 bg-ink-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        {/* Bubble threshold marker */}
        {bubblePoints < safePoints && (
          <div
            className="absolute top-0 w-0.5 h-3 bg-gold-400/60"
            style={{ left: `${bubbleProgress * 100}%` }}
            title={`Bubble: ${bubblePoints} pts`}
          />
        )}
      </div>

      {/* Points labels */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="text-ink-500">
            <span className="font-bold text-ink-200 text-sm tabular-nums">{currentPoints}</span> pts
          </span>
        </div>
        <div className="flex items-center gap-3 text-ink-500">
          {bubblePoints < safePoints && (
            <span>Bubble <span className="font-semibold text-gold-400">{bubblePoints}</span></span>
          )}
          <span>Qualif. <span className="font-semibold text-green-400">{safePoints}</span></span>
        </div>
      </div>

      {roundsLeft > 0 && !isSafe && !isEliminated && (
        <p className="text-xs text-ink-500">
          {roundsLeft} ronde{roundsLeft > 1 ? 's' : ''} restante{roundsLeft > 1 ? 's' : ''} — max atteignable : {maxPossiblePoints} pts
        </p>
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

function RoundsList({ title, rounds, tournamentId, format, onDelete }: { title: string; rounds: Round[]; tournamentId: string; format: string; onDelete: (id: string) => void }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-ink-400">{title}</h3>
      {rounds.map(round => (
        <RoundCard key={round.id} round={round} tournamentId={tournamentId} format={format} onDelete={onDelete} />
      ))}
    </div>
  );
}

function RoundCard({ round, tournamentId, format, onDelete }: { round: Round; tournamentId: string; format: string; onDelete: (id: string) => void }) {
  const navigate = useNavigate();
  const result = RESULT_STYLES[round.result];
  const games = round.games || [];
  const gamesWon = games.filter(g => g.result === 'WIN').length;
  const gamesLost = games.filter(g => g.result === 'LOSS').length;

  return (
    <div
      className="ink-card overflow-hidden cursor-pointer transition-all duration-200 hover:border-gold-500/25"
      onClick={() => navigate(`/tournaments/${tournamentId}/rounds/${round.id}/edit`)}
    >
      {/* Round header */}
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
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${result.cls}`}>
              {result.label}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(round.id); }}
              className="text-ink-600 hover:text-lorcana-ruby text-sm transition-colors p-1"
            >
              &times;
            </button>
          </div>
        </div>
        {/* Deck badges on second row */}
        {round.opponentDeckColors && round.opponentDeckColors.length > 0 && (
          <div className="mt-1.5 ml-8 sm:ml-10">
            <DeckBadges colors={round.opponentDeckColors as any} />
          </div>
        )}
      </div>

      {/* Games detail */}
      {games.length > 0 && (
        <div className="px-3 sm:px-4 py-2 bg-ink-900/50">
          <div className="flex gap-2 sm:gap-3 flex-wrap">
            {games.map(game => (
              <GameBadge key={game.id} game={game} />
            ))}
          </div>
        </div>
      )}

      {round.notes && (
        <div className="px-3 sm:px-4 py-2 text-xs text-ink-500 border-t border-ink-800/50">{round.notes}</div>
      )}
    </div>
  );
}

function GameBadge({ game }: { game: Game }) {
  const result = RESULT_STYLES[game.result];
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs ${result.cls}`}>
      <span className="font-bold">G{game.gameNumber}</span>
      <span>{game.myScore}–{game.opponentScore}</span>
      {game.wentFirst !== null && (
        <span className="text-[10px] opacity-70">{game.wentFirst ? '(1er)' : '(2nd)'}</span>
      )}
    </div>
  );
}
