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
      <div className="max-w-2xl w-full text-center">
        <div className="text-5xl mb-4 text-gold-400">&#9670;</div>
        <h1 className="font-display text-4xl tracking-wide">
          <span className="text-gold-400">Ink</span>
          <span className="text-ink-200">Tracker</span>
        </h1>
        <p className="mt-3 text-ink-300 text-lg">
          L'outil complet pour suivre et analyser vos performances en tournois Disney Lorcana
        </p>
        <p className="mt-2 text-ink-500 text-sm max-w-lg mx-auto">
          Enregistrez vos tournois ronde par ronde, analysez vos matchups, identifiez vos forces et améliorez votre jeu grâce à des statistiques détaillées.
        </p>
      </div>

      {/* Feature cards */}
      <div className="max-w-2xl w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <FeatureCard
          icon="&#9876;"
          title="Suivi de tournois"
          description="Enregistrez chaque tournoi avec vos rondes, résultats, scores de lore et notes. Compatible Bo1, Bo3, Bo5."
        />
        <FeatureCard
          icon="&#9824;"
          title="Gestion de decks"
          description="Créez et organisez vos decks. Import automatique des couleurs depuis Dreamborn, Lorcanito, Inkdecks et plus."
        />
        <FeatureCard
          icon="&#9636;"
          title="Statistiques avancées"
          description="Win rate global et par deck, analyse des matchups, impact du premier joueur. Filtrage par set Lorcana ou dates personnalisées."
        />
        <FeatureCard
          icon="&#10022;"
          title="Compteur de Lore"
          description="Compteur plein écran optimisé mobile pour 2 joueurs avec historique des actions et détection automatique du gagnant à 20 lore."
        />
        <FeatureCard
          icon="&#9986;"
          title="Top Cut Calculator"
          description="Calculez les records nécessaires pour passer le cut en format Suisse selon le nombre de joueurs et de rondes."
        />
        <FeatureCard
          icon="&#9670;"
          title="Progression Top Cut"
          description="Suivez en direct vos points par rapport au seuil de qualification pendant vos tournois."
        />
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
        Gratuit et open source. Vos données sont privées et accessibles uniquement par vous.
      </p>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex gap-3 p-4 rounded-xl bg-ink-800/30 border border-ink-700/20">
      <span className="text-xl text-gold-400 shrink-0 mt-0.5">{icon}</span>
      <div>
        <h3 className="text-sm font-semibold text-ink-100">{title}</h3>
        <p className="text-xs text-ink-500 mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
