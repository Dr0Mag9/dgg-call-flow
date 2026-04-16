import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { PhoneCall, Activity, Signal, Smartphone, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export default function TelephonyStatusPanel() {
  const { user, token } = useAppStore();
  const [lineInfo, setLineInfo] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me', {
       headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.agent?.telephonyLine) {
         setLineInfo(data.agent.telephonyLine);
      }
    });
  }, [token]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="luxury-card-gold px-6 py-3 flex items-center justify-between bg-gold/5 border-gold/20 shadow-lg relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
      
      <div className="flex items-center gap-4 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold shadow-[0_0_15px_rgba(212,175,55,0.2)]">
          <PhoneCall className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-pearl italic tracking-tight">
               {lineInfo ? lineInfo.number : 'Stationary Node'}
            </span>
            {lineInfo && (
              <span className="text-[8px] px-2 py-0.5 rounded-md border border-gold/30 bg-gold/10 text-gold font-black flex items-center gap-1 uppercase tracking-widest">
                {lineInfo.providerType === 'SIP' ? <Zap className="w-2.5 h-2.5"/> : <Smartphone className="w-2.5 h-2.5"/>}
                {lineInfo.providerType}
              </span>
            )}
          </div>
          <p className="text-[9px] font-black text-gold/40 uppercase tracking-[0.2em] mt-0.5">Assigned Wealth Channel</p>
        </div>
      </div>
      
      <div className="flex items-center gap-6 relative z-10">
        <div className="text-right">
          <p className="text-[9px] font-black text-gold/40 uppercase tracking-[0.2em]">Telephony Link</p>
          <div className="flex items-center gap-2 justify-end mt-0.5">
            <motion.div 
              animate={{ opacity: lineInfo?.gateway?.status === 'ONLINE' ? [0.4, 1, 0.4] : 0.2 }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`w-1.5 h-1.5 rounded-full ${lineInfo?.gateway?.status === 'ONLINE' ? 'bg-gold shadow-[0_0_8px_#D4AF37]' : 'bg-slate-600'}`} 
            />
            <p className={`text-[10px] font-black uppercase tracking-widest ${lineInfo?.gateway?.status === 'ONLINE' ? 'text-gold' : 'text-slate-500'}`}>
              {lineInfo?.gateway?.status === 'ONLINE' ? 'Operational' : 'Sim Offline'}
            </p>
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-gold/5 border border-gold/10">
          <Signal className={`w-4 h-4 ${lineInfo ? 'text-gold' : 'text-slate-700'}`} />
        </div>
      </div>
    </motion.div>
  );
}
