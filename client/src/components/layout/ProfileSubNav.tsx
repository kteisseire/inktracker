import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';

export function ProfileSubNav() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const tabs = [
    { to: '/profile', label: 'Profil' },
    { to: '/teams', label: 'Mes équipes' },
    ...(user?.isAdmin ? [{ to: '/admin', label: 'Admin' }] : []),
  ];
  return (
    <div className="flex gap-1 border-b border-ink-800/50 mb-6">
      {tabs.map(tab => {
        const active = tab.to === '/profile'
          ? pathname === '/profile'
          : pathname === tab.to || pathname.startsWith(tab.to + '/');
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
