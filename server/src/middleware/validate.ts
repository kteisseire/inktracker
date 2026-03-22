import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        console.log('[Validation error]', JSON.stringify(err.errors));
        res.status(400).json({ error: 'Données invalides', details: err.errors });
        return;
      }
      next(err);
    }
  };
}
