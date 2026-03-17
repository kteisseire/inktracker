import { Router } from 'express';
import { register, login, googleLogin, discordLogin, getMe, updateProfile, changePassword } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { registerSchema, loginSchema, googleLoginSchema, discordLoginSchema } from '../validators/auth.schema.js';

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(register));
router.post('/login', validate(loginSchema), asyncHandler(login));
router.post('/google', validate(googleLoginSchema), asyncHandler(googleLogin));
router.post('/discord', validate(discordLoginSchema), asyncHandler(discordLogin));
router.get('/me', authMiddleware, asyncHandler(getMe));
router.put('/profile', authMiddleware, asyncHandler(updateProfile));
router.put('/password', authMiddleware, asyncHandler(changePassword));

export default router;
