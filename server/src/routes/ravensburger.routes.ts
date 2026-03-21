import { Router } from 'express';
import { getEventInfo, getEventRounds } from '../controllers/ravensburger.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/events/:eventId', getEventInfo);
router.get('/events/:eventId/rounds', getEventRounds);

export default router;
