import { THEMES } from '../../lib/themes.js';
import { useTheme } from '../../context/ThemeContext.js';

// Grille de sélection de thème — partagée entre le compteur de lore (panneau
// plein écran) et le profil. Sélectionner un thème l'applique immédiatement à
// toute l'app (via useTheme / ThemeContext) et le persiste.
export function ThemePicker({ onPick }: { onPick?: (id: string) => void }) {
  const { themeId, setThemeId } = useTheme();

  return (
    <div className="grid grid-cols-2 gap-3">
      {THEMES.map(t => (
        <button
          key={t.id}
          type="button"
          onClick={() => {
            setThemeId(t.id);
            onPick?.(t.id);
          }}
          className="relative rounded-2xl overflow-hidden transition-all active:scale-95 text-left"
          style={{
            height: '7rem',
            boxShadow: themeId === t.id
              ? `0 0 0 2px ${t.meAccent}, 0 0 20px ${t.meAccent}40`
              : '0 0 0 1px rgba(255,255,255,0.06)',
          }}
        >
          {/* Fond dégradé du thème */}
          <div className="absolute inset-0" style={{ background: t.bg }} />
          {t.bgOverlay && <div className="absolute inset-0" style={{ background: t.bgOverlay }} />}

          {/* Losange filigrane */}
          <div className="absolute inset-0 flex items-center justify-end pr-3 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25.83 32" style={{ width: 48, height: 60, opacity: 0.08 }}>
              <path d="M12.91 0 0 16l12.91 16 12.91-16L12.91 0ZM1.28 16 12.91 1.59 24.54 16 12.91 30.41 1.28 16Z" fill="white" />
              <path d="m21.99 16-9.08 11.25L3.83 16l9.08-11.25L21.99 16z" fill="white" />
            </svg>
          </div>

          {/* Dégradés accent */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(105deg, ${t.meAccent}22 0%, transparent 55%)` }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(285deg, ${t.oppAccent}18 0%, transparent 50%)` }} />

          {/* Trait lumineux en haut */}
          <div className="absolute top-0 inset-x-4 h-px" style={{ background: `linear-gradient(90deg, transparent, ${t.meAccent}60, ${t.oppAccent}60, transparent)` }} />

          {/* Contenu */}
          <div className="absolute inset-0 flex flex-col justify-between p-3.5">
            <p className="text-[11px] font-bold tracking-widest uppercase text-white/40 leading-none">
              {t.id === 'default' ? '★' : t.id.replace('set', 'S')}
            </p>
            <div>
              <p className="text-sm font-semibold leading-tight" style={{ color: 'rgba(255,255,255,0.88)', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
                {t.name}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: t.meAccent, boxShadow: `0 0 6px ${t.meAccent}` }} />
                <div className="w-2 h-2 rounded-full" style={{ background: t.oppAccent, boxShadow: `0 0 6px ${t.oppAccent}` }} />
                {themeId === t.id && (
                  <span className="text-[10px] font-medium ml-auto" style={{ color: t.meAccent }}>Actif</span>
                )}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
