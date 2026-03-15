import { INK_COLORS, type InkColor } from '@lorcana/shared';
import { INK_COLORS_CONFIG } from '../../lib/colors.js';

interface InkColorPickerProps {
  selected: InkColor[];
  onChange: (colors: InkColor[]) => void;
  max?: number;
}

export function InkColorPicker({ selected, onChange, max = 2 }: InkColorPickerProps) {
  const toggle = (color: InkColor) => {
    if (selected.includes(color)) {
      onChange(selected.filter(c => c !== color));
    } else if (selected.length < max) {
      onChange([...selected, color]);
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {INK_COLORS.map(color => {
        const config = INK_COLORS_CONFIG[color];
        const isSelected = selected.includes(color);
        return (
          <button
            key={color}
            type="button"
            onClick={() => toggle(color)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
              isSelected
                ? 'ring-2 ring-offset-2 ring-offset-ink-900 ring-gold-400 scale-105 shadow-lg'
                : 'opacity-40 hover:opacity-70'
            }`}
            style={{
              backgroundColor: config.hex,
              color: color === 'AMBER' ? '#78350f' : '#fff',
              textShadow: color === 'AMBER' ? 'none' : '0 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            {config.label}
          </button>
        );
      })}
    </div>
  );
}
