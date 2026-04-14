import { UserAgent, Inviter, SessionState, UserAgentOptions } from 'sip.js';
import { useAppStore } from '../store/useAppStore';

class BrowserTelephonyService {
  private userAgent: UserAgent | null = null;
  private currentSession: Inviter | any = null;
  private isConnected = false;

  async connect(config: { sipWssUrl: string; sipExtension: string; sipPassword?: string; sipDomain: string }) {
    if (!config.sipWssUrl) return;

    try {
      const uri = UserAgent.makeURI(`sip:${config.sipExtension}@${config.sipDomain}`);
      if (!uri) throw new Error("Invalid SIP URI");

      const options: UserAgentOptions = {
        uri,
        transportOptions: {
          server: config.sipWssUrl,
        },
        authorizationUsername: config.sipExtension,
        authorizationPassword: config.sipPassword || '',
      };

      this.userAgent = new UserAgent(options);

      this.userAgent.delegate = {
        onConnect: () => {
          console.log('[BrowserTelephony] SIP Connected');
          this.isConnected = true;
        },
        onDisconnect: (error) => {
          console.log('[BrowserTelephony] SIP Disconnected', error);
          this.isConnected = false;
        },
        onInvite: (invitation) => {
          console.log('[BrowserTelephony] Incoming Call...');
          // The state store handles incoming calls via socket.io events from the backend,
          // but we would hook audio here.
        }
      };

      await this.userAgent.start();
    } catch (err) {
      console.error('[BrowserTelephony] Connection failed', err);
    }
  }

  async initiateCall(phoneNumber: string, domain: string) {
    if (!this.isConnected || !this.userAgent) {
       console.warn('[BrowserTelephony] Not connected to SIP broker. Falling back to backend socket signaling.');
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
