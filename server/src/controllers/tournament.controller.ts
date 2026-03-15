import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

const tournamentInclude = {
  rounds: {
    orderBy: [{ isTopCut: 'asc' as const }, { roundNumber: 'asc' as const }],
    include: { games: { orderBy: { gameNumber: 'asc' as const } } },
  },
  deck: true,
};

export async function listTournaments(req: AuthRequest, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
  const skip = (page - 1) * limit;

  const [tournaments, total] = await Promise.all([
    prisma.tournament.findMany({
      where: { userId: req.userId },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
      include: tournamentInclude,
    }),
    prisma.tournament.count({ where: { userId: req.userId } }),
  ]);

  res.json({ tournaments, total, page, limit });
}

export async function getTournament(req: AuthRequest, res: Response) {
  let tournament = await prisma.tournament.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: tournamentInclude,
  });

  if (!tournament) {
    res.status(404).json({ error: 'Tournoi non trouvé' });
    return;
  }

  // Auto-link deck for legacy tournaments without deckId
  if (!tournament.deckId && tournament.myDeckColors.length > 0) {
    const existingDeck = await prisma.deck.findFirst({
      where: {
        userId: req.userId!,
        colors: { equals: tournament.myDeckColors },
        ...(tournament.myDeckLink ? { link: tournament.myDeckLink } : {}),
      },
    });

    if (existingDeck) {
      await prisma.tournament.update({
        where: { id: tournament.id },
        data: { deckId: existingDeck.id },
      });
      tournament = await prisma.tournament.findFirst({
        where: { id: req.params.id, userId: req.userId },
        include: tournamentInclude,
      }) as typeof tournament;
    }
  }

  res.json({ tournament });
}

export async function createTournament(req: AuthRequest, res: Response) {
  const { myDeckColors, myDeckLink, deckId, ...rest } = req.body;
  let resolvedDeckId = deckId || null;

  // Auto-create or find matching deck if no deckId provided
  if (!resolvedDeckId && myDeckColors && myDeckColors.length > 0) {
    // Look for an existing deck with the same colors (and link if provided)
    const existing = await prisma.deck.findFirst({
      where: {
        userId: req.userId!,
        colors: { equals: myDeckColors },
        ...(myDeckLink ? { link: myDeckLink } : {}),
      },
    });

    if (existing) {
      resolvedDeckId = existing.id;
    } else {
      // Auto-create a new deck
      const colorNames: Record<string, string> = {
        AMBER: 'Ambre', AMETHYST: 'Améthyste', EMERALD: 'Émeraude',
        RUBY: 'Rubis', SAPPHIRE: 'Saphir', STEEL: 'Acier',
      };
      const autoName = (myDeckColors as string[]).map(c => colorNames[c] || c).join(' / ');
      const newDeck = await prisma.deck.create({
        data: {
          userId: req.userId!,
          name: autoName,
          colors: myDeckColors,
          link: myDeckLink || null,
        },
      });
      resolvedDeckId = newDeck.id;
    }
  }

  const tournament = await prisma.tournament.create({
    data: {
      ...rest,
      myDeckColors: myDeckColors || [],
      myDeckLink: myDeckLink || null,
      deckId: resolvedDeckId,
      date: new Date(req.body.date),
      userId: req.userId!,
    },
  });
  res.status(201).json({ tournament });
}

export async function updateTournament(req: AuthRequest, res: Response) {
  const existing = await prisma.tournament.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) {
    res.status(404).json({ error: 'Tournoi non trouvé' });
    return;
  }

  const data = { ...req.body };
  if (data.date) data.date = new Date(data.date);

  const tournament = await prisma.tournament.update({
    where: { id: req.params.id },
    data,
  });
  res.json({ tournament });
}

export async function deleteTournament(req: AuthRequest, res: Response) {
  const existing = await prisma.tournament.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) {
    res.status(404).json({ error: 'Tournoi non trouvé' });
    return;
  }

  await prisma.tournament.delete({ where: { id: req.params.id } });
  res.status(204).send();
}
