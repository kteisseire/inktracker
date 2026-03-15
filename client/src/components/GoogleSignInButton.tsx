import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNavigate } from 'react-router-dom';

export function GoogleSignInButton() {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const divRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      if (!window.google || !divRef.current) return;
      clearInterval(interval);

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response: { credential: string }) => {
          try {
            await loginWithGoogle(response.credential);
            navigate('/');
          } catch {
            setError('Erreur de connexion Google');
          }
        },
      });

      window.google.accounts.id.renderButton(divRef.current!, {
        theme: 'outline',
        size: 'large',
        width: 400,
        text: 'signin_with',
        locale: 'fr',
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {error && <div className="text-red-500 text-sm text-center">{error}</div>}
      <div ref={divRef} className="flex justify-center" />
    </>
  );
}
