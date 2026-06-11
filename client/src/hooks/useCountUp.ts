import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion.js';

/**
 * The ONE app-wide count-up (Dashboard win-rate). Eases from ~62% of the value to the target
 * (ink saturating to final density, not a casino reel). Animates once; later target changes
 * (refetch) SNAP to the new value. Guarded: reduced-motion, low-core devices, and backgrounded
 * tabs all skip the animation.
 */
export function useCountUp(target: number): number {
  const reduced = usePrefersReducedMotion();
  const ran = useRef(false);
  const [value, setValue] = useState(target);

  useEffect(() => {
    const lowCore = typeof navigator !== 'undefined' && (navigator.hardwareConcurrency || 8) <= 4;
    if (reduced || lowCore || ran.current) { setValue(target); return; }

    ran.current = true;
    const start = Math.round(target * 0.62);
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      if (document.visibilityState !== 'visible') { setValue(target); return; }
      const p = Math.min((t - t0) / 600, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(start + (target - start) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reduced]);

  return value;
}
