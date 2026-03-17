import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

/** Verify user is a member of the team */
async function verifyTeamMembership(teamId: string, userId: string) {
  return prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
}

/** Get all scout reports for a given event, scoped to the user's teams */
export async function getEventScoutReports(req: AuthRequest, res: Response) {
  const { eventId } = req.params;
  const teamId = req.query.teamId as string | undefined;

  const memberships = await prisma.teamMember.findMany({
    where: { userId: req.userId },
    select: { teamId: true },
  });
  const myTeamIds = memberships.map(m => m.teamId);

  if (myTeamIds.length === 0) {
    res.json({ reports: [], potentialDecks: [] });
    return;
  }

  const teamFilter = teamId && myTeamIds.includes(teamId) ? teamId : { in: myTeamIds };

  const [reports, potentialDecks] = await Promise.all([
    prisma.scoutReport.findMany({
      where: { eventId, teamId: teamFilter },
      include: {
        reportedBy: { select: { id: true, username: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.potentialDeck.findMany({
      where: { eventId, teamId: teamFilter },
      include: {
        reportedBy: { select: { id: true, username: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  res.json({ reports, potentialDecks });
}

/** Create or update a single scout report (certain deck) */
export async function upsertScoutReport(req: AuthRequest, res: Response) {
  const { teamId, eventId, playerName, deckColors } = req.body;

  const membership = await verifyTeamMembership(teamId, req.userId!);
  if (!membership) {
    res.status(403).json({ error: 'Vous n\'êtes pas membre de cette équipe' });
    return;
  }

  const report = await prisma.scoutReport.upsert({
    where: { teamId_eventId_playerName: { teamId, eventId, playerName: playerName.trim() } },
    update: {
      deckColors,
      reportedById: req.userId!,
      updatedAt: new Date(),
    },
    create: {
      teamId,
      eventId,
      playerName: playerName.trim(),
      deckColors,
      reportedById: req.userId!,
    },
    include: {
      reportedBy: { select: { id: true, username: true } },
    },
  });

  res.json({ report });
}

/** Bulk upsert scout reports */
export async function bulkUpsertScoutReports(req: AuthRequest, res: Response) {
  const { teamId, eventId, reports } = req.body;

  const membership = await verifyTeamMembership(teamId, req.userId!);
  if (!membership) {
    res.status(403).json({ error: 'Vous n\'êtes pas membre de cette équipe' });
    return;
  }

  const results = await Promise.all(
    reports.map((r: { playerName: string; deckColors: string[] }) =>
      prisma.scoutReport.upsert({
        where: { teamId_eventId_playerName: { teamId, eventId, playerName: r.playerName.trim() } },
        update: {
          deckColors: r.deckColors as any,
          reportedById: req.userId!,
          updatedAt: new Date(),
        },
        create: {
          teamId,
          eventId,
          playerName: r.playerName.trim(),
          deckColors: r.deckColors as any,
          reportedById: req.userId!,
        },
        include: {
          reportedBy: { select: { id: true, username: true } },
        },
      }),
    ),
  );

  res.json({ reports: results });
}

/** Create potential decks for a table (uncertain mode) */
export async function createPotentialDecks(req: AuthRequest, res: Response) {
  const { teamId, eventId, roundNumber, tableNumber, player1Name, player2Name, decks } = req.body;

  const membership = await verifyTeamMembership(teamId, req.userId!);
  if (!membership) {
    res.status(403).json({ error: 'Vous n\'êtes pas membre de cette équipe' });
    return;
  }

  const p1 = player1Name.trim();
  const p2 = player2Name.trim();

  // Delete existing potential decks for this table/round (replace them)
  await prisma.potentialDeck.deleteMany({
    where: { teamId, eventId, roundNumber, tableNumber },
  });

  // Create one PotentialDeck per deck seen at the table
  const results = await Promise.all(
    (decks as string[][]).map((deckColors: string[]) =>
      prisma.potentialDeck.create({
        data: {
          teamId,
          eventId,
          roundNumber,
          tableNumber,
          deckColors: deckColors as any,
          player1Name: p1,
          player2Name: p2,
          reportedById: req.userId!,
        },
        include: {
          reportedBy: { select: { id: true, username: true } },
        },
      }),
    ),
  );

  res.json({ potentialDecks: results });
}

/** Delete a scout report */
export async function deleteScoutReport(req: AuthRequest, res: Response) {
  const report = await prisma.scoutReport.findUnique({
    where: { id: req.params.reportId },
  });
  if (!report) {
    res.status(404).json({ error: 'Rapport non trouvé' });
    return;
  }

  const membership = await verifyTeamMembership(report.teamId, req.userId!);
  if (!membership) {
    res.status(403).json({ error: 'Permission insuffisante' });
    return;
  }

  await prisma.scoutReport.delete({ where: { id: req.params.reportId } });
  res.status(204).send();
}
