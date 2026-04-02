import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';

function isActive(paths: string[], pathname: string) {
  return paths.some(p => p === '/' ? pathname === '/' : pathname.startsWith(p));
}

export function BottomNav() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  if (!user) {
    const toolsActive = isActive(['/top-cut', '/lore-counter', '/help'], pathname);
    return (
      <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-gold-500/15 safe-area-pb" style={{ background: 'linear-gradient(0deg, rgba(8,6,15,0.98) 0%, rgba(14,11,30,0.96) 100%)', backdropFilter: 'blur(20px)', boxShadow: '0 -1px 0 rgba(212,163,36,0.08), 0 -4px 24px rgba(0,0,0,0.5)' }}>
        <div className="flex items-stretch h-16">
          <Link
            to="/top-cut"
            className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors active:scale-95"
            style={{ color: toolsActive ? 'rgb(234 179 8)' : 'rgba(255,255,255,0.35)' }}
          >
            <div style={{ transform: toolsActive ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.15s' }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span style={{ fontSize: '0.6rem', fontWeight: toolsActive ? 600 : 400, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Outils
            </span>
            {toolsActive && <div className="absolute bottom-0 w-8 h-0.5 rounded-full bg-gold-400" />}
          </Link>
          <Link
            to="/login"
            className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors active:scale-95"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            <span style={{ fontSize: '0.6rem', fontWeight: 400, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Connexion
            </span>
          </Link>
        </div>
      </nav>
    );
  }

  const items = [
    {
      to: '/tournaments',
      label: 'Tournois',
      paths: ['/tournaments'],
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h14l-1.4 8.4A5 5 0 0112.6 16h-.8a5 5 0 01-5-4.6L5 3zM8 16h8m-4 0v4m-3 0h6" />
        </svg>
      ),
    },
    {
      to: '/decks',
      label: 'Decks',
      paths: ['/decks', '/stats'],
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      to: '/top-cut',
      label: 'Outils',
      paths: ['/top-cut', '/lore-counter', '/help'],
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      to: '/profile',
      label: 'Profil',
      paths: ['/profile', '/teams', '/admin'],
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-gold-500/15 safe-area-pb" style={{ background: 'linear-gradient(0deg, rgba(8,6,15,0.98) 0%, rgba(14,11,30,0.96) 100%)', backdropFilter: 'blur(20px)', boxShadow: '0 -1px 0 rgba(212,163,36,0.08), 0 -4px 24px rgba(0,0,0,0.5)' }}>
      <div className="flex items-stretch h-16">
        {items.map(item => {
          const active = isActive(item.paths, pathname);
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors active:scale-95"
              style={{ color: active ? 'rgb(234 179 8)' : 'rgba(255,255,255,0.35)' }}
            >
              <div style={{ transform: active ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.15s' }}>
                {item.icon}
              </div>
              <span style={{
                fontSize: '0.6rem',
                fontWeight: active ? 600 : 400,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}>
                {item.label}
              </span>
              {active && (
                <div className="absolute bottom-0 w-8 h-0.5 rounded-full bg-gold-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
