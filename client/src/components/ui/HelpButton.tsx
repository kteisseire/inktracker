import { useState, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { FAQ_SECTIONS, type FaqItem } from '../../pages/HelpPage.js';

/* ── Accordion (self-contained) ── */

function Accordion({ item, defaultOpen }: { item: FaqItem; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <div className="border-b border-ink-800/50 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 py-3 text-left group"
      >
        <span className="text-sm font-medium text-ink-200 group-hover:text-ink-100 transition-colors">{item.question}</span>
        <svg
          className={`w-4 h-4 text-ink-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="pb-4 pr-4 text-sm text-ink-400 leading-relaxed">
          {item.answer}
        </div>
      )}
    </div>
  );
}

/* ── Modal ── */

function HelpModal({ sections, onClose }: { sections: string[]; onClose: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const matched = FAQ_SECTIONS.filter(s => sections.includes(s.title));

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-lg bg-ink-900 border border-ink-700/50 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-ink-800/50">
          <h2 className="text-base font-semibold text-ink-100">Aide</h2>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-300 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-5 py-4 space-y-5">
          {matched.map(section => (
            <div key={section.title}>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-6 h-6 rounded-md bg-gold-500/10 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={section.icon} />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-ink-200">{section.title}</h3>
              </div>
              {section.items.map(item => (
                <Accordion key={item.question} item={item} />
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-ink-800/50 text-center">
          <Link
            to="/help"
            onClick={onClose}
            className="text-xs text-gold-400 hover:text-gold-300 transition-colors"
          >
            Voir toute l'aide →
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ── Help Button (?) ── */

export function HelpButton({ sections }: { sections: string[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-ink-700 bg-ink-800/50 text-ink-400 hover:text-gold-400 hover:border-gold-500/50 transition-colors text-xs font-bold"
        title="Aide"
      >
        ?
      </button>
      {open && <HelpModal sections={sections} onClose={() => setOpen(false)} />}
    </>
  );
}
