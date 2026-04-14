import { TelephonyService, CallRequest } from './TelephonyService.js';
import { prisma } from '../../config/prisma.js';
import { getIo } from '../../services/websocket.service.js';
import { logger } from '../../utils/logger.js';

export class GatewayProvider implements TelephonyService {
  async initiateOutboundCall(req: CallRequest) {
    logger.info(`[Gateway Provider] Preparing call to ${req.phoneNumber} on line ${req.lineId}`);

    // 1. Find the line and its assigned gateway
    const line = await prisma.telephonyLine.findUnique({
      where: { id: req.lineId },
      include: { gateway: true }
    });

    if (!line || !line.gatewayId || line.providerType !== 'GATEWAY') {
      return { success: false, error: 'Invalid gateway line configuration' };
    }

    if (line.gateway?.status !== 'ONLINE') {
      return { success: false, error: 'Target gateway device is offline' };
    }

    // 2. Relay the signal via Socket.io
    const io = getIo();
    const gatewayRoom = `gateway_${line.gatewayId}`;
    
    // Check if anyone is in the room
    const socketsInRoom = await io.in(gatewayRoom).fetchSockets();
    if (socketsInRoom.length === 0) {
      return { success: false, error: 'No active socket connection for gateway' };
    }

    logger.info(`[Gateway Provider] Emitting dial command to gateway ${line.gatewayId}`);
    
    io.to(gatewayRoom).emit('gateway:command', {
      command: 'DIAL',
      phoneNumber: req.phoneNumber,
      callId: req.callId,
      timestamp: new Date().toISOString()
    });

    return { 
      success: true, 
      externalId: `gw_sig_${Date.now()}` 
    };
  }

  async endCall(callId: string) {
    const io = getIo();
    // Broadcast to all gateways involved in this call (usually just one)
    io.emit('gateway:command', {
      command: 'HANGUP',
      callId
    });
  }

  async transferCall(callId: string, targetNumber: string) {
    console.warn(`[Gateway Provider] Call transfer for ${callId} to ${targetNumber} via native Android gateway is limited`);
  }
}
