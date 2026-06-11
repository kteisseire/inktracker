import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion.js';

/* One shared module-level observer for all entrance reveals — no per-element observer,
   no window scroll listener. Unobserves on first fire so nothing re-animates on scroll-back. */
let observer: IntersectionObserver | null = null;
function getObserver(): IntersectionObserver | null {
  if (observer) return observer;
  if (typeof IntersectionObserver === 'undefined') return null;
  observer = new IntersectionObserver(
    entries => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.setAttribute('data-reveal', 'in');
          e.target.classList.remove('reveal-pending');
          observer!.unobserve(e.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
  );
  return observer;
}

/**
 * Reveal-on-enter ref. FAIL-OPEN: the hidden state (.reveal-pending) is only added when
 * motion is allowed AND JS runs; if anything fails the element stays at its natural visible
 * state. A 1.2s failsafe force-reveals any element a stalled observer never reached.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const io = getObserver();
    if (!io) return; // no IO support → stay visible

    el.classList.add('reveal-pending');
    io.observe(el);

    const failsafe = window.setTimeout(() => {
      el.setAttribute('data-reveal', 'in');
      el.classList.remove('reveal-pending');
      io.unobserve(el);
    }, 1200);

    return () => { io.unobserve(el); clearTimeout(failsafe); };
  }, [reduced]);

  return ref;
}
