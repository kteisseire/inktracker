import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

export function DiscordCallbackPage() {
  const { loginWithDiscord } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('Connexion Discord annulée');
      return;
    }

    if (!code) {
      setError('Code Discord manquant');
      return;
    }

    loginWithDiscord(code)
      .then(() => navigate('/'))
      .catch((err: any) => {
        setError(err.response?.data?.error || 'Erreur de connexion Discord');
      });
  }, []);

  if (error) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="ink-card p-6 space-y-4">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={() => navigate('/login')} className="ink-btn-primary text-sm px-6 py-2">
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#5865F2]"></div>
    </div>
  );
}
