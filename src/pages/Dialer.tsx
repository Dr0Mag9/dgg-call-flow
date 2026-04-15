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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="luxury-card overflow-hidden group shadow-gold/20"
      >
        <div className="p-10 bg-gradient-to-b from-navy to-navy-light text-center relative border-b border-gold/20">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-gold/30 rounded-full blur-sm" />
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-gold animate-pulse" />
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-gold-light/60">Wealth Console</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={number || 'placeholder'}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="h-16 flex items-center justify-center"
            >
              <span className="text-5xl font-mono font-black tracking-widest gold-text-gradient drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                {number || '...'}
              </span>
            </motion.div>
          </AnimatePresence>
          
          <div className="text-[10px] font-bold text-gold-light/30 mt-2 uppercase tracking-widest">Secure Transmission Line</div>
        </div>
        
        <div className="p-10 bg-navy/40 backdrop-blur-xl">
          <div className="grid grid-cols-3 gap-6 mb-10">
            {digits.map((digit) => (
              <motion.button
                key={digit}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(212, 175, 55, 0.1)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleKeypadClick(digit)}
                className="h-20 rounded-2xl bg-white/5 border border-gold/10 text-3xl font-bold text-pearl hover:border-gold/30 transition-all flex flex-col items-center justify-center group/key"
              >
                <span>{digit}</span>
                <span className="text-[8px] text-gold-light/20 group-hover/key:text-gold-light/60 transition-colors uppercase mt-1 tracking-tighter">
                  {digit === '1' ? '⚡' : digit === '0' ? '+' : ''}
                </span>
              </motion.button>
            ))}
          </div>

          <div className="flex justify-center gap-8 items-center">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setNumber(prev => prev.slice(0, -1))}
              disabled={!number}
              className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-all disabled:opacity-20"
            >
              <Delete className="w-7 h-7" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1, boxShadow: '0 0 30px rgba(212, 175, 55, 0.4)' }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDial}
              disabled={!number || !!activeCall}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-gold-light via-gold to-gold-deep text-navy flex items-center justify-center transition-all shadow-2xl relative group/call disabled:opacity-50 disabled:grayscale"
            >
              <div className="absolute inset-0 rounded-full bg-gold animate-ping opacity-20 pointer-events-none group-hover/call:opacity-40" />
              <Phone className="w-10 h-10 drop-shadow-lg" />
            </motion.button>

            <div className="w-16 flex flex-col items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gold animate-pulse shadow-[0_0_8px_#D4AF37]" />
              <span className="text-[8px] font-black text-gold-light/40 uppercase tracking-widest">Ready</span>
            </div>
          </div>
        </div>
        
        {/* Active Call Halo Effect Placeholder */}
        {activeCall && (
          <div className="absolute inset-0 bg-gold/5 animate-pulse flex items-center justify-center">
            <div className="w-64 h-64 bg-gold/10 blur-[100px] rounded-full" />
          </div>
        )}
      </motion.div>
    </div>
  );
}
