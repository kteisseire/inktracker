import api from './client.js';

export interface RavensburgerEventInfo {
  name: string | null;
  date: string | null;
  location: string | null;
  playerCount: number | null;
  format: string | null;
  eventType: string | null;
  status: string | null;
  swissRounds?: number;
}

export interface EventStanding {
  rank: number;
  playerName: string;
  record: string;
  matchRecord: string;
  matchPoints: number;
  totalPoints: number;
  omw: number;
  gw: number;
  ogw: number;
}

export interface EventMatch {
  matchId: number;
  table: number;
  isBye: boolean;
  isDraw: boolean;
  winnerId: number | null;
  gamesWonByWinner: number | null;
  gamesWonByLoser: number | null;
  players: { playerName: string; playerId: number }[];
}

export interface EventRound {
  roundId: number;
  roundNumber: number;
  roundType: string;
  status: string;
  phaseName: string;
  standings: EventStanding[];
  matches: EventMatch[];
}

export interface EventRoundsData {
  eventId: string;
  rounds: EventRound[];
}

export async function fetchEventInfo(eventId: string): Promise<RavensburgerEventInfo> {
  const { data } = await api.get(`/ravensburger/events/${eventId}`);
  return data;
}

export async function fetchEventRounds(eventId: string, refresh = false): Promise<EventRoundsData> {
  const { data } = await api.get(`/ravensburger/events/${eventId}/rounds`, {
    params: refresh ? { refresh: '1' } : undefined,
  });
  return data;
}

/** Extract event ID from a Ravensburger Play Hub URL */
export function extractEventId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname !== 'tcg.ravensburgerplay.com') return null;
    const match = u.pathname.match(/\/events\/(\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
