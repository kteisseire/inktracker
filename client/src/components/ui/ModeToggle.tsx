import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.js';

// Bascule mode sombre / parchemin clair. Icône = ce vers quoi on va basculer.
export function ModeToggle({ className = '' }: { className?: string }) {
  const { mode, toggleMode } = useTheme();
  const goingLight = mode === 'dark';
  return (
    <button
      onClick={toggleMode}
      aria-label={goingLight ? 'Passer en mode clair (parchemin)' : 'Passer en mode sombre'}
      title={goingLight ? 'Mode parchemin' : 'Mode sombre'}
      className={`p-1.5 rounded-lg text-ink-400 hover:text-gold-300 hover:bg-ink-800/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/50 ${className}`}
    >
      {goingLight ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
