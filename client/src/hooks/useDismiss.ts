import { useEffect, useRef, type RefObject } from 'react';

type AnyRef = RefObject<HTMLElement | null>;

/**
 * Dismiss an open popover/menu on outside mousedown or Escape.
 * Accepts a single ref or an array of refs (a click inside ANY of them is "inside").
 * Listeners attach only while `active` is true and re-attach only when `active` toggles
 * (the latest onDismiss is read from a ref, so unmemoized callbacks don't cause churn).
 */
export function useDismiss(active: boolean, refs: AnyRef | AnyRef[], onDismiss: () => void) {
  const cb = useRef(onDismiss);
  cb.current = onDismiss;

  useEffect(() => {
    if (!active) return;
    const list = Array.isArray(refs) ? refs : [refs];
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (list.every(r => !r.current || !r.current.contains(t))) cb.current();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') cb.current(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}
