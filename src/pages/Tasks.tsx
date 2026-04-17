import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { CheckSquare, Calendar, Clock, AlertCircle, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { motion, AnimatePresence } from 'motion';

export default function Tasks() {
  const { token, setSelectedClient, setClientDrawerOpen } = useAppStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tasks', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setTasks(data);
        setLoading(false);
      })
      .catch(console.error);
  }, [token]);

  const handleTaskClick = (client: any) => {
    if (client) {
      setSelectedClient(client);
      setClientDrawerOpen(true);
    }
  };

  const handleComplete = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'COMPLETED' })
      });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'COMPLETED' } : t));
    } catch (err) {
      console.error(err);
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'PENDING');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center px-2">
        <div>
          <h2 className="text-xl font-black text-pearl tracking-tight font-serif italic uppercase underline decoration-gold/30">Success Roadmap</h2>
          <p className="text-gold-light/40 text-[9px] font-black uppercase tracking-[0.3em] mt-0.5">Strategic Objectives & Actions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Tasks */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="luxury-card overflow-hidden flex flex-col border-gold/10"
        >
          <div className="px-6 py-4 border-b border-gold/10 bg-gold/5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-gold" />
              <h3 className="text-[10px] font-black text-pearl uppercase tracking-widest">Active Objectives</h3>
            </div>
            <span className="bg-gold text-navy text-[8px] font-black px-2 py-0.5 rounded shadow-lg uppercase tracking-widest">{pendingTasks.length} PENDING</span>
          </div>
          
          <ul className="divide-y divide-gold/10 overflow-y-auto max-h-[600px] bg-navy/20">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <li className="px-8 py-20 text-center"><Sparkles className="w-8 h-8 text-gold animate-spin mx-auto mb-4 opacity-20" /><span className="text-gold-light/30 italic">Calculating priorities...</span></li>
              ) : pendingTasks.length === 0 ? (
                <motion.li 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-8 py-24 text-center group"
                >
                  <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-gold/20 group-hover:scale-110 transition-transform duration-500">
                    <CheckCircle2 className="w-8 h-8 text-gold" />
                  </div>
                  <p className="text-pearl font-bold text-lg mb-2">Absolute Excellence</p>
                  <p className="text-gold-light/40 text-sm italic">All strategic objectives have been neutralized.</p>
                </motion.li>
              ) : (
                pendingTasks.map((task, i) => {
                  const dueDate = new Date(task.dueAt);
                  const isOverdue = isPast(dueDate) && !isToday(dueDate);
                  return (
                    <motion.li 
                      layout
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      transition={{ delay: i * 0.05 }}
                      key={task.id} 
                      className="px-6 py-4 hover:bg-gold/5 cursor-pointer transition-all group"
                      onClick={() => handleTaskClick(task.client)}
                    >
                      <div className="flex items-start gap-4">
                        <motion.button 
                          whileHover={{ scale: 1.2, color: '#D4AF37' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleComplete(e, task.id)}
                          className="mt-1 text-gold-light/10 transition-colors"
                        >
                          <div className="w-4 h-4 rounded border border-current flex items-center justify-center">
                            <CheckSquare className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </motion.button>
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-start gap-3">
                            <p className="text-sm font-black text-pearl group-hover:text-gold transition-colors italic truncate max-w-[200px]">{task.title}</p>
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest ${
                              isOverdue ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                              isToday(dueDate) ? 'bg-gold/10 text-gold border-gold/20' : 
                              'bg-navy/40 text-gold-light/20 border-gold/5'
                            }`}>
                              {isOverdue && <AlertCircle className="w-2.5 h-2.5 animate-pulse" />}
                              {format(dueDate, 'MMM d, h:mm a')}
                            </div>
                          </div>
                          
                          <div className="mt-2.5 flex items-center gap-3">
                            <span className="px-1.5 py-0.5 bg-gold/5 text-gold text-[7px] font-black rounded border border-gold/10 uppercase tracking-widest">{task.taskType}</span>
                            <div className="flex items-center gap-1.5">
                              <div className="w-1 h-1 rounded-full bg-gold/40" />
                              <span className="text-[9px] text-pearl/40 font-black group-hover:text-pearl transition-colors uppercase italic truncate max-w-[120px]">{task.client?.name}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.li>
                  );
                })
              )}
            </AnimatePresence>
          </ul>
        </motion.div>

        {/* Completed Tasks */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="luxury-card overflow-hidden flex flex-col border-gold/5 bg-navy/10 grayscale-[0.5] opacity-60"
        >
          <div className="px-6 py-4 border-b border-gold/5 bg-navy/40 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-gold-light/10" />
              <h3 className="text-[10px] font-black text-pearl/40 uppercase tracking-widest">Archived Success</h3>
            </div>
            <span className="bg-gold-light/5 text-gold-light/20 text-[8px] font-black px-2 py-0.5 rounded border border-gold/5 uppercase tracking-widest">{completedTasks.length} COMPLETED</span>
          </div>
          <ul className="divide-y divide-gold/5 overflow-y-auto max-h-[600px]">
            {completedTasks.length === 0 ? (
              <li className="px-8 py-20 text-center text-gold-light/20 italic">The archive is empty.</li>
            ) : (
              completedTasks.map(task => (
                <li key={task.id} className="px-8 py-6 bg-navy/20">
                  <div className="flex items-start gap-6">
                    <div className="mt-1 p-1 rounded-lg bg-gold/10">
                      <CheckSquare className="w-4 h-4 text-gold/40" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-pearl/30 line-through tracking-wide">{task.title}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-[10px] text-gold-light/20 font-black uppercase tracking-widest">{task.client?.name}</span>
                        <div className="w-1 h-1 rounded-full bg-gold/10" />
                        <span className="text-[10px] text-gold-light/10 font-bold">VERIFIED SUCCESS</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
