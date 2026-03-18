import { z } from 'zod';

const inkColorEnum = z.enum(['AMBER', 'AMETHYST', 'EMERALD', 'RUBY', 'SAPPHIRE', 'STEEL']);

export const createScoutReportSchema = z.object({
  teamId: z.string().uuid().optional().nullable(),
  eventId: z.string().min(1),
  playerName: z.string().min(1),
  deckColors: z.array(inkColorEnum).min(1).max(3),
});

export const bulkScoutReportSchema = z.object({
  teamId: z.string().uuid().optional().nullable(),
  eventId: z.string().min(1),
  reports: z.array(z.object({
    playerName: z.string().min(1),
    deckColors: z.array(inkColorEnum).min(1).max(3),
  })).min(1),
});

export const createPotentialDecksSchema = z.object({
  teamId: z.string().uuid().optional().nullable(),
  eventId: z.string().min(1),
  roundNumber: z.number().int().positive(),
  tableNumber: z.number().int(),
  player1Name: z.string().min(1),
  player2Name: z.string().min(1),
  decks: z.array(z.array(inkColorEnum).min(1).max(3)).min(1).max(2),
});
