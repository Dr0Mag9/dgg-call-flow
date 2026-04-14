import { TelephonyService, CallRequest } from './TelephonyService.js';
import { prisma } from '../../config/prisma.js';
import { getIo } from '../../services/websocket.service.js';
import { logger } from '../../utils/logger.js';

export class GatewayProvider implements TelephonyService {
  async initiateOutboundCall(req: CallRequest) {
    logger.info(`[Gateway Provider] Preparing call to ${req.phoneNumber} on line ${req.lineId}`);

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

    const io = getIo();
    const gatewayRoom = `gateway_${line.gatewayId}`;
    
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

  async registerIncomingCall(payload: any) {
    logger.info('[Gateway Provider] Incoming call registration via gateway not yet implemented', payload);
  }

  async answerCall(callId: string) {
    getIo().emit('gateway:command', { command: 'ANSWER', callId });
  }

  async endCall(callId: string) {
    getIo().emit('gateway:command', { command: 'HANGUP', callId });
  }

  async muteCall(callId: string, muted: boolean) {
    logger.warn(`[Gateway Provider] Mute (${muted}) not supported on gateway bridge for call ${callId}`);
  }

  async holdCall(callId: string, hold: boolean) {
    logger.warn(`[Gateway Provider] Hold (${hold}) not supported on gateway bridge for call ${callId}`);
  }

  async transferCall(callId: string, targetNumber: string) {
    logger.warn(`[Gateway Provider] Transfer of call ${callId} to ${targetNumber} not supported on gateway bridge`);
  }
}

export const gatewayProvider = new GatewayProvider();
