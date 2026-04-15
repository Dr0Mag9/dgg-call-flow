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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div 
              key={card.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -5, boxShadow: '0 0 30px rgba(212,175,55,0.1)' }}
              className="luxury-card p-8 group transition-all duration-500"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="rounded-2xl p-4 bg-gold/5 border border-gold/10 group-hover:border-gold/40 transition-all shadow-lg shadow-black/20">
                    <Icon className={`h-6 w-6 ${card.color} group-hover:scale-110 transition-transform`} aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-6 w-0 flex-1">
                  <dl>
                    <dt className="text-[10px] font-black text-gold-light/40 uppercase tracking-[0.2em] truncate mb-1">{card.name}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-3xl font-black text-pearl group-hover:text-gold transition-colors">{card.value}</div>
                      <div className="ml-2 text-[10px] font-bold text-gold/40 uppercase tracking-widest">+Sync</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="luxury-card p-10 flex flex-col justify-center relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-[100px] rounded-full -mr-32 -mt-32" />
          <h3 className="text-xl font-black text-pearl mb-6 tracking-tight uppercase tracking-widest text-sm flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-gold" />
            Live Resonance Monitoring
          </h3>
          <div className="h-64 bg-navy/40 rounded-3xl border border-gold/5 border-dashed flex flex-col items-center justify-center group-hover:border-gold/20 transition-all">
            <Sparkles className="w-12 h-12 text-gold/10 mb-4 animate-pulse" />
            <span className="text-gold-light/20 font-black uppercase tracking-[0.3em] text-xs">Real-time Data Pulse Pending</span>
          </div>
          <button className="luxury-button mt-8 text-[10px] py-4">Maximize Intelligence Output</button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="luxury-card overflow-hidden flex flex-col border-gold/10"
        >
          <div className="px-8 py-6 border-b border-gold/10 bg-gold/5 flex justify-between items-center">
            <h3 className="text-lg font-black text-pearl tracking-tight uppercase tracking-widest text-sm flex items-center gap-3">
              <Users className="w-5 h-5 text-gold" />
              Executor Performance Ledger
            </h3>
            <button className="text-[10px] font-black text-gold/40 hover:text-gold transition-colors tracking-widest uppercase">View All Units</button>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="min-w-full divide-y divide-gold/10">
              <thead className="bg-navy/40">
                <tr>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-gold-light/20 uppercase tracking-[0.2em]">Unit Executor</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-gold-light/20 uppercase tracking-[0.2em]">Operational Status</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-gold-light/20 uppercase tracking-[0.2em]">Comm Channel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10">
                {agents.slice(0, 5).map((agent, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.05 }}
                    key={agent.id} 
                    className="hover:bg-gold/5 transition-all group"
                  >
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center text-gold-light font-black shadow-lg shadow-black/20 group-hover:scale-110 transition-transform">
                          {agent.user?.name?.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-pearl group-hover:text-gold transition-colors">{agent.user?.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-gold/10 bg-gold/5 inline-flex">
                        <div className={`w-1.5 h-1.5 rounded-full ${agent.status === 'ONLINE' ? 'bg-gold animate-pulse shadow-[0_0_8px_#D4AF37]' : 'bg-slate-700'}`} />
                        <span className="text-[9px] font-black text-gold uppercase tracking-widest">{agent.status}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap font-mono text-xs font-bold text-pearl/60">
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
