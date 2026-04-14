export interface CallRequest {
  callId: string;
  agentId: string;
  phoneNumber: string;
  lineId: string;
  providerRef?: string;
}

export interface TelephonyService {
  initiateOutboundCall(req: CallRequest): Promise<{ success: boolean; externalId?: string; error?: string }>;
  registerIncomingCall(payload: any): Promise<void>;
  answerCall(callId: string): Promise<void>;
  endCall(callId: string): Promise<void>;
  muteCall(callId: string, muted: boolean): Promise<void>;
  holdCall(callId: string, hold: boolean): Promise<void>;
  transferCall(callId: string, targetNumber: string): Promise<void>;
}
