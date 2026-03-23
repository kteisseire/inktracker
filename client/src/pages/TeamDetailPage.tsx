import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext.js';
import {
  getTeam, updateTeam, deleteTeam,
  inviteMember, cancelInvite,
  updateMemberRole, removeMember, searchUsers,
  generateInviteCode,
} from '../api/team.api.js';
import { getQrCodeUrl } from '../lib/qrcode.js';
import type { Team, TeamMember, TeamInvite, TeamRole } from '@lorcana/shared';

const ROLE_LABELS: Record<string, string> = { OWNER: 'Propriétaire', ADMIN: 'Admin', MEMBER: 'Membre' };
const ROLE_STYLES: Record<string, string> = {
  OWNER: 'bg-gold-500/15 text-gold-400',
  ADMIN: 'bg-lorcana-sapphire/15 text-lorcana-sapphire',
  MEMBER: 'bg-ink-700/50 text-ink-400',
};

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: team = null, isLoading: loading } = useQuery({
    queryKey: ['team', id],
    queryFn: () => getTeam(id!),
    enabled: !!id,
  });

  const reload = () => queryClient.invalidateQueries({ queryKey: ['team', id] });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-400"></div>
      </div>
    );
  }

  if (!team) return null;

  const isOwner = team.myRole === 'OWNER';
  const isAdmin = team.myRole === 'ADMIN' || isOwner;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <TeamHeader team={team} isOwner={isOwner} isAdmin={isAdmin} onUpdated={reload} onDeleted={() => navigate('/teams')} />

      {/* QR Invite link */}
      {isAdmin && <InviteLink teamId={team.id} />}

      {/* Invite section */}
      {isAdmin && <InviteSection teamId={team.id} onInvited={reload} />}

      {/* Pending invites (visible to admin) */}
      {isAdmin && team.invites && team.invites.length > 0 && (
        <PendingInvites invites={team.invites} teamId={team.id} onChanged={reload} />
      )}

      {/* Members */}
      <MembersList
        members={team.members || []}
        teamId={team.id}
        isOwner={isOwner}
        isAdmin={isAdmin}
        currentUserId={user?.id || ''}
        onChanged={reload}
      />
    </div>
  );
}

// ─── Header ───
function TeamHeader({ team, isOwner, isAdmin, onUpdated, onDeleted }: {
  team: Team; isOwner: boolean; isAdmin: boolean; onUpdated: () => void; onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await updateTeam(team.id, { name: name.trim(), description: description.trim() || undefined });
      setEditing(false);
      onUpdated();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer cette équipe ? Tous les membres seront retirés.')) return;
    await deleteTeam(team.id);
    onDeleted();
  };

  if (editing) {
    return (
      <div className="ink-card p-4 sm:p-5 space-y-4">
        {error && <div className="ink-error">{error}</div>}
        <div>
          <label className="ink-label">Nom</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="ink-input" maxLength={50} />
        </div>
        <div>
          <label className="ink-label">Description</label>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="ink-input" maxLength={200} />
        </div>
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving} className="ink-btn-primary text-sm px-4 py-2">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button onClick={() => { setEditing(false); setName(team.name); setDescription(team.description || ''); }} className="ink-btn-secondary text-sm px-4 py-2">
            Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ink-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold text-ink-100 tracking-wide truncate">{team.name}</h1>
          {team.description && <p className="text-sm text-ink-400 mt-1">{team.description}</p>}
          <p className="text-xs text-ink-500 mt-2">
            Créée le {new Date(team.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setEditing(true)} className="text-xs text-ink-400 hover:text-gold-400 transition-colors">
              Modifier
            </button>
            {isOwner && (
              <button onClick={handleDelete} className="text-xs text-red-400/70 hover:text-red-400 transition-colors">
                Supprimer
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Invite Link (QR Code) ───
function InviteLink({ teamId }: { teamId: string }) {
  const [open, setOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleOpen = async () => {
    setOpen(true);
    if (inviteUrl) return;
    setLoading(true);
    try {
      const code = await generateInviteCode(teamId);
      setInviteUrl(`${window.location.origin}/join/${code}`);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="ink-card p-4 sm:p-5 w-full flex items-center justify-center gap-2 text-sm font-medium text-ink-300 hover:text-gold-400 hover:border-gold-500/20 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        Lien d'invitation
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setOpen(false)}>
          <div className="ink-card p-5 sm:p-6 max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink-200">Inviter via QR code</h3>
              <button onClick={() => setOpen(false)} className="text-ink-500 hover:text-ink-300 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-400"></div>
              </div>
            ) : inviteUrl ? (
              <>
                <div className="flex justify-center">
                  <img
                    src={getQrCodeUrl(inviteUrl)}
                    alt="QR code d'invitation"
                    className="w-48 h-48 rounded-lg"
                  />
                </div>
                <p className="text-xs text-ink-500 text-center">
                  Scannez ce QR code pour rejoindre l'équipe
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteUrl}
                    className="ink-input text-xs flex-1"
                    onClick={e => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={handleCopy}
                    className={`shrink-0 text-xs font-medium px-3 py-2 rounded-lg transition-colors ${
                      copied
                        ? 'bg-green-500/15 text-green-400'
                        : 'bg-ink-800/80 text-ink-300 hover:text-gold-400'
                    }`}
                  >
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-red-400 text-center py-4">Erreur lors de la génération du lien</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Invite Section ───
function InviteSection({ teamId, onInvited }: { teamId: string; onInvited: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; username: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const users = await searchUsers(query.trim());
        setResults(users);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleInvite = async (username: string) => {
    setSending(true);
    setError('');
    setSuccess('');
    try {
      await inviteMember(teamId, username);
      setSuccess(`Invitation envoyée à ${username}`);
      setQuery('');
      setResults([]);
      onInvited();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="ink-card p-4 sm:p-5 space-y-3">
      <h2 className="text-sm font-semibold text-ink-300 uppercase tracking-wide">Inviter un joueur</h2>

      {error && <div className="ink-error">{error}</div>}
      {success && <div className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">{success}</div>}

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setSuccess(''); setError(''); }}
          className="ink-input"
          placeholder="Rechercher un pseudo..."
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gold-400"></div>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {results.map(u => (
            <div key={u.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-ink-900/50 hover:bg-ink-800/50 transition-colors">
              <span className="text-sm text-ink-200">{u.username}</span>
              <button
                onClick={() => handleInvite(u.username)}
                disabled={sending}
                className="text-xs text-gold-400 hover:text-gold-300 font-medium transition-colors disabled:opacity-50"
              >
                Inviter
              </button>
            </div>
          ))}
        </div>
      )}

      {query.trim().length >= 2 && !searching && results.length === 0 && (
        <p className="text-xs text-ink-500 text-center py-2">Aucun utilisateur trouvé</p>
      )}
    </div>
  );
}

// ─── Pending Invites ───
function PendingInvites({ invites, teamId, onChanged }: { invites: TeamInvite[]; teamId: string; onChanged: () => void }) {
  const handleCancel = async (inviteId: string) => {
    await cancelInvite(teamId, inviteId);
    onChanged();
  };

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-ink-400 uppercase tracking-wide">Invitations en attente</h2>
      {invites.map(inv => (
        <div key={inv.id} className="ink-card px-3 sm:px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-200">{inv.user.username}</span>
            <span className="text-[10px] text-ink-500 bg-ink-800/50 px-1.5 py-0.5 rounded-full">En attente</span>
          </div>
          <button
            onClick={() => handleCancel(inv.id)}
            className="text-xs text-red-400/70 hover:text-red-400 transition-colors"
          >
            Annuler
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Members List ───
function MembersList({ members, teamId, isOwner, isAdmin, currentUserId, onChanged }: {
  members: TeamMember[]; teamId: string; isOwner: boolean; isAdmin: boolean; currentUserId: string; onChanged: () => void;
}) {
  const handleRoleChange = async (memberId: string, newRole: TeamRole) => {
    await updateMemberRole(teamId, memberId, newRole);
    onChanged();
  };

  const handleRemove = async (member: TeamMember) => {
    const isSelf = member.userId === currentUserId;
    const msg = isSelf ? 'Quitter cette équipe ?' : `Retirer ${member.user.username} de l'équipe ?`;
    if (!confirm(msg)) return;
    await removeMember(teamId, member.id);
    onChanged();
  };

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-ink-400 uppercase tracking-wide">
        Membres ({members.length})
      </h2>
      <div className="space-y-1.5">
        {members.map(m => {
          const isSelf = m.userId === currentUserId;
          const canChangeRole = isOwner && !isSelf && m.role !== 'OWNER';
          const canRemove = (isOwner && !isSelf && m.role !== 'OWNER')
            || (isAdmin && !isSelf && m.role === 'MEMBER')
            || (isSelf && m.role !== 'OWNER');

          return (
            <div key={m.id} className={`ink-card px-3 sm:px-4 py-3 flex items-center justify-between gap-3 ${isSelf ? 'border-gold-500/15' : ''}`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-ink-800/80 border border-ink-700/50 flex items-center justify-center text-sm font-bold text-ink-400 shrink-0">
                  {m.user.username.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <span className={`text-sm font-medium truncate block ${isSelf ? 'text-gold-400' : 'text-ink-100'}`}>
                    {m.user.username}
                    {isSelf && <span className="text-xs text-ink-500 ml-1.5">(vous)</span>}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {canChangeRole ? (
                  <select
                    value={m.role}
                    onChange={e => handleRoleChange(m.id, e.target.value as TeamRole)}
                    className="text-xs bg-ink-800/80 border border-ink-700/50 rounded-lg px-2 py-1 text-ink-300 focus:outline-none focus:border-gold-500/30"
                  >
                    <option value="MEMBER">Membre</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                ) : (
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${ROLE_STYLES[m.role]}`}>
                    {ROLE_LABELS[m.role]}
                  </span>
                )}

                {canRemove && (
                  <button
                    onClick={() => handleRemove(m)}
                    className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
                    title={isSelf ? 'Quitter' : 'Retirer'}
                  >
                    {isSelf ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
