import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

export interface MenuItem { label: string; onClick: () => void; danger?: boolean; }

// Menu d'actions "⋮" — bouton avec une vraie cible tactile (32px), panneau en
// portail. Sert de zone d'action standard sur les cartes/lignes (remplace les
// petits liens texte difficiles à toucher).
export function DropdownMenu({ items, label = 'Actions' }: { items: MenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.right - 168 });
    }
    setOpen(o => !o);
  };

  return (
    <div className="relative shrink-0">
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        aria-label={label}
        className="flex items-center justify-center w-8 h-8 rounded-lg bg-gold-500/15 text-gold-400 hover:bg-gold-500/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/50"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[9999] bg-ink-900 border border-ink-700/50 rounded-xl shadow-xl shadow-ink-950/50 py-1 overflow-hidden"
          style={{ top: pos.top, left: pos.left, width: '168px' }}
        >
          {items.map(item => (
            <button
              key={item.label}
              type="button"
              onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(false); item.onClick(); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                item.danger
                  ? 'text-lorcana-ruby/80 hover:bg-lorcana-ruby/10 hover:text-lorcana-ruby'
                  : 'text-ink-200 hover:bg-ink-800/50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
