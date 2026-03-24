import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

async function verifyTournamentOwnership(tournamentId: string, userId: string) {
  return prisma.tournament.findFirst({
    where: { id: tournamentId, userId },
  });
}

export async function listRounds(req: AuthRequest, res: Response) {
  const tournament = await verifyTournamentOwnership(req.params.tournamentId, req.userId!);
  if (!tournament) {
    res.status(404).json({ error: 'Tournoi non trouvé' });
    return;
  }

  const rounds = await prisma.round.findMany({
    where: { tournamentId: req.params.tournamentId },
    include: { games: { orderBy: { gameNumber: 'asc' } } },
    orderBy: [{ isTopCut: 'asc' }, { roundNumber: 'asc' }],
  });
  res.json({ rounds });
}

export async function createRound(req: AuthRequest, res: Response) {
  const tournament = await verifyTournamentOwnership(req.params.tournamentId, req.userId!);
  if (!tournament) {
    res.status(404).json({ error: 'Tournoi non trouvé' });
    return;
  }

  const { games = [], ...roundData } = req.body;
  const { roundNumber, isTopCut, opponentName, opponentDeckColors, result, notes, photoUrl } = roundData;

  const round = await prisma.round.create({
    data: {
      roundNumber, isTopCut, opponentName, opponentDeckColors, result, notes, photoUrl,
      tournamentId: req.params.tournamentId,
      ...(games.length > 0 && { games: { create: games } }),
    },
    include: { games: { orderBy: { gameNumber: 'asc' } } },
  });
  res.status(201).json({ round });
}

export async function updateRound(req: AuthRequest, res: Response) {
  const tournament = await verifyTournamentOwnership(req.params.tournamentId, req.userId!);
  if (!tournament) {
    res.status(404).json({ error: 'Tournoi non trouvé' });
    return;
  }

  const existing = await prisma.round.findFirst({
    where: { id: req.params.id, tournamentId: req.params.tournamentId },
  });
  if (!existing) {
    res.status(404).json({ error: 'Ronde non trouvée' });
    return;
  }

  const { games, ...roundData } = req.body;
  const { roundNumber: rn, isTopCut: tc, opponentName: on, opponentDeckColors: odc, result: rs, notes: nt, photoUrl: pu } = roundData;

  const round = await prisma.round.update({
    where: { id: req.params.id },
    data: {
      ...(rn !== undefined && { roundNumber: rn }),
      ...(tc !== undefined && { isTopCut: tc }),
      ...(on !== undefined && { opponentName: on }),
      ...(odc !== undefined && { opponentDeckColors: odc }),
      ...(rs !== undefined && { result: rs }),
      ...(nt !== undefined && { notes: nt }),
      ...(pu !== undefined && { photoUrl: pu }),
      ...(games && {
        games: {
          deleteMany: {},
          create: games,
        },
      }),
    },
    include: { games: { orderBy: { gameNumber: 'asc' } } },
  });
  res.json({ round });
}

export async function deleteRound(req: AuthRequest, res: Response) {
  const tournament = await verifyTournamentOwnership(req.params.tournamentId, req.userId!);
  if (!tournament) {
    res.status(404).json({ error: 'Tournoi non trouvé' });
    return;
  }

  const existing = await prisma.round.findFirst({
    where: { id: req.params.id, tournamentId: req.params.tournamentId },
  });
  if (!existing) {
    res.status(404).json({ error: 'Ronde non trouvée' });
    return;
  }

  await prisma.round.delete({ where: { id: req.params.id } });
  res.status(204).send();
}
