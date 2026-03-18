import { Router } from 'express';
import { extractDeckColors } from '../controllers/deck.controller.js';
import { listDecks, getDeck, createDeck, updateDeck, deleteDeck, setDefaultDeck } from '../controllers/deck.crud.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate } from '../middleware/validate.js';
import { createDeckSchema, updateDeckSchema, extractColorsSchema } from '../validators/deck.schema.js';

const router = Router();

router.use(authMiddleware);

// Deck color extraction from URL
router.post('/colors', validate(extractColorsSchema), asyncHandler(extractDeckColors));

// Deck CRUD
router.get('/', asyncHandler(listDecks));
router.get('/:id', asyncHandler(getDeck));
router.post('/', validate(createDeckSchema), asyncHandler(createDeck));
router.put('/:id', validate(updateDeckSchema), asyncHandler(updateDeck));
router.delete('/:id', asyncHandler(deleteDeck));
router.post('/:id/default', asyncHandler(setDefaultDeck));

export default router;
