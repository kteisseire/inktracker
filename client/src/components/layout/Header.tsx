import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { LogoIcon } from '../ui/Logo.js';

type NavItem = { to: string; label: string; icon: string }
  | { label: string; icon: string; children: { to: string; label: string; icon: string }[] };

const AUTH_NAV: NavItem[] = [
  { to: '/tournaments', label: 'Tournois', icon: 'trophy' },
  {
    label: 'Tableau de bord', icon: 'chart',
    children: [
      { to: '/', label: 'Vue d\'ensemble', icon: 'home' },
      { to: '/decks', label: 'Mes decks', icon: 'cards' },
      { to: '/stats', label: 'Statistiques', icon: 'chart' },
    ],
  },
  {
    label: 'Outils', icon: 'tools',
    children: [
      { to: '/lore-counter', label: 'Compteur de lore', icon: 'lore' },
      { to: '/top-cut', label: 'Calculateur Top Cut', icon: 'cut' },
      { to: '/help', label: 'Aide', icon: 'help' },
    ],
  },
];

const PUBLIC_NAV: NavItem[] = [
  {
    label: 'Outils', icon: 'tools',
    children: [
      { to: '/lore-counter', label: 'Compteur de lore', icon: 'lore' },
      { to: '/top-cut', label: 'Calculateur Top Cut', icon: 'cut' },
      { to: '/help', label: 'Aide', icon: 'help' },
    ],
  },
];

type NavLink = { to: string; label: string; icon: string };

const USER_NAV: NavLink[] = [
  { to: '/profile', label: 'Mon profil', icon: 'user' },
  { to: '/teams', label: 'Mes équipes', icon: 'team' },
];

function NavIcon({ name, className = 'w-4 h-4' }: { name: string; className?: string }) {
  const props = { className, fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', strokeWidth: 1.8 };
  switch (name) {
    case 'home': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" /></svg>;
    case 'trophy': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3h14l-1.4 8.4A5 5 0 0112.6 16h-.8a5 5 0 01-5-4.6L5 3zM8 16h8m-4 0v4m-3 0h6" /></svg>;
    case 'cards': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
    case 'chart': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
    case 'team': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
    case 'lore': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
    case 'cut': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" /></svg>;
    case 'user': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
    case 'logout': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
    case 'tools': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
    case 'help': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case 'chevron': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;
    case 'admin': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
    default: return null;
  }
}

function isLinkActive(to: string, pathname: string) {
  return to === '/' ? pathname === '/' : pathname.startsWith(to);
}

function isGroupActive(children: { to: string }[], pathname: string) {
  return children.some(c => isLinkActive(c.to, pathname));
}

/* Desktop dropdown for nav groups */
function DesktopDropdown({ item, pathname }: { item: Extract<NavItem, { children: any[] }>; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = isGroupActive(item.children, pathname);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          active ? 'text-gold-400 bg-gold-500/10' : 'text-ink-400 hover:text-ink-100 hover:bg-ink-800/50'
        }`}
      >
        <NavIcon name={item.icon} className="w-3.5 h-3.5" />
        {item.label}
        <NavIcon name="chevron" className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 min-w-[200px] bg-ink-900 border border-ink-700/50 rounded-xl shadow-xl shadow-ink-950/50 py-1 z-50">
          {item.children.map(child => (
            <Link
              key={child.to}
              to={child.to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                isLinkActive(child.to, pathname)
                  ? 'text-gold-400 bg-gold-500/5'
                  : 'text-ink-300 hover:text-ink-100 hover:bg-ink-800/50'
              }`}
            >
              <NavIcon name={child.icon} className="w-4 h-4" />
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const nav = user ? AUTH_NAV : PUBLIC_NAV;

  return (
    <header className="border-b border-gold-500/10 bg-ink-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <LogoIcon className="w-7 h-7 sm:w-8 sm:h-8 transition-transform group-hover:scale-110" />
          <span className="font-display text-lg sm:text-xl tracking-wide">
            <span className="text-gold-400 group-hover:text-gold-300 transition-colors">Ink</span>
            <span className="text-ink-200">Tracker</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          <nav className="flex gap-0.5">
            {nav.map(item => (
              'to' in item ? (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isLinkActive(item.to, location.pathname)
                      ? 'text-gold-400 bg-gold-500/10'
                      : 'text-ink-400 hover:text-ink-100 hover:bg-ink-800/50'
                  }`}
                >
                  <NavIcon name={item.icon} className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              ) : (
                <DesktopDropdown key={item.label} item={item} pathname={location.pathname} />
              )
            ))}
          </nav>
          <div className="w-px h-5 bg-ink-800 mx-2" />
          {user ? (
            <div className="flex items-center gap-0.5">
              {USER_NAV.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isLinkActive(item.to, location.pathname)
                      ? 'text-gold-400 bg-gold-500/10'
                      : 'text-ink-400 hover:text-ink-100 hover:bg-ink-800/50'
                  }`}
                >
                  <NavIcon name={item.icon} className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              ))}
              {user.isAdmin && (
                <Link
                  to="/admin"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isLinkActive('/admin', location.pathname)
                      ? 'text-gold-400 bg-gold-500/10'
                      : 'text-ink-400 hover:text-ink-100 hover:bg-ink-800/50'
                  }`}
                >
                  <NavIcon name="admin" className="w-3.5 h-3.5" />
                  Admin
                </Link>
              )}
              <button onClick={logout} className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-300 transition-colors px-2 py-2 rounded-lg hover:bg-ink-800/50">
                <NavIcon name="logout" className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-sm text-ink-400 hover:text-ink-100 transition-colors px-3 py-2 rounded-lg hover:bg-ink-800/50">
                Connexion
              </Link>
              <Link to="/register" className="text-sm font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-ink-950 hover:from-gold-400 hover:to-gold-300 transition-all">
                S'inscrire
              </Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2.5 -mr-1 text-ink-400 hover:text-ink-100 transition-colors rounded-lg active:bg-ink-800/50"
          aria-label="Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gold-500/10 bg-ink-950/95 backdrop-blur-md">
          <nav className="px-3 py-2">
            {nav.map(item => (
              'to' in item ? (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isLinkActive(item.to, location.pathname)
                      ? 'text-gold-400 bg-gold-500/10'
                      : 'text-ink-300 hover:text-ink-100 active:bg-ink-800/50'
                  }`}
                >
                  <NavIcon name={item.icon} className="w-5 h-5" />
                  {item.label}
                </Link>
              ) : (
                <MobileGroup key={item.label} item={item} pathname={location.pathname} onNavigate={() => setMenuOpen(false)} />
              )
            ))}
          </nav>

          {user && (
            <div className="px-3 py-2 border-t border-ink-800/50">
              <p className="px-4 py-1.5 text-[11px] text-ink-600 uppercase tracking-wider font-medium">Mon compte</p>
              {USER_NAV.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isLinkActive(item.to, location.pathname)
                      ? 'text-gold-400 bg-gold-500/10'
                      : 'text-ink-300 hover:text-ink-100 active:bg-ink-800/50'
                  }`}
                >
                  <NavIcon name={item.icon} className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
              {user.isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isLinkActive('/admin', location.pathname)
                      ? 'text-gold-400 bg-gold-500/10'
                      : 'text-ink-300 hover:text-ink-100 active:bg-ink-800/50'
                  }`}
                >
                  <NavIcon name="admin" className="w-5 h-5" />
                  Admin
                </Link>
              )}
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ink-500 hover:text-ink-300 active:bg-ink-800/50 transition-colors w-full"
              >
                <NavIcon name="logout" className="w-5 h-5" />
                Déconnexion
              </button>
            </div>
          )}

          {!user && (
            <div className="px-3 py-3 border-t border-ink-800/50 flex gap-2">
              <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm text-ink-300 hover:text-ink-100 transition-colors px-3 py-3 rounded-xl bg-ink-800/50 active:bg-ink-700/50 font-medium">
                Connexion
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm font-semibold px-3 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-ink-950 hover:from-gold-400 hover:to-gold-300 transition-all">
                S'inscrire
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

/* Mobile: collapsible group */
function MobileGroup({ item, pathname, onNavigate }: { item: Extract<NavItem, { children: any[] }>; pathname: string; onNavigate: () => void }) {
  const [open, setOpen] = useState(() => isGroupActive(item.children, pathname));
  const active = isGroupActive(item.children, pathname);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
          active ? 'text-gold-400' : 'text-ink-300'
        }`}
      >
        <span className="flex items-center gap-3">
          <NavIcon name={item.icon} className="w-5 h-5" />
          {item.label}
        </span>
        <NavIcon name="chevron" className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="ml-4 pl-4 border-l border-ink-800/50 space-y-0.5 pb-1">
          {item.children.map(child => (
            <Link
              key={child.to}
              to={child.to}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
                isLinkActive(child.to, pathname)
                  ? 'text-gold-400 bg-gold-500/10 font-medium'
                  : 'text-ink-400 hover:text-ink-100 active:bg-ink-800/50'
              }`}
            >
              <NavIcon name={child.icon} className="w-4 h-4" />
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
