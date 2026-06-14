import { Router } from 'express';
import { getMetagameOverview } from '../controllers/metagame.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { makeLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.use(authMiddleware);

// Agrégat global coûteux (lit toutes les rondes) : on limite la fréquence.
const metagameLimiter = makeLimiter({ windowMs: 60 * 1000, max: 30 });

router.get('/overview', metagameLimiter, asyncHandler(getMetagameOverview));

export default router;
