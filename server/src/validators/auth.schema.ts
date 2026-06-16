import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  username: z.string().min(3, 'Minimum 3 caractères').max(30),
  password: z.string().min(8, 'Minimum 8 caractères'),
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
  password: z.string().min(8, 'Minimum 8 caractères'),
});

// Profil : champs optionnels (le contrôleur n'applique que ceux fournis), mais
// validés en format/longueur quand présents.
export const updateProfileSchema = z.object({
  username: z.string().min(3, 'Minimum 3 caractères').max(30).optional(),
  email: z.string().email('Email invalide').optional(),
  notifyTournaments: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, 'Minimum 8 caractères'),
});
