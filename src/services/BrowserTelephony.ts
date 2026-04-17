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
    if (!config.wssUrl && !config.extension) return;
    this.lastConfig = config;
    this.setupRemoteAudio();
    
    // AUTO-IGNITION: Always start in CONNECTING state
    this.onStatusChange?.('CONNECTING');

    // DEEP HARDWARE SCAN: Identify why audio is blocked
    const health = this.getHardwareHealth();
    if (health !== 'OK') {
      console.warn(`[Deep Proxy] Hardware Alert: ${health}`);
      this.onStatusChange?.('ERROR', health);
    }

    // MULTI-NODE AUTOPILOT: Parse candidates from Admin settings
    const adminUrls = (config.wssUrl || '').split(',').map(u => u.trim()).filter(u => u.length > 0);
    const stealthUrls = [
      `wss://proxy.sipthor.net:443`, 
      `wss://69.62.79.9:8089`,       // Non-Nginx Port (Primary)
      `wss://69.62.79.9:16443`,      // Non-Nginx Port (Alternative)
      `wss://69.62.79.9:443`,        // Legacy Proxy
      `wss://sip2sip.info:443`,
      `wss://sipthor.net:8443`
    ];

    // Merge and finalize discovery net: Ensure Raw IP is tried first
    const urls = [...new Set([...stealthUrls, ...adminUrls])].map(url => 
      url.startsWith('ws://') ? url.replace('ws://', 'wss://') : url
    );

    try {
      this.isConnected = false;
      if (this.userAgent) {
        await this.userAgent.stop();
        this.userAgent = null;
      }

      console.log(`[Deep Proxy] Aggressive Auto-Ignition across ${urls.length} nodes:`, urls);
      const connectionAttempts = urls.map(url => this.tryStartUA(url, config));
      
      // Parallel Discovery: First one to respond wins
      await Promise.all(connectionAttempts);
      
      if (!this.isConnected) {
        throw new Error('Signal blocked');
      }
    } catch (err) {
      this.onStatusChange?.('ERROR', 'TUNNELING...');
      this.scheduleRetry();
    }
  }

  public checkHealth(): string {
    return this.getHardwareHealth();
  }

  private getHardwareHealth(): string {
    if (typeof window === 'undefined') return 'ENV_ERROR';
    
    // CRITICAL: Chrome blocks ALL microphones in non-secure (Raw IP) contexts
    if (!window.isSecureContext && !window.location.hostname.includes('localhost')) {
      return 'SSL_INSECURE_CONTEXT';
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return 'BROWSER_MEDIA_BLOCKED';
    }

    return 'OK';
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
        connectionTimeout: 10, // Increased for cross-continent signaling
      },
      authorizationUsername: authUser,
      authorizationPassword: config.password || '',
      displayName: config.extension,
      hackIpInContact: true,
      logLevel: "error",
      sessionDescriptionHandlerFactoryOptions: {
        peerConnectionConfiguration: {
          iceTransportPolicy: 'relay', // FORCE RELAY: Ensures packets take the tunnel
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun.services.mozilla.com' },
            { urls: 'stun:sip2sip.info:3478' },
            { urls: 'stun:stun.voip.antisip.com' },
            { urls: 'stun:stun.ekiga.net' },
            { urls: 'stun:stun.ideasip.com' },
            { urls: 'stun:stun.softjoys.com' },
            { urls: 'stun:stun.voipbuster.com' }
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
      // STEALTH DIAGNOSTICS: Extract specific SIP failure codes
      const msg = err?.toString() || '';
      console.error('[Deep Proxy] Registration Detailed Error:', msg);
      
      let errorLabel = 'RE-TUNNELING...';
      if (msg.includes('401')) errorLabel = 'ERR_AUTH_401';
      else if (msg.includes('403')) errorLabel = 'ERR_AUTH_403';
      else if (msg.includes('408')) errorLabel = 'ERR_TIMEOUT_408';
      else if (msg.includes('503')) errorLabel = 'ERR_SERVER_503';
      
      this.onStatusChange?.('ERROR', errorLabel);
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
