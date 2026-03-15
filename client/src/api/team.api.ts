import api from './client.js';
import type { Team, TeamInvite, TeamMember, CreateTeamRequest, UpdateTeamRequest, TeamRole } from '@lorcana/shared';

export async function listMyTeams(): Promise<Team[]> {
  const res = await api.get('/teams');
  return res.data.teams;
}

export async function getTeam(id: string): Promise<Team> {
  const res = await api.get(`/teams/${id}`);
  return res.data.team;
}

export async function createTeam(data: CreateTeamRequest): Promise<Team> {
  const res = await api.post('/teams', data);
  return res.data.team;
}

export async function updateTeam(id: string, data: UpdateTeamRequest): Promise<Team> {
  const res = await api.put(`/teams/${id}`, data);
  return res.data.team;
}

export async function deleteTeam(id: string): Promise<void> {
  await api.delete(`/teams/${id}`);
}

// Invites
export async function inviteMember(teamId: string, username: string): Promise<TeamInvite> {
  const res = await api.post(`/teams/${teamId}/invites`, { username });
  return res.data.invite;
}

export async function cancelInvite(teamId: string, inviteId: string): Promise<void> {
  await api.delete(`/teams/${teamId}/invites/${inviteId}`);
}

export async function listMyInvites(): Promise<TeamInvite[]> {
  const res = await api.get('/teams/invites');
  return res.data.invites;
}

export async function respondToInvite(inviteId: string, accept: boolean): Promise<{ accepted: boolean }> {
  const res = await api.post(`/teams/invites/${inviteId}/respond`, { accept });
  return res.data;
}

// Members
export async function updateMemberRole(teamId: string, memberId: string, role: TeamRole): Promise<TeamMember> {
  const res = await api.put(`/teams/${teamId}/members/${memberId}/role`, { role });
  return res.data.member;
}

export async function removeMember(teamId: string, memberId: string): Promise<void> {
  await api.delete(`/teams/${teamId}/members/${memberId}`);
}

// User search
export async function searchUsers(q: string): Promise<{ id: string; username: string }[]> {
  const res = await api.get('/teams/users/search', { params: { q } });
  return res.data.users;
}
