import { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { updateProfile, changePassword } from '../api/auth.api.js';
import { HelpButton } from '../components/ui/HelpButton.js';
import { ProfileSubNav } from '../components/layout/ProfileSubNav.js';

export function ProfilePage() {
  const { user, updateUser, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto">
      <ProfileSubNav />
      <div className="space-y-4">

        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-bold text-ink-100 tracking-wide">Mon profil</h1>
          <HelpButton sections={['Compte et sécurité']} />
        </div>

        {/* Groupe : Informations du compte */}
        <div className="ink-card divide-y divide-ink-800/50">
          {/* Membre depuis */}
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-ink-400">Membre depuis</span>
            <span className="text-sm text-ink-200">
              {new Date(user.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>

          {/* Comptes liés */}
          <div className="px-4 py-3 space-y-2">
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2">Comptes liés</p>
            <AccountRow
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              label="Email / mot de passe"
              connected={user.hasPassword}
            />
            <AccountRow
              icon={<svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>}
              label="Google"
              connected={user.hasGoogle}
            />
            <AccountRow
              icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>}
              label="Discord"
              connected={user.hasDiscord}
            />
          </div>
        </div>

        {/* Groupe : Informations personnelles */}
        <ProfileForm user={user} onUpdate={updateUser} />

        {/* Groupe : Sécurité — mot de passe replié par défaut */}
        <PasswordSection hasPassword={user.hasPassword} />

        {/* Déconnexion */}
        <button
          onClick={logout}
          className="w-full py-2.5 rounded-xl text-sm font-medium border transition-colors"
          style={{ color: 'rgba(220,80,80,0.85)', borderColor: 'rgba(220,50,50,0.25)', background: 'rgba(220,50,50,0.05)' }}
        >
          Se déconnecter
        </button>

      </div>
    </div>
  );
}

function AccountRow({ icon, label, connected }: { icon: React.ReactNode; label: string; connected: boolean }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-ink-900/50">
      <div className="flex items-center gap-2.5">
        <span className={connected ? 'text-ink-200' : 'text-ink-600'}>{icon}</span>
        <span className={`text-sm ${connected ? 'text-ink-200' : 'text-ink-500'}`}>{label}</span>
      </div>
      {connected ? (
        <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          Lié
        </span>
      ) : (
        <span className="text-xs text-ink-600">Non lié</span>
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
      <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Informations</p>

      {error && <div className="ink-error">{error}</div>}
      {success && <div className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">{success}</div>}

      <div>
        <label className="ink-label">Pseudo</label>
        <input type="text" required value={username}
          onChange={e => { setUsername(e.target.value); setSuccess(''); }} className="ink-input" />
      </div>
      <div>
        <label className="ink-label">Email</label>
        <input type="email" required value={email}
          onChange={e => { setEmail(e.target.value); setSuccess(''); }} className="ink-input" />
      </div>

      <button type="submit" disabled={!dirty || saving} className="ink-btn-primary w-full disabled:opacity-50">
        {saving ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </form>
  );
}

function PasswordSection({ hasPassword }: { hasPassword: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="ink-card overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-ink-800/30"
      >
        <div className="flex items-center gap-3">
          <svg className="w-4 h-4 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-sm font-medium text-ink-200">
            {hasPassword ? 'Changer le mot de passe' : 'Définir un mot de passe'}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-ink-500 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && <PasswordForm hasPassword={hasPassword} />}
    </div>
  );
}

function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (newPassword.length < 6) { setError('Au moins 6 caractères'); return; }
    if (newPassword !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return; }
    setSaving(true);
    try {
      await changePassword({ ...(hasPassword ? { currentPassword } : {}), newPassword });
      setSuccess('Mot de passe mis à jour');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-3 border-t border-ink-800/50 pt-4">
      {!hasPassword && (
        <p className="text-xs text-ink-500">Connecté via un compte externe. Définissez un mot de passe pour vous connecter par email.</p>
      )}
      {error && <div className="ink-error">{error}</div>}
      {success && <div className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">{success}</div>}

      {hasPassword && (
        <div>
          <label className="ink-label">Mot de passe actuel</label>
          <input type="password" required value={currentPassword}
            onChange={e => { setCurrentPassword(e.target.value); setSuccess(''); }} className="ink-input" />
        </div>
      )}
      <div>
        <label className="ink-label">Nouveau mot de passe</label>
        <input type="password" required minLength={6} value={newPassword}
          onChange={e => { setNewPassword(e.target.value); setSuccess(''); }} className="ink-input" />
      </div>
      <div>
        <label className="ink-label">Confirmer</label>
        <input type="password" required value={confirmPassword}
          onChange={e => { setConfirmPassword(e.target.value); setSuccess(''); }} className="ink-input" />
      </div>
      <button type="submit" disabled={saving} className="ink-btn-primary w-full disabled:opacity-50">
        {saving ? 'Enregistrement...' : hasPassword ? 'Changer' : 'Définir'}
      </button>
    </form>
  );
}
