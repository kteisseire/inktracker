import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function GoogleSignInButton() {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const initialized = useRef(false);
  const btnRef = useRef<HTMLDivElement>(null);
  const redirectRef = useRef(searchParams.get('redirect') || '/');

  useEffect(() => {
    if (initialized.current) return;

    const interval = setInterval(() => {
      if (!window.google || !btnRef.current) return;
      clearInterval(interval);
      initialized.current = true;

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response: { credential: string }) => {
          try {
            await loginWithGoogle(response.credential);
            navigate(redirectRef.current);
          } catch {
            setError('Erreur de connexion Google');
          }
        },
      });

      // Render the official Google button inside our container
      (window.google.accounts.id as any).renderButton(btnRef.current, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        width: btnRef.current.offsetWidth,
        text: 'continue_with',
        locale: 'fr',
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {error && <div className="text-red-500 text-sm text-center">{error}</div>}
      <div ref={btnRef} className="w-full flex justify-center [&>div]:!w-full" />
    </>
  );
}
