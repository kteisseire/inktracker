import { Router } from 'express';
import { getPublicKey, subscribe, unsubscribe } from '../controllers/push.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.use(authMiddleware);
router.get('/public-key', asyncHandler(getPublicKey));
router.post('/subscribe', asyncHandler(subscribe));
router.post('/unsubscribe', asyncHandler(unsubscribe));

export default router;
