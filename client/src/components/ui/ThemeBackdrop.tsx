import { useTheme } from '../../context/ThemeContext.js';

// Décor d'ambiance app-wide, derrière tout le contenu. Paramétré par le thème
// actif : deux halos d'accent + une nuée de motifs (losanges / bulles / éclats
// selon le set). Couleur via variables CSS → suit l'accent et le mode. Faible
// opacité (encore plus faible en clair). pointer-events-none, motion désactivée
// sous prefers-reduced-motion (règle globale dans index.css).
export function ThemeBackdrop() {
  const { theme, mode } = useTheme();
  const light = mode === 'light';

  // Type de motif dérivé du thème
  const motif: 'lozenge' | 'bubble' | 'spark' =
    theme.particles === 'bubbles' ? 'bubble'
    : theme.particles === 'sparks' || theme.stars ? 'spark'
    : 'lozenge';

  const count = motif === 'spark' ? 14 : motif === 'bubble' ? 10 : 8;
  const haloA = light ? 0.05 : 0.10;
  const haloB = light ? 0.04 : 0.08;
  const motifAlpha = light ? 0.05 : 0.09;

  return (
    <div className="theme-backdrop fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
      {/* Deux halos d'accent (ink blooms) */}
      <div
        className="absolute rounded-full theme-bloom"
        style={{
          width: '60vmax', height: '60vmax', top: '-20vmax', left: '-10vmax',
          background: `radial-gradient(circle, rgb(var(--accent-400) / ${haloA}) 0%, transparent 65%)`,
        }}
      />
      <div
        className="absolute rounded-full theme-bloom theme-bloom--slow"
        style={{
          width: '55vmax', height: '55vmax', bottom: '-22vmax', right: '-12vmax',
          background: `radial-gradient(circle, rgb(var(--accent-400) / ${haloB}) 0%, transparent 65%)`,
        }}
      />

      {/* Nuée de motifs flottants */}
      {Array.from({ length: count }).map((_, i) => {
        const left = (i * 53 + 11) % 92 + 4;
        const top = (i * 37 + 7) % 88 + 4;
        const size = motif === 'spark' ? 3 + (i % 3) : 16 + (i % 4) * 8;
        const delay = (i % 5) * 1.4;
        const dur = 14 + (i % 4) * 5;
        const common: React.CSSProperties = {
          position: 'absolute', left: `${left}%`, top: `${top}%`,
          opacity: motifAlpha, animationDelay: `${delay}s`, animationDuration: `${dur}s`,
        };
        if (motif === 'bubble') {
          return <div key={i} className="theme-float rounded-full" style={{ ...common, width: size, height: size, border: '1px solid rgb(var(--accent-400) / 0.5)' }} />;
        }
        if (motif === 'spark') {
          return <div key={i} className="theme-float rounded-full" style={{ ...common, width: size, height: size, background: 'rgb(var(--accent-300))', boxShadow: '0 0 6px 1px rgb(var(--accent-400) / 0.6)' }} />;
        }
        // losange (motif de marque)
        return (
          <svg key={i} className="theme-float" style={common} width={size} height={size * 1.24} viewBox="0 0 25.83 32">
            <path d="M12.91 0 0 16l12.91 16 12.91-16L12.91 0Z" fill="none" stroke="rgb(var(--accent-400))" strokeWidth={1.5} />
          </svg>
        );
      })}
    </div>
  );
}
