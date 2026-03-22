import { z } from 'zod';

const inkColorEnum = z.enum(['AMBER', 'AMETHYST', 'EMERALD', 'RUBY', 'SAPPHIRE', 'STEEL']);

export const createTournamentSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(200),
  location: z.string().max(500).optional(),
  date: z.string().datetime({ offset: true }).or(z.string().date()),
  playerCount: z.number().int().positive().optional(),
  swissRounds: z.number().int().min(1),
  topCut: z.enum(['NONE', 'TOP4', 'TOP8', 'TOP16', 'TOP32']).default('NONE'),
  format: z.enum(['BO1', 'BO3', 'BO5']).default('BO1'),
  myDeckColors: z.array(inkColorEnum).min(1).max(3),
  myDeckLink: z.string().url().max(500).nullish(),
  deckId: z.string().uuid().nullish(),
  eventLink: z.string().url().max(500).nullish(),
  placement: z.number().int().positive().optional(),
  notes: z.string().max(2000).optional(),
});

export const updateTournamentSchema = createTournamentSchema.partial();
