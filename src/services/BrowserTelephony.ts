import { UserAgent, Inviter, SessionState, UserAgentOptions, Registerer, RegistererState } from 'sip.js';

class BrowserTelephonyService {
  private userAgent: UserAgent | null = null;
  private registerer: Registerer | null = null;
  private currentSession: Inviter | any = null;
  private isConnected = false;
  private onStatusChange: ((status: 'OFFLINE' | 'CONNECTING' | 'LINKED' | 'ERROR') => void) | null = null;

  setStatusCallback(callback: (status: 'OFFLINE' | 'CONNECTING' | 'LINKED' | 'ERROR') => void) {
    this.onStatusChange = callback;
  }

  async connect(config: { wssUrl: string; extension: string; password?: string; domain: string }) {
    if (!config.wssUrl) return;
    this.onStatusChange?.('CONNECTING');

    try {
      const uri = UserAgent.makeURI(`sip:${config.extension}@${config.domain}`);
      if (!uri) throw new Error("Invalid SIP URI");

      const options: UserAgentOptions = {
        uri,
        transportOptions: {
          server: config.wssUrl,
          traceSip: true, // Critical for debugging international bridge
        },
        authorizationUsername: config.extension,
        authorizationPassword: config.password || '',
        displayName: config.extension,
        // Advanced Networking for Sip2Sip + NAT
        hackIpInContact: true,
        logLevel: "debug",
        sessionDescriptionHandlerFactoryOptions: {
          peerConnectionConfiguration: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' }
            ]
          }
        }
      };

      this.userAgent = new UserAgent(options);

      this.userAgent.delegate = {
        onConnect: () => {
          console.log('[BrowserTelephony] SIP Socket Connected');
          this.isConnected = true;
          this.initRegisterer();
        },
        onDisconnect: (error) => {
          console.log('[BrowserTelephony] SIP Socket Disconnected', error);
          this.isConnected = false;
          this.onStatusChange?.('OFFLINE');
        }
      };

      await this.userAgent.start();
    } catch (err) {
      console.error('[BrowserTelephony] Connection failed', err);
      this.onStatusChange?.('ERROR');
    }
  }

  private initRegisterer() {
    if (!this.userAgent) return;
    
    this.registerer = new Registerer(this.userAgent, {
      expires: 600 // Stay alive for 10 minutes, then auto-renew
    });
    
    this.registerer.stateChange.addListener((state: RegistererState) => {
      console.log(`[BrowserTelephony] Registration State: ${state}`);
      if (state === RegistererState.Registered) {
        this.onStatusChange?.('LINKED');
      } else if (state === RegistererState.Unregistered || state === RegistererState.Terminated) {
        this.onStatusChange?.('OFFLINE');
      }
    });

    this.registerer.register();
  }

  async initiateCall(phoneNumber: string, domain: string) {
    if (!this.isConnected || !this.userAgent) {
       console.warn('[BrowserTelephony] Not connected to SIP broker.');
       return;
    }

    const targetURI = UserAgent.makeURI(`sip:${phoneNumber}@${domain}`);
    if (!targetURI) throw new Error("Invalid target URI");

    this.currentSession = new Inviter(this.userAgent, targetURI, {
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false }
      }
    });

    this.currentSession.stateChange.addListener((state: SessionState) => {
       console.log(`[BrowserTelephony] Session state changed: ${state}`);
    });

    await this.currentSession.invite();
  }

  async endCall() {
    if (this.currentSession) {
       try {
         switch(this.currentSession.state) {
           case SessionState.Initial:
           case SessionState.Establishing:
             await this.currentSession.cancel();
             break;
           case SessionState.Established:
             await this.currentSession.bye();
             break;
         }
       } catch (e) {
           console.error("Error ending SIP call", e);
       }
       this.currentSession = null;
    }
  }
}

export const browserTelephony = new BrowserTelephonyService();
