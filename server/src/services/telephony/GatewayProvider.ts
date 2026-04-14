import { TelephonyService, CallRequest } from './TelephonyService.js';
import { prisma } from '../../config/prisma.js';
import { broadcast } from '../notification.service.js';

export class GatewayProvider implements TelephonyService {
  async initiateOutboundCall(req: CallRequest) {
    console.log(`[Gateway Provider] Initiating call to ${req.phoneNumber} on line ${req.lineId}`);
    
    // Look up the physical gateway device required for this line
    const line = await prisma.telephonyLine.findUnique({ 
      where: { id: req.lineId },
      include: { gateway: true }
    });

    if (!line || !line.gateway) {
      return { success: false, error: 'No associated gateway device found for this line.' };
    }

    // Emit a command over WebSocket to the Android Gateway App wrapper
    broadcast('gateway_command', {
      gatewayId: line.gateway.id,
      command: 'DIAL',
      phoneNumber: req.phoneNumber,
      callId: req.callId
    });

    return { success: true, externalId: `gw_${Date.now()}` };
  }

  async registerIncomingCall(payload: any) {
    console.log('[Gateway Provider] Incoming call', payload);
  }

  async answerCall(callId: string) {
    // For gateway mode, the PC agent might answer but the gateway handles audio
    broadcast('gateway_command', { command: 'ANSWER', callId });
  }

  async endCall(callId: string) {
    broadcast('gateway_command', { command: 'END', callId });
  }

  async muteCall(callId: string, muted: boolean) {
    broadcast('gateway_command', { command: 'MUTE', callId, muted });
  }

  async holdCall(callId: string, hold: boolean) {
    broadcast('gateway_command', { command: 'HOLD', callId, hold });
  }

  async transferCall(callId: string, targetNumber: string) {
    console.warn(`[Gateway Provider] Call transfer for ${callId} to ${targetNumber} via native Android gateway is limited`);
  }
}

export const gatewayProvider = new GatewayProvider();
