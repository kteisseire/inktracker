import type { InkColor } from '../constants/lorcana.js';

/**
 * A personal note describing how to play against a given opponent deck
 * color combination (e.g. matchup tips, sideboard plans, key cards to watch).
 * Unique per user + opponent color combination.
 */
export interface MatchupNote {
  id: string;
  userId: string;
  opponentColors: InkColor[];
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMatchupNoteRequest {
  opponentColors: InkColor[];
  content: string;
}

export interface UpdateMatchupNoteRequest {
  opponentColors?: InkColor[];
  content?: string;
}
