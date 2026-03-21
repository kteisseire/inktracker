import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTeamByInviteCode, joinTeamByCode } from '../api/team.api.js';
import { useAuth } from '../context/AuthContext.js';

export function JoinTeamPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState<{ id: string; name: string; description: string | null; memberCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    if (!inviteCode) return;
    getTeamByInviteCode(inviteCode)
      .then(t => setTeam(t))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [inviteCode]);

  const handleJoin = async () => {
    if (!inviteCode) return;
    setJoining(true);
    setJoinError('');
    try {
      const result = await joinTeamByCode(inviteCode);
      navigate(`/teams/${result.teamId}`);
    } catch (err: any) {
      setJoinError(err.response?.data?.error || 'Erreur lors de la tentative de rejoindre l\'équipe');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-400"></div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-ink-400 text-lg">Ce lien d'invitation n'est plus valide.</p>
        <Link to="/" className="text-gold-400 hover:text-gold-300 text-sm">Retour à l'accueil</Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      <div className="ink-card p-6 space-y-5 text-center">
        {/* Team icon */}
        <div className="w-16 h-16 rounded-2xl bg-ink-800/80 border border-ink-700/50 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>

        <div>
          <p className="text-xs text-ink-500 mb-1">Vous êtes invité à rejoindre</p>
          <h1 className="font-display text-2xl font-bold text-ink-100 tracking-wide">{team.name}</h1>
          {team.description && <p className="text-sm text-ink-400 mt-2">{team.description}</p>}
          <p className="text-xs text-ink-500 mt-3">{team.memberCount} membre{team.memberCount > 1 ? 's' : ''}</p>
        </div>

        {joinError && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{joinError}</div>}

        {user ? (
          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full text-sm font-semibold px-6 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-ink-950 hover:from-gold-400 hover:to-gold-300 transition-all disabled:opacity-50"
          >
            {joining ? 'En cours...' : 'Rejoindre l\'équipe'}
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-ink-400">Connectez-vous pour rejoindre cette équipe</p>
            <div className="flex justify-center gap-3">
              <Link
                to={`/register?redirect=${encodeURIComponent(`/join/${inviteCode}`)}`}
                className="text-sm font-semibold px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-ink-950 hover:from-gold-400 hover:to-gold-300 transition-all"
              >
                S'inscrire
              </Link>
              <Link
                to={`/login?redirect=${encodeURIComponent(`/join/${inviteCode}`)}`}
                className="text-sm font-medium px-6 py-2.5 rounded-xl border border-ink-700 text-ink-300 hover:bg-ink-800/50 transition-colors"
              >
                Se connecter
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
