export function LogoIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fcd879"/>
          <stop offset="50%" stopColor="#f5c542"/>
          <stop offset="100%" stopColor="#d4a324"/>
        </linearGradient>
      </defs>
      <path
        d="M16 3 C16 3 8 12.5 8 18.5 C8 23 11.6 27 16 27 C20.4 27 24 23 24 18.5 C24 12.5 16 3 16 3Z"
        fill="url(#logoGold)"
      />
      <path d="M16 9 L14.2 19.5 L16 22 L17.8 19.5 Z" fill="#16120e" opacity="0.45"/>
    </svg>
  );
}

export function LogoFull({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoIcon className="w-7 h-7 sm:w-8 sm:h-8" />
      <span className="font-display text-lg sm:text-xl tracking-wide">
        <span className="text-gold-400">Ink</span>
        <span className="text-ink-200">Tracker</span>
      </span>
    </div>
  );
}
