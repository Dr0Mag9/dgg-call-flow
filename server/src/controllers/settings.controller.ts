import type { Request, Response } from 'express';
import { z } from 'zod';
import * as settingsService from '../services/settings.service.js';
import { sendError } from '../utils/responses.js';
import { logger } from '../utils/logger.js';

const systemPostSchema = z.object({
  key: z.string().min(1).max(120),
  value: z.union([z.string(), z.boolean(), z.number()]),
});

export async function getSystem(_req: Request, res: Response) {
  const map = await settingsService.getSystemSettingsMap();
  return res.json(map);
}

export async function postSystem(req: Request, res: Response) {
  const parsed = systemPostSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, 'Invalid setting');
  }
  try {
    const setting = await settingsService.upsertSystemSetting(parsed.data.key, parsed.data.value);
    return res.json(setting);
  } catch (e) {
    logger.error('postSystem', { message: e instanceof Error ? e.message : String(e) });
    return sendError(res, 400, 'Failed to save system setting');
  }
}
