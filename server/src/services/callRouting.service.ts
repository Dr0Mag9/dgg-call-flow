import { prisma } from '../config/prisma.js';
import { logger } from '../utils/logger.js';

/**
 * Picks an online agent for inbound routing. Uses "longest idle" when enabled in system settings.
 */
export async function pickInboundAgent(): Promise<{ id: string; userId: string } | null> {
  const routeSetting = await prisma.systemSetting.findUnique({ where: { key: 'route_available' } });
  const useLongestIdle = routeSetting?.value === 'true';

  const online = await prisma.agent.findMany({
    where: { status: 'ONLINE', user: { isActive: true } },
    include: { user: true },
    orderBy: useLongestIdle ? { lastSeenAt: 'asc' } : { lastSeenAt: 'desc' },
  });

  if (online.length === 0) {
    logger.debug('No online agents for inbound routing');
    return null;
  }

  const chosen = online[0];
  return { id: chosen.id, userId: chosen.userId };
}
