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
    console.log('[Deep Proxy] Global Audio Sink Initialized');
  }

  async connect(config: { wssUrl: string; extension: string; password?: string; domain: string }) {
    if (!config.wssUrl) return;
    this.lastConfig = config;
    this.setupRemoteAudio();
    this.onStatusChange?.('CONNECTING');

    // SSL Check: Browser requires secure context for voice
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      console.error('[Deep Proxy] INSECURE CONTEXT DETECTED. Chrome will block audio hardware.');
      this.onStatusChange?.('ERROR', 'SSL_NOT_TRUSTED');
    }

    // Production SIGNAL NET: Diversified paths for HTTPS environments
    const urls = [
      `wss://sip2sip.info:443`,
      `wss://sipthor.net:8443`,
      `wss://webrtc.antisip.com:443`,
      `wss://sip.linphone.org:443`,
      `wss://edge.sip.audio:443`,
      config.wssUrl.replace('ws://', 'wss://') // Ensure secure protocol
    ];

    try {
      this.isConnected = false;
      if (this.userAgent) {
        await this.userAgent.stop();
        this.userAgent = null;
      }

      console.log('[Deep Proxy] Hunting for open signaling door...');
      // Cycle faster to find working path
      const connectionAttempts = urls.map(url => this.tryStartUA(url, config));
      await Promise.all(connectionAttempts);
      
      if (!this.isConnected) {
        throw new Error('Signal blocked');
      }
    } catch (err) {
      this.onStatusChange?.('ERROR', 'TUNNELING...');
      this.scheduleRetry();
    }
  }

  private scheduleRetry() {
    if (this.retryTimeout) clearTimeout(this.retryTimeout);
    this.retryTimeout = setTimeout(() => {
      if (!this.isConnected && this.lastConfig) {
        this.connect(this.lastConfig);
      }
    }, 15000); // Aggressive 15s retry for Deep Proxy
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
        connectionTimeout: 8, // Rapid handshake
      },
      authorizationUsername: authUser,
      authorizationPassword: config.password || '',
      displayName: config.extension,
      hackIpInContact: true,
      logLevel: "error",
      sessionDescriptionHandlerFactoryOptions: {
        peerConnectionConfiguration: {
          // FORCE RELAY: Bypasses Indian ISP direct P2P blocks
          iceTransportPolicy: 'relay',
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun.services.mozilla.com' },
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
          console.log(`[Deep Proxy] TUNNEL OPEN via ${url}`);
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

      // Quick timeout to switch to next node
      setTimeout(() => {
        if (!resolved) {
          if (!this.isConnected) ua.stop();
          resolved = true;
          resolve(false);
        }
      }, 10000);
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
      this.onStatusChange?.('ERROR', 'RE-TUNNELING...');
      this.scheduleRetry();
    });
  }

  async initiateCall(phoneNumber: string, domain: string) {
    if (!this.isConnected || !this.userAgent) return;

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
            if (event.track.kind === 'audio' && this.remoteAudio) {
              const remoteStream = new MediaStream();
              remoteStream.addTrack(event.track);
              this.remoteAudio.srcObject = remoteStream;
              this.remoteAudio.muted = false;
              this.remoteAudio.volume = 1.0;
              this.remoteAudio.play().catch(e => console.error('[Deep Proxy] Audio play error:', e));
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
