export function LogoIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGlimmer" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa"/>
          <stop offset="50%" stopColor="#f5c542"/>
          <stop offset="100%" stopColor="#fcd879"/>
        </linearGradient>
      </defs>
      {/* 4-point Glimmer star */}
      <path
        d="M16 4 L18.5 12.5 L27 16 L18.5 19.5 L16 28 L13.5 19.5 L5 16 L13.5 12.5 Z"
        fill="url(#logoGlimmer)"
      />
      {/* Bright core */}
      <circle cx="16" cy="16" r="3" fill="#fef3c7" opacity="0.9"/>
    </svg>
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
