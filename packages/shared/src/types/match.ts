import type { InkColor, MatchResult } from '../constants/lorcana.js';

export interface Game {
  id: string;
  roundId: string;
  gameNumber: number;
  result: MatchResult;
  wentFirst: boolean | null;
  myScore: number;
  opponentScore: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Round {
  id: string;
  tournamentId: string;
  roundNumber: number;
  isTopCut: boolean;
  opponentName: string | null;
  opponentDeckColors: InkColor[];
  result: MatchResult;
  notes: string | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  games?: Game[];
}

export interface CreateRoundRequest {
  roundNumber: number;
  isTopCut?: boolean;
  opponentName?: string;
  opponentDeckColors?: InkColor[];
  result: MatchResult;
  notes?: string;
  photoUrl?: string;
  games?: CreateGameInput[];
}

export interface CreateGameInput {
  gameNumber: number;
  result: MatchResult;
  wentFirst?: boolean;
  myScore: number;
  opponentScore: number;
  notes?: string;
}

export interface UpdateRoundRequest extends Partial<Omit<CreateRoundRequest, 'games' | 'photoUrl'>> {
  games?: CreateGameInput[];
  photoUrl?: string | null;
}
