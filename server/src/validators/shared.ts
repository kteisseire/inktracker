import { z } from 'zod';

/** The six Lorcana ink colors — shared across resource validators. */
export const inkColorEnum = z.enum(['AMBER', 'AMETHYST', 'EMERALD', 'RUBY', 'SAPPHIRE', 'STEEL']);
