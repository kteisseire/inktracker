import { useState, FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/auth.api.js';
import { LogoIcon } from '../components/ui/Logo.js';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="ink-card p-6 space-y-4">
          <p className="text-red-400 text-sm">Lien de réinitialisation invalide.</p>
          <Link to="/forgot-password" className="inline-block text-sm text-gold-400 hover:text-gold-300 font-medium">
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token, password });
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-16 px-1">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <LogoIcon className="w-12 h-12" />
        </div>
        <h1 className="font-display text-2xl font-bold text-ink-100 tracking-wide">Nouveau mot de passe</h1>
        <p className="mt-2 text-sm text-ink-500">Choisissez votre nouveau mot de passe</p>
      </div>

      <div className="ink-card p-6 sm:p-8 space-y-5">
        {done ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-green-500/15 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-ink-300">Votre mot de passe a été réinitialisé avec succès.</p>
            <Link to="/login" className="inline-block ink-btn-primary text-sm px-6 py-2.5">
              Se connecter
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="ink-error">{error}</div>}

            <div>
              <label className="ink-label">Nouveau mot de passe</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="ink-input"
              />
            </div>

            <div>
              <label className="ink-label">Confirmer le mot de passe</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="ink-input"
              />
            </div>

            <button type="submit" disabled={loading} className="w-full ink-btn-primary py-3">
              {loading ? 'Réinitialisation...' : 'Réinitialiser'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
