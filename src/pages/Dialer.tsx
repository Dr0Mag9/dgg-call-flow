import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Phone, Delete, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Dialer({ embedded = false }: { embedded?: boolean }) {
  const [number, setNumber] = useState('');
  const [isDialing, setIsDialing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, activeCall, lineInfo } = useAppStore();

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

  return (
    <div className={`${embedded ? 'w-full' : 'max-w-md mx-auto mt-10'}`}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="luxury-card overflow-hidden group shadow-2xl shadow-gold/10 relative border-gold/30"
      >
        {/* Connectivity Bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-navy/80 flex items-center justify-between px-3 z-20">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`w-0.5 h-2 rounded-full ${i <= 3 ? 'bg-gold' : 'bg-gold/20'}`} />
            ))}
          </div>
          <span className="text-[6px] font-black text-gold uppercase tracking-[0.2em] animate-pulse">Quantum Link: Active</span>
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
        
        {activeCall && (
          <div className="absolute inset-0 bg-gold/5 animate-pulse flex items-center justify-center pointer-events-none">
            <div className="w-32 h-32 bg-gold/5 blur-[50px] rounded-full" />
          </div>
        )}
      </motion.div>
    </div>
  );
}
