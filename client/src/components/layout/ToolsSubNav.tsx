import { Link, useLocation } from 'react-router-dom';

const TABS = [
  { to: '/top-cut', label: 'Top Cut' },
  { to: '/lore-counter', label: 'Compteur de lore' },
  { to: '/help', label: 'Aide' },
];

export function ToolsSubNav() {
  const { pathname } = useLocation();
  return (
    <div className="flex gap-1 border-b border-ink-800/50 mb-6">
      {TABS.map(tab => {
        const active = pathname === tab.to;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              active
                ? 'text-gold-400 border-gold-400'
                : 'text-ink-400 border-transparent hover:text-ink-200'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
