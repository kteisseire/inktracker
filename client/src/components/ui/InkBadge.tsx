import type { InkColor } from '@lorcana/shared';
import { INK_COLORS_CONFIG } from '../../lib/colors.js';

export function InkBadge({ color }: { color: InkColor }) {
  const config = INK_COLORS_CONFIG[color];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide shadow-sm"
      style={{
        backgroundColor: config.hex,
        color: color === 'AMBER' ? '#78350f' : '#fff',
        textShadow: color === 'AMBER' ? 'none' : '0 1px 2px rgba(0,0,0,0.3)',
      }}
    >
      {config.label}
    </span>
  );
}

export function DeckBadges({ colors }: { colors: InkColor[] }) {
  const valid = (colors || []).filter(c => c && INK_COLORS_CONFIG[c]);
  if (valid.length === 0) return <span className="text-xs text-ink-500">—</span>;
  return (
    <span className="inline-flex gap-1.5">
      {valid.map(c => <InkBadge key={c} color={c} />)}
    </span>
  );
}
