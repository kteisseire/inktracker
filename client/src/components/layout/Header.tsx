import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';

const NAV_LINKS = [
  { to: '/', label: 'Accueil', icon: '◈' },
  { to: '/tournaments', label: 'Tournois', icon: '⚔' },
  { to: '/decks', label: 'Decks', icon: '♠' },
  { to: '/stats', label: 'Stats', icon: '▤' },
  { to: '/lore-counter', label: 'Lore', icon: '✦' },
  { to: '/top-cut', label: 'Top Cut', icon: '✂' },
];

export function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-gold-500/10 bg-ink-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-2xl">&#9670;</span>
          <span className="font-display text-xl tracking-wide">
            <span className="text-gold-400 group-hover:text-gold-300 transition-colors">Ink</span>
            <span className="text-ink-200">Tracker</span>
          </span>
        </Link>
        {user && (
          <>
            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6">
              <nav className="flex gap-1">
                {NAV_LINKS.map(link => {
                  const isActive = link.to === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(link.to);
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-gold-400 bg-gold-500/10'
                          : 'text-ink-400 hover:text-ink-100 hover:bg-ink-800/50'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="flex items-center gap-3">
                <Link to="/profile" className="text-sm text-ink-400 hover:text-gold-400 transition-colors">{user.username}</Link>
                <button onClick={logout} className="text-sm text-ink-500 hover:text-ink-300 transition-colors">
                  Déconnexion
                </button>
              </div>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-ink-400 hover:text-ink-100 transition-colors"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Mobile menu dropdown */}
      {user && menuOpen && (
        <div className="md:hidden border-t border-gold-500/10 bg-ink-950/95 backdrop-blur-md">
          <nav className="px-4 py-3 space-y-1">
            {NAV_LINKS.map(link => {
              const isActive = link.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-gold-400 bg-gold-500/10'
                      : 'text-ink-300 hover:text-ink-100 hover:bg-ink-800/50'
                  }`}
                >
                  <span className="text-base w-5 text-center">{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="px-4 py-3 border-t border-ink-800/50 flex items-center justify-between">
            <Link to="/profile" onClick={() => setMenuOpen(false)} className="text-sm text-ink-400 hover:text-gold-400 transition-colors">{user.username}</Link>
            <button onClick={() => { logout(); setMenuOpen(false); }} className="text-sm text-ink-500 hover:text-ink-300 transition-colors">
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
