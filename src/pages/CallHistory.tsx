import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Phone, PhoneIncoming, PhoneMissed, Clock, Search, Filter, Play, ArrowUpRight, ArrowDownLeft, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

export default function CallHistory() {
  const { token } = useAppStore();
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/calls', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setCalls(data);
        setLoading(false);
      })
      .catch(console.error);
  }, [token]);

  const filteredCalls = calls.filter(call => 
    call.client?.name.toLowerCase().includes(search.toLowerCase()) ||
    call.phoneNumber.includes(search) ||
    call.agent?.user?.name.toLowerCase().includes(search.toLowerCase()) ||
    call.disposition?.outcome?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-pearl tracking-tight">Call Ledger</h2>
          <p className="text-gold-light/40 text-xs font-bold uppercase tracking-[0.2em] mt-1">Transaction History & Records</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="luxury-card-gold p-6 flex gap-8 items-center"
      >
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gold/60 group-focus-within:text-gold w-6 h-6 transition-colors" />
          <input 
            type="text" 
            placeholder="Search ledger by client, agent, or outcome markers..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-8 py-4 bg-[#0A1221]/40 border border-gold/20 rounded-2xl focus:ring-4 focus:ring-gold/10 focus:border-gold/50 text-pearl transition-all outline-none placeholder:text-gold-light/20 font-medium"
          />
        </div>
        <button className="flex items-center gap-4 px-8 py-3.5 bg-gold/5 border border-gold/30 rounded-2xl hover:bg-gold/10 text-gold hover:text-gold-light font-black uppercase text-xs tracking-[0.2em] transition-all shadow-lg hover:shadow-gold/10 group">
          <Filter className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
          Refine Ledger
        </button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="luxury-card-gold overflow-hidden flex flex-col"
      >
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-gold/10">
            <thead className="bg-[#0A1221]/80 backdrop-blur-3xl sticky top-0 z-20">
              <tr className="border-b border-gold/20">
                <th className="px-8 py-6 text-left text-[11px] font-black text-gold uppercase tracking-[0.3em]">Flow</th>
                <th className="px-8 py-6 text-left text-[11px] font-black text-gold uppercase tracking-[0.3em]">Asset / Target</th>
                <th className="px-8 py-6 text-left text-[11px] font-black text-gold uppercase tracking-[0.3em]">Executor</th>
                <th className="px-8 py-6 text-left text-[11px] font-black text-gold uppercase tracking-[0.3em]">Assigned Channel</th>
                <th className="px-8 py-6 text-left text-[11px] font-black text-gold uppercase tracking-[0.3em]">Timestamp</th>
                <th className="px-8 py-6 text-left text-[11px] font-black text-gold uppercase tracking-[0.3em]">Session Time</th>
                <th className="px-8 py-6 text-left text-[11px] font-black text-gold uppercase tracking-[0.3em]">Audio Vault</th>
                <th className="px-8 py-6 text-left text-[11px] font-black text-gold uppercase tracking-[0.3em]">Resolution</th>
                <th className="px-8 py-6 text-left text-[11px] font-black text-gold uppercase tracking-[0.3em]">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/5 bg-navy/10">
              {loading ? (
                <tr><td colSpan={9} className="px-8 py-20 text-center"><Sparkles className="w-8 h-8 text-gold animate-spin mx-auto mb-4 opacity-20" /><span className="text-gold-light/30 italic">Synchronizing ledger...</span></td></tr>
              ) : filteredCalls.length === 0 ? (
                <tr><td colSpan={9} className="px-8 py-20 text-center text-gold-light/30 italic">No ledger entries found.</td></tr>
              ) : (
                filteredCalls.map((call, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.02 }}
                    key={call.id} 
                    className="hover:bg-gold/10 transition-all group relative overflow-hidden"
                  >
                    <td className="px-8 py-7 whitespace-nowrap">
                      <div className={`inline-flex p-3 rounded-2xl ${
                        call.direction === 'INBOUND' ? 'bg-gold/10 text-gold border border-gold/30' : 'bg-gold-light/10 text-gold-light border border-gold-light/30'
                      } shadow-xl group-hover:scale-110 transition-all duration-500`}>
                        {call.direction === 'INBOUND' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                    </td>
                    <td className="px-8 py-7 whitespace-nowrap">
                      <div className="text-base font-black text-pearl group-hover:text-gold transition-colors italic tracking-tight">{call.client?.name || 'External Signal'}</div>
                      <div className="text-[11px] text-gold-light/40 font-black mt-1.5 uppercase tracking-widest">{call.phoneNumber}</div>
                    </td>
                    <td className="px-8 py-7 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-[10px] font-black text-gold uppercase shadow-lg">
                          {(call.agent?.user?.name || 'U').charAt(0)}
                        </div>
                        <span className="text-[11px] font-black text-pearl/80 uppercase tracking-widest">{call.agent?.user?.name || 'AUTO NODE'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-7 whitespace-nowrap">
                      <div className="text-[11px] text-pearl font-mono font-black tracking-[0.2em]">{call.assignedLine || '--'}</div>
                      {call.providerType && (
                        <div className="text-[9px] font-black text-gold-light/40 uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gold/60 animate-pulse" />
                          {call.providerType}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-7 whitespace-nowrap">
                      <div className="text-xs font-black text-pearl/80 uppercase tracking-widest">{format(new Date(call.startedAt), 'MMM dd, yyyy')}</div>
                      <div className="text-[10px] text-gold-light/40 font-black mt-1.5 uppercase tracking-widest italic">{format(new Date(call.startedAt), 'h:mm:ss a')}</div>
                    </td>
                    <td className="px-8 py-7 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-gold/60" />
                        <span className="text-xs font-black text-pearl/80 tracking-widest">
                          {call.duration ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : '--'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-7 whitespace-nowrap">
                      {call.recordingUrl ? (
                        <a 
                          href={call.recordingUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-3 bg-gold/10 text-gold rounded-xl hover:bg-gold/20 transition-all shadow-xl group/play inline-block border border-gold/20"
                          title="Decrypt Recording"
                        >
                          <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
                        </a>
                      ) : (
                        <div className="text-[9px] font-black text-gold-light/10 uppercase tracking-widest italic">Encrypted (No Audio)</div>
                      )}
                    </td>
                    <td className="px-8 py-7 whitespace-nowrap">
                      <span className={`px-5 py-1.5 inline-flex text-[10px] font-black uppercase tracking-[0.2em] rounded-full border-2 ${
                        call.status === 'ENDED' ? 'bg-gold/10 text-gold border-gold/30 shadow-[0_0_20px_rgba(212,175,55,0.1)]' :
                        call.status === 'MISSED' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                        'bg-gold-light/10 text-gold-light border-gold-light/30'
                      }`}>
                        {call.status}
                      </span>
                    </td>
                    <td className="px-8 py-7 whitespace-nowrap">
                      <div className="text-[11px] font-black text-gold uppercase tracking-[0.2em] italic shimmer-text">
                        {call.disposition?.outcome || 'STATIONARY'}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
