import { Router } from 'express';
import {
  listMatchupNotes, upsertMatchupNote, updateMatchupNote, deleteMatchupNote,
} from '../controllers/matchup-note.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate } from '../middleware/validate.js';
import { createMatchupNoteSchema, updateMatchupNoteSchema } from '../validators/matchupNote.schema.js';

const router = Router();

router.use(authMiddleware);

router.get('/', asyncHandler(listMatchupNotes));
router.post('/', validate(createMatchupNoteSchema), asyncHandler(upsertMatchupNote));
router.put('/:id', validate(updateMatchupNoteSchema), asyncHandler(updateMatchupNote));
router.delete('/:id', asyncHandler(deleteMatchupNote));

export default router;
