import { prisma } from '../../config/prisma.js';
import { logger } from '../../utils/logger.js';
import { broadcast } from '../../services/notification.service.js';

export async function connectGateway(apiKey: string, deviceName: string) {
  logger.info(`[Gateway] Connection attempt: ${deviceName} (${apiKey.substring(0, 8)}...)`);

  const gateway = await prisma.gatewayDevice.findUnique({
    where: { apiKey }
  });

  if (!gateway) {
    logger.warn(`[Gateway] Invalid API Key: ${apiKey.substring(0, 8)}...`);
    return null;
  }

  const updated = await prisma.gatewayDevice.update({
    where: { apiKey },
    data: {
      status: 'ONLINE',
      lastSeen: new Date(),
      name: deviceName || gateway.name // Allow dynamic name update if provided
    }
  });

  logger.info(`[Gateway] Success connection: ${updated.name}`);
  
  // Real-time notification to CRM UI
  broadcast('gateway_status_changed', { 
    gatewayId: updated.id, 
    status: 'ONLINE' 
  });

  return updated;
}

export async function updateHeartbeat(apiKey: string) {
  const gateway = await prisma.gatewayDevice.findUnique({
    where: { apiKey }
  });

  if (!gateway) return null;

  const updated = await prisma.gatewayDevice.update({
    where: { apiKey },
    data: {
      status: 'ONLINE',
      lastSeen: new Date()
    }
  });

  logger.debug(`[Gateway] Heartbeat received: ${updated.name}`);
  return updated;
}

export async function disconnectGateway(apiKey: string) {
  const gateway = await prisma.gatewayDevice.findUnique({
    where: { apiKey }
  });

  if (!gateway) return null;

  const updated = await prisma.gatewayDevice.update({
    where: { apiKey },
    data: {
      status: 'OFFLINE',
      lastSeen: new Date()
    }
  });

  logger.info(`[Gateway] Disconnect event: ${updated.name}`);

  broadcast('gateway_status_changed', { 
    gatewayId: updated.id, 
    status: 'OFFLINE' 
  });

  return updated;
}

/**
 * Cleanup function to mark stale gateways as offline
 * Should be called periodically
 */
export async function cleanupStaleGateways() {
  const timeoutLimit = new Date(Date.now() - 60000); // 1 minute stale check

  const gateways = await prisma.gatewayDevice.findMany({
    where: {
      status: 'ONLINE',
      OR: [
        { lastSeen: { lt: timeoutLimit } },
        { lastSeen: null }
      ]
    }
  });

  for (const gw of gateways) {
    await prisma.gatewayDevice.update({
      where: { id: gw.id },
      data: { status: 'OFFLINE' }
    });
    
    broadcast('gateway_status_changed', { 
      gatewayId: gw.id, 
      status: 'OFFLINE' 
    });
    
    logger.info(`[Gateway] Marked stale device OFFLINE: ${gw.name}`);
  }
}
