import type { Request, Response } from 'express';
import * as agentsService from '../services/agents.service.js';
import { sendError } from '../utils/responses.js';

export async function me(req: Request, res: Response) {
  if (!req.user) return sendError(res, 401, 'Authentication required');
  const agent = await agentsService.getAgentForUser(req.user.userId);
  if (!agent) {
    return sendError(res, 404, 'No agent profile for this user');
  }
  return res.json(agent);
}
