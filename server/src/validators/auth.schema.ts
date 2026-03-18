import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  username: z.string().min(3, 'Minimum 3 caractères').max(30),
  password: z.string().min(6, 'Minimum 6 caractères'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const googleLoginSchema = z.object({
  credential: z.string().min(1, 'Token requis'),
});

export const discordLoginSchema = z.object({
  code: z.string().min(1, 'Code requis'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requis'),
  password: z.string().min(6, 'Minimum 6 caractères'),
});
