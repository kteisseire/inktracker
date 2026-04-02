import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listMyTeams, createTeam, listMyInvites, respondToInvite } from '../api/team.api.js';
import { HelpButton } from '../components/ui/HelpButton.js';
import { ProfileSubNav } from '../components/layout/ProfileSubNav.js';
import type { Team, TeamInvite } from '@lorcana/shared';

const ROLE_LABELS: Record<string, string> = { OWNER: 'Propriétaire', ADMIN: 'Admin', MEMBER: 'Membre' };

export function TeamsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: teams = [], isLoading: loadingTeams } = useQuery({
    queryKey: ['my-teams'],
    queryFn: listMyTeams,
  });

  const { data: invites = [], isLoading: loadingInvites } = useQuery({
    queryKey: ['my-invites'],
    queryFn: listMyInvites,
  });

  const loading = loadingTeams || loadingInvites;

  const reload = () => {
    queryClient.invalidateQueries({ queryKey: ['my-teams'] });
    queryClient.invalidateQueries({ queryKey: ['my-invites'] });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <ProfileSubNav />
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-bold text-ink-100 tracking-wide">Mes équipes</h1>
          <HelpButton sections={['Équipes']} />
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="ink-btn-primary text-sm px-4 py-2">
            + Créer
          </button>
        )}
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-ink-400 uppercase tracking-wide">Invitations en attente</h2>
          {invites.map(inv => (
            <InviteCard key={inv.id} invite={inv} onRespond={reload} />
          ))}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <CreateTeamForm
          onCreated={() => { setShowForm(false); reload(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Teams list */}
      {teams.length === 0 && !showForm ? (
        <div className="text-center py-12 text-ink-400">
          <p className="text-lg mb-2">Aucune équipe</p>
          <p className="text-sm">Créez une équipe ou attendez une invitation.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {teams.map(team => (
            <Link
              key={team.id}
              to={`/teams/${team.id}`}
              className="ink-card-hover p-4 flex items-center justify-between group"
            >
              <div className="min-w-0">
                <div className="font-semibold text-ink-100 group-hover:text-gold-400 transition-colors truncate">
                  {team.name}
                </div>
                {team.description && (
                  <p className="text-xs text-ink-500 mt-0.5 truncate">{team.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-ink-500">
                  <span>{team.memberCount} membre{(team.memberCount || 0) > 1 ? 's' : ''}</span>
                  <span className="text-ink-600">·</span>
                  <span className="text-ink-400">{ROLE_LABELS[team.myRole || 'MEMBER']}</span>
                </div>
              </div>
              <svg className="w-4 h-4 text-ink-600 group-hover:text-ink-400 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

function InviteCard({ invite, onRespond }: { invite: TeamInvite; onRespond: () => void }) {
  const [responding, setResponding] = useState(false);

  const handleRespond = async (accept: boolean) => {
    setResponding(true);
    try {
      await respondToInvite(invite.id, accept);
      onRespond();
    } finally {
      setResponding(false);
    }
  };

  return (
    <div className="ink-card p-3 sm:p-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <span className="text-sm font-medium text-ink-100">{invite.team?.name}</span>
        <p className="text-xs text-ink-500 mt-0.5">Invitation reçue</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => handleRespond(true)}
          disabled={responding}
          className="ink-btn-primary text-xs px-3 py-1.5"
        >
          Accepter
        </button>
        <button
          onClick={() => handleRespond(false)}
          disabled={responding}
          className="ink-btn-secondary text-xs px-3 py-1.5"
        >
          Refuser
        </button>
      </div>
    </div>
  );
}

function CreateTeamForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Nom requis'); return; }
    setError('');
    setSaving(true);
    try {
      await createTeam({ name: name.trim(), description: description.trim() || undefined });
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="ink-card p-4 sm:p-5 space-y-4">
      <h2 className="text-sm font-semibold text-ink-300 uppercase tracking-wide">Nouvelle équipe</h2>

      {error && <div className="ink-error">{error}</div>}

      <div>
        <label className="ink-label">Nom *</label>
        <input
          type="text"
          required
          maxLength={50}
          value={name}
          onChange={e => setName(e.target.value)}
          className="ink-input"
          placeholder="Ex: Team Lorcana Paris"
        />
      </div>

      <div>
        <label className="ink-label">Description</label>
        <input
          type="text"
          maxLength={200}
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="ink-input"
          placeholder="Optionnel"
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={saving} className="flex-1 ink-btn-primary">
          {saving ? 'Création...' : 'Créer l\'équipe'}
        </button>
        <button type="button" onClick={onCancel} className="ink-btn-secondary">
          Annuler
        </button>
      </div>
    </form>
  );
}
