import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../lib/prisma.js';
import { signToken } from '../lib/jwt.js';
import { AuthRequest } from '../middleware/auth.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
    select: { id: true, email: true, username: true, createdAt: true },
  });

  const token = signToken(user.id);
  res.status(201).json({ user: { ...user, hasPassword: true }, token });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    return;
  }

  const token = signToken(user.id);
  res.json({
    user: { id: user.id, email: user.email, username: user.username, hasPassword: true, createdAt: user.createdAt },
    token,
  });
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
  res.json({
    user: { id: user!.id, email: user!.email, username: user!.username, hasPassword: !!user!.passwordHash, createdAt: user!.createdAt },
    token,
  });
}

export async function getMe(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, username: true, passwordHash: true, createdAt: true },
  });
  if (!user) {
    res.status(404).json({ error: 'Utilisateur non trouvé' });
    return;
  }
  res.json({ user: { id: user.id, email: user.email, username: user.username, hasPassword: !!user.passwordHash, createdAt: user.createdAt } });
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
    select: { id: true, email: true, username: true, passwordHash: true, createdAt: true },
  });

  res.json({ user: { id: user.id, email: user.email, username: user.username, hasPassword: !!user.passwordHash, createdAt: user.createdAt } });
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
