import { z } from 'zod';
import { inkColorEnum } from './shared.js';

export const createDeckSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100),
  colors: z.array(inkColorEnum).min(1).max(3),
  link: z.string().url().max(500).nullish(),
  archetypeName: z.string().trim().max(60).optional(),
  isDefault: z.boolean().optional(),
});

export const extractColorsSchema = z.object({
  url: z.string().url().max(500),
});

export const updateDeckSchema = createDeckSchema.partial();
