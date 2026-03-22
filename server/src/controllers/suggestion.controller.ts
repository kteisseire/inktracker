import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export async function createSuggestion(req: AuthRequest, res: Response) {
  const { content } = req.body;
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    res.status(400).json({ error: 'Le contenu est requis' });
    return;
  }
  if (content.trim().length > 2000) {
    res.status(400).json({ error: 'Le contenu est trop long (2000 caractères max)' });
    return;
  }

  const suggestion = await prisma.suggestion.create({
    data: {
      content: content.trim(),
      userId: req.userId || null,
    },
  });

  res.status(201).json({ suggestion });
}

export async function listSuggestions(_req: AuthRequest, res: Response) {
  const suggestions = await prisma.suggestion.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, username: true } },
    },
  });

  res.json({ suggestions });
}

export async function deleteSuggestion(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const existing = await prisma.suggestion.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: 'Suggestion non trouvée' });
    return;
  }
  await prisma.suggestion.delete({ where: { id } });
  res.status(204).send();
}
