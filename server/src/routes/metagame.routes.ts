import { Router } from 'express';
import { getMetagameOverview } from '../controllers/metagame.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.use(authMiddleware);

router.get('/overview', asyncHandler(getMetagameOverview));

export default router;
