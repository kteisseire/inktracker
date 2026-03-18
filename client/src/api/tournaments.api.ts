import api from './client.js';
import type { Tournament, CreateTournamentRequest, UpdateTournamentRequest } from '@lorcana/shared';

export async function listTournaments(page = 1, limit = 20): Promise<{ tournaments: Tournament[]; total: number }> {
  const res = await api.get(`/tournaments?page=${page}&limit=${limit}`);
  return res.data;
}

export async function getTournament(id: string): Promise<Tournament> {
  const res = await api.get(`/tournaments/${id}`);
  return res.data.tournament;
}

export async function createTournament(data: CreateTournamentRequest): Promise<Tournament> {
  const res = await api.post('/tournaments', data);
  return res.data.tournament;
}

export async function updateTournament(id: string, data: UpdateTournamentRequest): Promise<Tournament> {
  const res = await api.put(`/tournaments/${id}`, data);
  return res.data.tournament;
}

export async function deleteTournament(id: string): Promise<void> {
  await api.delete(`/tournaments/${id}`);
}

export async function getTeamPresence(): Promise<Record<string, { count: number; members: string[] }>> {
  const res = await api.get('/tournaments/team-presence');
  return res.data.presence;
}
