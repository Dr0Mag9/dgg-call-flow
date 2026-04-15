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
    <div className="space-y-4 pb-4">
      <div className="flex justify-between items-center px-2">
        <div>
          <h2 className="text-xl font-black text-pearl tracking-tight uppercase italic underline decoration-gold/30">Call Ledger</h2>
          <p className="text-gold-light/40 text-[9px] font-black uppercase tracking-[0.3em] mt-0.5">Transaction History</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="luxury-card-gold p-3 flex gap-4 items-center"
      >
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/60 group-focus-within:text-gold w-5 h-5 transition-colors" />
          <input 
            type="text" 
            placeholder="Search ledger..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-6 py-2 bg-[#0A1221]/40 border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold/10 focus:border-gold/30 text-pearl transition-all outline-none placeholder:text-gold-light/20 text-xs font-medium"
          />
        </div>
        <button className="flex items-center gap-3 px-4 py-2 bg-gold/5 border border-gold/20 rounded-xl hover:bg-gold/10 text-gold hover:text-gold-light font-black uppercase text-[9px] tracking-[0.2em] transition-all group">
          <Filter className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          Refine
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
                <th className="px-6 py-3 text-left text-[9px] font-black text-gold uppercase tracking-[0.2em]">Flow</th>
                <th className="px-6 py-3 text-left text-[9px] font-black text-gold uppercase tracking-[0.2em]">Target</th>
                <th className="px-6 py-3 text-left text-[9px] font-black text-gold uppercase tracking-[0.2em]">Executor</th>
                <th className="px-6 py-3 text-left text-[9px] font-black text-gold uppercase tracking-[0.2em]">Channel</th>
                <th className="px-6 py-3 text-left text-[9px] font-black text-gold uppercase tracking-[0.2em]">Timestamp</th>
                <th className="px-6 py-3 text-left text-[9px] font-black text-gold uppercase tracking-[0.2em]">Time</th>
                <th className="px-6 py-3 text-left text-[9px] font-black text-gold uppercase tracking-[0.2em]">Vault</th>
                <th className="px-6 py-3 text-left text-[9px] font-black text-gold uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-3 text-left text-[9px] font-black text-gold uppercase tracking-[0.2em]">Outcome</th>
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
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className={`inline-flex p-2 rounded-lg ${
                        call.direction === 'INBOUND' ? 'bg-gold/10 text-gold border border-gold/30' : 'bg-gold-light/10 text-gold-light border border-gold-light/30'
                      }`}>
                        {call.direction === 'INBOUND' ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                      </div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="text-sm font-black text-pearl group-hover:text-gold transition-colors italic tracking-tight uppercase truncate max-w-[150px]">{call.client?.name || 'External'}</div>
                      <div className="text-[8px] text-gold-light/40 font-black mt-0.5 uppercase tracking-widest">{call.phoneNumber}</div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center text-[10px] font-black text-gold">
                          {(call.agent?.user?.name || 'U').charAt(0)}
                        </div>
                        <span className="text-[9px] font-black text-pearl/80 uppercase tracking-widest truncate max-w-[100px]">{call.agent?.user?.name || 'AUTO'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="text-[10px] text-pearl font-mono font-black tracking-tight">{call.assignedLine || '--'}</div>
                      {call.providerType && (
                        <div className="text-[8px] font-black text-gold-light/40 uppercase tracking-widest mt-1">
                          {call.providerType}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="text-[10px] font-black text-pearl/80 uppercase tracking-widest">{format(new Date(call.startedAt), 'MMM dd')}</div>
                      <div className="text-[8px] text-gold-light/40 font-black mt-0.5 uppercase tracking-widest italic">{format(new Date(call.startedAt), 'h:mm a')}</div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-gold/60" />
                        <span className="text-[10px] font-black text-pearl/80 tracking-widest">
                          {call.duration ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : '--'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      {call.recordingUrl ? (
                        <a 
                          href={call.recordingUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 bg-gold/10 text-gold rounded-lg hover:bg-gold/20 transition-all inline-block border border-gold/20"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </a>
                      ) : (
                        <div className="text-[8px] font-black text-gold-light/10 uppercase italic">N/A</div>
                      )}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-[9px] font-black uppercase tracking-widest rounded-full border ${
                        call.status === 'ENDED' ? 'bg-gold/10 text-gold border-gold/30' :
                        call.status === 'MISSED' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                        'bg-navy-light text-pearl/40 border-gold/10'
                      }`}>
                        {call.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="text-[9px] font-black text-gold uppercase tracking-widest italic truncate max-w-[100px]">
                        {call.disposition?.outcome || 'NONE'}
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
