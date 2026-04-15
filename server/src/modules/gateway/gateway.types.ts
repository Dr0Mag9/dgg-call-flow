export interface ConnectRequest {
  apiKey: string;
  deviceName: string;
}

export interface HeartbeatRequest {
  apiKey: string;
}

export interface DisconnectRequest {
  apiKey: string;
}

export interface GatewayResponse {
  success: boolean;
  message: string;
  data?: any;
}
