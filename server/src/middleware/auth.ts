import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { sendError } from '../utils/responses.js';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    sendError(res, 401, 'Authentication required');
    return;
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    sendError(res, 403, 'Invalid or expired token');
  }
}

