import api from './client.js';
import type { OverviewStats, MatchupStat, DeckPerformance, GoingFirstStats, DeckStats, Deck } from '@lorcana/shared';

export async function getOverview(): Promise<OverviewStats> {
  const res = await api.get('/stats/overview');
  return res.data;
}

export async function getMatchups(): Promise<MatchupStat[]> {
  const res = await api.get('/stats/matchups');
  return res.data.matchups;
}

export async function getDeckPerformance(): Promise<DeckPerformance[]> {
  const res = await api.get('/stats/deck-performance');
  return res.data.deckStats;
}

export async function getGoingFirstStats(): Promise<GoingFirstStats> {
  const res = await api.get('/stats/going-first');
  return res.data;
}

export async function getTournamentHistory(): Promise<any[]> {
  const res = await api.get('/stats/tournament-history');
  return res.data.history;
}

export async function getDeckStatsById(deckId: string): Promise<DeckStats & { deck: Deck }> {
  const res = await api.get(`/stats/deck/${deckId}`);
  return res.data;
}
