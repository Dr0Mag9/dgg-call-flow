import type { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/responses.js';

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'Authentication required');
      return;
    }
    if (!roles.includes(req.user.role)) {
      sendError(res, 403, 'Insufficient permissions');
      return;
    }
    next();
  };
}
