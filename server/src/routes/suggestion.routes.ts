import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createSuggestion, listSuggestions, deleteSuggestion } from '../controllers/suggestion.controller.js';

const router = Router();

// Any authenticated user can submit a suggestion
router.post('/', authMiddleware, asyncHandler(createSuggestion));

// Only admins can list and delete suggestions
router.get('/', authMiddleware, adminMiddleware, asyncHandler(listSuggestions));
router.delete('/:id', authMiddleware, adminMiddleware, asyncHandler(deleteSuggestion));

export default router;
