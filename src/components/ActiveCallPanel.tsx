import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { PhoneOff, MicOff, Mic, Pause, Play, User, ExternalLink, Zap, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function ActiveCallPanel() {
  const { activeCall, token, setSelectedClient, setClientDrawerOpen } = useAppStore();
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeCall && activeCall.status === 'CONNECTED' && activeCall.startedAt) {
      const startTime = new Date(activeCall.startedAt).getTime();
      if (!isNaN(startTime)) {
        interval = setInterval(() => {
          setDuration(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
        }, 1000);
      } else {
        setDuration(0);
      }
    } else {
      setDuration(0);
    }
    return () => clearInterval(interval);
  }, [activeCall]);

  if (!activeCall) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleHangup = async () => {
    try {
      await fetch(`/api/calls/${activeCall.id}/hangup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenProfile = () => {
    if (activeCall.client) {
      setSelectedClient(activeCall.client);
      setClientDrawerOpen(true);
    }
  };

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-8 right-8 w-96 luxury-card overflow-hidden z-[100] border-gold/30 shadow-[0_0_50px_rgba(212,175,55,0.2)]"
    >
      <div className="absolute inset-0 bg-gold/5 opacity-50 pointer-events-none" />
      
      <div className={cn(
        "px-6 py-4 flex justify-between items-center relative overflow-hidden",
        activeCall.status === 'CONNECTED' ? "bg-gold/10" : "bg-navy/60"
      )}>
        <div className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent w-full" />
        <div className="flex items-center gap-3 z-10">
          <Activity className={cn("w-4 h-4", activeCall.status === 'CONNECTED' ? "text-gold animate-pulse" : "text-gold/20")} />
          <div className="text-[10px] font-black text-gold uppercase tracking-[0.3em] shimmer-text italic">
            {activeCall.status === 'DIALING' && 'Initiating Core Link...'}
            {activeCall.status === 'RINGING' && 'Signal Transmitting...'}
            {activeCall.status === 'CONNECTED' && 'Active Logic Link'}
            {activeCall.status === 'ON_HOLD' && 'Suspended Protocol'}
          </div>
        </div>
        <div className="font-mono text-xs font-black text-pearl tracking-widest z-10 bg-navy/40 px-3 py-1 rounded-full border border-gold/20">
          {activeCall.status === 'CONNECTED' ? formatTime(duration) : '00:00'}
        </div>
      </div>
      
      <div className="p-8 flex flex-col items-center text-center relative bg-[#0A1221]/80 backdrop-blur-3xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-gold/5 blur-3xl rounded-full pointer-events-none" />
        
        {activeCall.client && (
          <button 
            onClick={handleOpenProfile}
            className="absolute top-4 right-4 p-2.5 bg-gold/5 border border-gold/20 rounded-xl text-gold/40 hover:text-gold hover:border-gold/40 transition-all group/prof"
            title="Open Executive Profile"
          >
            <ExternalLink className="w-5 h-5 group-hover/prof:scale-110 transition-transform" />
          </button>
        )}
        
        <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-gold/30 to-navy border border-gold/40 flex items-center justify-center mb-6 shadow-2xl relative group/avatar">
          <div className="absolute inset-0 bg-gold/10 rounded-[inherit] animate-pulse" />
          <User className="w-10 h-10 text-gold-light relative z-10 italic" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-gold border border-navy flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-navy fill-current" />
          </div>
        </div>

        <h3 className="text-xl font-black text-pearl italic gold-text-gradient tracking-tight uppercase mb-1">
          {activeCall.client?.name || 'External Signal'}
        </h3>
        <p className="text-[11px] font-black text-gold/60 tracking-[0.2em] mb-4 uppercase">{activeCall.phoneNumber}</p>
        
        <div className="px-4 py-1.5 rounded-full bg-gold/5 border border-gold/10 inline-flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-gold shadow-[0_0_8px_#D4AF37]" />
          <span className="text-[8px] text-pearl/40 font-black uppercase tracking-[0.3em]">
            {activeCall.direction} Link Established
          </span>
        </div>
      </div>

      <div className="px-8 pb-8 flex justify-center gap-6 bg-[#0A1221]/80 backdrop-blur-3xl relative z-10">
        <motion.button 
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(212, 175, 55, 0.1)' }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsMuted(!isMuted)}
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all border",
            isMuted ? "bg-navy-light text-white border-white/20" : "bg-gold/5 text-gold-light border-gold/20"
          )}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </motion.button>
        
        <motion.button 
          whileHover={{ scale: 1.1, boxShadow: '0 0 30px rgba(239, 68, 68, 0.3)' }}
          whileTap={{ scale: 0.9 }}
          onClick={handleHangup}
          className="w-16 h-16 rounded-3xl bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-2xl shadow-red-500/20"
        >
          <PhoneOff className="w-7 h-7" />
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(212, 175, 55, 0.1)' }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOnHold(!isOnHold)}
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all border",
            isOnHold ? "bg-gold text-navy border-gold" : "bg-gold/5 text-gold-light border-gold/20"
          )}
        >
          {isOnHold ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
        </motion.button>
      </div>
    </motion.div>
  );
}
