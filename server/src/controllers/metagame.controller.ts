import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';
import { calculateWinRate } from '../lib/stats.js';

/** Minimum number of rounds for a color combination to be included (avoids noise from small samples). */
const MIN_ROUNDS_THRESHOLD = 5;

/** Build a date range filter compatible with Prisma `gte`/`lte`, from `?from=` and `?to=` query params. */
function dateRangeFilter(req: AuthRequest) {
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}/;
  const filter: { gte?: Date; lte?: Date } = {};
  if (from && isoDateRegex.test(from)) {
    const d = new Date(from);
    if (!isNaN(d.getTime())) filter.gte = d;
  }
  if (to && isoDateRegex.test(to)) {
    const d = new Date(to);
    if (!isNaN(d.getTime())) filter.lte = d;
  }
  return filter;
}

/**
 * GET /api/v1/metagame/overview?from=&to=
 *
 * Anonymized, community-wide metagame snapshot aggregated across ALL users.
 * No userId, username, or other identifying information is ever included in
 * the response — only aggregate counts per opponent deck color combination.
 *
 * For each combination of opponent deck colors seen in `Round.opponentDeckColors`
 * (filtered by the tournament's date when `from`/`to` are provided):
 *  - total rounds played against it
 *  - win/loss/draw counts and win rate from the reporters' point of view
 *  - meta share (% of all rounds in range)
 *  - the most frequently reported `archetypeName` from `ScoutReport` for the
 *    same color combination, if any scout data exists
 *
 * Combinations with fewer than `MIN_ROUNDS_THRESHOLD` total rounds are excluded as noise.
 * Requires authentication, but returns only aggregated, anonymized data.
 */
export async function getMetagameOverview(req: AuthRequest, res: Response) {
  const dateRange = dateRangeFilter(req);
  const hasDateRange = Object.keys(dateRange).length > 0;

  // Fetch all rounds across all users, filtered by tournament date if requested.
  const rounds = await prisma.round.findMany({
    where: hasDateRange ? { tournament: { date: dateRange } } : {},
    select: { opponentDeckColors: true, result: true },
  });

  type ComboEntry = { wins: number; losses: number; draws: number; total: number };
  const comboMap = new Map<string, ComboEntry>();

  for (const round of rounds) {
    if (round.opponentDeckColors.length === 0) continue;
    const key = [...round.opponentDeckColors].sort().join('/');
    const entry = comboMap.get(key) || { wins: 0, losses: 0, draws: 0, total: 0 };
    if (round.result === 'WIN') entry.wins++;
    else if (round.result === 'LOSS') entry.losses++;
    else entry.draws++;
    entry.total++;
    comboMap.set(key, entry);
  }

  // Filter out low-sample combinations (noise).
  const filteredCombos = Array.from(comboMap.entries()).filter(([, stats]) => stats.total >= MIN_ROUNDS_THRESHOLD);
  const totalRounds = filteredCombos.reduce((sum, [, stats]) => sum + stats.total, 0);

  // Fetch scout reports (across all users/teams) to find the most common archetype
  // name per color combination, when available.
  const scoutReports = await prisma.scoutReport.findMany({
    where: {
      archetypeName: { not: null },
      ...(hasDateRange ? { createdAt: dateRange } : {}),
    },
    select: { deckColors: true, archetypeName: true },
  });

  const archetypeCountByCombo = new Map<string, Map<string, number>>();
  for (const report of scoutReports) {
    if (!report.archetypeName) continue;
    const key = [...report.deckColors].sort().join('/');
    const name = report.archetypeName.trim();
    if (!name) continue;
    const counts = archetypeCountByCombo.get(key) || new Map<string, number>();
    counts.set(name, (counts.get(name) || 0) + 1);
    archetypeCountByCombo.set(key, counts);
  }

  function mostCommonArchetype(key: string): string | null {
    const counts = archetypeCountByCombo.get(key);
    if (!counts || counts.size === 0) return null;
    let best: string | null = null;
    let bestCount = 0;
    for (const [name, count] of counts) {
      if (count > bestCount) {
        best = name;
        bestCount = count;
      }
    }
    return best;
  }

  const entries = filteredCombos.map(([key, stats]) => ({
    opponentDeckColors: key.split('/'),
    archetypeName: mostCommonArchetype(key),
    total: stats.total,
    wins: stats.wins,
    losses: stats.losses,
    draws: stats.draws,
    winRate: calculateWinRate(stats.wins, stats.total),
    metaShare: totalRounds > 0 ? Math.round((stats.total / totalRounds) * 1000) / 10 : 0,
  }));

  // Sort by meta share descending (most-faced combinations first).
  entries.sort((a, b) => b.metaShare - a.metaShare);

  res.json({
    totalRounds,
    minRoundsThreshold: MIN_ROUNDS_THRESHOLD,
    entries,
  });
}
