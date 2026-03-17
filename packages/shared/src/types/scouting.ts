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

export interface PotentialDeck {
  id: string;
  teamId: string;
  eventId: string;
  roundNumber: number;
  tableNumber: number;
  deckColors: InkColor[];
  player1Name: string;
  player2Name: string;
  reportedById: string;
  reportedBy: { id: string; username: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreatePotentialDecksRequest {
  teamId: string;
  eventId: string;
  roundNumber: number;
  tableNumber: number;
  player1Name: string;
  player2Name: string;
  decks: InkColor[][];  // array of 2 deck color arrays
}
