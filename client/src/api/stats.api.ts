import api from './client.js';
import type { OverviewStats, MatchupStat, DeckPerformance, GoingFirstStats, DeckStats, Deck } from '@lorcana/shared';

export interface DateFilter {
  from?: string;
  to?: string;
}

function dateParams(filter?: DateFilter) {
  if (!filter) return {};
  const params: Record<string, string> = {};
  if (filter.from) params.from = filter.from;
  if (filter.to) params.to = filter.to;
  return { params };
}

export async function getOverview(filter?: DateFilter): Promise<OverviewStats> {
  const res = await api.get('/stats/overview', dateParams(filter));
  return res.data;
}

export async function getMatchups(filter?: DateFilter): Promise<MatchupStat[]> {
  const res = await api.get('/stats/matchups', dateParams(filter));
  return res.data.matchups;
}

export async function getDeckPerformance(filter?: DateFilter): Promise<DeckPerformance[]> {
  const res = await api.get('/stats/deck-performance', dateParams(filter));
  return res.data.deckStats;
}

export async function getGoingFirstStats(filter?: DateFilter): Promise<GoingFirstStats> {
  const res = await api.get('/stats/going-first', dateParams(filter));
  return res.data;
}

export async function getTournamentHistory(filter?: DateFilter): Promise<any[]> {
  const res = await api.get('/stats/tournament-history', dateParams(filter));
  return res.data.history;
}

export async function getDeckStatsById(deckId: string, filter?: DateFilter): Promise<DeckStats & { deck: Deck }> {
  const res = await api.get(`/stats/deck/${deckId}`, dateParams(filter));
  return res.data;
}
