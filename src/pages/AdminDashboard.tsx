import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Users, PhoneIncoming, PhoneOutgoing, PhoneMissed, Activity, Star, TrendingUp, Shield, Zap, Sparkles } from 'lucide-react';
import { motion } from 'motion';

export default function AdminDashboard() {
  const { token } = useAppStore();
  const [stats, setStats] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error);

    fetch('/api/admin/agents', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setAgents(data))
      .catch(console.error);
  }, [token]);

  if (!stats) return (
    <div className="p-24 text-center">
      <Sparkles className="w-12 h-12 text-gold animate-spin mx-auto mb-6 opacity-20" />
      <span className="text-gold-light/30 font-black uppercase tracking-[0.3em] text-sm">Synchronizing Command Center...</span>
    </div>
  );

  const cards = [
    { name: 'Total Workforce', value: stats.totalAgents, icon: Users, color: 'text-gold' },
    { name: 'Operational Units', value: stats.onlineAgents, icon: Activity, color: 'text-gold-light' },
    { name: 'Inbound Inflow', value: stats.inboundCallsToday, icon: PhoneIncoming, color: 'text-gold' },
    { name: 'Outbound Expansion', value: stats.outboundCallsToday, icon: PhoneOutgoing, color: 'text-gold-light' },
    { name: 'Opportunity Gaps', value: stats.missedCalls, icon: PhoneMissed, color: 'text-red-400' },
    { name: 'Live Sessions', value: stats.activeCalls, icon: Zap, color: 'text-gold' },
  ];

  return (
    <div className="space-y-4 pb-4">
      <div className="flex justify-between items-center px-2">
        <div>
          <h2 className="text-xl font-black text-pearl tracking-tight font-serif italic uppercase underline decoration-gold/30">The Wealth Command</h2>
          <p className="text-gold-light/40 text-[9px] font-black uppercase tracking-[0.3em] mt-0.5">Control Center</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-gold/5 border border-gold/20 rounded-xl">
          <Shield className="w-4 h-4 text-gold" />
          <span className="text-[9px] font-black text-gold-light uppercase tracking-widest">Oversight Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div 
              key={card.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="luxury-card-gold group transition-all duration-500 flex items-center p-5 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gold/2 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex-shrink-0 relative z-10">
                <div className="rounded-2xl p-3 bg-gold/5 border border-gold/10 group-hover:border-gold/50 transition-all duration-500 shadow-xl relative">
                  <Icon className={`h-5 w-5 ${card.color} group-hover:scale-110 transition-transform duration-500`} />
                </div>
              </div>
              <div className="ml-5 flex-1 relative z-10">
                <dl>
                  <dt className="text-[9px] font-black text-gold/40 uppercase tracking-[0.2em] truncate mb-1">{card.name}</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-black text-pearl group-hover:text-gold transition-colors italic tracking-tighter">{card.value}</div>
                    <div className="ml-2 text-[8px] font-black text-gold/60 tracking-[0.1em]">SYNC</div>
                  </dd>
                </dl>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="luxury-card-gold p-6 relative overflow-hidden group min-h-[300px] flex flex-col justify-center"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-gold/5 blur-[100px] rounded-full -mr-32 -mt-32 animate-heavenly-pulse" />
          <div className="relative z-10">
            <h3 className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-gold" />
              Strategic Resonance Monitoring
            </h3>
            <div className="h-40 bg-[#0A1221]/40 rounded-3xl border border-gold/10 border-dashed flex flex-col items-center justify-center relative overflow-hidden">
              <Sparkles className="w-10 h-10 text-gold mb-4 animate-[spin_10s_linear_infinite] opacity-20" />
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <motion.div 
                    key={i}
                    animate={{ height: [10, 20, 10] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                    className="w-1 bg-gold/20 rounded-full"
                  />
                ))}
              </div>
              <span className="text-gold-light/20 font-black uppercase tracking-[0.3em] text-[8px] italic">Awaiting Quantitative Synthesis...</span>
            </div>
            <div className="mt-8 flex justify-center">
              <button className="luxury-button text-[10px] py-3.5 px-12 uppercase tracking-[0.2em] shimmer-text">Optimize Yield</button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
