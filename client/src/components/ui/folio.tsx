import { useEffect, type ElementType, type ReactNode } from 'react';
import { useReveal } from '../../hooks/useReveal.js';
import { useCountUp } from '../../hooks/useCountUp.js';
import { HollowLozenge } from './InkBadge.js';

/* Reveal wrapper — applies the entrance reveal ref + stagger index to a row/card/header block. */
export function Reveal({ i = 0, as: As = 'div', className = '', children, ...rest }: {
  i?: number;
  as?: ElementType;
  className?: string;
  children: ReactNode;
  [key: string]: any;
}) {
  const ref = useReveal<HTMLElement>();
  return (
    <As ref={ref as any} className={className} style={{ ['--i' as any]: Math.min(i, 8) }} {...rest}>
      {children}
    </As>
  );
}

/* The giant win-rate numeral with count-up + trailing Marcellus percent. */
export function CountUpPercent({ value, animate = true }: { value: number; animate?: boolean }) {
  const live = useCountUp(value);
  const shown = animate ? live : value;
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="folio-hero-num">{shown}</span>
      <span className="folio-hero-pct">%</span>
    </span>
  );
}

/* Manuscript versal on lead PROSE only. Dev-guard: warns if more than one renders per route. */
export function DropCap({ children, className = '' }: { children: string; className?: string }) {
  const first = children.charAt(0);
  const rest = children.slice(1);
  useEffect(() => {
    if (import.meta.env.DEV && document.querySelectorAll('.drop-cap').length > 1) {
      console.error('Codex: more than one <DropCap> on this route');
    }
  }, []);
  return (
    <p className={`text-sm text-ink-400 ${className}`}>
      <span className="drop-cap float-left mr-2 -mt-1 font-display text-6xl leading-[0.8] text-gold-300">{first}</span>
      {rest}
    </p>
  );
}

/* Rubric-terminator divider: hairline — HollowLozenge — hairline. Use sparingly (one per page). */
export function GildedDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 ink-divider" />
      <HollowLozenge size={14} />
      <div className="flex-1 ink-divider" />
    </div>
  );
}

/* Open 1px gold L-bracket. Static by default; strokes itself once when draw is true (Login only). */
export function CornerFlourish({ draw = false }: { draw?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`corner-flourish absolute top-1.5 right-1.5 w-3 h-3 ${draw ? 'is-drawing' : ''}`}
      viewBox="0 0 12 12"
    >
      <path pathLength={1} d="M12 0 H4 M12 0 V8" fill="none" stroke="var(--rule-gold)" strokeWidth={1} />
    </svg>
  );
}

/* Hero folio shell: rubric label + contained gold bloom + optional corner-tick + the giant slot. */
export function FolioHero({ rubric, tick = false, className = '', children }: {
  rubric: string;
  tick?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`ink-card-hero relative overflow-hidden p-5 flex flex-col justify-center min-h-[7rem] ${className}`}
      style={{ backgroundImage: 'radial-gradient(circle 90px at 12% 0%, rgba(42,32,8,0.04), transparent 70%)' }}
    >
      {tick && <CornerFlourish />}
      <span className="rubric-label">{rubric}</span>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
