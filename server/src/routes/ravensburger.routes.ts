import { Router } from 'express';
import { getEventInfo, getEventRounds } from '../controllers/ravensburger.controller.js';

const router = Router();

router.get('/events/:eventId', getEventInfo);
router.get('/events/:eventId/rounds', getEventRounds);

export default router;
