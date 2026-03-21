import { Router } from 'express';
import { listTournaments, getTeamPresence, getTournament, createTournament, updateTournament, deleteTournament, shareTournament, getSharedTournament } from '../controllers/tournament.controller.js';
import { validate } from '../middleware/validate.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createTournamentSchema, updateTournamentSchema } from '../validators/tournament.schema.js';

const router = Router();

// Public route (no auth)
router.get('/shared/:shareId', asyncHandler(getSharedTournament));

// Protected routes
router.use(authMiddleware);

router.get('/', asyncHandler(listTournaments));
router.get('/team-presence', asyncHandler(getTeamPresence));
router.get('/:id', asyncHandler(getTournament));
router.post('/', validate(createTournamentSchema), asyncHandler(createTournament));
router.put('/:id', validate(updateTournamentSchema), asyncHandler(updateTournament));
router.delete('/:id', asyncHandler(deleteTournament));
router.post('/:id/share', asyncHandler(shareTournament));

export default router;
