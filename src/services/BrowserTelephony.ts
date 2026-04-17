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

    // Try a few ports if 443 fails
    const possibleUrls = [config.wssUrl];
    if (config.wssUrl.includes(':443')) {
      possibleUrls.push(config.wssUrl.replace(':443', ':16443'));
      possibleUrls.push(config.wssUrl.replace(':443', ':8443'));
    } else if (!config.wssUrl.includes(':')) {
       possibleUrls.push(`${config.wssUrl}:443`);
       possibleUrls.push(`${config.wssUrl}:16443`);
    }

    for (const url of possibleUrls) {
      try {
        console.log(`[BrowserTelephony] Attempting connection to: ${url}`);
        const success = await this.tryStartUA(url, config);
        if (success) return;
      } catch (err) {
        console.warn(`[BrowserTelephony] Failed attempt to ${url}, trying next...`);
      }
    }

    console.error('[BrowserTelephony] All connection attempts failed');
    this.onStatusChange?.('ERROR');
  }

  private async tryStartUA(url: string, config: any): Promise<boolean> {
    const uri = UserAgent.makeURI(`sip:${config.extension}@${config.domain}`);
    if (!uri) throw new Error("Invalid SIP URI");

    const options: UserAgentOptions = {
      uri,
      transportOptions: {
        server: url,
        traceSip: true,
      },
      authorizationUsername: config.extension,
      authorizationPassword: config.password || '',
      displayName: config.extension,
      hackIpInContact: true,
      logLevel: "debug",
      sessionDescriptionHandlerFactoryOptions: {
        peerConnectionConfiguration: {
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        }
      }
    };

    const ua = new UserAgent(options);
    
    return new Promise((resolve) => {
      let resolved = false;

      ua.delegate = {
        onConnect: () => {
          console.log(`[BrowserTelephony] SIP Connected to ${url}`);
          this.userAgent = ua;
          this.isConnected = true;
          this.initRegisterer();
          if (!resolved) { resolved = true; resolve(true); }
        },
        onDisconnect: (error) => {
          console.log(`[BrowserTelephony] SIP Disconnected from ${url}`, error);
          if (!resolved) { resolved = true; resolve(false); }
        }
      };

      ua.start().catch(err => {
        console.warn(`[BrowserTelephony] UA start error for ${url}`, err);
        if (!resolved) { resolved = true; resolve(false); }
      });

      // Timeout attempt
      setTimeout(() => {
        if (!resolved) {
          console.warn(`[BrowserTelephony] Connection attempt to ${url} timed out`);
          ua.stop();
          resolved = true;
          resolve(false);
        }
      }, 5000);
    });
  }

  private initRegisterer() {
    if (!this.userAgent) return;
    
    this.registerer = new Registerer(this.userAgent, { expires: 600 });
    this.registerer.stateChange.addListener((state: RegistererState) => {
      console.log(`[BrowserTelephony] Registration: ${state}`);
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
       console.warn('[BrowserTelephony] Not connected.');
       return;
    }

    const targetURI = UserAgent.makeURI(`sip:${phoneNumber}@${domain}`);
    if (!targetURI) throw new Error("Invalid target URI");

    this.currentSession = new Inviter(this.userAgent, targetURI, {
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false }
      }
    });

    await this.currentSession.invite();
  }

  async endCall() {
    if (this.currentSession) {
       try {
         if (this.currentSession.state === SessionState.Established) {
           await this.currentSession.bye();
         } else {
           await this.currentSession.cancel();
         }
       } catch (e) {
           console.error("Error ending SIP call", e);
       }
       this.currentSession = null;
    }
  }
}

export const browserTelephony = new BrowserTelephonyService();
