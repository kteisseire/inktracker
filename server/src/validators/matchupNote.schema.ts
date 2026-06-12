import { z } from 'zod';
import { inkColorEnum } from './shared.js';

export const createMatchupNoteSchema = z.object({
  opponentColors: z.array(inkColorEnum).min(1).max(3),
  content: z.string().trim().min(1, 'Le contenu est requis').max(2000),
});

export const updateMatchupNoteSchema = createMatchupNoteSchema.partial();
