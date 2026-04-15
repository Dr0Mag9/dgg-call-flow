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
        className="luxury-card p-4 flex gap-6 bg-navy/20"
      >
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40 group-focus-within:text-gold w-5 h-5 transition-colors" />
          <input 
            type="text" 
            placeholder="Search ledger by client, agent, or outcome markers..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-6 py-3 bg-navy-light/30 border border-gold/10 rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 text-pearl transition-all outline-none placeholder:text-gold-light/20"
          />
        </div>
        <button className="flex items-center gap-3 px-6 py-2 border border-gold/10 rounded-xl hover:bg-gold/5 text-gold-light/60 font-bold uppercase text-[10px] tracking-widest transition-all">
          <Filter className="w-4 h-4 text-gold" />
          Filters
        </button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="luxury-card overflow-hidden flex flex-col border-gold/10"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gold/10">
            <thead className="bg-navy-light/60 backdrop-blur-3xl sticky top-0 z-10">
              <tr>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gold/40 uppercase tracking-[0.2em]">Flow</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gold/40 uppercase tracking-[0.2em]">Asset / Target</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gold/40 uppercase tracking-[0.2em]">Executor</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gold/40 uppercase tracking-[0.2em]">Assigned Channel</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gold/40 uppercase tracking-[0.2em]">Timestamp</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gold/40 uppercase tracking-[0.2em]">Session Time</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gold/40 uppercase tracking-[0.2em]">Audio Vault</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gold/40 uppercase tracking-[0.2em]">Resolution</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gold/40 uppercase tracking-[0.2em]">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/10">
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
                    className="hover:bg-gold/5 transition-all group"
                  >
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className={`inline-flex p-2.5 rounded-xl ${
                        call.direction === 'INBOUND' ? 'bg-gold/10 text-gold' : 'bg-gold-light/10 text-gold-light'
                      } shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
                        {call.direction === 'INBOUND' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="text-sm font-bold text-pearl group-hover:text-gold transition-colors">{call.client?.name || 'External Signal'}</div>
                      <div className="text-[10px] text-gold-light/40 font-bold mt-1 tracking-wider">{call.phoneNumber}</div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-[8px] font-black text-gold uppercase">
                          {(call.agent?.user?.name || 'U').charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-pearl/80">{call.agent?.user?.name || 'Auto Process'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="text-[10px] text-pearl font-mono font-bold tracking-widest">{call.assignedLine || '--'}</div>
                      {call.providerType && (
                        <div className="text-[8px] font-black text-gold-light/40 uppercase tracking-widest mt-1.5 flex items-center gap-1">
                          <div className="w-1 h-1 rounded-full bg-gold/40" />
                          {call.providerType}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="text-xs font-bold text-pearl/80">{format(new Date(call.startedAt), 'MMM d, yyyy')}</div>
                      <div className="text-[10px] text-gold-light/40 font-bold mt-1 uppercase tracking-widest">{format(new Date(call.startedAt), 'h:mm a')}</div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-gold/40" />
                        <span className="text-xs font-bold text-pearl/80">
                          {call.duration ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : '--'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      {call.recordingUrl ? (
                        <a 
                          href={call.recordingUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 bg-gold/10 text-gold rounded-lg hover:bg-gold/20 transition-all shadow-lg shadow-black/20 group/play inline-block"
                          title="Decrypt Recording"
                        >
                          <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                        </a>
                      ) : (
                        <div className="text-[8px] font-black text-gold-light/10 uppercase tracking-widest">No Record</div>
                      )}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-[8px] font-black uppercase tracking-widest rounded-full border ${
                        call.status === 'ENDED' ? 'bg-gold/10 text-gold border-gold/20 shadow-[0_0_10px_rgba(212,175,55,0.1)]' :
                        call.status === 'MISSED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-gold-light/10 text-gold-light border-gold-light/20'
                      }`}>
                        {call.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="text-[10px] font-bold text-gold-light/60 uppercase tracking-widest italic">
                        {call.disposition?.outcome || '--'}
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
