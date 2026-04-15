import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Phone, Delete, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Dialer({ embedded = false }: { embedded?: boolean }) {
  const [number, setNumber] = useState('');
  const { token, activeCall } = useAppStore();

  const handleDial = async () => {
    if (!number) return;
    try {
      await fetch('/api/calls/outbound', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phoneNumber: number })
      });
      setNumber('');
    } catch (err) {
      console.error(err);
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
              key={number || 'placeholder'}
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="h-16 flex items-center justify-center"
            >
              <span className="text-5xl font-mono font-black tracking-[0.2em] gold-text-gradient drop-shadow-[0_0_20px_rgba(212,175,55,0.3)] italic">
                {number || '---'}
              </span>
            </motion.div>
          </AnimatePresence>
          
          <div className="text-[9px] font-black text-gold-light/20 mt-4 uppercase tracking-[0.3em] italic">Encrypted Satellite Uplink</div>
        </div>
        
        <div className="p-8 bg-[#0A1221]/60 backdrop-blur-xl">
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
              whileHover={{ scale: 1.1, boxShadow: '0 0 30px rgba(212, 175, 55, 0.4)' }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDial}
              disabled={!number || !!activeCall}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-light via-gold to-gold-deep text-navy flex items-center justify-center transition-all shadow-2xl relative group/call disabled:opacity-30 disabled:grayscale"
            >
              <div className="absolute inset-0 rounded-full bg-gold animate-ping opacity-10 pointer-events-none" />
              <Phone className="w-7 h-7 drop-shadow-md" />
            </motion.button>

            <div className="w-10 flex flex-col items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-gold animate-pulse shadow-[0_0_10px_#D4AF37]" />
              <span className="text-[7px] font-black text-gold-light/30 uppercase tracking-[0.3em] italic">Ready</span>
            </div>
          </div>
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
