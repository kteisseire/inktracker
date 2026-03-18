import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

/** Verify user is a member of the team */
async function verifyTeamMembership(teamId: string, userId: string) {
  return prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
}

/** Get all scout reports for a given event, scoped to user's personal reports + team reports */
export async function getEventScoutReports(req: AuthRequest, res: Response) {
  const { eventId } = req.params;

  const memberships = await prisma.teamMember.findMany({
    where: { userId: req.userId },
    select: { teamId: true },
  });
  const myTeamIds = memberships.map(m => m.teamId);

  // Personal reports (teamId is null, reportedById is me) OR team reports
  const orConditions: any[] = [
    { eventId, teamId: null, reportedById: req.userId },
  ];
  if (myTeamIds.length > 0) {
    orConditions.push({ eventId, teamId: { in: myTeamIds } });
  }

  const [reports, potentialDecks] = await Promise.all([
    prisma.scoutReport.findMany({
      where: { OR: orConditions },
      include: {
        reportedBy: { select: { id: true, username: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.potentialDeck.findMany({
      where: { OR: orConditions },
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

  // If teamId is provided, verify membership
  if (teamId) {
    const membership = await verifyTeamMembership(teamId, req.userId!);
    if (!membership) {
      res.status(403).json({ error: 'Vous n\'êtes pas membre de cette équipe' });
      return;
    }
  }

  const report = await prisma.scoutReport.upsert({
    where: { reportedById_eventId_playerName: { reportedById: req.userId!, eventId, playerName: playerName.trim() } },
    update: {
      deckColors,
      teamId: teamId || null,
      updatedAt: new Date(),
    },
    create: {
      teamId: teamId || null,
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

  if (teamId) {
    const membership = await verifyTeamMembership(teamId, req.userId!);
    if (!membership) {
      res.status(403).json({ error: 'Vous n\'êtes pas membre de cette équipe' });
      return;
    }
  }

  const results = await Promise.all(
    reports.map((r: { playerName: string; deckColors: string[] }) =>
      prisma.scoutReport.upsert({
        where: { reportedById_eventId_playerName: { reportedById: req.userId!, eventId, playerName: r.playerName.trim() } },
        update: {
          deckColors: r.deckColors as any,
          teamId: teamId || null,
          updatedAt: new Date(),
        },
        create: {
          teamId: teamId || null,
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

  // If teamId is provided, verify membership
  if (teamId) {
    const membership = await verifyTeamMembership(teamId, req.userId!);
    if (!membership) {
      res.status(403).json({ error: 'Vous n\'êtes pas membre de cette équipe' });
      return;
    }
  }

  const p1 = player1Name.trim();
  const p2 = player2Name.trim();

  // Delete existing potential decks for this table/round by this user (replace them)
  await prisma.potentialDeck.deleteMany({
    where: { reportedById: req.userId!, eventId, roundNumber, tableNumber },
  });

  // Create one PotentialDeck per deck seen at the table
  const results = await Promise.all(
    (decks as string[][]).map((deckColors: string[]) =>
      prisma.potentialDeck.create({
        data: {
          teamId: teamId || null,
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

  // Personal report (no team) — only the reporter can delete
  // Team report — only team members can delete
  if (report.teamId) {
    const membership = await verifyTeamMembership(report.teamId, req.userId!);
    if (!membership) {
      res.status(403).json({ error: 'Permission insuffisante' });
      return;
    }
  } else if (report.reportedById !== req.userId) {
    res.status(403).json({ error: 'Permission insuffisante' });
    return;
  }

  await prisma.scoutReport.delete({ where: { id: req.params.reportId } });
  res.status(204).send();
}
