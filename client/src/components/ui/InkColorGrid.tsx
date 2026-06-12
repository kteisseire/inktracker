import { INK_COLORS, type InkColor } from '@lorcana/shared';
import { INK_COLORS_CONFIG } from '../../lib/colors.js';

interface InkColorGridProps {
  selected: InkColor[];
  onChange: (colors: InkColor[]) => void;
  max?: number;
  /** Selected-lozenge glow blur in px. */
  shadowBlur?: number;
  /** Selected-lozenge glow alpha (hex suffix, e.g. '99' or '60'). */
  shadowOpacity?: string;
  /** Set the HTML disabled attribute on over-max buttons (not just dimmed). */
  htmlDisabled?: boolean;
}

/* The 6-color Lorcana lozenge picker grid. Shared by the deck form (InkColorPicker)
   and the scout picker, which differ only in glow intensity + disabled handling. */
export function InkColorGrid({
  selected,
  onChange,
  max = 2,
  shadowBlur = 5,
  shadowOpacity = '99',
  htmlDisabled = false,
}: InkColorGridProps) {
  const toggle = (color: InkColor) => {
    if (selected.includes(color)) onChange(selected.filter(c => c !== color));
    else if (selected.length < max) onChange([...selected, color]);
  };

  return (
    <div className="grid grid-cols-6 gap-1">
      {INK_COLORS.map(color => {
        const config = INK_COLORS_CONFIG[color];
        const hex = config.hex;
        const isSelected = selected.includes(color);
        const isDisabled = !isSelected && selected.length >= max;

        return (
          <button
            key={color}
            type="button"
            onClick={() => toggle(color)}
            disabled={htmlDisabled ? isDisabled : undefined}
            className="flex flex-col items-center gap-1 py-2 rounded-xl transition-all duration-200 active:scale-95"
            style={{
              opacity: isDisabled ? 0.2 : isSelected ? 1 : 0.45,
              background: isSelected ? `${hex}12` : 'transparent',
              border: `1px solid ${isSelected ? `${hex}50` : 'transparent'}`,
            }}
          >
            <svg viewBox="0 0 25.83 32" style={{ width: 22, height: 28, filter: isSelected ? `drop-shadow(0 0 ${shadowBlur}px ${hex}${shadowOpacity})` : 'none', transition: 'filter 0.2s' }}>
              {isSelected ? (
                <>
                  <path d="M12.91 0 0 16l12.91 16 12.91-16Z" fill={hex} opacity="0.25" />
                  <path d="M12.91 0 0 16l12.91 16 12.91-16ZM1.28 16 12.91 1.59 24.54 16 12.91 30.41Z" fill={hex} />
                  <path d="m21.99 16-9.08 11.25L3.83 16l9.08-11.25Z" fill={hex} />
                </>
              ) : (
                <path d="M12.91 0 0 16l12.91 16 12.91-16ZM1.28 16 12.91 1.59 24.54 16 12.91 30.41Z" fill={hex} />
              )}
            </svg>
            <span style={{
              fontSize: '0.55rem',
              fontWeight: isSelected ? 600 : 400,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: isSelected ? hex : 'rgba(255,255,255,0.35)',
              transition: 'color 0.2s',
              lineHeight: 1,
            }}>
              {config.label.slice(0, 4)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
