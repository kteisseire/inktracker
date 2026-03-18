import { Router } from 'express';
import { listTournaments, getTeamPresence, getTournament, createTournament, updateTournament, deleteTournament } from '../controllers/tournament.controller.js';
import { validate } from '../middleware/validate.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createTournamentSchema, updateTournamentSchema } from '../validators/tournament.schema.js';

const router = Router();

router.use(authMiddleware);

router.get('/', asyncHandler(listTournaments));
router.get('/team-presence', asyncHandler(getTeamPresence));
router.get('/:id', asyncHandler(getTournament));
router.post('/', validate(createTournamentSchema), asyncHandler(createTournament));
router.put('/:id', validate(updateTournamentSchema), asyncHandler(updateTournament));
router.delete('/:id', asyncHandler(deleteTournament));

export default router;
