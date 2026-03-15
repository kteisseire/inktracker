import api from './client.js';
import type { Round, CreateRoundRequest, UpdateRoundRequest } from '@lorcana/shared';

export async function listRounds(tournamentId: string): Promise<Round[]> {
  const res = await api.get(`/tournaments/${tournamentId}/rounds`);
  return res.data.rounds;
}

export async function createRound(tournamentId: string, data: CreateRoundRequest): Promise<Round> {
  const res = await api.post(`/tournaments/${tournamentId}/rounds`, data);
  return res.data.round;
}

export async function updateRound(tournamentId: string, id: string, data: UpdateRoundRequest): Promise<Round> {
  const res = await api.put(`/tournaments/${tournamentId}/rounds/${id}`, data);
  return res.data.round;
}

export async function deleteRound(tournamentId: string, id: string): Promise<void> {
  await api.delete(`/tournaments/${tournamentId}/rounds/${id}`);
}
