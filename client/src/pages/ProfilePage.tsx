import { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { updateProfile, changePassword } from '../api/auth.api.js';

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
      <PasswordForm hasPassword={user.hasPassword} onLogout={logout} />
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
