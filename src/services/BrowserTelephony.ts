import { UserAgent, Inviter, SessionState, UserAgentOptions, Registerer, RegistererState } from 'sip.js';

class BrowserTelephonyService {
  private userAgent: UserAgent | null = null;
  private registerer: Registerer | null = null;
  private currentSession: Inviter | any = null;
  private isConnected = false;
  private onStatusChange: ((status: 'OFFLINE' | 'CONNECTING' | 'LINKED' | 'ERROR') => void) | null = null;
  private remoteAudio: HTMLAudioElement | null = null;

  setStatusCallback(callback: (status: 'OFFLINE' | 'CONNECTING' | 'LINKED' | 'ERROR') => void) {
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
    this.setupRemoteAudio();
    this.onStatusChange?.('CONNECTING');

    // Parallel Port Discovery: Try 443 and 8443 concurrently for best-case performance
    const urls = [
      `wss://sip2sip.info:443`,
      `wss://sipthor.net:443`,
      `wss://sip2sip.info:8443`,
      `wss://sipthor.net:8443`
    ];

    try {
      // Use Promise.race to pick the first successful connection
      const connectionAttempt = urls.map(url => this.tryStartUA(url, config));
      await Promise.all(connectionAttempt);
      
      if (!this.isConnected) {
        throw new Error('All signaling paths failed');
      }
    } catch (err) {
      console.error('[BrowserTelephony] Critical Connection Failure:', err);
      this.onStatusChange?.('ERROR');
    }
  }

  private async tryStartUA(url: string, config: any): Promise<boolean> {
    if (this.isConnected) return true; // Already connected via another path

    const uri = UserAgent.makeURI(`sip:${config.extension}@${config.domain}`);
    if (!uri) throw new Error("Invalid SIP URI");

    const options: UserAgentOptions = {
      uri,
      transportOptions: {
        server: url,
        traceSip: true,
        // HEARTBEAT: Prevent firewall/NAT timeout (UK to India)
        keepAliveInterval: 10,
        connectionTimeout: 15, // 15 seconds for socket handshake
      },
      authorizationUsername: config.extension,
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
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
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
          if (this.isConnected) { ua.stop(); return; } // Late winner
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

      // High-latency timeout for international routes (UK to India)
      setTimeout(() => {
        if (!resolved) {
          console.warn(`[BrowserTelephony] Parallel path ${url} timed out (20s)`);
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

    // Attempt registration with error capture
    this.registerer.register().catch(err => {
      console.error('[BrowserTelephony] Registration Request Failed:', err);
      // If we get a 401/403, it's usually credentials (username/password)
      if (err.message?.includes('401') || err.message?.includes('403')) {
        console.error('[BRIDGE DIAGNOSTIC] AUTHENTICATION FAILURE. Check Extension (Username) and Password.');
      }
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
