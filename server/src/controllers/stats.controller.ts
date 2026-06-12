import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';
import { calculateWinRate } from '../lib/stats.js';

function dateFilter(req: AuthRequest) {
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}/;
  const filter: any = {};
  if (from && isoDateRegex.test(from)) {
    const d = new Date(from);
    if (!isNaN(d.getTime())) filter.gte = d;
  }
  if (to && isoDateRegex.test(to)) {
    const d = new Date(to);
    if (!isNaN(d.getTime())) filter.lte = d;
  }
  return Object.keys(filter).length > 0 ? { date: filter } : {};
}

export async function getOverview(req: AuthRequest, res: Response) {
  const df = dateFilter(req);
  const rounds = await prisma.round.findMany({
    where: { tournament: { userId: req.userId, ...df } },
    select: { result: true },
  });

  const total = rounds.length;
  const wins = rounds.filter(r => r.result === 'WIN').length;
  const losses = rounds.filter(r => r.result === 'LOSS').length;
  const draws = rounds.filter(r => r.result === 'DRAW').length;
  const totalTournaments = await prisma.tournament.count({ where: { userId: req.userId, ...df } });

  res.json({
    totalTournaments,
    totalRounds: total,
    overallWinRate: calculateWinRate(wins, total),
    wins,
    losses,
    draws,
  });
}

export async function getMatchups(req: AuthRequest, res: Response) {
  const df = dateFilter(req);
  const rounds = await prisma.round.findMany({
    where: { tournament: { userId: req.userId, ...df } },
    select: { opponentDeckColors: true, result: true },
  });

  const matchupMap = new Map<string, { wins: number; losses: number; draws: number }>();

  for (const round of rounds) {
    const key = [...round.opponentDeckColors].sort().join('/');
    const entry = matchupMap.get(key) || { wins: 0, losses: 0, draws: 0 };
    if (round.result === 'WIN') entry.wins++;
    else if (round.result === 'LOSS') entry.losses++;
    else entry.draws++;
    matchupMap.set(key, entry);
  }

  const matchups = Array.from(matchupMap.entries()).map(([key, stats]) => {
    const total = stats.wins + stats.losses + stats.draws;
    return {
      opponentDeckColors: key.split('/'),
      ...stats,
      total,
      winRate: calculateWinRate(stats.wins, total),
    };
  });

  res.json({ matchups });
}

export async function getDeckPerformance(req: AuthRequest, res: Response) {
  const df = dateFilter(req);
  const tournaments = await prisma.tournament.findMany({
    where: { userId: req.userId, ...df },
    select: {
      myDeckColors: true,
      rounds: { select: { result: true } },
    },
  });

  const deckMap = new Map<string, { tournaments: number; wins: number; losses: number; draws: number }>();

  for (const t of tournaments) {
    const key = [...t.myDeckColors].sort().join('/');
    const entry = deckMap.get(key) || { tournaments: 0, wins: 0, losses: 0, draws: 0 };
    entry.tournaments++;
    for (const r of t.rounds) {
      if (r.result === 'WIN') entry.wins++;
      else if (r.result === 'LOSS') entry.losses++;
      else entry.draws++;
    }
    deckMap.set(key, entry);
  }

  const deckStats = Array.from(deckMap.entries()).map(([key, stats]) => {
    const total = stats.wins + stats.losses + stats.draws;
    return {
      deckColors: key.split('/'),
      ...stats,
      total,
      winRate: calculateWinRate(stats.wins, total),
    };
  });

  res.json({ deckStats });
}

export async function getGoingFirstStats(req: AuthRequest, res: Response) {
  const df = dateFilter(req);
  const games = await prisma.game.findMany({
    where: {
      round: { tournament: { userId: req.userId, ...df } },
      wentFirst: { not: null },
    },
    select: { wentFirst: true, result: true },
  });

  const first = games.filter(g => g.wentFirst === true);
  const second = games.filter(g => g.wentFirst === false);

  const firstWins = first.filter(g => g.result === 'WIN').length;
  const secondWins = second.filter(g => g.result === 'WIN').length;

  res.json({
    firstWinRate: calculateWinRate(firstWins, first.length),
    secondWinRate: calculateWinRate(secondWins, second.length),
    firstTotal: first.length,
    secondTotal: second.length,
  });
}

export async function getDeckStats(req: AuthRequest, res: Response) {
  const deckId = req.params.deckId;

  const deck = await prisma.deck.findFirst({
    where: { id: deckId, userId: req.userId },
  });
  if (!deck) {
    res.status(404).json({ error: 'Deck non trouvé' });
    return;
  }

  // Find tournaments played with this deck (by deckId or matching colors+link)
  const df = dateFilter(req);
  const tournaments = await prisma.tournament.findMany({
    where: {
      userId: req.userId,
      ...df,
      OR: [
        { deckId },
        { myDeckColors: { equals: deck.colors }, ...(deck.link ? { myDeckLink: deck.link } : {}) },
      ],
    },
    orderBy: { date: 'asc' },
    include: {
      rounds: {
        select: {
          result: true,
          opponentDeckColors: true,
          games: { select: { wentFirst: true, result: true } },
        },
      },
    },
  });

  // Overview
  const allRounds = tournaments.flatMap(t => t.rounds);
  const totalRounds = allRounds.length;
  const wins = allRounds.filter(r => r.result === 'WIN').length;
  const losses = allRounds.filter(r => r.result === 'LOSS').length;
  const draws = allRounds.filter(r => r.result === 'DRAW').length;

  const overview = {
    totalTournaments: tournaments.length,
    totalRounds,
    overallWinRate: calculateWinRate(wins, totalRounds),
    wins,
    losses,
    draws,
  };

  // Matchups
  const matchupMap = new Map<string, { wins: number; losses: number; draws: number }>();
  for (const round of allRounds) {
    const key = [...round.opponentDeckColors].sort().join('/');
    const entry = matchupMap.get(key) || { wins: 0, losses: 0, draws: 0 };
    if (round.result === 'WIN') entry.wins++;
    else if (round.result === 'LOSS') entry.losses++;
    else entry.draws++;
    matchupMap.set(key, entry);
  }
  const matchups = Array.from(matchupMap.entries()).map(([key, stats]) => {
    const total = stats.wins + stats.losses + stats.draws;
    return { opponentDeckColors: key.split('/'), ...stats, total, winRate: calculateWinRate(stats.wins, total) };
  });

  // Going first
  const allGames = allRounds.flatMap(r => r.games).filter(g => g.wentFirst !== null);
  const first = allGames.filter(g => g.wentFirst === true);
  const second = allGames.filter(g => g.wentFirst === false);
  const firstWins = first.filter(g => g.result === 'WIN').length;
  const secondWins = second.filter(g => g.result === 'WIN').length;
  const goingFirst = {
    firstWinRate: calculateWinRate(firstWins, first.length),
    secondWinRate: calculateWinRate(secondWins, second.length),
    firstTotal: first.length,
    secondTotal: second.length,
  };

  // Tournament history
  const history = tournaments.map(t => {
    const w = t.rounds.filter(r => r.result === 'WIN').length;
    const total = t.rounds.length;
    return {
      id: t.id, name: t.name, date: t.date,
      playerCount: t.playerCount, placement: t.placement,
      wins: w,
      losses: t.rounds.filter(r => r.result === 'LOSS').length,
      draws: t.rounds.filter(r => r.result === 'DRAW').length,
      totalRounds: total,
      winRate: calculateWinRate(w, total),
    };
  });

  res.json({ deck, overview, matchups, goingFirst, history });
}

export async function getTournamentHistory(req: AuthRequest, res: Response) {
  const df = dateFilter(req);
  const tournaments = await prisma.tournament.findMany({
    where: { userId: req.userId, ...df },
    orderBy: { date: 'asc' },
    select: {
      id: true,
      name: true,
      date: true,
      playerCount: true,
      placement: true,
      myDeckColors: true,
      rounds: { select: { result: true } },
    },
  });

  const history = tournaments.map(t => {
    const wins = t.rounds.filter(r => r.result === 'WIN').length;
    const total = t.rounds.length;
    return {
      id: t.id,
      name: t.name,
      date: t.date,
      playerCount: t.playerCount,
      placement: t.placement,
      myDeckColors: t.myDeckColors,
      wins,
      losses: t.rounds.filter(r => r.result === 'LOSS').length,
      draws: t.rounds.filter(r => r.result === 'DRAW').length,
      totalRounds: total,
      winRate: calculateWinRate(wins, total),
    };
  });

  res.json({ history });
}
