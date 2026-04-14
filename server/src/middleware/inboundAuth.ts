import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { sendError } from '../utils/responses.js';

export function requireInboundSecret(req: Request, res: Response, next: NextFunction) {
  const secret = env.INBOUND_WEBHOOK_SECRET;
  if (!secret) {
    next();
    return;
  }
  const raw = req.headers['x-inbound-secret'] ?? req.headers['authorization'];
  const token =
    typeof raw === 'string' && raw.startsWith('Bearer ') ? raw.slice(7) : typeof raw === 'string' ? raw : '';
  if (token === secret) {
    next();
    return;
  }
  sendError(res, 401, 'Unauthorized');
}
