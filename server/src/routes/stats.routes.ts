import { Router } from 'express';
import { getOverview, getMatchups, getDeckPerformance, getGoingFirstStats, getTournamentHistory, getDeckStats } from '../controllers/stats.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.use(authMiddleware);

router.get('/overview', asyncHandler(getOverview));
router.get('/matchups', asyncHandler(getMatchups));
router.get('/deck-performance', asyncHandler(getDeckPerformance));
router.get('/going-first', asyncHandler(getGoingFirstStats));
router.get('/tournament-history', asyncHandler(getTournamentHistory));
router.get('/deck/:deckId', asyncHandler(getDeckStats));

export default router;
