import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { GoogleSignInButton } from '../components/GoogleSignInButton.js';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-16">
      <div className="text-center mb-8">
        <h1 className="font-display text-2xl font-bold text-ink-100 tracking-wide">Inscription</h1>
        <p className="mt-2 text-sm text-ink-500">Créez votre compte pour suivre vos tournois</p>
      </div>

      <form onSubmit={handleSubmit} className="ink-card p-6 sm:p-8 space-y-5">
        {error && <div className="ink-error">{error}</div>}

        <div>
          <label className="ink-label">Email</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="ink-input" />
        </div>

        <div>
          <label className="ink-label">Nom d'utilisateur</label>
          <input type="text" required minLength={3} value={username} onChange={e => setUsername(e.target.value)} className="ink-input" />
        </div>

        <div>
          <label className="ink-label">Mot de passe</label>
          <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="ink-input" />
        </div>

        <button type="submit" disabled={loading} className="w-full ink-btn-primary">
          {loading ? 'Inscription...' : 'S\'inscrire'}
        </button>

        <p className="text-center text-sm text-ink-400">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-gold-400 hover:text-gold-300 transition-colors">Se connecter</Link>
        </p>

        <div className="flex items-center gap-3">
          <div className="flex-1 ink-divider" />
          <span className="text-sm text-ink-500">ou</span>
          <div className="flex-1 ink-divider" />
        </div>

        <GoogleSignInButton />
      </form>
    </div>
  );
}
