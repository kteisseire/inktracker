import { useEffect, useState } from 'react';
import { listUsers } from '../api/admin.api.js';
import { listSuggestions, deleteSuggestion, type Suggestion } from '../api/suggestion.api.js';
import { ProfileSubNav } from '../components/layout/ProfileSubNav.js';
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
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'users' | 'suggestions'>('users');

  useEffect(() => {
    Promise.all([
      listUsers().catch(() => { setError('Accès refusé'); return [] as AdminUserInfo[]; }),
      listSuggestions().catch(() => [] as Suggestion[]),
    ]).then(([u, s]) => {
      setUsers(u);
      setSuggestions(s);
    }).finally(() => setLoading(false));
  }, []);

  const handleDeleteSuggestion = async (id: string) => {
    if (!confirm('Supprimer cette suggestion ?')) return;
    await deleteSuggestion(id);
    setSuggestions(prev => prev.filter(s => s.id !== id));
  };

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
    <div>
      <ProfileSubNav />
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink-100 tracking-wide">Administration</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-ink-800/50">
        <button
          onClick={() => setTab('users')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === 'users' ? 'text-gold-400 border-gold-500' : 'text-ink-400 border-transparent hover:text-ink-200'
          }`}
        >
          Utilisateurs ({users.length})
        </button>
        <button
          onClick={() => setTab('suggestions')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === 'suggestions' ? 'text-gold-400 border-gold-500' : 'text-ink-400 border-transparent hover:text-ink-200'
          }`}
        >
          Suggestions ({suggestions.length})
        </button>
      </div>

      {tab === 'suggestions' && (
        <div className="space-y-3">
          {suggestions.length === 0 ? (
            <div className="ink-card p-8 text-center text-ink-400">Aucune suggestion pour le moment</div>
          ) : (
            suggestions.map(s => (
              <div key={s.id} className="ink-card p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-ink-100 whitespace-pre-wrap flex-1">{s.content}</p>
                  <button
                    onClick={() => handleDeleteSuggestion(s.id)}
                    className="text-ink-600 hover:text-red-400 transition-colors p-1 shrink-0"
                    title="Supprimer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-3 text-xs text-ink-500">
                  {s.user ? (
                    <span className="text-ink-300">{s.user.username} <span className="text-ink-600">({s.user.email})</span></span>
                  ) : (
                    <span className="text-ink-600 italic">Utilisateur supprimé</span>
                  )}
                  <span>{formatRelative(s.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'users' && <>
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
      </>}
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
