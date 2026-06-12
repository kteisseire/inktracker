import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';
import { InkColor } from '@prisma/client';

/**
 * Build the deterministic `colorKey` used to enforce a per-user uniqueness
 * constraint on `opponentColors`, since Prisma does not support `@unique`
 * on array fields in PostgreSQL. Sorted + comma-joined (e.g. "AMBER,STEEL").
 */
function buildColorKey(colors: InkColor[]): string {
  return [...colors].sort().join(',');
}

/** List all matchup notes for the authenticated user. */
export async function listMatchupNotes(req: AuthRequest, res: Response) {
  const notes = await prisma.matchupNote.findMany({
    where: { userId: req.userId },
    orderBy: { updatedAt: 'desc' },
  });
  res.json({ notes });
}

/** Create or update (upsert) a matchup note for a given opponent color combination. */
export async function upsertMatchupNote(req: AuthRequest, res: Response) {
  const { opponentColors, content } = req.body;
  const colorKey = buildColorKey(opponentColors);

  const note = await prisma.matchupNote.upsert({
    where: { userId_colorKey: { userId: req.userId!, colorKey } },
    update: {
      opponentColors,
      content,
    },
    create: {
      userId: req.userId!,
      opponentColors,
      colorKey,
      content,
    },
  });

  res.status(201).json({ note });
}

/** Update a matchup note by id. Ownership is verified before update. */
export async function updateMatchupNote(req: AuthRequest, res: Response) {
  const existing = await prisma.matchupNote.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) {
    res.status(404).json({ error: 'Note non trouvée' });
    return;
  }

  const { opponentColors, content } = req.body;
  const data: { opponentColors?: InkColor[]; colorKey?: string; content?: string } = {};

  if (opponentColors) {
    data.opponentColors = opponentColors;
    data.colorKey = buildColorKey(opponentColors);
  }
  if (content !== undefined) {
    data.content = content;
  }

  const note = await prisma.matchupNote.update({
    where: { id: req.params.id },
    data,
  });
  res.json({ note });
}

/** Delete a matchup note by id. Ownership is verified before deletion. */
export async function deleteMatchupNote(req: AuthRequest, res: Response) {
  const existing = await prisma.matchupNote.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) {
    res.status(404).json({ error: 'Note non trouvée' });
    return;
  }

  await prisma.matchupNote.delete({ where: { id: req.params.id } });
  res.status(204).send();
}
