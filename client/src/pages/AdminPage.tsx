import { useEffect, useState } from 'react';
import { listUsers } from '../api/admin.api.js';
import type { AdminUserInfo } from '@lorcana/shared';

function formatRelative(dateStr: string): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `il y a ${diffD}j`;
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

export function AdminPage() {
  const [users, setUsers] = useState<AdminUserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listUsers()
      .then(setUsers)
      .catch(() => setError('Accès refusé'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-400"></div></div>;
  }

  if (error) {
    return (
      <div className="ink-card p-8 text-center text-red-400">
        <p className="text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink-100 tracking-wide">Administration</h1>
        <span className="text-sm text-ink-400">{users.length} utilisateur{users.length > 1 ? 's' : ''}</span>
      </div>

      {/* Desktop table */}
      <div className="ink-card overflow-hidden hidden md:block">
        <table className="w-full text-sm">
          <thead className="bg-ink-800/50 text-ink-400 uppercase text-xs">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Utilisateur</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-center px-4 py-3 font-medium">Connexion</th>
              <th className="text-center px-4 py-3 font-medium">Tournois</th>
              <th className="text-center px-4 py-3 font-medium">Decks</th>
              <th className="text-center px-4 py-3 font-medium">Équipes</th>
              <th className="text-left px-4 py-3 font-medium">Dernière connexion</th>
              <th className="text-left px-4 py-3 font-medium">Inscription</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800/30">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-ink-800/20 transition-colors">
                <td className="px-4 py-3 font-medium text-ink-100">{u.username}</td>
                <td className="px-4 py-3 text-ink-300">{u.email}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-1.5">
                    {u.hasPassword && <AuthBadge label="Email" />}
                    {u.hasGoogle && <AuthBadge label="Google" />}
                    {u.hasDiscord && <AuthBadge label="Discord" />}
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-ink-300">{u.tournamentsCount}</td>
                <td className="px-4 py-3 text-center text-ink-300">{u.decksCount}</td>
                <td className="px-4 py-3 text-center text-ink-300">{u.teamsCount}</td>
                <td className="px-4 py-3 text-ink-500 text-xs">{u.lastLoginAt ? formatRelative(u.lastLoginAt) : '—'}</td>
                <td className="px-4 py-3 text-ink-500 text-xs">{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {users.map(u => (
          <div key={u.id} className="ink-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-ink-100">{u.username}</span>
              <span className="text-xs text-ink-500">{new Date(u.createdAt).toLocaleDateString('fr-FR')}</span>
            </div>
            <p className="text-sm text-ink-400">{u.email}</p>
            {u.lastLoginAt && (
              <p className="text-xs text-ink-500">Dernière connexion : {formatRelative(u.lastLoginAt)}</p>
            )}
            <div className="flex items-center gap-1.5">
              {u.hasPassword && <AuthBadge label="Email" />}
              {u.hasGoogle && <AuthBadge label="Google" />}
              {u.hasDiscord && <AuthBadge label="Discord" />}
            </div>
            <div className="flex gap-4 text-xs text-ink-500">
              <span>{u.tournamentsCount} tournoi{u.tournamentsCount > 1 ? 's' : ''}</span>
              <span>{u.decksCount} deck{u.decksCount > 1 ? 's' : ''}</span>
              <span>{u.teamsCount} équipe{u.teamsCount > 1 ? 's' : ''}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuthBadge({ label }: { label: string }) {
  return (
    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-ink-800/50 text-ink-300 border border-ink-700/50">
      {label}
    </span>
  );
}
