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
        if (Array.isArray(data)) {
          setAllCalls(data);
          setCalls(data.slice(0, 5));
        } else {
          console.warn('[Dashboard] Unexpected calls data format:', data);
          setAllCalls([]);
        }
      })
      .catch(console.error);

    fetch('/api/tasks', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTasks(data.filter((t: any) => t.status === 'PENDING').slice(0, 5));
        } else {
          console.warn('[Dashboard] Unexpected tasks data format:', data);
          setTasks([]);
        }
      })
      .catch(console.error);
  }, [token]);

  const handleClientClick = (client: any) => {
    if (client) {
      setSelectedClient(client);
      setClientDrawerOpen(true);
    }
  };

  const todayCalls = Array.isArray(allCalls) 
    ? allCalls.filter(c => c.startedAt && new Date(c.startedAt) >= startOfDay(new Date()))
    : [];

  return (
    <div className="space-y-4 pb-4">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="luxury-card-gold p-5 relative overflow-hidden group border-gold/30 shadow-[0_0_40px_rgba(212,175,55,0.1)]"
      >
        <div className="absolute top-0 right-0 w-60 h-60 bg-gold/5 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-gold/10 transition-all duration-1000" />
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold/30 to-navy-light/50 border border-gold/40 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-500 relative">
              <img src="/assets/@digitalgrowthgurus (1).jpg" className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-10" alt="" />
              <Award className="w-7 h-7 text-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.6)] relative z-10" />
            </div>
            <div>
              <h2 className="text-xl font-black text-pearl tracking-tight italic">
                Welcome, <span className="gold-text-gradient uppercase tracking-tighter">{user?.name}</span>
              </h2>
              <p className="text-gold-light/40 font-black mt-1 tracking-[0.2em] uppercase text-[9px]">
                Status: <span className="text-gold shimmer-text">Asset Optimal</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-5 px-6 py-3 rounded-2xl bg-gold/10 border border-gold/20 backdrop-blur-3xl shadow-inner relative group/status">
            <div className="flex flex-col items-end relative z-10">
              <span className="text-[9px] text-gold font-black tracking-[0.2em] uppercase shimmer-text">Connectivity</span>
              <span className="text-sm font-black text-gold-light tracking-[0.1em] uppercase italic mt-0.5">Primus Gold Link</span>
            </div>
            <div className="relative flex h-4 w-4 z-10">
              <motion.span 
                animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inline-flex h-full w-full rounded-full bg-gold"
              ></motion.span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-gold border border-navy shadow-[0_0_10px_rgba(212,175,55,1)]"></span>
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

        <div className="xl:col-span-2 space-y-4">

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="f-card overflow-hidden luxury-card-gold"
          >
            <div className="px-6 py-3 border-b border-gold/20 flex justify-between items-center bg-gold/5">
              <h3 className="text-sm font-black text-pearl tracking-[0.2em] uppercase italic">Opportunity Ledger</h3>
              <button className="text-[8px] font-black text-gold hover:text-gold-light transition-all uppercase tracking-[0.2em] bg-gold/10 px-3 py-1.5 rounded-lg border border-gold/20 shimmer-text">Archive</button>
            </div>
            <ul className="divide-y divide-gold/10 bg-navy/20 max-h-[300px] overflow-y-auto custom-scrollbar">
              {calls.map((call, i) => (
                <motion.li 
                  key={call.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.05 }}
                  className="px-6 py-3 hover:bg-gold/10 cursor-pointer transition-all group flex items-center justify-between relative overflow-hidden"
                  onClick={() => handleClientClick(call.client)}
                >
                  <div className="absolute inset-y-0 left-0 w-0.5 bg-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      call.direction === 'INBOUND' ? 'bg-gold/20 text-gold border border-gold/30' : 'bg-gold-light/20 text-gold-light border border-gold-light/30'
                    } group-hover:scale-105 transition-all duration-500 shadow-xl`}>
                      {call.direction === 'INBOUND' ? <PhoneIncoming className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-pearl group-hover:text-gold transition-colors italic tracking-tight">{call.client?.name || call.phoneNumber}</p>
                      <p className="text-[8px] text-gold-light/40 font-black mt-0.5 uppercase tracking-widest">{format(new Date(call.startedAt), 'h:mm a')}</p>
                    </div>
                  </div>
                  <div className="text-right relative z-10">
                    <p className="text-xs font-black text-pearl tracking-widest">{call.duration ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : '--'}</p>
                    <p className={`text-[8px] font-black uppercase tracking-[0.2em] mt-1 px-2 py-0.5 rounded-full border ${
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
              className="luxury-card overflow-hidden"
            >
              <div className="px-6 py-3 border-b border-gold/10 flex justify-between items-center bg-navy/40">
                <h3 className="text-sm font-bold text-pearl uppercase tracking-widest">Tasks</h3>
                <span className="bg-gold text-navy text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg">{tasks.length}</span>
              </div>
              <ul className="divide-y divide-gold/10 max-h-[180px] overflow-y-auto custom-scrollbar">
                {tasks.map((task, i) => (
                  <li 
                    key={task.id} 
                    className="px-6 py-3 hover:bg-gold/5 cursor-pointer transition-colors"
                    onClick={() => handleClientClick(task.client)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-gold/10 mt-0.5">
                        <CheckSquare className="w-3.5 h-3.5 text-gold" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-pearl line-clamp-1">{task.title}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <p className="text-[8px] text-gold-light/40 flex items-center gap-1 font-bold uppercase tracking-widest">
                            <Clock className="w-2.5 h-2.5 text-gold" />
                            {format(new Date(task.dueAt), 'h:mm a')}
                          </p>
                          <p className="text-[8px] text-gold font-black uppercase tracking-widest">{task.client?.name}</p>
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
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="luxury-card p-5 flex flex-col justify-center bg-gradient-to-br from-gold/10 to-transparent border-gold/20 hover:shadow-gold/20 transition-all duration-500"
            >
              <h3 className="text-sm font-black gold-text-gradient mb-4 tracking-widest uppercase">Overview</h3>
              <dl className="space-y-4">
                <div className="flex justify-between items-end border-b border-gold/10 pb-1.5">
                  <dt className="text-[9px] font-bold text-gold-light/40 uppercase tracking-widest">Global Sessions</dt>
                  <dd className="text-sm font-bold text-pearl">{allCalls.length}</dd>
                </div>
                <div className="flex justify-between items-end border-b border-gold/10 pb-1.5">
                  <dt className="text-[9px] font-bold text-gold-light/40 uppercase tracking-widest">Avg Resonance</dt>
                  <dd className="text-sm font-bold text-pearl">
                    {(() => {
                      const totalSec = allCalls.reduce((acc, c) => acc + (c.duration || 0), 0);
                      const avg = allCalls.length ? Math.floor(totalSec / allCalls.length) : 0;
                      return `${Math.floor(avg / 60)}m ${avg % 60}s`;
                    })()}
                  </dd>
                </div>
                <div className="flex justify-between items-end border-b border-gold/10 pb-1.5">
                  <dt className="text-[9px] font-bold text-gold-light/40 uppercase tracking-widest">Gap</dt>
                  <dd className="text-sm font-bold text-red-400">
                    {allCalls.filter(c => c.status === 'MISSED').length}
                  </dd>
                </div>
              </dl>
              <button className="luxury-button mt-5 text-[9px] py-2 uppercase tracking-[0.2em]">Optimize</button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
