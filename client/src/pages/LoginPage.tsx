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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="text-4xl mb-3 text-gold-400">&#9670;</div>
          <h1 className="font-display text-3xl tracking-wide">
            <span className="text-gold-400">Ink</span>
            <span className="text-ink-200">Tracker</span>
          </h1>
          <p className="mt-3 text-ink-400">Connectez-vous pour accéder à vos données</p>
        </div>

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
    </div>
  );
}
