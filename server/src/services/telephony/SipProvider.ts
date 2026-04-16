import { TelephonyService, CallRequest, TelephonyResult } from './TelephonyService.js';

export class SipProvider implements TelephonyService {
  async initiateOutboundCall(req: CallRequest): Promise<TelephonyResult> {
    console.log(`[SIP Provider] Initiating call to ${req.phoneNumber} on line ${req.lineId}`);
    // In a real PBX integration (Asterisk ARI / FreeSWITCH ESL), you would initiate 
    // an originate command here so the PBX dials the destination and bridges the web extension.
    return { success: true, externalId: `sip_${Date.now()}` };
  }

  async registerIncomingCall(payload: any) {
    console.log('[SIP Provider] Incoming call', payload);
  }

  async answerCall(callId: string) {
    console.log(`[SIP Provider] Answering call ${callId}`);
  }

  async endCall(callId: string) {
    console.log(`[SIP Provider] Ending call ${callId}`);
  }

  async muteCall(callId: string, muted: boolean) {
    console.log(`[SIP Provider] Muting call ${callId}: ${muted}`);
  }

  async holdCall(callId: string, hold: boolean) {
    console.log(`[SIP Provider] Holding call ${callId}: ${hold}`);
  }

  async transferCall(callId: string, targetNumber: string) {
    console.log(`[SIP Provider] Transferring call ${callId} to ${targetNumber}`);
  }
}

export const sipProvider = new SipProvider();
