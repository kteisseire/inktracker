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

    console.log('[Google] Starting init, window.google:', !!window.google);

    const interval = setInterval(() => {
      if (!window.google || !btnRef.current) return;
      clearInterval(interval);
      initialized.current = true;

      console.log('[Google] SDK loaded, initializing...');
      console.log('[Google] Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID?.substring(0, 20) + '...');

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response: { credential: string }) => {
          console.log('[Google] Callback fired! credential length:', response.credential?.length);
          try {
            await loginWithGoogle(response.credential);
            console.log('[Google] Login success, redirecting to:', redirectRef.current);
            navigate(redirectRef.current);
          } catch (err: any) {
            console.error('[Google] Login error:', err?.response?.status, err?.response?.data, err?.message);
            setError('Erreur de connexion Google');
          }
        },
      });

      console.log('[Google] Rendering button, container width:', btnRef.current.offsetWidth);

      // Render the official Google button inside our container
      (window.google.accounts.id as any).renderButton(btnRef.current, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        width: btnRef.current.offsetWidth,
        text: 'continue_with',
        locale: 'fr',
      });

      console.log('[Google] Button rendered');
    }, 100);

    // Log COOP header
    fetch(window.location.href, { method: 'HEAD' }).then(res => {
      console.log('[Google] Page COOP header:', res.headers.get('cross-origin-opener-policy'));
      console.log('[Google] Page CSP header:', res.headers.get('content-security-policy')?.substring(0, 100) + '...');
    }).catch(() => {});

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {error && <div className="text-red-500 text-sm text-center">{error}</div>}
      <div ref={btnRef} className="w-full flex justify-center [&>div]:!w-full" />
    </>
  );
}
