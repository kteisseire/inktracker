import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt.js';

export interface AuthRequest extends Request {
  userId?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token manquant' });
    return;
  }

  try {
    const { userId } = verifyToken(header.slice(7));
    req.userId = userId;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
}
