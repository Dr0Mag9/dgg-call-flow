import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const msg = err.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    return res.status(400).json({ error: msg || 'Validation failed' });
  }
  if (err instanceof Error && err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS policy blocked this origin' });
  }
  logger.error('Unhandled error', { message: err instanceof Error ? err.message : String(err) });
  return res.status(500).json({ error: 'Internal server error' });
}
