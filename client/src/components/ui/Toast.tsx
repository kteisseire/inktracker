import { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
interface ToastItem { id: number; message: string; type: ToastType; }

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const ICONS = { success: Check, error: AlertTriangle, info: Info };
const ACCENTS: Record<ToastType, string> = {
  success: 'text-win',
  error: 'text-loss',
  info: 'text-gold-400',
};

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => setItems(list => list.filter(t => t.id !== id)), []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++;
    setItems(list => [...list, { id, message, type }]);
    setTimeout(() => remove(id), 2800);
  }, [remove]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div className="fixed inset-x-0 bottom-20 sm:bottom-6 z-[9998] flex flex-col items-center gap-2 px-4 pointer-events-none">
          {items.map(t => {
            const Icon = ICONS[t.type];
            return (
              <div
                key={t.id}
                role="status"
                onClick={() => remove(t.id)}
                className="sheet-enter pointer-events-auto flex items-center gap-2.5 max-w-sm w-fit ink-card px-4 py-2.5 shadow-card-hover cursor-pointer"
              >
                <Icon className={`w-4 h-4 shrink-0 ${ACCENTS[t.type]}`} strokeWidth={2.2} />
                <span className="text-sm text-ink-100">{t.message}</span>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
