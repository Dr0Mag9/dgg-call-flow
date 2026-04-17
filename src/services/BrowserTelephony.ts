import { UserAgent, Inviter, SessionState, UserAgentOptions, Registerer, RegistererState } from 'sip.js';

class BrowserTelephonyService {
  private userAgent: UserAgent | null = null;
  private registerer: Registerer | null = null;
  private currentSession: Inviter | any = null;
  private isConnected = false;
  private onStatusChange: ((status: 'OFFLINE' | 'CONNECTING' | 'LINKED' | 'ERROR', extra?: string) => void) | null = null;
  private remoteAudio: HTMLAudioElement | null = null;
  private lastConfig: any = null;
  private retryTimeout: any = null;

  setStatusCallback(callback: (status: 'OFFLINE' | 'CONNECTING' | 'LINKED' | 'ERROR', extra?: string) => void) {
    this.onStatusChange = callback;
  }

  private setupRemoteAudio() {
    if (typeof window === 'undefined') return;
    if (this.remoteAudio) return;
    
    this.remoteAudio = document.createElement('audio');
    this.remoteAudio.id = 'remote-telephony-audio';
    this.remoteAudio.autoplay = true;
    this.remoteAudio.style.display = 'none';
    document.body.appendChild(this.remoteAudio);
    console.log('[BrowserTelephony] Global Audio Sink Initialized');
  }

  async connect(config: { wssUrl: string; extension: string; password?: string; domain: string }) {
    if (!config.wssUrl) return;
    this.lastConfig = config;
    this.setupRemoteAudio();
    this.onStatusChange?.('CONNECTING');

    // REDUNDANT SIGNAL NET: Expanded list to bypass regional ISP blocks
    const urls = [
      `wss://sip2sip.info:443`,
      `wss://sipthor.net:443`,
      `wss://proxy.sipthor.net:443`,
      `wss://sipthor.net:8443`,
      `wss://sip2sip.info:8443`,
      `wss://sip2sip.info:5061`, // SIP-TLS Port
      `wss://edge.sip.audio:443` // Third-party edge proxy
    ];

    try {
      this.isConnected = false;
      if (this.userAgent) {
        await this.userAgent.stop();
        this.userAgent = null;
      }

      console.log('[Stealth Bridge] Starting parallel discovery across 7 nodes...');
      const connectionAttempts = urls.map(url => this.tryStartUA(url, config));
      await Promise.all(connectionAttempts);
      
      if (!this.isConnected) {
        throw new Error('All signaling paths failed');
      }
    } catch (err) {
      console.error('[Stealth Bridge] Block detected. Scheduling auto-tunneling...');
      this.onStatusChange?.('ERROR', 'TUNNELING...');
      this.scheduleRetry();
    }
  }

  private scheduleRetry() {
    if (this.retryTimeout) clearTimeout(this.retryTimeout);
    this.retryTimeout = setTimeout(() => {
      if (!this.isConnected && this.lastConfig) {
        console.log('[Stealth Bridge] Retrying background link...');
        this.connect(this.lastConfig);
      }
    }, 30000); // Silent retry every 30s
  }

  private async tryStartUA(url: string, config: any): Promise<boolean> {
    if (this.isConnected) return true; 

    const domain = config.domain || 'sip2sip.info';
    const uri = UserAgent.makeURI(`sip:${config.extension}@${domain}`);
    if (!uri) throw new Error("Invalid SIP URI");

    const authUser = config.extension.includes('@') ? config.extension : `${config.extension}@${domain}`;

    const options: UserAgentOptions = {
      uri,
      transportOptions: {
        server: url,
        traceSip: true,
        keepAliveInterval: 10,
        connectionTimeout: 10,
      },
      authorizationUsername: authUser,
      authorizationPassword: config.password || '',
      displayName: config.extension,
      hackIpInContact: true,
      logLevel: "error", // Quiet logging for background retries
      sessionDescriptionHandlerFactoryOptions: {
        peerConnectionConfiguration: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:sip2sip.info:3478' }
          ]
        }
      }
    };

    const ua = new UserAgent(options);
    
    return new Promise((resolve) => {
      let resolved = false;

      ua.delegate = {
        onConnect: () => {
          if (this.isConnected) { ua.stop(); return; }
          console.log(`[Stealth Bridge] SUCCESS: Linked via ${url}`);
          this.userAgent = ua;
          this.isConnected = true;
          if (this.retryTimeout) clearTimeout(this.retryTimeout);
          this.initRegisterer();
          if (!resolved) { resolved = true; resolve(true); }
        },
        onDisconnect: (error) => {
          if (!resolved) { resolved = true; resolve(false); }
          if (this.isConnected) {
             this.isConnected = false;
             this.scheduleRetry();
          }
        }
      };

      ua.start().catch(err => {
        if (!resolved) { resolved = true; resolve(false); }
      });

      setTimeout(() => {
        if (!resolved) {
          if (!this.isConnected) ua.stop();
          resolved = true;
          resolve(false);
        }
      }, 15000);
    });
  }

  private initRegisterer() {
    if (!this.userAgent) return;
    
    this.registerer = new Registerer(this.userAgent, { expires: 600 });
    this.registerer.stateChange.addListener((state: RegistererState) => {
      if (state === RegistererState.Registered) {
        this.onStatusChange?.('LINKED');
      } else if (state === RegistererState.Unregistered || state === RegistererState.Terminated) {
        if (this.isConnected) {
           this.onStatusChange?.('OFFLINE');
           this.scheduleRetry();
        }
      }
    });

    this.registerer.register().catch(err => {
      const sipCode = err.message?.match(/\d{3}/)?.[0] || 'FAILED';
      this.onStatusChange?.('ERROR', `ERR_${sipCode}`);
      this.scheduleRetry();
    });
  }

  async initiateCall(phoneNumber: string, domain: string) {
    if (!this.isConnected || !this.userAgent) {
       console.warn('[Stealth Bridge] Call blocked: Bridge not linked.');
       return;
    }

    const targetURI = UserAgent.makeURI(`sip:${phoneNumber}@${domain}`);
    if (!targetURI) throw new Error("Invalid target URI");

    const session = new Inviter(this.userAgent, targetURI, {
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false }
      }
    });

    this.currentSession = session;
    this.setupSessionListeners(session);

    await session.invite();
  }

  private setupSessionListeners(session: Inviter) {
    session.stateChange.addListener((state: SessionState) => {
      if (state === SessionState.Established) {
        const sdh = session.sessionDescriptionHandler as any;
        if (sdh && sdh.peerConnection) {
          const pc = sdh.peerConnection as RTCPeerConnection;
          
          pc.ontrack = (event) => {
            console.log(`[Stealth Bridge] Remote audio stream active: ${event.track.label}`);
            if (event.track.kind === 'audio' && this.remoteAudio) {
              const remoteStream = new MediaStream();
              remoteStream.addTrack(event.track);
              this.remoteAudio.srcObject = remoteStream;
              this.remoteAudio.muted = false;
              this.remoteAudio.volume = 1.0;
              this.remoteAudio.play().catch(e => console.error('[Stealth Bridge] Audio play error:', e));
            }
          };
        }
      }

      if (state === SessionState.Terminated) {
        if (this.remoteAudio) this.remoteAudio.srcObject = null;
        if (this.currentSession === session) this.currentSession = null;
      }
    });
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
