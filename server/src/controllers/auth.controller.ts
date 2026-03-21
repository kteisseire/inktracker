import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../lib/prisma.js';
import { signToken } from '../lib/jwt.js';
import { AuthRequest } from '../middleware/auth.js';
import { sendPasswordResetEmail } from '../lib/email.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

function userResponse(u: { id: string; email: string; username: string; passwordHash?: string | null; googleId?: string | null; discordId?: string | null; createdAt: Date }) {
  return { id: u.id, email: u.email, username: u.username, hasPassword: !!u.passwordHash, hasGoogle: !!u.googleId, hasDiscord: !!u.discordId, isAdmin: isAdminEmail(u.email), createdAt: u.createdAt };
}

function touchLastLogin(userId: string) {
  prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } }).catch(() => {});
}

export async function register(req: Request, res: Response) {
  const { email, username, password } = req.body;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    res.status(409).json({ error: 'Email ou nom d\'utilisateur déjà utilisé' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, username, passwordHash },
  });

  const token = signToken(user.id);
  touchLastLogin(user.id);
  res.status(201).json({ user: userResponse(user), token });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    return;
  }

  const token = signToken(user.id);
  touchLastLogin(user.id);
  res.json({ user: userResponse(user), token });
}

export async function googleLogin(req: Request, res: Response) {
  const { credential } = req.body;

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    console.error('Google token verification failed:', err);
    res.status(401).json({ error: 'Token Google invalide' });
    return;
  }
  if (!payload || !payload.email) {
    res.status(401).json({ error: 'Token Google invalide' });
    return;
  }

  const { sub: googleId, email, name } = payload;

  // Find existing user by googleId or email
  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId }, { email }] },
  });

  if (user && !user.googleId) {
    // Email exists from password registration — link Google account
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId },
    });
  } else if (!user) {
    // New user — generate unique username
    const baseUsername = (name || email!.split('@')[0]).replace(/[^a-zA-Z0-9_]/g, '').slice(0, 30);
    let username = baseUsername;
    let suffix = 1;
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername.slice(0, 26)}${suffix++}`;
    }

    user = await prisma.user.create({
      data: { email: email!, username, googleId },
    });
  }

  const token = signToken(user!.id);
  touchLastLogin(user!.id);
  res.json({ user: userResponse(user!), token });
}

export async function discordLogin(req: Request, res: Response) {
  const { code } = req.body;
  const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
  const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || (process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/auth/discord/callback` : '');

  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !DISCORD_REDIRECT_URI) {
    res.status(500).json({ error: 'Configuration Discord manquante' });
    return;
  }

  // Exchange code for access token
  let tokenData: any;
  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: DISCORD_REDIRECT_URI,
      }),
    });
    tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('Discord token exchange failed:', tokenData);
      res.status(401).json({ error: 'Code Discord invalide' });
      return;
    }
  } catch (err) {
    console.error('Discord token exchange error:', err);
    res.status(502).json({ error: 'Erreur de communication avec Discord' });
    return;
  }

  // Fetch Discord user info
  let discordUser: any;
  try {
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    discordUser = await userRes.json();
    if (!discordUser.id) {
      res.status(401).json({ error: 'Impossible de récupérer le profil Discord' });
      return;
    }
  } catch (err) {
    console.error('Discord user fetch error:', err);
    res.status(502).json({ error: 'Erreur de communication avec Discord' });
    return;
  }

  const discordId = discordUser.id;
  const email = discordUser.email;
  const displayName = discordUser.global_name || discordUser.username;

  // Find existing user by discordId or email
  let user = await prisma.user.findFirst({
    where: { OR: [{ discordId }, ...(email ? [{ email }] : [])] },
  });

  if (user && !user.discordId) {
    // Email exists — link Discord account
    user = await prisma.user.update({
      where: { id: user.id },
      data: { discordId },
    });
  } else if (!user) {
    // New user — generate unique username
    if (!email) {
      res.status(400).json({ error: 'Votre compte Discord n\'a pas d\'email vérifié. Veuillez utiliser un autre mode de connexion.' });
      return;
    }
    const baseUsername = (displayName || email.split('@')[0]).replace(/[^a-zA-Z0-9_]/g, '').slice(0, 30) || 'user';
    let username = baseUsername;
    let suffix = 1;
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername.slice(0, 26)}${suffix++}`;
    }

    user = await prisma.user.create({
      data: { email, username, discordId },
    });
  }

  const token = signToken(user!.id);
  touchLastLogin(user!.id);
  res.json({ user: userResponse(user!), token });
}

export async function getMe(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    res.status(404).json({ error: 'Utilisateur non trouvé' });
    return;
  }
  touchLastLogin(user.id);
  res.json({ user: userResponse(user) });
}

export async function updateProfile(req: AuthRequest, res: Response) {
  const { username, email } = req.body;
  const data: any = {};
  if (username) data.username = username;
  if (email) data.email = email;

  if (Object.keys(data).length === 0) {
    res.status(400).json({ error: 'Aucune modification' });
    return;
  }

  // Check uniqueness
  if (username || email) {
    const existing = await prisma.user.findFirst({
      where: {
        id: { not: req.userId },
        OR: [
          ...(username ? [{ username }] : []),
          ...(email ? [{ email }] : []),
        ],
      },
    });
    if (existing) {
      res.status(409).json({ error: 'Email ou nom d\'utilisateur déjà utilisé' });
      return;
    }
  }

  const user = await prisma.user.update({
    where: { id: req.userId },
    data,
  });

  res.json({ user: userResponse(user) });
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;

  // Always respond with success to prevent email enumeration
  const successMsg = { message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.json(successMsg);
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: hashedToken, passwordResetExpiresAt: expiresAt },
  });

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetUrl = `${clientUrl}/reset-password?token=${token}`;

  try {
    await sendPasswordResetEmail(user.email, resetUrl);
  } catch (err) {
    console.error('Failed to send password reset email:', err);
  }

  res.json(successMsg);
}

export async function resetPassword(req: Request, res: Response) {
  const { token, password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpiresAt: { gt: new Date() },
    },
  });

  if (!user) {
    res.status(400).json({ error: 'Lien invalide ou expiré' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    },
  });

  res.json({ message: 'Mot de passe réinitialisé avec succès' });
}

export async function changePassword(req: AuthRequest, res: Response) {
  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    res.status(404).json({ error: 'Utilisateur non trouvé' });
    return;
  }

  // If user has a password, verify current password
  if (user.passwordHash) {
    if (!currentPassword) {
      res.status(400).json({ error: 'Mot de passe actuel requis' });
      return;
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Mot de passe actuel incorrect' });
      return;
    }
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: req.userId },
    data: { passwordHash },
  });

  res.json({ message: 'Mot de passe mis à jour' });
}
