import { z } from 'zod';
import { inkColorEnum } from './shared.js';

const resultEnum = z.enum(['WIN', 'LOSS', 'DRAW']);

// Photo de feuille de match : doit être une data-URL image (le client compresse
// à 1200px / JPEG 70%, soit < 1 Mo) et est bornée pour éviter le DoS de stockage.
const photoUrlSchema = z.string()
  .regex(/^data:image\/(jpeg|png|webp);base64,/, 'Image invalide')
  .max(4_000_000, 'Image trop volumineuse');

const gameInputSchema = z.object({
  gameNumber: z.number().int().min(1),
  result: resultEnum,
  wentFirst: z.boolean().optional(),
  myScore: z.number().int().min(0),
  opponentScore: z.number().int().min(0),
  notes: z.string().max(2000).optional(),
});

export const createRoundSchema = z.object({
  roundNumber: z.number().int().min(1),
  isTopCut: z.boolean().default(false),
  opponentName: z.string().max(100).optional(),
  opponentDeckColors: z.array(inkColorEnum).max(3).default([]),
  result: resultEnum,
  notes: z.string().max(2000).optional(),
  photoUrl: photoUrlSchema.optional(),
  games: z.array(gameInputSchema).default([]),
});

export const updateRoundSchema = z.object({
  roundNumber: z.number().int().min(1).optional(),
  isTopCut: z.boolean().optional(),
  opponentName: z.string().max(100).optional(),
  opponentDeckColors: z.array(inkColorEnum).max(3).optional(),
  result: resultEnum.optional(),
  notes: z.string().max(2000).optional(),
  photoUrl: photoUrlSchema.nullable().optional(),
  games: z.array(gameInputSchema).optional(),
});
