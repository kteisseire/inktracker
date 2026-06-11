import { useState, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { GoogleSignInButton } from '../components/GoogleSignInButton.js';
import { DiscordSignInButton } from '../components/DiscordSignInButton.js';
import { LogoIcon } from '../components/ui/Logo.js';
import { HollowLozenge } from '../components/ui/InkBadge.js';
import { safeRedirect } from '../lib/safeRedirect.js';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const raw = safeRedirect(searchParams.get('redirect'));
  const redirectTo = (!raw || ['/profile', '/teams', '/admin'].some(p => raw.startsWith(p))) ? '/tournaments' : raw;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(redirectTo || '/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur de connexion');
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
        <h1 className="font-display text-2xl text-ink-50 tracking-[0.03em]">Connexion</h1>
        <p className="mt-2 text-sm text-ink-500">Accédez à vos tournois et statistiques</p>
      </div>

      <form onSubmit={handleSubmit} className="ink-card-hero p-6 sm:p-8 space-y-5">
        {error && (
          <div className="ink-error">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="ink-label">Email</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="ink-input" />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="ink-label">Mot de passe</label>
            <Link to="/forgot-password" className="text-xs text-gold-400 hover:text-gold-300 transition-colors">
              Mot de passe oublié ?
            </Link>
          </div>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="ink-input" />
        </div>

        <button type="submit" disabled={loading} className="w-full ink-btn-primary py-3">
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>

        <p className="text-center text-sm text-ink-400">
          Pas de compte ?{' '}
          <Link to={redirectTo ? `/register?redirect=${encodeURIComponent(redirectTo)}` : '/register'} className="text-gold-400 hover:text-gold-300 transition-colors font-medium">S'inscrire</Link>
        </p>

        {/* Signature separator: hairline — ◇ — hairline */}
        <div className="flex items-center gap-3">
          <div className="flex-1 ink-divider" />
          <HollowLozenge size={14} />
          <div className="flex-1 ink-divider" />
        </div>

        <div className="space-y-2.5">
          <GoogleSignInButton />
          <DiscordSignInButton />
        </div>
      </form>
    </div>
  );
}
