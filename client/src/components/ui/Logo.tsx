export function LogoIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <img src="/logo.png" alt="GlimmerLog" className={className} />
  );
}

export function LogoFull({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoIcon className="w-7 h-7 sm:w-8 sm:h-8" />
      <span className="font-display text-lg sm:text-xl tracking-wide">
        <span className="text-gold-400">Glimmer</span>
        <span className="text-ink-200">Log</span>
      </span>
    </div>
  );
}
