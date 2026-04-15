import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Users, PhoneIncoming, PhoneOutgoing, PhoneMissed, Activity, Star, TrendingUp, Shield, Zap, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="luxury-card-gold p-6 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-gold/5 blur-[100px] rounded-full -mr-32 -mt-32 animate-heavenly-pulse" />
          <h3 className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
            <TrendingUp className="w-4 h-4 text-gold" />
            Live Resonance Monitoring
          </h3>
          <div className="h-40 bg-[#0A1221]/40 rounded-3xl border border-gold/10 border-dashed flex flex-col items-center justify-center relative overflow-hidden">
            <Sparkles className="w-10 h-10 text-gold mb-4 animate-[spin_10s_linear_infinite] opacity-20" />
            <span className="text-gold-light/20 font-black uppercase tracking-[0.3em] text-[8px] italic">Awaiting Synthesis...</span>
          </div>
          <button className="luxury-button mt-6 text-[10px] py-3.5 uppercase tracking-[0.2em] shimmer-text">Optimize</button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="luxury-card-gold overflow-hidden flex flex-col"
        >
          <div className="px-6 py-4 border-b border-gold/20 bg-gold/5 flex justify-between items-center relative overflow-hidden">
            <h3 className="text-[10px] font-black text-gold uppercase tracking-[0.3em] flex items-center gap-3">
              <Users className="w-4 h-4 text-gold" />
              Workforce Ledger
            </h3>
            <button className="text-[9px] font-black text-gold/40 hover:text-gold transition-all tracking-[0.2em] uppercase bg-gold/5 px-3 py-1.5 rounded-lg border border-gold/10">Matrix</button>
          </div>
          <div className="overflow-x-auto flex-1 custom-scrollbar max-h-[250px]">
            <table className="min-w-full divide-y divide-gold/10">
              <thead className="bg-[#0A1221]/60">
                <tr>
                  <th className="px-6 py-3 text-left text-[9px] font-black text-gold uppercase tracking-[0.2em]">Executor</th>
                  <th className="px-6 py-3 text-left text-[9px] font-black text-gold uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-3 text-left text-[9px] font-black text-gold uppercase tracking-[0.2em]">Ext</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/5 bg-navy/10">
                {agents.slice(0, 5).map((agent, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.05 }}
                    key={agent.id} 
                    className="hover:bg-gold/10 transition-all group relative overflow-hidden"
                  >
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-gold/30 to-navy-light/50 border border-gold/40 flex items-center justify-center text-gold font-black shadow-lg group-hover:scale-105 transition-all duration-500 text-sm">
                          {agent.user?.name?.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-black text-pearl group-hover:text-gold transition-colors italic tracking-tight uppercase">{agent.user?.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl border border-gold/10 bg-gold/5 group-hover:border-gold/30 transition-all">
                        <motion.div 
                          animate={{ scale: agent.status === 'ONLINE' ? [1, 1.3, 1] : 1 }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className={`w-1.5 h-1.5 rounded-full ${agent.status === 'ONLINE' ? 'bg-gold' : 'bg-slate-700'}`} 
                        />
                        <span className="text-[9px] font-black text-gold uppercase tracking-[0.2em]">{agent.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap font-mono text-[10px] font-black text-pearl/40 uppercase">
                      EXT {agent.extension}
                    </td>
                  </motion.tr>
                ))}
                {agents.length === 0 && (
                  <tr><td colSpan={3} className="px-8 py-20 text-center text-gold-light/20 italic">No operational units detected.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
