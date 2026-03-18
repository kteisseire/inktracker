import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, googleLogin, discordLogin, getMe, updateProfile, changePassword } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { registerSchema, loginSchema, googleLoginSchema, discordLoginSchema } from '../validators/auth.schema.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: { error: 'Trop de tentatives, réessayez dans 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, validate(registerSchema), asyncHandler(register));
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(login));
router.post('/google', authLimiter, validate(googleLoginSchema), asyncHandler(googleLogin));
router.post('/discord', authLimiter, validate(discordLoginSchema), asyncHandler(discordLogin));
router.get('/me', authMiddleware, asyncHandler(getMe));
router.put('/profile', authMiddleware, asyncHandler(updateProfile));
router.put('/password', authMiddleware, asyncHandler(changePassword));

export default router;
