import { Router } from 'express';
import { register, login, googleLogin, discordLogin, forgotPassword, resetPassword, getMe, updateProfile, changePassword } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { makeLimiter } from '../middleware/rateLimit.js';
import { registerSchema, loginSchema, googleLoginSchema, discordLoginSchema, forgotPasswordSchema, resetPasswordSchema, updateProfileSchema, changePasswordSchema } from '../validators/auth.schema.js';

const router = Router();

const authLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: 'Trop de tentatives, réessayez dans 15 minutes',
});

router.post('/register', authLimiter, validate(registerSchema), asyncHandler(register));
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(login));
router.post('/google', authLimiter, validate(googleLoginSchema), asyncHandler(googleLogin));
router.post('/discord', authLimiter, validate(discordLoginSchema), asyncHandler(discordLogin));
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), asyncHandler(forgotPassword));
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), asyncHandler(resetPassword));
router.get('/me', authMiddleware, asyncHandler(getMe));
router.put('/profile', authMiddleware, validate(updateProfileSchema), asyncHandler(updateProfile));
router.put('/password', authMiddleware, validate(changePasswordSchema), asyncHandler(changePassword));

export default router;
