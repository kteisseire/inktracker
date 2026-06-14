import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

type Resolver = (ok: boolean) => void;

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<Resolver | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    setOpts(options);
    return new Promise<boolean>(resolve => { resolverRef.current = resolve; });
  }, []);

  const close = useCallback((ok: boolean) => {
    resolverRef.current?.(ok);
    resolverRef.current = null;
    setOpts(null);
  }, []);

  // Échap = annuler, Entrée = confirmer
  useEffect(() => {
    if (!opts) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
      else if (e.key === 'Enter') close(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [opts, close]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {opts && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 veil-enter"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
          onClick={() => close(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="sheet-enter ink-card-hero w-full max-w-sm p-5 sm:p-6"
            onClick={e => e.stopPropagation()}
          >
            {opts.title && <h2 className="font-display text-lg text-ink-50 tracking-[0.02em] mb-1.5">{opts.title}</h2>}
            <p className="text-sm text-ink-300 leading-relaxed">{opts.message}</p>
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => close(false)}
                className="ink-btn-secondary flex-1 py-2.5"
              >
                {opts.cancelLabel ?? 'Annuler'}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => close(true)}
                className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-[0.98] ${
                  opts.danger
                    ? 'bg-lorcana-ruby/90 text-white hover:bg-lorcana-ruby'
                    : 'ink-btn-primary'
                }`}
              >
                {opts.confirmLabel ?? 'Confirmer'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue['confirm'] {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx.confirm;
}
