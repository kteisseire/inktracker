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

  // Find all teams the user belongs to
  const memberships = await prisma.teamMember.findMany({
    where: { userId: req.userId },
    select: { teamId: true },
  });
  const myTeamIds = memberships.map(m => m.teamId);

  if (myTeamIds.length === 0) {
    res.json({ reports: [] });
    return;
  }

  const reports = await prisma.scoutReport.findMany({
    where: {
      eventId,
      teamId: teamId && myTeamIds.includes(teamId) ? teamId : { in: myTeamIds },
    },
    include: {
      reportedBy: { select: { id: true, username: true } },
      team: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  res.json({ reports });
}

/** Create or update a single scout report */
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

/** Bulk upsert scout reports (when saving a round with colors) */
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
