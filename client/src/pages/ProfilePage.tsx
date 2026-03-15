import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { updateProfile, changePassword } from '../api/auth.api.js';
import { listMyTeams, listMyInvites, respondToInvite } from '../api/team.api.js';
import type { Team, TeamInvite } from '@lorcana/shared';

const ROLE_LABELS: Record<string, string> = { OWNER: 'Propriétaire', ADMIN: 'Admin', MEMBER: 'Membre' };

export function ProfilePage() {
  const { user, updateUser, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="font-display text-xl sm:text-2xl font-bold text-ink-100 tracking-wide">Mon profil</h1>

      <div className="ink-card p-4 sm:p-5">
        <p className="text-xs text-ink-500 mb-1">Membre depuis</p>
        <p className="text-sm text-ink-300">
          {new Date(user.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <ProfileForm user={user} onUpdate={updateUser} />
      <TeamSection />
      <PasswordForm hasPassword={user.hasPassword} onLogout={logout} />
    </div>
  );
}

function TeamSection() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [t, i] = await Promise.all([listMyTeams(), listMyInvites()]);
      setTeams(t);
      setInvites(i);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRespond = async (inviteId: string, accept: boolean) => {
    await respondToInvite(inviteId, accept);
    load();
  };

  return (
    <div className="ink-card p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-300 uppercase tracking-wide">Équipes</h2>
        <Link to="/teams" className="text-xs text-gold-400 hover:text-gold-300 transition-colors">
          Gérer
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gold-400"></div>
        </div>
      ) : (
        <>
          {/* Pending invites */}
          {invites.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-ink-500">Invitations en attente</p>
              {invites.map(inv => (
                <div key={inv.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-ink-900/50">
                  <span className="text-sm text-ink-200">{inv.team?.name}</span>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleRespond(inv.id, true)} className="text-xs text-green-400 hover:text-green-300 font-medium">Accepter</button>
                    <button onClick={() => handleRespond(inv.id, false)} className="text-xs text-ink-500 hover:text-ink-300">Refuser</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* My teams */}
          {teams.length === 0 && invites.length === 0 ? (
            <div className="text-center py-3">
              <p className="text-sm text-ink-500 mb-2">Aucune équipe</p>
              <Link to="/teams" className="text-xs text-gold-400 hover:text-gold-300 transition-colors">
                Créer ou rejoindre une équipe
              </Link>
            </div>
          ) : (
            <div className="space-y-1.5">
              {teams.map(team => (
                <Link
                  key={team.id}
                  to={`/teams/${team.id}`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-ink-900/50 hover:bg-ink-800/50 transition-colors group"
                >
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-ink-200 group-hover:text-gold-400 transition-colors truncate block">{team.name}</span>
                    <span className="text-[11px] text-ink-500">{team.memberCount} membre{(team.memberCount || 0) > 1 ? 's' : ''}</span>
                  </div>
                  <span className="text-[11px] text-ink-500">{ROLE_LABELS[team.myRole || 'MEMBER']}</span>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ProfileForm({ user, onUpdate }: { user: { username: string; email: string }; onUpdate: (u: any) => void }) {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const dirty = username !== user.username || email !== user.email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty) return;
    setError(''); setSuccess(''); setSaving(true);
    try {
      const data: any = {};
      if (username !== user.username) data.username = username;
      if (email !== user.email) data.email = email;
      const updated = await updateProfile(data);
      onUpdate(updated);
      setSuccess('Profil mis à jour');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="ink-card p-4 sm:p-5 space-y-4">
      <h2 className="text-sm font-semibold text-ink-300 uppercase tracking-wide">Informations</h2>

      {error && <div className="ink-error">{error}</div>}
      {success && <div className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">{success}</div>}

      <div>
        <label className="ink-label">Pseudo</label>
        <input
          type="text"
          required
          value={username}
          onChange={e => { setUsername(e.target.value); setSuccess(''); }}
          className="ink-input"
        />
      </div>

      <div>
        <label className="ink-label">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={e => { setEmail(e.target.value); setSuccess(''); }}
          className="ink-input"
        />
      </div>

      <button
        type="submit"
        disabled={!dirty || saving}
        className="ink-btn-primary w-full disabled:opacity-50"
      >
        {saving ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </form>
  );
}

function PasswordForm({ hasPassword, onLogout }: { hasPassword: boolean; onLogout: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (newPassword.length < 6) {
      setError('Le nouveau mot de passe doit faire au moins 6 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setSaving(true);
    try {
      await changePassword({
        ...(hasPassword ? { currentPassword } : {}),
        newPassword,
      });
      setSuccess('Mot de passe mis à jour');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="ink-card p-4 sm:p-5 space-y-4">
      <h2 className="text-sm font-semibold text-ink-300 uppercase tracking-wide">
        {hasPassword ? 'Changer le mot de passe' : 'Définir un mot de passe'}
      </h2>

      {error && <div className="ink-error">{error}</div>}
      {success && <div className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">{success}</div>}

      {!hasPassword && (
        <p className="text-xs text-ink-500">
          Vous êtes connecté via Google. Définissez un mot de passe pour pouvoir aussi vous connecter par email.
        </p>
      )}

      {hasPassword && (
        <div>
          <label className="ink-label">Mot de passe actuel</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={e => { setCurrentPassword(e.target.value); setSuccess(''); }}
            className="ink-input"
          />
        </div>
      )}

      <div>
        <label className="ink-label">Nouveau mot de passe</label>
        <input
          type="password"
          required
          minLength={6}
          value={newPassword}
          onChange={e => { setNewPassword(e.target.value); setSuccess(''); }}
          className="ink-input"
        />
      </div>

      <div>
        <label className="ink-label">Confirmer le mot de passe</label>
        <input
          type="password"
          required
          value={confirmPassword}
          onChange={e => { setConfirmPassword(e.target.value); setSuccess(''); }}
          className="ink-input"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="ink-btn-primary w-full disabled:opacity-50"
      >
        {saving ? 'Enregistrement...' : hasPassword ? 'Changer le mot de passe' : 'Définir le mot de passe'}
      </button>
    </form>
  );
}
