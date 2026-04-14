import type { Request, Response } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service.js';
import { sendError } from '../utils/responses.js';
import { logger } from '../utils/logger.js';

const loginSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(256),
});

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, 'Invalid email or password format');
    return;
  }
  try {
    const result = await authService.login(parsed.data.email, parsed.data.password);
    if (!result.ok) {
      sendError(res, 400, result.error);
      return;
    }
    logger.info('User login', { userId: result.user.id, role: result.user.role });
    res.json({ token: result.token, user: result.user });
  } catch (e) {
    logger.error('login failed', { message: e instanceof Error ? e.message : String(e) });
    sendError(res, 500, 'Login failed');
  }
}

export async function me(req: Request, res: Response) {
  if (!req.user) {
    sendError(res, 401, 'Authentication required');
    return;
  }
  const user = await authService.getMe(req.user.userId);
  if (!user) {
    sendError(res, 404, 'User not found');
    return;
  }
  res.json(user);
}
