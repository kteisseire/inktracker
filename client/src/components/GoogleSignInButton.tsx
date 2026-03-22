import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { safeRedirect } from '../lib/safeRedirect.js';

export function GoogleSignInButton() {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const initialized = useRef(false);
  const hiddenBtnRef = useRef<HTMLDivElement>(null);
  const redirectRef = useRef(safeRedirect(searchParams.get('redirect')));

  useEffect(() => {
    if (initialized.current) return;

    const interval = setInterval(() => {
      if (!window.google || !hiddenBtnRef.current) return;
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

      // Render a hidden Google button to handle the auth flow (avoids FedCM prompt() error)
      (window.google.accounts.id as any).renderButton(hiddenBtnRef.current, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        width: 300,
        text: 'continue_with',
        locale: 'fr',
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    // Click the hidden Google button to trigger the popup
    const googleBtn = hiddenBtnRef.current?.querySelector('[role="button"]') as HTMLElement
      || hiddenBtnRef.current?.querySelector('div[style]') as HTMLElement
      || hiddenBtnRef.current?.querySelector('iframe');
    if (googleBtn) {
      googleBtn.click();
    }
  };

  return (
    <>
      {error && <div className="text-red-500 text-sm text-center">{error}</div>}
      {/* Hidden Google button for auth flow */}
      <div ref={hiddenBtnRef} className="absolute overflow-hidden" style={{ width: 0, height: 0, opacity: 0, pointerEvents: 'none' }} />
      {/* Visible custom button */}
      <button
        type="button"
        onClick={handleClick}
        className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg border border-ink-700 bg-ink-800/50 hover:bg-ink-700/50 text-ink-200 font-medium text-sm transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continuer avec Google
      </button>
    </>
  );
}
