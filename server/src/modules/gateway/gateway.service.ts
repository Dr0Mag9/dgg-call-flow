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
 * Update call session status AND sync the main Call model
 */
export async function updateCallStatus(apiKey: string, callId: string, status: string) {
  const device = await prisma.gatewayDevice.findUnique({ where: { apiKey } });
  if (!device) throw new Error('Invalid Gateway');

  // 1. Try to update CallSession (gateway-specific tracking)
  let session;
  try {
    session = await prisma.callSession.update({
      where: { id: callId },
      data: { 
        status,
        endedAt: status === 'ENDED' || status === 'FAILED' ? new Date() : undefined
      }
    });
  } catch (e) {
    // CallSession might not exist if this callId is actually a Call.id
    logger.warn(`[Gateway] CallSession ${callId} not found, checking Call model`);
  }

  // 2. Also update the main Call model (CRM tracking)
  // The callId could be the Call.id directly (passed as sessionId in the command)
  try {
    const existingCall = await prisma.call.findUnique({ where: { id: callId } });
    if (existingCall) {
      const mapStatus = (s: string) => {
        switch (s) {
          case 'RINGING': return 'RINGING';
          case 'CONNECTED': case 'ANSWERED': return 'CONNECTED';
          case 'ENDED': case 'FAILED': return 'ENDED';
          default: return s;
        }
      };

      const callStatus = mapStatus(status);
      const updateData: any = { status: callStatus };

      if (callStatus === 'CONNECTED' && !existingCall.startedAt) {
        updateData.startedAt = new Date();
      }
      if (callStatus === 'ENDED') {
        updateData.endedAt = new Date();
        if (existingCall.startedAt) {
          updateData.duration = Math.floor((Date.now() - existingCall.startedAt.getTime()) / 1000);
        }
      }

      const updatedCall = await prisma.call.update({
        where: { id: callId },
        data: updateData,
        include: { 
          client: true, 
          agent: { include: { user: { select: { name: true } } } }, 
          disposition: true 
        }
      });

      // Broadcast to all CRM users so Dialer/HUD updates
      broadcast('call_updated', updatedCall);
      
      if (updatedCall.agent?.userId) {
        const { emitToUser } = await import('../../services/notification.service.js');
        emitToUser(updatedCall.agent.userId, 'call_updated', updatedCall);
      }

      logger.info(`[Gateway] Call ${callId} status synced to ${callStatus}`);
    }
  } catch (e) {
    logger.warn(`[Gateway] Could not update Call model for ${callId}`, {
      message: e instanceof Error ? e.message : String(e)
    });
  }

  // 3. Broadcast gateway-level status update
  broadcast('call_status_updated', {
    callId,
    status,
    phoneNumber: session?.phoneNumber || ''
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
