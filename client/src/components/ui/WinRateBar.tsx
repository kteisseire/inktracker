/* Win-rate mini-bar — emerald ≥60, gold 45-59, ruby <45 (Lorcana tokens), mono %. No glow. */
export function WinRateBar({ rate }: { rate: number }) {
  const color = rate >= 60 ? 'bg-lorcana-emerald' : rate >= 45 ? 'bg-gold-400' : 'bg-lorcana-ruby';
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <div className="w-12 sm:w-16 h-2 bg-ink-800 border border-rule rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${rate}%` }} />
      </div>
      <span className="ink-num text-xs text-ink-300">{rate}%</span>
    </div>
  );
}
