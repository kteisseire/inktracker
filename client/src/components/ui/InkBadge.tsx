import { useState, useRef, useEffect } from 'react';
import type { InkColor, ScoutReport } from '@lorcana/shared';
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

export function ScoutDeckBadges({ scout }: { scout: ScoutReport }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const valid = (scout.deckColors || []).filter(c => c && INK_COLORS_CONFIG[c as InkColor]) as InkColor[];
  if (valid.length === 0) return null;

  const time = new Date(scout.updatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const date = new Date(scout.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="inline-flex gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
      >
        {valid.map(c => <InkBadge key={c} color={c} />)}
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 left-0 min-w-[180px] bg-ink-900 border border-ink-700/50 rounded-xl shadow-xl shadow-ink-950/50 p-3 space-y-2 animate-in fade-in-0 zoom-in-95 duration-150"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center gap-1.5">
            {valid.map(c => <InkBadge key={c} color={c} />)}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <svg className="w-3.5 h-3.5 text-lorcana-sapphire shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-ink-300 font-medium">{scout.reportedBy.username}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-500">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{date} à {time}</span>
          </div>
        </div>
      )}
    </div>
  );
}
