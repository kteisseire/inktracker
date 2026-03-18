import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth.api.js';
import { LogoIcon } from '../components/ui/Logo.js';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword({ email });
      setSent(true);
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
        <h1 className="font-display text-2xl font-bold text-ink-100 tracking-wide">Mot de passe oublié</h1>
        <p className="mt-2 text-sm text-ink-500">Entrez votre email pour recevoir un lien de réinitialisation</p>
      </div>

      <div className="ink-card p-6 sm:p-8 space-y-5">
        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-green-500/15 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-ink-300">
              Si un compte existe avec l'adresse <span className="text-ink-100 font-medium">{email}</span>, un email de réinitialisation a été envoyé.
            </p>
            <p className="text-xs text-ink-500">Vérifiez vos spams si vous ne le trouvez pas.</p>
            <Link to="/login" className="inline-block text-sm text-gold-400 hover:text-gold-300 transition-colors font-medium">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="ink-error">{error}</div>}

            <div>
              <label className="ink-label">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="ink-input"
                placeholder="votre@email.com"
              />
            </div>

            <button type="submit" disabled={loading} className="w-full ink-btn-primary py-3">
              {loading ? 'Envoi...' : 'Envoyer le lien'}
            </button>

            <p className="text-center text-sm text-ink-400">
              <Link to="/login" className="text-gold-400 hover:text-gold-300 transition-colors font-medium">
                Retour à la connexion
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
