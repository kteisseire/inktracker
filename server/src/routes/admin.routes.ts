import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import { listUsers } from '../controllers/admin.controller.js';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/users', listUsers);

export default router;
