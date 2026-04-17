import { UserAgent, Inviter, SessionState, UserAgentOptions, Registerer, RegistererState } from 'sip.js';

class BrowserTelephonyService {
  private userAgent: UserAgent | null = null;
  private registerer: Registerer | null = null;
  private currentSession: Inviter | any = null;
  private isConnected = false;
  private onStatusChange: ((status: 'OFFLINE' | 'CONNECTING' | 'LINKED' | 'ERROR', extra?: string) => void) | null = null;
  private remoteAudio: HTMLAudioElement | null = null;

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
    this.remoteAudio.controls = true; // Temporary for debug if needed
    document.body.appendChild(this.remoteAudio);
    console.log('[BrowserTelephony] Global Audio Sink Initialized');
  }

  async connect(config: { wssUrl: string; extension: string; password?: string; domain: string }) {
    if (!config.wssUrl) return;
    this.setupRemoteAudio();
    this.onStatusChange?.('CONNECTING');

    // Parallel Port Discovery: Try 443 and 8443 concurrently for best-case performance
    const urls = [
      `wss://sip2sip.info:443`,
      `wss://sipthor.net:8443`,
      `wss://sipthor.net:443`,
      `wss://sip2sip.info:8443`
    ];

    try {
      this.isConnected = false;
      if (this.userAgent) {
        await this.userAgent.stop();
        this.userAgent = null;
      }

      // Use Promise.any to pick the first successful connection
      const connectionAttempts = urls.map(url => this.tryStartUA(url, config));
      await Promise.all(connectionAttempts);
      
      if (!this.isConnected) {
        throw new Error('All signaling paths failed');
      }
    } catch (err) {
      console.error('[BrowserTelephony] Critical Connection Failure:', err);
      this.onStatusChange?.('ERROR', 'WSS_RESET_REQUIRED');
    }
  }

  private async tryStartUA(url: string, config: any): Promise<boolean> {
    if (this.isConnected) return true; 

    const domain = config.domain || 'sip2sip.info';
    const uri = UserAgent.makeURI(`sip:${config.extension}@${domain}`);
    if (!uri) throw new Error("Invalid SIP URI");

    // Sip2Sip Hardening: Use explicit auth-user format
    const authUser = config.extension.includes('@') ? config.extension : `${config.extension}@${domain}`;

    const options: UserAgentOptions = {
      uri,
      transportOptions: {
        server: url,
        traceSip: true,
        keepAliveInterval: 10,
        connectionTimeout: 15,
      },
      authorizationUsername: authUser, // Force full ID
      authorizationPassword: config.password || '',
      displayName: config.extension,
      hackIpInContact: true,
      logLevel: "debug",
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
          console.log(`[BrowserTelephony] SIP Established via ${url}`);
          this.userAgent = ua;
          this.isConnected = true;
          this.initRegisterer();
          if (!resolved) { resolved = true; resolve(true); }
        },
        onDisconnect: (error) => {
          if (!resolved) { resolved = true; resolve(false); }
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
      }, 20000);
    });
  }

  private initRegisterer() {
    if (!this.userAgent) return;
    
    this.registerer = new Registerer(this.userAgent, { expires: 600 });
    this.registerer.stateChange.addListener((state: RegistererState) => {
      console.log(`[BrowserTelephony] Registration State: ${state}`);
      if (state === RegistererState.Registered) {
        this.onStatusChange?.('LINKED');
      } else if (state === RegistererState.Unregistered || state === RegistererState.Terminated) {
        this.onStatusChange?.('OFFLINE');
      }
    });

    this.registerer.register().catch(err => {
      console.error('[BrowserTelephony] Registration Request Failed:', err);
      const sipCode = err.message?.match(/\d{3}/)?.[0] || 'FAILED';
      this.onStatusChange?.('ERROR', `ERR_${sipCode}`);
    });
  }

  async initiateCall(phoneNumber: string, domain: string) {
    if (!this.isConnected || !this.userAgent) {
       console.warn('[BrowserTelephony] Not connected.');
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
      console.log(`[BrowserTelephony] Session State Change: ${state}`);
      
      if (state === SessionState.Established) {
        const sdh = session.sessionDescriptionHandler as any;
        if (sdh && sdh.peerConnection) {
          const pc = sdh.peerConnection as RTCPeerConnection;
          
          pc.ontrack = (event) => {
            console.log(`[BrowserTelephony] Remote track received: ${event.track.kind} (${event.track.label})`);
            if (event.track.kind === 'audio' && this.remoteAudio) {
              const remoteStream = new MediaStream();
              remoteStream.addTrack(event.track);
              
              // Ensure audio sink is unmuted and active
              this.remoteAudio.srcObject = remoteStream;
              this.remoteAudio.muted = false;
              this.remoteAudio.volume = 1.0;
              
              this.remoteAudio.play().then(() => {
                console.log('[BrowserTelephony] Remote audio playback started successfully');
              }).catch(e => {
                console.error('[BrowserTelephony] Audio playback failed. Check browser permissions.', e);
              });
            }
          };
        }
      }

      if (state === SessionState.Terminated) {
        if (this.remoteAudio) {
          this.remoteAudio.srcObject = null;
        }
        if (this.currentSession === session) {
          this.currentSession = null;
        }
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
