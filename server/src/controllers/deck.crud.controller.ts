import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export async function listDecks(req: AuthRequest, res: Response) {
  const decks = await prisma.deck.findMany({
    where: { userId: req.userId },
    orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
  });
  res.json({ decks });
}

export async function getDeck(req: AuthRequest, res: Response) {
  const deck = await prisma.deck.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!deck) {
    res.status(404).json({ error: 'Deck non trouvé' });
    return;
  }
  res.json({ deck });
}

export async function createDeck(req: AuthRequest, res: Response) {
  const { isDefault, ...data } = req.body;

  // If setting as default, unset other defaults first
  if (isDefault) {
    await prisma.deck.updateMany({
      where: { userId: req.userId!, isDefault: true },
      data: { isDefault: false },
    });
  }

  const deck = await prisma.deck.create({
    data: {
      ...data,
      isDefault: isDefault ?? false,
      userId: req.userId!,
    },
  });
  res.status(201).json({ deck });
}

export async function updateDeck(req: AuthRequest, res: Response) {
  const existing = await prisma.deck.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) {
    res.status(404).json({ error: 'Deck non trouvé' });
    return;
  }

  const { isDefault, ...data } = req.body;

  if (isDefault) {
    await prisma.deck.updateMany({
      where: { userId: req.userId!, isDefault: true },
      data: { isDefault: false },
    });
  }

  const deck = await prisma.deck.update({
    where: { id: req.params.id },
    data: { ...data, ...(isDefault !== undefined ? { isDefault } : {}) },
  });
  res.json({ deck });
}

export async function deleteDeck(req: AuthRequest, res: Response) {
  const existing = await prisma.deck.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) {
    res.status(404).json({ error: 'Deck non trouvé' });
    return;
  }

  await prisma.deck.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

export async function setDefaultDeck(req: AuthRequest, res: Response) {
  const existing = await prisma.deck.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) {
    res.status(404).json({ error: 'Deck non trouvé' });
    return;
  }

  await prisma.deck.updateMany({
    where: { userId: req.userId!, isDefault: true },
    data: { isDefault: false },
  });
  const deck = await prisma.deck.update({
    where: { id: req.params.id },
    data: { isDefault: true },
  });
  res.json({ deck });
}
