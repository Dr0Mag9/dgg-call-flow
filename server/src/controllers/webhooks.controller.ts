import type { Request, Response } from 'express';
import { z } from 'zod';
import * as settingsService from '../services/settings.service.js';
import { sendError } from '../utils/responses.js';
import { logger } from '../utils/logger.js';

const webhookBodySchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url().max(2000),
  secret: z.string().max(500).optional(),
  events: z.string().max(4000),
  isActive: z.boolean().optional(),
});

export async function list(_req: Request, res: Response) {
  const webhooks = await settingsService.listWebhooks();
  return res.json(webhooks);
}

export async function create(req: Request, res: Response) {
  const parsed = webhookBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, 'Invalid webhook');
  }
  try {
    const webhook = await settingsService.createWebhook(parsed.data);
    return res.json(webhook);
  } catch (e) {
    logger.error('create webhook', { message: e instanceof Error ? e.message : String(e) });
    return sendError(res, 400, 'Failed to create webhook');
  }
}

export async function update(req: Request, res: Response) {
  const parsed = webhookBodySchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, 'Invalid webhook');
  }
  try {
    const webhook = await settingsService.updateWebhook(req.params.id, parsed.data);
    return res.json(webhook);
  } catch (e) {
    logger.error('update webhook', { message: e instanceof Error ? e.message : String(e) });
    return sendError(res, 400, 'Failed to update webhook');
  }
}

export async function remove(req: Request, res: Response) {
  try {
    await settingsService.deleteWebhook(req.params.id);
    return res.json({ success: true });
  } catch (e) {
    logger.error('delete webhook', { message: e instanceof Error ? e.message : String(e) });
    return sendError(res, 400, 'Failed to delete webhook');
  }
}
