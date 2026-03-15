import { z } from 'zod';

const inkColorEnum = z.enum(['AMBER', 'AMETHYST', 'EMERALD', 'RUBY', 'SAPPHIRE', 'STEEL']);
const resultEnum = z.enum(['WIN', 'LOSS', 'DRAW']);

const gameInputSchema = z.object({
  gameNumber: z.number().int().min(1),
  result: resultEnum,
  wentFirst: z.boolean().optional(),
  myScore: z.number().int().min(0),
  opponentScore: z.number().int().min(0),
  notes: z.string().optional(),
});

export const createRoundSchema = z.object({
  roundNumber: z.number().int().min(1),
  isTopCut: z.boolean().default(false),
  opponentName: z.string().optional(),
  opponentDeckColors: z.array(inkColorEnum).max(3).default([]),
  result: resultEnum,
  notes: z.string().optional(),
  games: z.array(gameInputSchema).default([]),
});

export const updateRoundSchema = z.object({
  roundNumber: z.number().int().min(1).optional(),
  isTopCut: z.boolean().optional(),
  opponentName: z.string().optional(),
  opponentDeckColors: z.array(inkColorEnum).max(3).optional(),
  result: resultEnum.optional(),
  notes: z.string().optional(),
  games: z.array(gameInputSchema).optional(),
});
