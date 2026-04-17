import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Phone, Delete, Zap, Headphones, Volume2, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

export default function Dialer({ embedded = false }: { embedded?: boolean }) {
  const [number, setNumber] = useState('');
  const [isDialing, setIsDialing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasHeadset, setHasHeadset] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const { token, activeCall, lineInfo, sipStatus, sipError } = useAppStore();

  // Hardware Sensing Logic
  useEffect(() => {
    const checkHardware = async () => {
      if (!navigator.mediaDevices) {
        console.warn('Hardware sensing requires HTTPS/Secure Context');
        setHasHeadset(false);
        return;
      }

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const outputs = devices.filter(d => d.kind === 'audiooutput');
        // Check if a dedicated communication device (Headset) is present
        const headset = outputs.some(d => 
          d.label.toLowerCase().includes('headset') || 
          d.label.toLowerCase().includes('headphones') ||
          d.label.toLowerCase().includes('hands-free')
        );
        setHasHeadset(headset);
      } catch (err) {
        console.warn('Hardware sensing restricted:', err);
      }
    };

    checkHardware();
    if (navigator.mediaDevices) {
      navigator.mediaDevices.ondevicechange = checkHardware;
    }
    return () => {
      if (navigator.mediaDevices) {
        navigator.mediaDevices.ondevicechange = null;
      }
    };
  }, []);

  const toggleSpeaker = async () => {
    if (!navigator.mediaDevices) {
      // Don't set global error, just log it. 
      // The UI button will show the restriction.
      console.warn('Speaker switching requires HTTPS');
      return;
    }
    setIsSpeakerOn(!isSpeakerOn);
    // Note: setSinkId is Chrome-only. We'll attempt it if available.
    try {
      const audioElements = document.querySelectorAll('audio');
      const devices = await navigator.mediaDevices.enumerateDevices();
      const speaker = devices.find(d => 
        d.kind === 'audiooutput' && 
        (d.label.toLowerCase().includes('speaker') || d.label.toLowerCase().includes('internal'))
      );
      
      if (speaker && (audioElements[0] as any).setSinkId) {
        audioElements.forEach(el => (el as any).setSinkId(isSpeakerOn ? '' : speaker.deviceId));
      }
    } catch (e) {
      console.warn('Speaker switching not supported in this browser');
    }
  };

  const handleDial = async () => {
    if (!number || isDialing) return;
    setIsDialing(true);
    setError(null);

    try {
      const res = await fetch('/api/calls/outbound', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phoneNumber: number })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Logical Link Failure');
        setIsDialing(false);
        return;
      }

      setNumber('');
    } catch (err) {
      setError('Network communication lost');
      console.error(err);
    } finally {
      setIsDialing(false);
    }
  };

  const handleKeypadClick = (digit: string) => {
    setNumber(prev => prev + digit);
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

  const isSecureContext = typeof window !== 'undefined' && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  return (
    <div className={`${embedded ? 'w-full' : 'max-w-md mx-auto mt-10'}`}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="luxury-card overflow-hidden group shadow-2xl shadow-gold/10 relative border-gold/30"
      >
        {/* Connectivity Bar */}
        <div className="absolute top-0 inset-x-0 h-4 bg-navy/80 backdrop-blur-md flex items-center justify-between px-4 z-20 border-b border-gold/10">
          <div className="flex gap-1.5 items-center">
            <div className={`w-1.5 h-1.5 rounded-full ${
              sipStatus === 'LINKED' ? 'bg-gold animate-pulse shadow-[0_0_10px_#D4AF37]' : 
              sipStatus === 'CONNECTING' ? 'bg-blue-400 animate-spin' : 
              sipStatus === 'ERROR' ? 'bg-red-500' : 'bg-slate-700'
            }`} />
            <span className="text-[7px] font-black text-gold uppercase tracking-[0.2em]">
              Bridge: {sipStatus === 'LINKED' ? 'ONLINE' : (sipError || sipStatus)}
            </span>
          </div>
          <span className="text-[7px] font-black text-gold/40 uppercase tracking-[0.2em]">Quantum Link: Active</span>
        </div>

        <div className="p-10 bg-gradient-to-b from-navy via-navy to-[#0A1221] text-center relative border-b border-gold/10">
          <div className="flex items-center justify-center gap-2 mb-4 mt-2">
            <Zap className="w-4 h-4 text-gold animate-pulse" />
            <span className="text-[10px] font-black tracking-[0.4em] uppercase text-gold-light/40 italic">Wealth Command Dial</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={number || (error ? 'error' : 'placeholder')}
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="h-16 flex flex-col items-center justify-center"
            >
              {error ? (
                <span className="text-xs font-black text-red-500 uppercase tracking-widest animate-pulse px-4 text-center">
                  Protocol Error: {error}
                </span>
              ) : (
                <span className="text-5xl font-mono font-black tracking-[0.2em] gold-text-gradient drop-shadow-[0_0_20px_rgba(212,175,55,0.3)] italic">
                  {number || '---'}
                </span>
              )}
            </motion.div>
          </AnimatePresence>
          
          <div className="text-[9px] font-black text-gold-light/20 mt-4 uppercase tracking-[0.3em] italic">
            {!lineInfo ? 'AUTHENTICATION REQUIRED IN ADMIN' : 'Encrypted Satellite Uplink'}
          </div>
        </div>
        
        <div className="p-8 bg-[#0A1221]/60 backdrop-blur-xl">
          {activeCall ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center space-y-8"
            >
              <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-gold/30 to-navy border border-gold/40 flex items-center justify-center shadow-2xl relative group/avatar">
                <div className="absolute inset-0 bg-gold/10 rounded-[inherit] animate-ping opacity-20" />
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-16 h-16 rounded-3xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold"
                >
                  <Phone className="w-8 h-8 italic" />
                </motion.div>
              </div>

              <div className="text-center">
                <h3 className="text-2xl font-black text-pearl tracking-tight uppercase italic gold-text-gradient mb-1">
                  {activeCall.client?.name || 'External Signal'}
                </h3>
                <p className="text-xs font-black text-gold/60 tracking-widest uppercase mb-4">{activeCall.phoneNumber}</p>
                
                <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gold/5 border border-gold/10">
                  <motion.div 
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-gold shadow-[0_0_10px_#D4AF37]" 
                  />
                  <span className="text-[10px] font-black text-pearl/60 uppercase tracking-[0.2em] italic shimmer-text">
                    {activeCall.status === 'DIALING' && 'Securing Uplink...'}
                    {activeCall.status === 'RINGING' && 'Signal Transmitting...'}
                    {activeCall.status === 'CONNECTED' && 'Logic Link Established'}
                    {activeCall.status === 'ENDED' && 'Uplink Terminated'}
                  </span>
                </div>
              </div>

              <div className="flex gap-8">
                <motion.button
                  whileHover={{ scale: 1.1, boxShadow: '0 0 40px rgba(239, 68, 68, 0.4)' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={async () => {
                    try {
                      await fetch(`/api/calls/${activeCall.id}/hangup`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                      });
                    } catch (err) { console.error(err); }
                  }}
                  className="w-20 h-20 rounded-3xl bg-red-500 text-white flex flex-col items-center justify-center shadow-2xl shadow-red-500/20 group/end transition-all"
                >
                  <Delete className="w-8 h-8 mb-1" />
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">End Call</span>
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-6 mb-8">
                {digits.map((digit) => (
                  <motion.button
                    key={digit}
                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(212, 175, 55, 0.05)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleKeypadClick(digit)}
                    className="h-16 rounded-2xl bg-white/5 border border-gold/10 text-2xl font-black text-pearl hover:border-gold/40 transition-all flex flex-col items-center justify-center group/key shadow-lg"
                  >
                    <span className="italic">{digit}</span>
                    <span className="text-[8px] text-gold-light/10 group-hover/key:text-gold-light/40 transition-colors uppercase tracking-widest mt-1">
                      {digit === '1' ? 'VOX' : digit === '0' ? '+' : ''}
                    </span>
                  </motion.button>
                ))}
              </div>

              <div className="flex justify-between items-center px-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setNumber(prev => prev.slice(0, -1))}
                  disabled={!number}
                  className="w-12 h-12 rounded-xl bg-red-500/5 border border-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/10 transition-all disabled:opacity-5"
                >
                  <Delete className="w-5 h-5" />
                </motion.button>

                <motion.button
                  whileHover={!(!number || !lineInfo || isDialing) ? { scale: 1.1, boxShadow: '0 0 30px rgba(212,175,55,0.4)' } : {}}
                  whileTap={!(!number || !lineInfo || isDialing) ? { scale: 0.9 } : {}}
                  onClick={handleDial}
                  disabled={!number || !lineInfo || isDialing}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-light via-gold to-gold-deep text-navy flex items-center justify-center transition-all shadow-2xl relative group/call disabled:opacity-30 disabled:grayscale"
                >
                  {isDialing && (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 border-2 border-navy/20 border-t-navy rounded-full"
                    />
                  )}
                  <div className="absolute inset-0 rounded-full bg-gold animate-ping opacity-10 pointer-events-none" />
                  <Phone className={`w-7 h-7 drop-shadow-md ${isDialing ? 'opacity-20' : ''}`} />
                </motion.button>

                <div className="w-10 flex flex-col items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-gold animate-pulse shadow-[0_0_10px_#D4AF37]" />
                  <span className="text-[7px] font-black text-gold-light/30 uppercase tracking-[0.3em] italic">Ready</span>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Quantum Hardware Status Bar */}
        <div className="bg-navy/40 border-t border-gold/10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gold/5 border ${hasHeadset ? 'border-gold/30 text-gold' : 'border-pearl/5 text-pearl/20'}`}>
              <Headphones className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-gold/60 uppercase tracking-widest">Audio Intelligence</span>
              {!isSecureContext ? (
                <span className="text-[8px] font-bold text-red-500/60 uppercase animate-pulse">HTTPS REQD FOR HARDWARE</span>
              ) : (
                <span className={`text-[10px] font-bold italic transition-colors ${hasHeadset ? 'text-gold' : 'text-pearl/80'}`}>
                  {hasHeadset ? 'QUANTUM HEADSET DETECTED' : 'SYSTEM LOUDSPEAKER ACTIVE'}
                </span>
              )}
            </div>
          </div>

          <motion.button
            whileHover={isSecureContext ? { scale: 1.05, backgroundColor: 'rgba(212,175,55,0.1)' } : {}}
            whileTap={isSecureContext ? { scale: 0.95 } : {}}
            onClick={toggleSpeaker}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
              !isSecureContext ? 'bg-navy/40 border-white/5 opacity-50 cursor-not-allowed text-pearl/20' :
              isSpeakerOn 
                ? 'bg-gold/10 border-gold shadow-[0_0_15px_rgba(212,175,55,0.2)] text-gold' 
                : 'bg-navy/60 border-pearl/10 text-pearl/40'
            }`}
          >
            <Volume2 className="w-3 h-3" />
            <span className="text-[8px] font-black uppercase tracking-widest">
              {!isSecureContext ? 'SSL LOCKED' : isSpeakerOn ? 'Speaker ON' : 'Speaker OFF'}
            </span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
