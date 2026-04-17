import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
  sipStatus: 'OFFLINE' | 'CONNECTING' | 'LINKED' | 'ERROR';
  sipError: string | null;
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

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      token: localStorage.getItem('token'),
      socket: null,
      activeCall: null,
      incomingCall: null,
      selectedClient: null,
      isClientDrawerOpen: false,
      lineInfo: null,
      sipStatus: 'OFFLINE',
      sipError: null,

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
          
          const contentType = res.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await res.text();
            console.error('[API ERROR] Expected JSON but received HTML/Text. Backend might be down or Nginx misconfigured.', text.substring(0, 100));
            set({ sipStatus: 'ERROR', sipError: 'BACKEND_OFFLINE_HTML' });
            return;
          }

          const data = await res.json();
          if (data.agent?.telephonyLine) {
            const line = data.agent.telephonyLine;
            
            // MAP VARIABLES
            const extension = line.sip_extension;
            const password = line.sip_password;
            const domain = line.sip_domain;
            
            // SANITIZE: Handle multiple comma-separated URLs from Admin configuration
            const sanitizedWss = (line.sip_wss_url || '')
              .split(',')
              .map((u: string) => u.trim())
              .filter((u: string) => u.length > 0)
              .join(',');

            set({ lineInfo: { ...line, sip_wss_url: sanitizedWss } });
            
            if (extension && password && sanitizedWss) {
              const { sipStatus } = get();
              if (sipStatus === 'OFFLINE' || sipStatus === 'ERROR') {
                browserTelephony.setStatusCallback((status, extra) => {
                  set({ sipStatus: status, sipError: extra || null });
                });

                browserTelephony.connect({
                  wssUrl: sanitizedWss,
                  extension,
                  password,
                  domain: domain || 'sip2sip.info'
                }).catch(err => {
                  console.error('[SIP Bridge] Critical Connection Error', err);
                  set({ sipStatus: 'ERROR', sipError: 'WSS_CONNECTION_FAILED' });
                });
              }
            } else {
              const reason = !extension ? 'MISSING_EXTENSION' : (!password ? 'MISSING_PASSWORD' : 'MISSING_WSS_URL');
              set({ sipStatus: 'OFFLINE', sipError: reason });
            }
          } else {
            set({ lineInfo: null, sipStatus: 'OFFLINE', sipError: 'NO_LINE_ASSIGNED' });
          }
        } catch (err) {
          console.error('Fetch line info failed', err);
          set({ sipStatus: 'ERROR', sipError: 'FETCH_FAILED' });
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
    }),
    {
      name: 'callflow-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token,
        sipStatus: state.sipStatus,
        sipError: state.sipError
      }),
    }
  )
);
