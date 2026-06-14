import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';

function isActive(paths: string[], pathname: string) {
  return paths.some(p => p === '/' ? pathname === '/' : pathname.startsWith(p));
}

type TabItem = { to: string; label: string; paths: string[]; icon: JSX.Element };

const ICON = {
  trophy: <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h14l-1.4 8.4A5 5 0 0112.6 16h-.8a5 5 0 01-5-4.6L5 3zM8 16h8m-4 0v4m-3 0h6" />,
  cards: <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />,
  tools: <><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>,
  profile: <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
  login: <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />,
};

function Tab({ item, pathname }: { item: TabItem; pathname: string }) {
  const active = isActive(item.paths, pathname);
  return (
    <Link
      to={item.to}
      data-active={active}
      aria-current={active ? 'page' : undefined}
      className="relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors active:scale-95
        text-ink-400 data-[active=true]:text-gold-400 focus-visible:outline-none focus-visible:bg-ink-800/40"
    >
      {/* gold top edge-light over the active tab */}
      {active && <span className="absolute top-0 h-[2px] w-9 rounded-full bg-gold-400" />}
      <span className={`transition-transform duration-150 ${active ? 'scale-110' : 'scale-100'}`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          {item.icon}
        </svg>
      </span>
      <span className={`text-[0.6rem] uppercase tracking-[0.05em] ${active ? 'font-semibold' : 'font-normal'}`}>
        {item.label}
      </span>
    </Link>
  );
}

// md:hidden — sur PC la navigation est dans le Header ; la barre du bas ne doit
// pas s'afficher en double ni passer par-dessus le contenu.
const NAV_BAR = 'md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-rule bg-ink-950/95 tint-accent backdrop-blur-md safe-area-pb shadow-[0_-4px_24px_rgba(8,6,15,0.5)]';

export function BottomNav() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const items: TabItem[] = user
    ? [
        { to: '/tournaments', label: 'Tournois', paths: ['/tournaments'], icon: ICON.trophy },
        { to: '/decks', label: 'Decks', paths: ['/decks', '/stats', '/metagame'], icon: ICON.cards },
        { to: '/top-cut', label: 'Outils', paths: ['/top-cut', '/lore-counter', '/help'], icon: ICON.tools },
        { to: '/profile', label: 'Profil', paths: ['/profile', '/teams', '/admin'], icon: ICON.profile },
      ]
    : [
        { to: '/top-cut', label: 'Outils', paths: ['/top-cut', '/lore-counter', '/help'], icon: ICON.tools },
        { to: '/login', label: 'Connexion', paths: ['/login'], icon: ICON.login },
      ];

  return (
    <nav className={NAV_BAR}>
      <div className="flex items-stretch h-16">
        {items.map(item => <Tab key={item.to} item={item} pathname={pathname} />)}
      </div>
    </nav>
  );
}
