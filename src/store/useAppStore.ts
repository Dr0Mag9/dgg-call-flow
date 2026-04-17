import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { browserTelephony } from '../services/BrowserTelephony';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface Call {
  id: string;
  direction: string;
  status: string;
  phoneNumber: string;
  clientId?: string;
  client?: any;
  agent?: any;
  startedAt: string;
  duration?: number;
}

interface AppState {
  user: User | null;
  token: string | null;
  socket: Socket | null;
  activeCall: Call | null;
  incomingCall: Call | null;
  selectedClient: any | null;
  isClientDrawerOpen: boolean;
  lineInfo: any | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  setActiveCall: (call: Call | null) => void;
  setIncomingCall: (call: Call | null) => void;
  setSelectedClient: (client: any | null) => void;
  setClientDrawerOpen: (isOpen: boolean) => void;
  setLineInfo: (info: any | null) => void;
  fetchLineInfo: () => Promise<void>;
  connectSocket: () => void;
  disconnectSocket: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  socket: null,
  activeCall: null,
  incomingCall: null,
  selectedClient: null,
  isClientDrawerOpen: false,
  lineInfo: null,

  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
    set({ token });
  },
  login: (token, user) => {
    get().setToken(token);
    set({ user });
    get().connectSocket();
    get().fetchLineInfo();
  },
  logout: () => {
    get().setToken(null);
    set({ user: null, activeCall: null, incomingCall: null, selectedClient: null, isClientDrawerOpen: false, lineInfo: null });
    get().disconnectSocket();
  },
  setActiveCall: (call) => set({ activeCall: call }),
  setIncomingCall: (call) => set({ incomingCall: call }),
  setSelectedClient: (client) => set({ selectedClient: client }),
  setClientDrawerOpen: (isOpen) => set({ isClientDrawerOpen: isOpen }),
  setLineInfo: (info) => set({ lineInfo: info }),

  fetchLineInfo: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.agent?.telephonyLine) {
        set({ lineInfo: data.agent.telephonyLine });
        
        // Auto-Connect SIP Bridge for UK Agents
        if (data.telephonyConfig?.sip_wss_url) {
          const extension = data.agent.extension;
          const password = data.agent.sipPassword || data.telephonyConfig.sip_default_password;
          const domain = data.telephonyConfig.sip_domain;
          const wssUrl = data.telephonyConfig.sip_wss_url;

          if (extension && password) {
            console.log(`[SIP Bridge] Initializing bridge for extension: ${extension}`);
            browserTelephony.connect({
              extension,
              password,
              domain,
              wssUrl
            }).catch(err => console.error('[SIP Bridge] Failed to establish audio link', err));
          }
        }
      } else {
        set({ lineInfo: null });
      }
    } catch (err) {
      console.error('Fetch line info failed', err);
    }
  },

  connectSocket: () => {
    const { token, socket } = get();
    if (!token) return;
    if (socket) socket.disconnect();

    const newSocket = io();
    
    newSocket.on('connect', () => {
      newSocket.emit('authenticate', token);
    });

    newSocket.on('incoming_call', (call: Call) => {
      set({ incomingCall: call });
    });

    newSocket.on('call_started', (call: Call) => {
      set({ activeCall: call });
    });

    newSocket.on('call_updated', (call: Call) => {
      const { activeCall, incomingCall } = get();
      if (activeCall && activeCall.id === call.id) {
        if (call.status === 'ENDED' || call.status === 'REJECTED') {
          // Keep activeCall for disposition screen, but update status
          set({ activeCall: call });
        } else {
          set({ activeCall: call });
        }
      }
      if (incomingCall && incomingCall.id === call.id) {
        if (call.status === 'ENDED' || call.status === 'REJECTED' || call.status === 'CONNECTED') {
          set({ incomingCall: null });
        }
      }
    });

    newSocket.on('agent_telephony_updated', () => {
      get().fetchLineInfo();
    });

    newSocket.on('call_status_updated', (data: { callId: string, status: string }) => {
      const { activeCall } = get();
      if (activeCall && activeCall.id === data.callId) {
        set({ activeCall: { ...activeCall, status: data.status } });
      }
    });

    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  }
}));
