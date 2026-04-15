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
        className="luxury-card p-8 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-gold/10 transition-colors duration-1000" />
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center shadow-xl">
              <Award className="w-10 h-10 text-gold" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-pearl tracking-tight">
                Welcome back, <span className="gold-text-gradient">{user?.name}</span>
              </h2>
              <p className="text-gold-light/60 font-medium mt-1 tracking-wide">
                Your wealth command center is fully operational.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 px-6 py-4 rounded-2xl bg-gold/5 border border-gold/10 backdrop-blur-md">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gold-deep font-bold tracking-widest uppercase">Connectivity</span>
              <span className="text-lg font-bold text-gold-light tracking-tight">VIRTUAL GOLD LINE</span>
            </div>
            <div className="relative flex h-5 w-5">
              <motion.span 
                animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inline-flex h-full w-full rounded-full bg-gold-light"
              ></motion.span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-gold border border-navy shadow-[0_0_15px_rgba(212,175,55,0.5)]"></span>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Today's Volume", value: todayCalls.length, icon: TrendingUp, color: "text-gold" },
              { label: "Success Rate", value: "84%", icon: Zap, color: "text-gold-light" },
              { label: "Active Revenue", value: "$12.4k", icon: Award, color: "text-gold" },
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="luxury-card p-6 flex flex-col items-center text-center group hover:bg-gold/5"
              >
                <stat.icon className={`w-8 h-8 ${stat.color} mb-3 group-hover:scale-110 transition-transform`} />
                <div className="text-sm font-bold text-gold-light/40 uppercase tracking-widest">{stat.label}</div>
                <div className="text-2xl font-black text-pearl mt-1">{stat.value}</div>
              </motion.div>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="luxury-card overflow-hidden"
          >
            <div className="px-8 py-6 border-b border-gold/10 flex justify-between items-center bg-gold/5">
              <h3 className="text-xl font-bold text-pearl tracking-tight">Recent Opportunities</h3>
              <button className="text-xs font-bold text-gold-light hover:text-gold transition-colors uppercase tracking-widest">View Ledger</button>
            </div>
            <ul className="divide-y divide-gold/10">
              {calls.map((call, i) => (
                <motion.li 
                  key={call.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.05 }}
                  className="px-8 py-5 hover:bg-gold/5 cursor-pointer transition-colors group"
                  onClick={() => handleClientClick(call.client)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className={`p-3 rounded-xl ${
                        call.direction === 'INBOUND' ? 'bg-gold/10 text-gold' : 'bg-gold-light/10 text-gold-light'
                      } group-hover:scale-110 transition-transform shadow-lg shadow-black/20`}>
                        {call.direction === 'INBOUND' ? <PhoneIncoming className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-base font-bold text-pearl group-hover:text-gold transition-colors">{call.client?.name || call.phoneNumber}</p>
                        <p className="text-xs text-gold-light/40 font-medium mt-0.5">{format(new Date(call.startedAt), 'MMM d, h:mm a')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-pearl tracking-tight">{call.duration ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : '--'}</p>
                      <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${
                        call.status === 'MISSED' ? 'text-red-400' : 'text-gold-light/60'
                      }`}>{call.status}</p>
                    </div>
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
