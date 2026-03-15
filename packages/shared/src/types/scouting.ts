import type { InkColor } from '../constants/lorcana.js';

export interface ScoutReport {
  id: string;
  teamId: string;
  eventId: string;
  playerName: string;
  deckColors: InkColor[];
  reportedById: string;
  reportedBy: { id: string; username: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateScoutReportRequest {
  teamId: string;
  eventId: string;
  playerName: string;
  deckColors: InkColor[];
}

export interface BulkScoutReportRequest {
  teamId: string;
  eventId: string;
  reports: { playerName: string; deckColors: InkColor[] }[];
}
