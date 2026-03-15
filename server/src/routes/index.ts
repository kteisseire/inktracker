import { Router } from 'express';
import authRoutes from './auth.routes.js';
import tournamentRoutes from './tournament.routes.js';
import roundRoutes from './match.routes.js';
import statsRoutes from './stats.routes.js';
import deckRoutes from './deck.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tournaments', tournamentRoutes);
router.use('/tournaments/:tournamentId/rounds', roundRoutes);
router.use('/stats', statsRoutes);
router.use('/decks', deckRoutes);

export default router;
