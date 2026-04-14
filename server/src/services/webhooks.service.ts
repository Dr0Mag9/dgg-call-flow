import { prisma } from '../config/prisma.js';
import { logger } from '../utils/logger.js';

export async function fireWebhooks(event: string, payload: unknown): Promise<void> {
  try {
    const webhooks = await prisma.webhook.findMany({ where: { isActive: true } });
    const body = JSON.stringify({
      event,
      payload,
      timestamp: new Date().toISOString(),
    });

    for (const webhook of webhooks) {
      let shouldFire = false;
      try {
        const events = JSON.parse(webhook.events) as string[];
        if (!Array.isArray(events) || events.length === 0 || events.includes(event)) {
          shouldFire = true;
        }
      } catch {
        shouldFire = true;
      }

      if (!shouldFire) continue;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (webhook.secret) {
        headers['X-Webhook-Secret'] = webhook.secret;
      }

      fetch(webhook.url, {
        method: 'POST',
        headers,
        body,
      }).catch((err: Error) => {
        logger.warn('Webhook delivery failed', { name: webhook.name, message: err.message });
      });
    }
  } catch (error) {
    logger.error('fireWebhooks failed', { message: error instanceof Error ? error.message : String(error) });
  }
}
