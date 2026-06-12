import api from './client.js';
import type { MatchupNote, CreateMatchupNoteRequest, UpdateMatchupNoteRequest } from '@lorcana/shared';

export async function listMatchupNotes(): Promise<MatchupNote[]> {
  const res = await api.get('/matchup-notes');
  return res.data.notes;
}

/** Upsert: creates or updates the note for the given opponent color combination. */
export async function upsertMatchupNote(data: CreateMatchupNoteRequest): Promise<MatchupNote> {
  const res = await api.post('/matchup-notes', data);
  return res.data.note;
}

export async function updateMatchupNote(id: string, data: UpdateMatchupNoteRequest): Promise<MatchupNote> {
  const res = await api.put(`/matchup-notes/${id}`, data);
  return res.data.note;
}

export async function deleteMatchupNote(id: string): Promise<void> {
  await api.delete(`/matchup-notes/${id}`);
}
