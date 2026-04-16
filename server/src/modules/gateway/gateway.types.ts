export interface GatewayDevice {
  id: string;
  name: string;
  apiKey: string;
  status: 'ONLINE' | 'OFFLINE';
  lastSeen?: Date | null;
}

export interface CallTriggerRequest {
  apiKey: string;
  phoneNumber: string;
  agentId: string;
}

export interface GatewayCommandResponse {
  action: string;
  phoneNumber?: string;
  payload?: any;
}

export interface CallStatusUpdate {
  apiKey: string;
  callId: string;
  status: 'RINGING' | 'CONNECTED' | 'ENDED' | 'FAILED';
}
