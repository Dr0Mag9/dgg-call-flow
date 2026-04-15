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
    <div className={`${embedded ? 'w-full' : 'max-w-xs mx-auto mt-6'}`}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="luxury-card overflow-hidden group shadow-gold/20 relative"
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

        <div className="p-4 bg-gradient-to-b from-navy via-navy to-[#0A1221] text-center relative border-b border-gold/10">
          <div className="flex items-center justify-center gap-2 mb-2 mt-1">
            <Zap className="w-3 h-3 text-gold animate-pulse" />
            <span className="text-[8px] font-black tracking-[0.2em] uppercase text-gold-light/40">Wealth Command Dial</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={number || 'placeholder'}
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="h-10 flex items-center justify-center"
            >
              <span className="text-3xl font-mono font-black tracking-widest gold-text-gradient drop-shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                {number || '---'}
              </span>
            </motion.div>
          </AnimatePresence>
          
          <div className="text-[7px] font-black text-gold-light/20 mt-1 uppercase tracking-widest italic">Encrypted Satellite Uplink</div>
        </div>
        
        <div className="p-4 bg-[#0A1221]/60 backdrop-blur-xl">
          <div className="grid grid-cols-3 gap-2 mb-4">
            {digits.map((digit) => (
              <motion.button
                key={digit}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(212, 175, 55, 0.05)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleKeypadClick(digit)}
                className="h-12 rounded-xl bg-white/5 border border-gold/5 text-lg font-black text-pearl hover:border-gold/30 transition-all flex flex-col items-center justify-center group/key"
              >
                <span>{digit}</span>
                <span className="text-[6px] text-gold-light/10 group-hover/key:text-gold-light/40 transition-colors uppercase tracking-widest">
                  {digit === '1' ? 'VOX' : digit === '0' ? '+' : ''}
                </span>
              </motion.button>
            ))}
          </div>

          <div className="flex justify-between items-center px-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setNumber(prev => prev.slice(0, -1))}
              disabled={!number}
              className="w-10 h-10 rounded-xl bg-red-500/5 border border-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/10 transition-all disabled:opacity-5"
            >
              <Delete className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDial}
              disabled={!number || !!activeCall}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-gold-light via-gold to-gold-deep text-navy flex items-center justify-center transition-all shadow-xl relative group/call disabled:opacity-30 disabled:grayscale"
            >
              <div className="absolute inset-0 rounded-full bg-gold animate-ping opacity-10 pointer-events-none" />
              <Phone className="w-6 h-6 drop-shadow-md" />
            </motion.button>

            <div className="w-10 flex flex-col items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse shadow-[0_0_5px_#D4AF37]" />
              <span className="text-[6px] font-black text-gold-light/30 uppercase tracking-[0.2em]">Ready</span>
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
