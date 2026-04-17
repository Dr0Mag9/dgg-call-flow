import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Professional Recovery System (Error Boundary)
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("[CRITICAL SYSTEM FAILURE]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-[#060B14] flex flex-col items-center justify-center p-8 font-sans">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </div>
          <h1 className="text-xl font-black text-pearl uppercase tracking-[0.3em] italic mb-2">Protocol Failure</h1>
          <p className="text-gold-light/40 text-[10px] uppercase tracking-widest mb-8 max-w-xs text-center leading-relaxed">
            The neural interface has encountered an unexpected recursive loop. Recovery protocols initiated.
          </p>
          <button 
            onClick={() => window.location.assign('/login')}
            className="px-8 py-3 bg-gold/10 border border-gold/30 rounded-xl text-gold font-black uppercase text-[10px] tracking-widest hover:bg-gold/20 transition-all shadow-xl"
          >
            Reboot Nexus Terminal
          </button>
          <pre className="mt-12 text-[8px] text-red-500/40 font-mono overflow-auto max-w-xl text-center">
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
