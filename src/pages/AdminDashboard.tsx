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
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-pearl tracking-tight font-serif italic">The Wealth Command</h2>
          <p className="text-gold-light/40 text-xs font-bold uppercase tracking-[0.3em] mt-1">Global Operations & Metrics</p>
        </div>
        <div className="flex items-center gap-4 px-6 py-3 bg-gold/5 border border-gold/20 rounded-2xl">
          <Shield className="w-5 h-5 text-gold" />
          <span className="text-xs font-black text-gold-light uppercase tracking-widest">Administrator Oversight Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div 
              key={card.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -8, boxShadow: '0 0 50px rgba(212,175,55,0.15)' }}
              className="luxury-card-gold group transition-all duration-500 flex items-center p-10 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gold/2 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex-shrink-0 relative z-10">
                <div className="rounded-[2rem] p-6 bg-gold/5 border-2 border-gold/10 group-hover:border-gold/50 group-hover:bg-gold/15 transition-all duration-500 shadow-2xl relative">
                  <div className="absolute inset-0 bg-gold opacity-0 group-hover:opacity-20 blur-xl transition-opacity" />
                  <Icon className={`h-8 w-8 ${card.color} group-hover:scale-125 transition-transform duration-500 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]`} />
                </div>
              </div>
              <div className="ml-8 flex-1 relative z-10">
                <dl>
                  <dt className="text-[11px] font-black text-gold/40 uppercase tracking-[0.3em] truncate mb-2">{card.name}</dt>
                  <dd className="flex items-baseline">
                    <div className="text-4xl font-black text-pearl group-hover:text-gold transition-colors italic tracking-tighter">{card.value}</div>
                    <div className="ml-3 text-[10px] font-black text-gold/60 uppercase tracking-[0.2em] simmer-text">SYNCED</div>
                  </dd>
                </dl>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="luxury-card-gold p-12 flex flex-col justify-center relative overflow-hidden group shadow-[0_0_80px_rgba(212,175,55,0.1)]"
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/5 blur-[120px] rounded-full -mr-40 -mt-40 animate-heavenly-pulse" />
          <h3 className="text-[11px] font-black text-gold uppercase tracking-[0.4em] mb-10 flex items-center gap-5">
            <div className="p-2 bg-gold/10 rounded-lg border border-gold/20">
              <TrendingUp className="w-5 h-5 text-gold" />
            </div>
            Live Resonance Monitoring
          </h3>
          <div className="h-72 bg-[#0A1221]/40 rounded-[3rem] border-2 border-gold/10 border-dashed flex flex-col items-center justify-center group-hover:border-gold/30 transition-all duration-700 relative overflow-hidden">
            <div className="absolute inset-0 bg-gold/2 animate-pulse" />
            <Sparkles className="w-16 h-16 text-gold mb-6 animate-[spin_10s_linear_infinite] opacity-40 drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
            <span className="text-gold-light/20 font-black uppercase tracking-[0.5em] text-[10px] italic">Awaiting Global Synthesis...</span>
          </div>
          <button className="luxury-button mt-10 text-[11px] py-5 uppercase tracking-[0.3em] shimmer-text">Maximize Operations</button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="luxury-card-gold overflow-hidden flex flex-col"
        >
          <div className="px-10 py-8 border-b border-gold/20 bg-gold/5 flex justify-between items-center relative overflow-hidden">
            <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent opacity-30" />
            <h3 className="text-[11px] font-black text-gold uppercase tracking-[0.4em] flex items-center gap-5">
              <div className="p-2 bg-gold/10 rounded-lg border border-gold/20">
                <Users className="w-5 h-5 text-gold" />
              </div>
              Workforce Ledger
            </h3>
            <button className="text-[10px] font-black text-gold/40 hover:text-gold transition-all tracking-[0.3em] uppercase bg-gold/5 px-4 py-2 rounded-xl border border-gold/10">View Matrix</button>
          </div>
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="min-w-full divide-y divide-gold/10">
              <thead className="bg-[#0A1221]/60">
                <tr>
                  <th className="px-10 py-6 text-left text-[11px] font-black text-gold uppercase tracking-[0.3em]">Executor Unit</th>
                  <th className="px-10 py-6 text-left text-[11px] font-black text-gold uppercase tracking-[0.3em]">Status Rank</th>
                  <th className="px-10 py-6 text-left text-[11px] font-black text-gold uppercase tracking-[0.3em]">Sync Ext</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/5 bg-navy/10">
                {agents.slice(0, 5).map((agent, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.05 }}
                    key={agent.id} 
                    className="hover:bg-gold/10 transition-all group relative overflow-hidden"
                  >
                    <td className="px-10 py-6 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-[1rem] bg-gradient-to-br from-gold/30 to-navy-light/50 border border-gold/40 flex items-center justify-center text-gold font-black shadow-xl group-hover:scale-110 transition-all duration-500 shadow-gold/5">
                          {agent.user?.name?.charAt(0)}
                        </div>
                        <div className="ml-6">
                          <div className="text-base font-black text-pearl group-hover:text-gold transition-colors italic tracking-tight uppercase">{agent.user?.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-4 px-4 py-2 rounded-2xl border border-gold/20 bg-gold/5 group-hover:border-gold/40 transition-all">
                        <motion.div 
                          animate={{ scale: agent.status === 'ONLINE' ? [1, 1.5, 1] : 1 }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className={`w-2 h-2 rounded-full ${agent.status === 'ONLINE' ? 'bg-gold shadow-[0_0_12px_#D4AF37]' : 'bg-slate-700'}`} 
                        />
                        <span className="text-[10px] font-black text-gold uppercase tracking-[0.3em]">{agent.status}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6 whitespace-nowrap font-mono text-[11px] font-black text-pearl/40 uppercase tracking-[0.2em]">
                      SIGNAL: EXT {agent.extension}
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
