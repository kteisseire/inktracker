import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { isAdminEmail } from '../controllers/auth.controller.js';
import { AuthRequest } from './auth.js';

export async function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.userId) {
    res.status(401).json({ error: 'Non authentifié' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { email: true } });
  if (!user || !isAdminEmail(user.email)) {
    res.status(403).json({ error: 'Accès refusé' });
    return;
  }

  next();
}
