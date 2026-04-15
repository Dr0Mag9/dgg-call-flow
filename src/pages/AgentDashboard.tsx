import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Phone, Clock, PhoneMissed, PhoneIncoming, CheckSquare, Calendar, TrendingUp, Zap, Award } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import Dialer from './Dialer';
import TelephonyStatusPanel from '../components/TelephonyStatusPanel';
import { motion } from 'motion/react';

export default function AgentDashboard() {
  const { user, token, setSelectedClient, setClientDrawerOpen } = useAppStore();
  const [calls, setCalls] = useState<any[]>([]);
  const [allCalls, setAllCalls] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/calls', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setAllCalls(data);
        setCalls(data.slice(0, 5));
      })
      .catch(console.error);

    fetch('/api/tasks', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setTasks(data.filter((t: any) => t.status === 'PENDING').slice(0, 5)))
      .catch(console.error);
  }, [token]);

  const handleClientClick = (client: any) => {
    if (client) {
      setSelectedClient(client);
      setClientDrawerOpen(true);
    }
  };

  const todayCalls = allCalls.filter(c => new Date(c.startedAt) >= startOfDay(new Date()));

  return (
    <div className="space-y-8 pb-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="luxury-card-gold p-10 relative overflow-hidden group border-gold/40 shadow-[0_0_60px_rgba(212,175,55,0.15)]"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-gold/5 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:bg-gold/15 transition-all duration-1000 animate-pulse" />
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
          <div className="flex items-center gap-8">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gold/30 to-navy-light/50 border-2 border-gold/40 flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-500">
              <Award className="w-12 h-12 text-gold drop-shadow-[0_0_10px_rgba(212,175,55,0.6)]" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-pearl tracking-tighter italic">
                Salutations, <span className="gold-text-gradient shimmer-text uppercase">{user?.name}</span>
              </h2>
              <p className="text-gold-light/40 font-black mt-2 tracking-[0.3em] uppercase text-xs">
                Asset Optimization Node: <span className="text-gold">Operational</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-8 px-8 py-5 rounded-3xl bg-gold/10 border border-gold/30 backdrop-blur-3xl shadow-inner relative group/status">
            <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover/status:opacity-100 transition-opacity duration-700 blur-2xl" />
            <div className="flex flex-col items-end relative z-10">
              <span className="text-[11px] text-gold font-black tracking-[0.3em] uppercase shimmer-text">Connectivity</span>
              <span className="text-xl font-black text-gold-light tracking-widest uppercase italic mt-1">Primus Gold Link</span>
            </div>
            <div className="relative flex h-6 w-6 z-10">
              <motion.span 
                animate={{ scale: [1, 2.5, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inline-flex h-full w-full rounded-full bg-gold"
              ></motion.span>
              <span className="relative inline-flex rounded-full h-6 w-6 bg-gold border-2 border-navy shadow-[0_0_20px_rgba(212,175,55,1)]"></span>
            </div>
          </div>
        </div>
      </motion.div>

      <TelephonyStatusPanel />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Dialer Column */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-1"
        >
          <Dialer embedded={true} />
        </motion.div>

        <div className="xl:col-span-2 space-y-8">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { label: "Today's Volume", value: todayCalls.length, icon: TrendingUp, color: "text-gold" },
              { label: "Success Rate", value: "84%", icon: Zap, color: "text-gold-light" },
              { label: "Active Revenue", value: "$32.8k", icon: Award, color: "text-gold" },
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="luxury-card p-8 flex flex-col items-center text-center group bg-[#0A1221]/40 border-gold/10 hover:border-gold/40 hover:shadow-gold/10 transition-all duration-500"
              >
                <div className="w-14 h-14 rounded-2xl bg-gold/5 border border-gold/20 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-gold/10 transition-all duration-500">
                  <stat.icon className={`w-8 h-8 ${stat.color} drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]`} />
                </div>
                <div className="text-[11px] font-black text-gold/40 uppercase tracking-[0.2em]">{stat.label}</div>
                <div className="text-3xl font-black text-pearl mt-2 tracking-tight italic">{stat.value}</div>
                {i === 2 && <div className="mt-2 text-[9px] font-black text-gold bg-gold/10 px-2 py-0.5 rounded tracking-widest">+12% EST.</div>}
              </motion.div>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="luxury-card-gold overflow-hidden"
          >
            <div className="px-10 py-7 border-b border-gold/20 flex justify-between items-center bg-gold/5">
              <h3 className="text-xl font-black text-pearl tracking-tight uppercase italic tracking-widest">Opportunity Ledger</h3>
              <button className="text-[10px] font-black text-gold hover:text-gold-light transition-all uppercase tracking-[0.3em] bg-gold/10 px-4 py-2 rounded-xl border border-gold/20 shimmer-text">Expand Archive</button>
            </div>
            <ul className="divide-y divide-gold/10 bg-navy/20">
              {calls.map((call, i) => (
                <motion.li 
                  key={call.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.05 }}
                  className="px-10 py-6 hover:bg-gold/10 cursor-pointer transition-all group flex items-center justify-between relative overflow-hidden"
                  onClick={() => handleClientClick(call.client)}
                >
                  <div className="absolute inset-y-0 left-0 w-1 bg-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-6 relative z-10">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      call.direction === 'INBOUND' ? 'bg-gold/20 text-gold border border-gold/30' : 'bg-gold-light/20 text-gold-light border border-gold-light/30'
                    } group-hover:scale-110 transition-all duration-500 shadow-xl`}>
                      {call.direction === 'INBOUND' ? <PhoneIncoming className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="text-lg font-black text-pearl group-hover:text-gold transition-colors italic tracking-tight">{call.client?.name || call.phoneNumber}</p>
                      <p className="text-[10px] text-gold-light/40 font-black mt-1 uppercase tracking-widest">{format(new Date(call.startedAt), 'h:mm a')} • {format(new Date(call.startedAt), 'MMMM d')}</p>
                    </div>
                  </div>
                  <div className="text-right relative z-10">
                    <p className="text-sm font-black text-pearl tracking-widest">{call.duration ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : '--'}</p>
                    <p className={`text-[9px] font-black uppercase tracking-[0.3em] mt-2 px-3 py-1 rounded-full border ${
                      call.status === 'MISSED' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-gold/10 text-gold border-gold/20'
                    }`}>{call.status}</p>
                  </div>
                </motion.li>
              ))}
              {calls.length === 0 && (
                <li className="px-8 py-12 text-center text-gold-light/30 italic">No wealth activity recorded yet.</li>
              )}
            </ul>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
              className="luxury-card overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-gold/10 flex justify-between items-center bg-navy/40">
                <h3 className="text-lg font-bold text-pearl">Action List</h3>
                <span className="bg-gold text-navy text-[10px] font-black px-2 py-0.5 rounded-md shadow-lg">{tasks.length} PENDING</span>
              </div>
              <ul className="divide-y divide-gold/10 max-h-[300px] overflow-y-auto">
                {tasks.map((task, i) => (
                  <li 
                    key={task.id} 
                    className="px-8 py-5 hover:bg-gold/5 cursor-pointer transition-colors"
                    onClick={() => handleClientClick(task.client)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-gold/10 mt-0.5">
                        <CheckSquare className="w-4 h-4 text-gold" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-pearl line-clamp-1">{task.title}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <p className="text-[10px] text-gold-light/40 flex items-center gap-1.5 font-bold uppercase tracking-widest">
                            <Calendar className="w-3 h-3 text-gold" />
                            {format(new Date(task.dueAt), 'h:mm a')}
                          </p>
                          <p className="text-[10px] text-gold font-black uppercase tracking-widest">{task.client?.name}</p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
                {tasks.length === 0 && (
                  <li className="px-8 py-12 text-center text-gold-light/30 italic">All tasks completed. Efficiency is wealth.</li>
                )}
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="luxury-card p-8 flex flex-col justify-center bg-gradient-to-br from-gold/10 to-transparent border-gold/30 hover:shadow-gold/20 transition-all duration-500"
            >
              <h3 className="text-xl font-black gold-text-gradient mb-6 tracking-tight">Luxury Summary</h3>
              <dl className="space-y-6">
                <div className="flex justify-between items-end border-b border-gold/10 pb-2">
                  <dt className="text-xs font-bold text-gold-light/40 uppercase tracking-widest">Global Sessions</dt>
                  <dd className="text-lg font-bold text-pearl">{allCalls.length}</dd>
                </div>
                <div className="flex justify-between items-end border-b border-gold/10 pb-2">
                  <dt className="text-xs font-bold text-gold-light/40 uppercase tracking-widest">Avg Resonance</dt>
                  <dd className="text-lg font-bold text-pearl">
                    {(() => {
                      const totalSec = allCalls.reduce((acc, c) => acc + (c.duration || 0), 0);
                      const avg = allCalls.length ? Math.floor(totalSec / allCalls.length) : 0;
                      return `${Math.floor(avg / 60)}m ${avg % 60}s`;
                    })()}
                  </dd>
                </div>
                <div className="flex justify-between items-end border-b border-gold/10 pb-2">
                  <dt className="text-xs font-bold text-gold-light/40 uppercase tracking-widest">Opportunity Gap</dt>
                  <dd className="text-lg font-bold text-red-400">
                    {allCalls.filter(c => c.status === 'MISSED').length}
                  </dd>
                </div>
              </dl>
              <button className="luxury-button mt-8 text-xs py-3">Optimize Performance</button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
