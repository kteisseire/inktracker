import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Cet enregistrement existe déjà' });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Enregistrement non trouvé' });
      return;
    }
  }

  res.status(500).json({ error: 'Erreur interne du serveur' });
}

// Wrapper to catch async errors and forward them to Express error handler
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
