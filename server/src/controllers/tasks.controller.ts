import type { Request, Response } from 'express';
import * as tasksService from '../services/tasks.service.js';
import { broadcast } from '../services/notification.service.js';
import { fireWebhooks } from '../services/webhooks.service.js';
import { sendError } from '../utils/responses.js';
import { logger } from '../utils/logger.js';

export async function list(req: Request, res: Response) {
  if (!req.user) {
    sendError(res, 401, 'Authentication required');
    return;
  }
  const tasks = await tasksService.listTasksForUser(req.user.userId, req.user.role);
  res.json(tasks);
}

export async function update(req: Request, res: Response) {
  try {
    const task = await tasksService.updateTask(req.params.id, req.body);
    broadcast('task_updated', task);
    if (req.body && typeof req.body === 'object' && (req.body as { status?: string }).status === 'COMPLETED') {
      broadcast('task_completed', task);
      fireWebhooks('task_completed', task).catch(() => undefined);
    }
    res.json(task);
  } catch (e) {
    logger.error('task update', { message: e instanceof Error ? e.message : String(e) });
    sendError(res, 400, 'Failed to update task');
  }
}
