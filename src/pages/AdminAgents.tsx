import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { User, Phone, Circle, X, Edit, Power, Activity, PhoneIncoming, PhoneOutgoing, CheckSquare, Clock, Plus, ShieldCheck, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion';

export default function AdminAgents() {
  const { token } = useAppStore();
  const [agents, setAgents] = useState<any[]>([]);
  const [telephonyLines, setTelephonyLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [agentActivity, setAgentActivity] = useState<{calls: any[], tasks: any[]}>({ calls: [], tasks: [] });
  
  // Forms
  const [formData, setFormData] = useState({ name: '', email: '', password: '', extension: '', assignedNumber: '', telephonyLineId: '', sipPassword: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState('');
  const [editError, setEditError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchAgents = () => {
    fetch('/api/admin/agents', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setAgents(data);
        setLoading(false);
      })
      .catch(console.error);
  };

  const fetchTelephonyLines = () => {
    fetch('/api/admin/telephony-lines', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setTelephonyLines(data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchAgents();
    fetchTelephonyLines();
  }, [token]);

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');

    if (formData.password.length < 8) {
      setAddError('Password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setIsAddModalOpen(false);
        setAddError('');
        setFormData({ name: '', email: '', password: '', extension: '', assignedNumber: '', telephonyLineId: '', sipPassword: '' });
        fetchAgents();
      } else {
        setAddError(data?.error || 'Failed to create agent.');
      }
    } catch (err) {
      console.error(err);
      setAddError('Network error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;
    setIsSubmitting(true);
    setEditError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/admin/agents/${selectedAgent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          extension: formData.extension,
          assignedNumber: formData.assignedNumber,
          telephonyLineId: formData.telephonyLineId || null,
          sipPassword: formData.sipPassword
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        setSuccessMsg('Unit synchronized successfully.');
        setTimeout(() => {
          setIsEditModalOpen(false);
          setSuccessMsg('');
        }, 1500);
        fetchAgents();
      } else {
        setEditError(data.error || 'Failed to update agent.');
      }
    } catch (err) {
      console.error(err);
      setEditError('Communication Uplink Failure.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (agentId: string) => {
    try {
      const res = await fetch(`/api/admin/agents/${agentId}/toggle-status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAgents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewProfile = async (agent: any) => {
    setSelectedAgent(agent);
    setIsProfileDrawerOpen(true);
    try {
      const res = await fetch(`/api/admin/agents/${agent.id}/activity`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAgentActivity(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (agent: any) => {
    setSelectedAgent(agent);
    setEditError('');
    setSuccessMsg('');
    setFormData({
      name: agent.user.name,
      email: agent.user.email,
      password: '',
      extension: agent.extension || '',
      assignedNumber: agent.assignedNumber || '',
      telephonyLineId: agent.telephonyLineId || '',
      sipPassword: agent.sipPassword || ''
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center px-2">
        <div>
          <h2 className="text-xl font-black text-pearl tracking-tight font-serif italic uppercase underline decoration-gold/30">Force Command</h2>
          <p className="text-gold-light/40 text-[9px] font-black uppercase tracking-[0.3em] mt-0.5">Executor Registry & Deployment</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setFormData({ name: '', email: '', password: '', extension: '', assignedNumber: '', telephonyLineId: '', sipPassword: '' });
            setAddError('');
            setIsAddModalOpen(true);
          }}
          className="luxury-button flex items-center gap-2 py-2.5 px-6 text-[10px]"
        >
          <Plus className="w-4 h-4" />
          <span>Deploy Unit</span>
        </motion.button>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <Sparkles className="w-12 h-12 text-gold animate-spin mx-auto mb-6 opacity-20" />
          <span className="text-gold-light/30 font-black uppercase tracking-[0.3em] text-sm">Visualizing Unit Matrix...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {agents.map((agent, i) => (
            <motion.div 
              key={agent.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              className={`luxury-card overflow-hidden group border-gold/10 ${!agent.user.isActive ? 'opacity-30 grayscale' : ''}`}
            >
              <div className="p-4 cursor-pointer relative" onClick={() => handleViewProfile(agent)}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold/20 to-navy border border-gold/30 flex items-center justify-center text-gold shadow-lg group-hover:scale-110 transition-transform">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-pearl group-hover:text-gold transition-colors tracking-tight truncate uppercase italic">
                      {agent.user.name}
                    </h3>
                    <p className="text-[8px] text-gold-light/40 font-bold uppercase tracking-widest truncate">{agent.user.email}</p>
                  </div>
                </div>
                
                <div className="space-y-2 bg-gold/5 p-3 rounded-xl border border-gold/5">
                  <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest">
                    <span className="text-gold-light/20">Protocol</span>
                    <span className="flex items-center gap-1.5 text-gold">
                      <motion.div 
                        animate={{ scale: agent.status === 'ONLINE' ? [1, 1.3, 1] : 1 }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`w-1.5 h-1.5 rounded-full ${agent.status === 'ONLINE' ? 'bg-gold' : 'bg-slate-700'}`} 
                      />
                      {agent.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest">
                    <span className="text-gold-light/20">Weaponized Line</span>
                    <span className="text-gold font-mono">{agent.telephonyLine?.number || 'NONE'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest">
                    <span className="text-gold-light/20">Extension</span>
                    <span className="text-pearl font-mono">{agent.extension || '--'}</span>
                  </div>
                </div>
              </div>
              <div className="bg-navy-light/20 px-4 py-2 border-t border-gold/10 flex justify-end gap-4 overflow-hidden">
                <button 
                  onClick={(e) => { e.stopPropagation(); openEditModal(agent); }}
                  className="text-[8px] font-black text-gold/40 hover:text-gold uppercase tracking-[0.2em] flex items-center gap-1 transition-all"
                >
                  <Edit className="w-3 h-3" /> Mod
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleToggleStatus(agent.id); }}
                  className={`text-[8px] font-black uppercase tracking-[0.2em] flex items-center gap-1 transition-all ${agent.user.isActive ? 'text-red-400/40 hover:text-red-400' : 'text-gold-light/60 hover:text-gold'}`}
                >
                  <Power className="w-3 h-3" /> {agent.user.isActive ? 'Kill' : 'Init'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Agent Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-navy/80 backdrop-blur-md" 
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="luxury-card w-full max-w-xl overflow-hidden relative z-10 border-gold/30 shadow-[0_0_50px_rgba(212,175,55,0.1)]"
            >
              <div className="px-8 py-6 border-b border-gold/10 bg-gold/5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-gold/10 rounded-xl border border-gold/20">
                    <User className="w-5 h-5 text-gold" />
                  </div>
                  <h3 className="text-lg font-black text-pearl uppercase tracking-[0.2em]">Deploy Unit</h3>
                </div>
                <button onClick={() => { setIsAddModalOpen(false); setAddError(''); }} className="p-2 rounded-full hover:bg-gold/10 text-gold-light/40 hover:text-gold transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddAgent} className="p-8 space-y-6 bg-navy/20">
                {addError && (
                  <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    Protocol Error: {addError}
                  </motion.div>
                )}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gold/40 uppercase tracking-widest ml-1">Full Legal Alias</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-navy/50 border border-gold/10 rounded-xl p-3.5 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all placeholder:text-gold-light/10" placeholder="e.g. Alexander Vance" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gold/40 uppercase tracking-widest ml-1">Digital Identity (Email)</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-navy/50 border border-gold/10 rounded-xl p-3.5 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all placeholder:text-gold-light/10" placeholder="executor@vault.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gold/40 uppercase tracking-widest ml-1">Master Secure Key</label>
                    <input required type="password" minLength={8} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-navy/50 border border-gold/10 rounded-xl p-3.5 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all placeholder:text-gold-light/10" placeholder="Min. 8 Entropy Points" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-gold/40 uppercase tracking-widest ml-1">Internal Line</label>
                      <input type="text" value={formData.extension} onChange={e => setFormData({...formData, extension: e.target.value})} className="w-full bg-navy/50 border border-gold/10 rounded-xl p-3.5 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all" placeholder="101" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-gold/40 uppercase tracking-widest ml-1">SIM Phone Number</label>
                      <input type="text" value={formData.assignedNumber} onChange={e => setFormData({...formData, assignedNumber: e.target.value})} className="w-full bg-navy/50 border border-gold/10 rounded-xl p-3.5 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all" placeholder="91564..." />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gold/40 uppercase tracking-widest ml-1 text-gold">SIP Account Password (Separate from Login)</label>
                    <input type="password" value={formData.sipPassword} onChange={e => setFormData({...formData, sipPassword: e.target.value})} className="w-full bg-gold/5 border border-gold/20 rounded-xl p-3.5 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all placeholder:text-gold-light/20" placeholder="Enter Sip2Sip Password" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gold/40 uppercase tracking-widest ml-1 text-gold">Assigned Phone Line (Physical SIM)</label>
                    <select 
                      value={formData.telephonyLineId} 
                      onChange={e => setFormData({...formData, telephonyLineId: e.target.value})}
                      className="w-full bg-gold/10 border border-gold/40 rounded-xl p-3.5 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all cursor-pointer appearance-none"
                    >
                      <option value="">-- Select Airtel SIM Line --</option>
                      {telephonyLines.map(line => (
                        <option key={line.id} value={line.id}>{line.number} ({line.providerType})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="pt-6 flex justify-end gap-6 items-center">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-[10px] font-black text-gold-light/30 hover:text-gold-light uppercase tracking-widest transition-colors">Abort</button>
                  <button type="submit" disabled={isSubmitting} className="luxury-button min-w-[160px] text-xs py-4 px-8">
                    {isSubmitting ? 'Initializing...' : 'Deploy Unit'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Agent Modal */}
      <AnimatePresence>
        {isEditModalOpen && selectedAgent && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-navy/80 backdrop-blur-md" 
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="luxury-card w-full max-w-xl overflow-hidden relative z-10 border-gold/30 shadow-[0_0_50px_rgba(212,175,55,0.15)]"
            >
              <div className="px-8 py-6 border-b border-gold/10 bg-gold/5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-gold/10 rounded-xl border border-gold/20">
                    <Edit className="w-5 h-5 text-gold" />
                  </div>
                  <h3 className="text-lg font-black text-pearl uppercase tracking-[0.2em]">Modify Unit Profile</h3>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 rounded-full hover:bg-gold/10 text-gold-light/40 hover:text-gold transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleEditAgent} className="p-8 space-y-6 bg-navy/20">
                {editError && (
                  <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    SYNC ERROR: {editError}
                  </motion.div>
                )}
                {successMsg && (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gold/10 border border-gold/20 text-gold px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-center">
                    {successMsg}
                  </motion.div>
                )}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gold/40 uppercase tracking-widest ml-1">Alias</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-navy/50 border border-gold/10 rounded-xl p-3.5 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all placeholder:text-gold-light/10" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gold/40 uppercase tracking-widest ml-1">Digital ID (Email)</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-navy/50 border border-gold/10 rounded-xl p-3.5 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all placeholder:text-gold-light/10" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-gold/40 uppercase tracking-widest ml-1">Internal Line</label>
                      <input type="text" value={formData.extension} onChange={e => setFormData({...formData, extension: e.target.value})} className="w-full bg-navy/50 border border-gold/10 rounded-xl p-3.5 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all" placeholder="101" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-gold/40 uppercase tracking-widest ml-1">SIM Phone Number</label>
                      <input type="text" value={formData.assignedNumber} onChange={e => setFormData({...formData, assignedNumber: e.target.value})} className="w-full bg-navy/50 border border-gold/10 rounded-xl p-3.5 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all placeholder:text-gold-light/10" placeholder="91564..." />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gold/40 uppercase tracking-widest ml-1 text-gold">SIP Account Password</label>
                    <input type="password" value={formData.sipPassword} onChange={e => setFormData({...formData, sipPassword: e.target.value})} className="w-full bg-gold/5 border border-gold/20 rounded-xl p-3.5 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all placeholder:text-gold-light/20" placeholder="Enter Sip2Sip Password" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gold/40 uppercase tracking-widest ml-1 text-gold">Assigned Phone Line (Physical SIM)</label>
                    <select 
                      value={formData.telephonyLineId} 
                      onChange={e => {
                        const lineId = e.target.value;
                        const line = telephonyLines.find(l => l.id === lineId);
                        setFormData({
                          ...formData, 
                          telephonyLineId: lineId,
                          assignedNumber: line ? line.number : formData.assignedNumber
                        });
                      }}
                      className="w-full bg-gold/10 border border-gold/40 rounded-xl p-3.5 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all cursor-pointer appearance-none"
                    >
                      <option value="">-- Select Airtel SIM Line --</option>
                      {telephonyLines.map(line => (
                        <option key={line.id} value={line.id}>{line.number} ({line.providerType})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="pt-6 flex justify-end gap-6 items-center">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="text-[10px] font-black text-gold-light/30 hover:text-gold-light uppercase tracking-widest transition-colors">Abort</button>
                  <button type="submit" disabled={isSubmitting} className="luxury-button min-w-[160px] text-xs py-4 px-8">
                    {isSubmitting ? 'Syncing...' : 'Update Unit'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile & Activity Drawer */}
      <AnimatePresence>
        {isProfileDrawerOpen && selectedAgent && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileDrawerOpen(false)}
              className="fixed inset-0 bg-navy/60 backdrop-blur-md z-[110]" 
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-xl bg-navy border-l border-gold/20 shadow-2xl z-[120] flex flex-col"
            >
              <div className="px-10 py-8 border-b border-gold/10 flex justify-between items-center bg-gold/5">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold/30 to-navy border border-gold/30 flex items-center justify-center text-gold shadow-xl">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-pearl tracking-tight">{selectedAgent.user.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                      <span className="text-[10px] text-gold font-black uppercase tracking-[0.2em]">{selectedAgent.user.email}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsProfileDrawerOpen(false)} className="p-3 hover:bg-gold/10 rounded-full transition-all text-gold-light/40 hover:text-gold">
                  <X className="w-8 h-8" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-10 space-y-12 bg-navy/40 custom-scrollbar">
                {/* Recent Calls */}
                <section>
                  <h4 className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                    <Phone className="w-4 h-4" /> Strategic Transactions
                  </h4>
                  <div className="space-y-4">
                    {agentActivity.calls.length === 0 ? (
                      <div className="p-8 border border-dashed border-gold/10 rounded-2xl text-center text-gold-light/20 italic text-sm">No transaction history detected.</div>
                    ) : (
                      agentActivity.calls.map(call => (
                        <div key={call.id} className="luxury-card p-5 bg-navy/60 border-gold/5 group flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={`p-2.5 rounded-xl mt-0.5 shadow-lg ${call.direction === 'INBOUND' ? 'bg-gold/10 text-gold' : 'bg-gold-light/10 text-gold-light'}`}>
                              {call.direction === 'INBOUND' ? <PhoneIncoming className="w-4 h-4" /> : <PhoneOutgoing className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-pearl group-hover:text-gold transition-colors">{call.client?.name || call.phoneNumber}</p>
                              <p className="text-[10px] text-gold-light/40 font-bold mt-1 uppercase tracking-widest">{format(new Date(call.startedAt), 'MMM d, h:mm a')}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full border ${call.status === 'ENDED' ? 'bg-gold/10 text-gold border-gold/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                              {call.status}
                            </span>
                            {call.duration && <p className="text-[10px] font-mono text-gold-light/40 mt-2">{Math.floor(call.duration / 60)}m {call.duration % 60}s</p>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                {/* Recent Tasks */}
                <section>
                  <h4 className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                    <CheckSquare className="w-4 h-4" /> Objective Roadmap
                  </h4>
                  <div className="space-y-4">
                    {agentActivity.tasks.length === 0 ? (
                      <div className="p-8 border border-dashed border-gold/10 rounded-2xl text-center text-gold-light/20 italic text-sm">No active objectives detected.</div>
                    ) : (
                      agentActivity.tasks.map(task => (
                        <div key={task.id} className="luxury-card p-5 bg-navy/60 border-gold/5">
                          <div className="flex justify-between items-start">
                            <p className={`text-sm font-bold ${task.status === 'COMPLETED' ? 'text-gold-light/20 line-through' : 'text-pearl'}`}>{task.title}</p>
                            <span className="text-[9px] font-black text-gold uppercase tracking-widest">{task.client?.name}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gold-light/40 uppercase tracking-widest">
                              <Clock className="w-3.5 h-3.5 text-gold/60" /> {format(new Date(task.dueAt), 'MMM d, h:mm a')}
                            </div>
                            <span className="px-2 py-0.5 bg-gold/10 text-gold text-[8px] font-black rounded border border-gold/10 uppercase tracking-widest">{task.taskType}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
                
                <div className="pt-8 flex justify-center">
                  <ShieldCheck className="w-12 h-12 text-gold/10" />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
