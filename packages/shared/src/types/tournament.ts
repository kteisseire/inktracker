import type { InkColor, TopCut, Format } from '../constants/lorcana.js';
import type { Round } from './match.js';
import type { Deck } from './deck.js';

export interface Tournament {
  id: string;
  userId: string;
  name: string;
  location: string | null;
  date: string;
  playerCount: number | null;
  swissRounds: number;
  topCut: TopCut;
  format: Format;
  myDeckColors: InkColor[];
  myDeckLink: string | null;
  deckId: string | null;
  eventLink: string | null;
  placement: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  rounds?: Round[];
  deck?: Deck | null;
}

export interface CreateTournamentRequest {
  name: string;
  location?: string;
  date: string;
  playerCount?: number;
  swissRounds: number;
  topCut: TopCut;
  format: Format;
  myDeckColors: InkColor[];
  myDeckLink?: string;
  deckId?: string;
  eventLink?: string;
  placement?: number;
  notes?: string;
}

export interface UpdateTournamentRequest extends Partial<CreateTournamentRequest> {}
