import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join('; ');
      res.status(400).json({ error: msg || 'Validation failed' });
      return;
    }
    req.body = parsed.data;
    next();
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.params);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join('; ');
      res.status(400).json({ error: msg || 'Validation failed' });
      return;
    }
    req.params = parsed.data as typeof req.params;
    next();
  };
}
