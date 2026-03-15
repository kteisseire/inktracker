import { z } from 'zod';

const inkColorEnum = z.enum(['AMBER', 'AMETHYST', 'EMERALD', 'RUBY', 'SAPPHIRE', 'STEEL']);

export const createDeckSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  colors: z.array(inkColorEnum).min(1).max(3),
  link: z.string().url().nullish(),
  isDefault: z.boolean().optional(),
});

export const updateDeckSchema = createDeckSchema.partial();
