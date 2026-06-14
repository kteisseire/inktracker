import { Router } from 'express';
import { extractDeckColors } from '../controllers/deck.controller.js';
import { listDecks, getDeck, createDeck, updateDeck, deleteDeck, setDefaultDeck } from '../controllers/deck.crud.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate } from '../middleware/validate.js';
import { makeLimiter } from '../middleware/rateLimit.js';
import { createDeckSchema, updateDeckSchema, extractColorsSchema } from '../validators/deck.schema.js';

const router = Router();

router.use(authMiddleware);

// L'extraction déclenche une requête sortante du serveur vers un site externe :
// on limite pour éviter l'abus/amplification (SSRF déjà muselé par l'allowlist).
const extractLimiter = makeLimiter({ windowMs: 60 * 1000, max: 20, message: 'Trop d\'extractions, réessayez dans une minute.' });

// Deck color extraction from URL
router.post('/colors', extractLimiter, validate(extractColorsSchema), asyncHandler(extractDeckColors));

// Deck CRUD
router.get('/', asyncHandler(listDecks));
router.get('/:id', asyncHandler(getDeck));
router.post('/', validate(createDeckSchema), asyncHandler(createDeck));
router.put('/:id', validate(updateDeckSchema), asyncHandler(updateDeck));
router.delete('/:id', asyncHandler(deleteDeck));
router.post('/:id/default', asyncHandler(setDefaultDeck));

export default router;
