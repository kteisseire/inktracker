import api from './client.js';

export interface Suggestion {
  id: string;
  content: string;
  userId: string | null;
  createdAt: string;
  user: { id: string; username: string; email: string } | null;
}

export async function submitSuggestion(content: string): Promise<void> {
  await api.post('/suggestions', { content });
}

export async function listSuggestions(): Promise<Suggestion[]> {
  const res = await api.get('/suggestions');
  return res.data.suggestions;
}

export async function deleteSuggestion(id: string): Promise<void> {
  await api.delete(`/suggestions/${id}`);
}
