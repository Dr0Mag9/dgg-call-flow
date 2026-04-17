import { TelephonyService, CallRequest, TelephonyResult } from './TelephonyService.js';
import { prisma } from '../../config/prisma.js';
import { getIo } from '../../services/websocket.service.js';
import { logger } from '../../utils/logger.js';

export class GatewayProvider implements TelephonyService {
  async initiateOutboundCall(req: CallRequest): Promise<TelephonyResult> {
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

    // Triple-Format Normalization for Indian Telecom Compatibility
    const rawDigits = req.phoneNumber.replace(/\D/g, '');
    const tenDigits = rawDigits.length > 10 ? rawDigits.slice(-10) : rawDigits;
    const prefixed91 = `91${tenDigits}`;
    const local0 = `0${tenDigits}`;

    const io = getIo();
    const gatewayRoom = `gateway_${line.gatewayId}`;

    const dialPayload = {
      action: 'CALL',
      command: 'DIAL', // Redundant for legacy support
      phoneNumber: tenDigits, // Native 10 digits
      fullNumber: prefixed91, // 91 Prefix
      domesticNumber: local0, // 0 Prefix
      sessionId: req.callId,
      timestamp: new Date().toISOString()
    };

    // 1. Always persist command for HTTP polling (robust delivery)
    await (prisma as any).gatewayCommand.create({
      data: {
        gatewayId: line.gatewayId,
        action: 'CALL',
        payload: JSON.stringify(dialPayload),
        status: 'PENDING'
      }
    });

    // 2. Also try socket emit (real-time, best-effort)
    try {
      const socketsInRoom = await io.in(gatewayRoom).fetchSockets();
      if (socketsInRoom.length > 0) {
        logger.info(`[Gateway Provider] Emitting reinforced dial command to gateway ${line.gatewayId}`);
        io.to(gatewayRoom).emit('gateway:command', dialPayload);
      } else {
        logger.info(`[Gateway Provider] No active sockets, relying on HTTP polling with Triple-Format`);
      }
    } catch (err) {
      logger.warn('[Gateway Provider] Signal emit failed, relying on polling backup', { 
        message: err instanceof Error ? err.message : String(err) 
      });
    }

    return { 
      success: true, 
      externalId: `gw_sig_${Date.now()}` 
    };
  }

  async registerIncomingCall(payload: any) {
    logger.info('[Gateway Provider] Incoming call registration via gateway not yet implemented', payload);
  }

  async answerCall(callId: string) {
    await this.sendCommandToGateway(callId, 'ANSWER');
  }

  async endCall(callId: string) {
    logger.info(`[Gateway Provider] Ending call ${callId}`);

    // Find the call to get the gateway ID
    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: { agent: { include: { telephonyLine: { include: { gateway: true } } } } }
    });

    const gatewayId = call?.agent?.telephonyLine?.gatewayId;

    if (gatewayId) {
      // 1. Queue HANGUP for HTTP polling
      await (prisma as any).gatewayCommand.create({
        data: {
          gatewayId,
          action: 'HANGUP',
          payload: JSON.stringify({ callId }),
          status: 'PENDING'
        }
      });

      // 2. Try socket emit (best-effort)
      try {
        const io = getIo();
        const gatewayRoom = `gateway_${gatewayId}`;
        io.to(gatewayRoom).emit('gateway:command', { 
          command: 'HANGUP', 
          callId,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        logger.warn('[Gateway Provider] Socket hangup emit failed, command queued for polling');
      }
    } else {
      logger.warn(`[Gateway Provider] Could not find gateway for call ${callId}`);
    }
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

  private async sendCommandToGateway(callId: string, command: string) {
    try {
      const io = getIo();
      io.emit('gateway:command', { command, callId });
    } catch (err) {
      logger.error(`[Gateway Provider] Failed to send ${command} command`, {
        message: err instanceof Error ? err.message : String(err)
      });
    }
  }
}

export const gatewayProvider = new GatewayProvider();
