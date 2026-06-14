import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, ChevronRight, Plus } from 'lucide-react';
import { listMyTeams, createTeam, listMyInvites, respondToInvite } from '../api/team.api.js';
import { HelpButton } from '../components/ui/HelpButton.js';
import { RoleBadge } from '../components/ui/RoleBadge.js';
import { SkeletonRows } from '../components/ui/Skeleton.js';
import { ErrorAlert } from '../components/ui/ErrorAlert.js';
import { useToast } from '../components/ui/Toast.js';
import { ProfileSubNav } from '../components/layout/ProfileSubNav.js';
import type { TeamInvite } from '@lorcana/shared';

export function TeamsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
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

  return (
    <div className="max-w-2xl mx-auto">
      <ProfileSubNav />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl text-ink-50 tracking-[0.03em]">Mes équipes</h1>
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
            <h2 className="rubric-label">Invitations en attente</h2>
            {invites.map(inv => (
              <InviteCard key={inv.id} invite={inv} onRespond={reload} onToast={toast} />
            ))}
          </div>
        )}

        {/* Create form */}
        {showForm && (
          <CreateTeamForm
            onCreated={(msg) => { setShowForm(false); reload(); toast(msg, 'success'); }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Teams list */}
        {loading ? (
          <SkeletonRows count={3} />
        ) : teams.length === 0 && !showForm ? (
          <div className="section-wash flex flex-col items-center text-center py-12 gap-3">
            <span className="grid place-items-center w-14 h-14 rounded-2xl bg-gold-400/10 text-gold-400 shadow-edge-lit">
              <Users className="w-7 h-7" strokeWidth={1.6} />
            </span>
            <p className="font-display text-lg text-ink-50 tracking-[0.02em]">Aucune équipe</p>
            <p className="text-sm text-ink-500">Créez une équipe ou attendez une invitation.</p>
            <button onClick={() => setShowForm(true)} className="ink-btn-primary text-sm px-4 py-2 mt-1 inline-flex items-center gap-1.5">
              <Plus className="w-4 h-4" strokeWidth={2.2} /> Créer une équipe
            </button>
          </div>
        ) : teams.length > 0 ? (
          <div className="ink-card divide-y divide-rule overflow-hidden">
            {teams.map(team => (
              <Link
                key={team.id}
                to={`/teams/${team.id}`}
                className="row-tappable flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-ink-800/40 transition-colors group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-[0.95rem] tracking-[0.02em] text-ink-100 group-hover:text-gold-400 transition-colors truncate">
                      {team.name}
                    </span>
                    <RoleBadge role={team.myRole} />
                  </div>
                  {team.description && (
                    <p className="text-xs text-ink-500 mt-0.5 truncate">{team.description}</p>
                  )}
                  <p className="text-xs text-ink-500 mt-1">
                    <span className="ink-num">{team.memberCount}</span> membre{(team.memberCount || 0) > 1 ? 's' : ''}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-600 group-hover:text-ink-400 transition-colors shrink-0" strokeWidth={2} />
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function InviteCard({ invite, onRespond, onToast }: { invite: TeamInvite; onRespond: () => void; onToast: (msg: string, type: 'success' | 'error') => void }) {
  const [responding, setResponding] = useState(false);

  const handleRespond = async (accept: boolean) => {
    setResponding(true);
    try {
      await respondToInvite(invite.id, accept);
      onToast(accept ? 'Invitation acceptée' : 'Invitation refusée', 'success');
      onRespond();
    } catch {
      onToast('Erreur lors de la réponse', 'error');
    } finally {
      setResponding(false);
    }
  };

  return (
    <div className="ink-card border-l-2 border-l-lorcana-emerald/70 p-3 sm:p-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <span className="font-display text-[0.95rem] tracking-[0.02em] text-ink-100">{invite.team?.name}</span>
        <p className="text-xs text-lorcana-emerald/80 mt-0.5">Invitation reçue</p>
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

function CreateTeamForm({ onCreated, onCancel }: { onCreated: (msg: string) => void; onCancel: () => void }) {
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
      onCreated('Équipe créée');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="ink-card p-4 sm:p-5 space-y-4">
      <h2 className="rubric-label">Nouvelle équipe</h2>

      {error && <ErrorAlert message={error} />}

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
