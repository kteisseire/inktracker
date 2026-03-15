import { Router } from 'express';
import { register, login, googleLogin, getMe } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { registerSchema, loginSchema, googleLoginSchema } from '../validators/auth.schema.js';

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(register));
router.post('/login', validate(loginSchema), asyncHandler(login));
router.post('/google', validate(googleLoginSchema), asyncHandler(googleLogin));
router.get('/me', authMiddleware, asyncHandler(getMe));

export default router;
