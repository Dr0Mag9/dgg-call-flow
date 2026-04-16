import { prisma } from '../../config/prisma.js';
import { broadcast } from '../../services/notification.service.js';
import { logger } from '../../utils/logger.js';

export async function connectGateway(apiKey: string, deviceName: string) {
  const device = await prisma.gatewayDevice.upsert({
    where: { apiKey },
    update: { status: 'ONLINE', lastSeen: new Date(), name: deviceName },
    create: { apiKey, name: deviceName, status: 'ONLINE', lastSeen: new Date() }
  });

  broadcast('gateway_status_changed', { gatewayId: device.id, status: 'ONLINE' });
  return device;
}

export async function updateHeartbeat(apiKey: string) {
  const device = await prisma.gatewayDevice.update({
    where: { apiKey },
    data: { lastSeen: new Date(), status: 'ONLINE' }
  });
  return device;
}

export async function disconnectGateway(apiKey: string) {
  const device = await prisma.gatewayDevice.update({
    where: { apiKey },
    data: { status: 'OFFLINE', lastSeen: new Date() }
  });
  broadcast('gateway_status_changed', { gatewayId: device.id, status: 'OFFLINE' });
  return device;
}

/**
 * Trigger a call command for a gateway device
 */
export async function triggerCall(apiKey: string, phoneNumber: string, agentId: string) {
  const device = await prisma.gatewayDevice.findUnique({ where: { apiKey } });
  if (!device || device.status !== 'ONLINE') {
    throw new Error('Gateway device not found or offline');
  }

  // 1. Create a CallSession
  const session = await prisma.callSession.create({
    data: {
      phoneNumber,
      agentId,
      gatewayId: device.id,
      status: 'INITIATED'
    }
  });

  // 2. Queue a GatewayCommand for the Android app to poll
  await prisma.gatewayCommand.create({
    data: {
      gatewayId: device.id,
      action: 'CALL',
      payload: JSON.stringify({ phoneNumber, sessionId: session.id }),
      status: 'PENDING'
    }
  });

  // 3. Notify agent via socket
  broadcast('outbound_call_started', { 
    callId: session.id, 
    phoneNumber, 
    agentId,
    status: 'INITIATED'
  });

  return session;
}

/**
 * Fetch and clear pending commands (for polling)
 */
export async function getPendingCommands(apiKey: string) {
  const device = await prisma.gatewayDevice.findUnique({ where: { apiKey } });
  if (!device) return [];

  const commands = await prisma.gatewayCommand.findMany({
    where: { gatewayId: device.id, status: 'PENDING' },
    orderBy: { createdAt: 'asc' }
  });

  if (commands.length > 0) {
    // Mark as SENT (or delete) to prevent duplicate polling
    await prisma.gatewayCommand.updateMany({
      where: { id: { in: commands.map(c => c.id) } },
      data: { status: 'SENT' }
    });
  }

  return commands.map(c => ({
    id: c.id,
    action: c.action,
    ...(c.payload ? JSON.parse(c.payload) : {})
  }));
}

/**
 * Update call session status
 */
export async function updateCallStatus(apiKey: string, callId: string, status: string) {
  const device = await prisma.gatewayDevice.findUnique({ where: { apiKey } });
  if (!device) throw new Error('Invalid Gateway');

  const session = await prisma.callSession.update({
    where: { id: callId },
    data: { 
      status,
      endedAt: status === 'ENDED' || status === 'FAILED' ? new Date() : undefined
    }
  });

  // Broadcast to frontend
  broadcast('call_status_updated', {
    callId: session.id,
    status,
    phoneNumber: session.phoneNumber
  });

  return session;
}

export async function cleanupStaleGateways() {
  const threshold = new Date(Date.now() - 60000); // 1 minute
  const staleDevices = await prisma.gatewayDevice.findMany({
    where: {
      status: 'ONLINE',
      lastSeen: { lt: threshold }
    }
  });

  for (const device of staleDevices) {
    await prisma.gatewayDevice.update({
      where: { id: device.id },
      data: { status: 'OFFLINE' }
    });
    broadcast('gateway_status_changed', { gatewayId: device.id, status: 'OFFLINE' });
    logger.info(`Gateway marked OFFLINE due to timeout: ${device.name}`);
  }
}
