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
  /**
   * Optional named archetype for this deck (e.g. "Amber/Steel Aggro").
   * When present, grouping is done by colors + archetypeName; when absent
   * (legacy data), grouping falls back to colors alone. Optional for
   * backward compatibility with clients built before this field existed.
   */
  archetypeName?: string | null;
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

/**
 * One row of the community metagame overview: an opponent deck color
 * combination (optionally with a named archetype, when enough scout report
 * data is available), aggregated anonymously across all users' rounds.
 */
export interface MetagameEntry {
  opponentDeckColors: InkColor[];
  /**
   * Most common named archetype reported (via ScoutReport) for this color
   * combination in the selected date range, if any. Null when no archetype
   * data is available — clients should fall back to displaying colors only.
   */
  archetypeName?: string | null;
  /** Total rounds played against this combination across all users. */
  total: number;
  wins: number;
  losses: number;
  draws: number;
  /** Win rate (%) from the reporters' point of view, i.e. against this combination. */
  winRate: number;
  /** Share (%) of this combination among all rounds in the response (metagame presence). */
  metaShare: number;
}

/**
 * Anonymized, community-wide metagame snapshot. No userId, username, or any
 * other identifying information is included. Combinations with fewer than
 * `MIN_ROUNDS_THRESHOLD` (5) total rounds are excluded as noise.
 */
export interface MetagameOverview {
  /** Total rounds considered (after filtering out low-sample combinations). */
  totalRounds: number;
  /** Minimum number of rounds required for a combination to be included. */
  minRoundsThreshold: number;
  entries: MetagameEntry[];
}
