import type { MatchResult } from '@lorcana/shared';

/* Single source of truth for win/loss/draw colors (mapped to the Lorcana inks). */
export function resultColor(r: MatchResult): { text: string; bg: string } {
  switch (r) {
    case 'WIN': return { text: 'text-lorcana-emerald', bg: 'bg-lorcana-emerald/12' };
    case 'LOSS': return { text: 'text-lorcana-ruby', bg: 'bg-lorcana-ruby/12' };
    default: return { text: 'text-ink-300', bg: 'bg-ink-700/40' };
  }
}

const LETTER: Record<MatchResult, string> = { WIN: 'V', LOSS: 'D', DRAW: 'N' };

/* Shared result-badge styles (label + classes), on the Lorcana tokens. One source of truth
   for the per-round/per-game V/D/N chips across tournament views. */
export const RESULT_STYLES: Record<string, { label: string; cls: string }> = {
  WIN: { label: 'V', cls: 'bg-lorcana-emerald/12 text-lorcana-emerald' },
  LOSS: { label: 'D', cls: 'bg-lorcana-ruby/12 text-lorcana-ruby' },
  DRAW: { label: 'N', cls: 'bg-ink-700/40 text-ink-300' },
};

/* Fixed-width mono verdict glyph — a round of games reads like a match-history strip. */
export function ResultChip({ result }: { result: MatchResult }) {
  const c = resultColor(result);
  return (
    <span className={`ink-num inline-flex items-center justify-center w-5 h-5 rounded-sm text-xs ${c.bg} ${c.text}`}>
      {LETTER[result]}
    </span>
  );
}

/* Wins-losses-draws record, machined tabular mono. */
export function RecordLine({ wins, losses, draws }: { wins: number; losses: number; draws: number }) {
  if (wins === 0 && losses === 0 && draws === 0) return <span className="text-xs text-ink-600">—</span>;
  return (
    <span className="ink-num text-sm">
      <span className="text-lorcana-emerald">{wins}</span>
      <span className="text-ink-600">-</span>
      <span className="text-lorcana-ruby">{losses}</span>
      {draws > 0 && <><span className="text-ink-600">-</span><span className="text-ink-300">{draws}</span></>}
    </span>
  );
}
