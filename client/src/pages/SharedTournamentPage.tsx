import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSharedTournament } from '../api/tournaments.api.js';
import { DeckBadges } from '../components/ui/InkBadge.js';
import type { Tournament, InkColor } from '@lorcana/shared';

const FORMAT_LABELS: Record<string, string> = { BO1: 'Bo1', BO3: 'Bo3', BO5: 'Bo5' };
const TOPCUT_LABELS: Record<string, string> = { NONE: 'Aucun', TOP4: 'Top 4', TOP8: 'Top 8', TOP16: 'Top 16', TOP32: 'Top 32' };
const RESULT_STYLES: Record<string, { label: string; cls: string }> = {
  WIN: { label: 'V', cls: 'bg-green-500/15 text-green-400' },
  LOSS: { label: 'D', cls: 'bg-red-500/15 text-red-400' },
  DRAW: { label: 'N', cls: 'bg-ink-700/50 text-ink-400' },
};

export function SharedTournamentPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const [tournament, setTournament] = useState<(Tournament & { user: { username: string } }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!shareId) return;
    getSharedTournament(shareId)
      .then(t => setTournament(t))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [shareId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-400"></div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-ink-400 text-lg">Ce tournoi n'existe pas ou n'est plus partagé.</p>
        <Link to="/" className="text-gold-400 hover:text-gold-300 text-sm">Retour à l'accueil</Link>
      </div>
    );
  }

  const rounds = tournament.rounds || [];
  const wins = rounds.filter(r => r.result === 'WIN').length;
  const losses = rounds.filter(r => r.result === 'LOSS').length;
  const draws = rounds.filter(r => r.result === 'DRAW').length;
  const swissRounds = rounds.filter(r => !r.isTopCut);
  const topCutRounds = rounds.filter(r => r.isTopCut);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-ink-500 mb-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Tournoi partagé par <span className="text-gold-400 font-medium">{tournament.user.username}</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-ink-100 tracking-wide">{tournament.name}</h1>
        <p className="text-ink-400 text-sm mt-1">
          {new Date(tournament.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          {tournament.location && ` — ${tournament.location}`}
        </p>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="ink-card p-3 text-center">
          <p className="text-xs text-ink-500 mb-1">Deck</p>
          <div className="flex justify-center">
            <DeckBadges colors={tournament.myDeckColors as InkColor[]} />
          </div>
        </div>
        <div className="ink-card p-3 text-center">
          <p className="text-xs text-ink-500 mb-1">Bilan</p>
          <p className="text-sm font-medium">
            <span className="text-green-400">{wins}V</span>{' '}
            <span className="text-red-400">{losses}D</span>
            {draws > 0 && <>{' '}<span className="text-ink-400">{draws}N</span></>}
          </p>
        </div>
        <div className="ink-card p-3 text-center">
          <p className="text-xs text-ink-500 mb-1">Format</p>
          <p className="text-sm font-medium text-ink-200">{FORMAT_LABELS[tournament.format]}</p>
        </div>
        <div className="ink-card p-3 text-center">
          <p className="text-xs text-ink-500 mb-1">Joueurs</p>
          <p className="text-sm font-medium text-ink-200">{tournament.playerCount ?? '—'}</p>
        </div>
      </div>

      {/* Placement */}
      {tournament.placement && (
        <div className="ink-card p-3 sm:p-4 text-center text-sm border-gold-500/20">
          <span className="text-gold-400 font-medium">Classement final : #{tournament.placement}</span>
          {tournament.playerCount && (
            <span className="text-gold-500/70"> / {tournament.playerCount} joueurs</span>
          )}
        </div>
      )}

      {/* Rounds */}
      {rounds.length > 0 && (
        <div className="space-y-4">
          {swissRounds.length > 0 && (
            <div className="space-y-2">
              <h2 className="ink-section-title">Rondes suisses</h2>
              <div className="space-y-1.5">
                {swissRounds.map(round => (
                  <SharedRoundCard key={round.id} round={round} />
                ))}
              </div>
            </div>
          )}
          {topCutRounds.length > 0 && (
            <div className="space-y-2">
              <h2 className="ink-section-title">Top Cut</h2>
              <div className="space-y-1.5">
                {topCutRounds.map(round => (
                  <SharedRoundCard key={round.id} round={round} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CTA */}
      <div className="ink-card p-5 text-center space-y-3 border-gold-500/10">
        <p className="text-sm text-ink-400">Envie de tracker tes propres tournois ?</p>
        <Link to="/register" className="inline-block text-sm font-semibold px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-ink-950 hover:from-gold-400 hover:to-gold-300 transition-all">
          Créer un compte InkTracker
        </Link>
      </div>
    </div>
  );
}

function SharedRoundCard({ round }: { round: any }) {
  const r = round.result ? RESULT_STYLES[round.result] : null;
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-ink-900/30">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xs text-ink-500 font-medium w-8 shrink-0 text-center">
          {round.isTopCut ? `TC${round.roundNumber}` : `R${round.roundNumber}`}
        </span>
        <span className="text-sm text-ink-200 truncate">{round.opponentName || '—'}</span>
        {round.opponentDeckColors?.length > 0 && (
          <div className="flex gap-0.5 shrink-0">
            {round.opponentDeckColors.map((c: string) => (
              <span key={c} className="w-2.5 h-2.5 rounded-full ring-1 ring-white/10" style={{ backgroundColor: INK_HEX[c] || '#666' }} />
            ))}
          </div>
        )}
      </div>
      {r ? (
        <span className={`text-xs font-bold px-2.5 py-1 rounded-md shrink-0 ${r.cls}`}>{r.label}</span>
      ) : (
        <span className="text-xs text-ink-600 px-2 py-1">—</span>
      )}
    </div>
  );
}

const INK_HEX: Record<string, string> = {
  AMBER: '#F5A623', AMETHYST: '#9B59B6', EMERALD: '#27AE60',
  RUBY: '#E74C3C', SAPPHIRE: '#3498DB', STEEL: '#7F8C8D',
};
