import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { GoogleSignInButton } from '../components/GoogleSignInButton.js';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
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
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 gap-8">
      {/* Hero */}
      <div className="max-w-lg w-full text-center">
        <div className="text-5xl mb-4 text-gold-400">&#9670;</div>
        <h1 className="font-display text-4xl tracking-wide">
          <span className="text-gold-400">Ink</span>
          <span className="text-ink-200">Tracker</span>
        </h1>
        <p className="mt-3 text-ink-400 text-lg">
          Suivez vos performances en tournois Disney Lorcana
        </p>
      </div>

      {/* Features */}
      <div className="max-w-lg w-full grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <FeaturePill icon="&#9876;" label="Tournois & rondes" />
        <FeaturePill icon="&#9824;" label="Gestion de decks" />
        <FeaturePill icon="&#9636;" label="Stats & matchups" />
        <FeaturePill icon="&#10022;" label="Compteur de Lore" />
        <FeaturePill icon="&#9986;" label="Top Cut Calculator" />
        <FeaturePill icon="&#9670;" label="Filtrage par set" />
      </div>

      {/* Login form */}
      <div className="max-w-md w-full">
        <form onSubmit={handleSubmit} className="ink-card p-8 space-y-5">
          {error && <div className="ink-error">{error}</div>}

          <div>
            <label className="ink-label">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="ink-input" />
          </div>

          <div>
            <label className="ink-label">Mot de passe</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="ink-input" />
          </div>

          <button type="submit" disabled={loading} className="w-full ink-btn-primary">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          <p className="text-center text-sm text-ink-400">
            Pas de compte ?{' '}
            <Link to="/register" className="text-gold-400 hover:text-gold-300 transition-colors">S'inscrire</Link>
          </p>

          <div className="flex items-center gap-3">
            <div className="flex-1 ink-divider" />
            <span className="text-sm text-ink-500">ou</span>
            <div className="flex-1 ink-divider" />
          </div>

          <GoogleSignInButton />
        </form>
      </div>

      <p className="text-xs text-ink-600 text-center max-w-sm">
        Gratuit et open source. Vos donnees sont privees et accessibles uniquement par vous.
      </p>
    </div>
  );
}

function FeaturePill({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-ink-800/40 border border-ink-700/30">
      <span className="text-gold-400 text-sm">{icon}</span>
      <span className="text-xs text-ink-300 font-medium">{label}</span>
    </div>
  );
}
