import api from './client.js';
import type { InkColor, Deck, CreateDeckRequest, UpdateDeckRequest } from '@lorcana/shared';

export async function extractDeckColors(url: string): Promise<InkColor[]> {
  const res = await api.post('/decks/colors', { url });
  return res.data.colors;
}

export async function listDecks(): Promise<Deck[]> {
  const res = await api.get('/decks');
  return res.data.decks;
}

export async function getDeck(id: string): Promise<Deck> {
  const res = await api.get(`/decks/${id}`);
  return res.data.deck;
}

export async function createDeck(data: CreateDeckRequest): Promise<Deck> {
  const res = await api.post('/decks', data);
  return res.data.deck;
}

export async function updateDeck(id: string, data: UpdateDeckRequest): Promise<Deck> {
  const res = await api.put(`/decks/${id}`, data);
  return res.data.deck;
}

export async function deleteDeck(id: string): Promise<void> {
  await api.delete(`/decks/${id}`);
}

export async function setDefaultDeck(id: string): Promise<Deck> {
  const res = await api.post(`/decks/${id}/default`);
  return res.data.deck;
}
