import { Router } from 'express';
import { listRounds, createRound, updateRound, deleteRound } from '../controllers/match.controller.js';
import { validate } from '../middleware/validate.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createRoundSchema, updateRoundSchema } from '../validators/match.schema.js';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/', asyncHandler(listRounds));
router.post('/', validate(createRoundSchema), asyncHandler(createRound));
router.put('/:id', validate(updateRoundSchema), asyncHandler(updateRound));
router.delete('/:id', asyncHandler(deleteRound));

export default router;
