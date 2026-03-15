import type { InkColor } from '../constants/lorcana.js';

export interface OverviewStats {
  totalTournaments: number;
  totalRounds: number;
  overallWinRate: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface MatchupStat {
  opponentDeckColors: InkColor[];
  wins: number;
  losses: number;
  draws: number;
  total: number;
  winRate: number;
}

export interface DeckPerformance {
  deckColors: InkColor[];
  tournaments: number;
  wins: number;
  losses: number;
  draws: number;
  total: number;
  winRate: number;
}

export interface GoingFirstStats {
  firstWinRate: number;
  secondWinRate: number;
  firstTotal: number;
  secondTotal: number;
}

export interface DeckStats {
  overview: OverviewStats;
  matchups: MatchupStat[];
  goingFirst: GoingFirstStats;
  history: {
    id: string;
    name: string;
    date: string;
    playerCount: number | null;
    placement: number | null;
    wins: number;
    losses: number;
    draws: number;
    totalRounds: number;
    winRate: number;
  }[];
}
