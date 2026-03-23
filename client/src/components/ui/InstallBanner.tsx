import { useState } from 'react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt.js';

const DISMISS_KEY = 'glimmerlog-install-dismissed';

export function InstallBanner() {
  const { canInstall, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');

  if (!canInstall || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 bg-ink-900/95 backdrop-blur border-t border-ink-700">
      <div className="max-w-xl mx-auto flex items-center gap-3">
        <div className="flex-1 text-sm text-ink-200">
          Installer <strong className="text-gold-400">GlimmerLog</strong> pour un accès rapide et hors ligne.
        </div>
        <button
          onClick={promptInstall}
          className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-ink-950 font-semibold text-sm rounded-lg transition-colors whitespace-nowrap"
        >
          Installer
        </button>
        <button
          onClick={handleDismiss}
          className="text-ink-400 hover:text-ink-200 transition-colors text-lg leading-none"
          aria-label="Fermer"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
