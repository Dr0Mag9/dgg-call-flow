import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Search, Filter, Star, Phone, Mail, Building, MoreVertical, X, MapPin, Gavel, Plus, Sparkles, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function CRMOverview() {
  const { token, user, setSelectedClient, setClientDrawerOpen, socket } = useAppStore();
  const [clients, setClients] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Add Client Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', company: '', city: '', matterType: '', assignedAgentId: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/clients', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setClients(data);
        setLoading(false);
      })
      .catch(console.error);

    if (user?.role === 'ADMIN') {
      fetch('/api/admin/agents', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setAgents(data))
        .catch(console.error);
    }

    if (socket) {
      const handleClientCreated = (client: any) => {
        setClients(prev => [client, ...prev]);
      };
      const handleClientUpdated = (client: any) => {
        setClients(prev => prev.map(c => c.id === client.id ? { ...c, ...client } : c));
      };
      socket.on('client_created', handleClientCreated);
      socket.on('client_updated', handleClientUpdated);
      return () => {
        socket.off('client_created', handleClientCreated);
        socket.off('client_updated', handleClientUpdated);
      };
    }
  }, [token, socket, user?.role]);

  const handleClientClick = (client: any) => {
    setSelectedClient(client);
    setClientDrawerOpen(true);
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...newClient };
      if (!payload.assignedAgentId) delete payload.assignedAgentId;

      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setNewClient({ name: '', phone: '', email: '', company: '', city: '', matterType: '', assignedAgentId: '' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClients = clients.filter(c => 
    (c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.company?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.city?.toLowerCase().includes(search.toLowerCase()) ||
    c.matterType?.toLowerCase().includes(search.toLowerCase())) ?? false
  );

  const getStageStyle = (stage: string) => {
    switch(stage) {
      case 'Converted': return 'bg-gold/20 text-gold-light border-gold/30 shadow-[0_0_10px_rgba(212,175,55,0.2)]';
      case 'Lost': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'New Lead': return 'bg-gold-light/20 text-gold-light border-gold-light/30';
      default: return 'bg-navy/40 text-pearl/60 border-gold/10';
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col pb-4">
      <div className="flex justify-between items-center px-2">
        <div>
          <h2 className="text-xl font-black text-pearl tracking-tight uppercase italic underline decoration-gold/30">Business Intelligence</h2>
          <p className="text-gold-light/40 text-[9px] font-black uppercase tracking-[0.3em] mt-0.5">Asset Portfolio</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAddModalOpen(true)}
          className="luxury-button flex items-center gap-2 py-2 text-[10px]"
        >
          <Plus className="w-4 h-4" />
          <span>New Prospect</span>
        </motion.button>
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
            placeholder="Scan portfolio..." 
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
        className="luxury-card-gold flex-1 overflow-hidden flex flex-col"
      >
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="min-w-full divide-y divide-gold/10">
            <thead className="bg-[#0A1221]/80 backdrop-blur-3xl sticky top-0 z-20">
              <tr className="border-b border-gold/20">
                <th className="px-6 py-3 text-left text-[9px] font-black text-gold uppercase tracking-[0.2em]">Client Asset</th>
                <th className="px-6 py-3 text-left text-[9px] font-black text-gold uppercase tracking-[0.2em]">Coordinates</th>
                <th className="px-6 py-3 text-left text-[9px] font-black text-gold uppercase tracking-[0.2em]">Domain</th>
                <th className="px-6 py-3 text-left text-[9px] font-black text-gold uppercase tracking-[0.2em]">Stage</th>
                <th className="px-6 py-3 text-left text-[9px] font-black text-gold uppercase tracking-[0.2em]">Rank</th>
                <th className="px-6 py-3 text-left text-[9px] font-black text-gold uppercase tracking-[0.2em]">Executor</th>
                <th className="px-6 py-3 text-left text-[9px] font-black text-gold uppercase tracking-[0.2em]">Last Sync</th>
                <th className="px-6 py-3 text-left text-[9px] font-black text-gold uppercase tracking-[0.2em]">Next</th>
                <th className="px-6 py-3 relative"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/5 bg-navy/10">
              {loading ? (
                <tr><td colSpan={9} className="px-8 py-20 text-center"><Sparkles className="w-8 h-8 text-gold animate-spin mx-auto mb-4 opacity-20" /><span className="text-gold-light/30 italic">Decrypting portfolio...</span></td></tr>
              ) : filteredClients.length === 0 ? (
                <tr><td colSpan={9} className="px-8 py-20 text-center text-gold-light/30 italic">No assets matching these coordinates.</td></tr>
              ) : (
                filteredClients.map((client, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.03 }}
                    key={client.id} 
                    onClick={() => handleClientClick(client)}
                    className="hover:bg-gold/10 cursor-pointer transition-all group relative overflow-hidden"
                  >
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gold/30 to-navy-light/50 border border-gold/30 flex items-center justify-center text-gold-light font-black shadow-lg group-hover:scale-105 transition-all duration-500 relative shrink-0">
                          {client.score > 85 && <div className="absolute inset-0 bg-gold/20 blur-md rounded-[inherit]" />}
                          <span className="relative z-10 text-sm italic uppercase">{client.name?.charAt(0) || '?'}</span>
                        </div>
                        <div className="ml-4 truncate">
                          <div className="text-sm font-black text-pearl group-hover:text-gold transition-colors tracking-tight italic uppercase">{client.name}</div>
                          <div className="text-[8px] text-gold-light/40 font-black flex items-center gap-1.5 mt-0.5 uppercase tracking-widest truncate max-w-[120px]">
                            {client?.company || 'Private Asset'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="text-xs font-bold text-pearl/90 flex items-center gap-2 group-hover:text-gold transition-colors">
                        <Phone className="w-3.5 h-3.5 text-gold/60 shrink-0" /> {client.phone}
                      </div>
                      {client.email && (
                        <div className="text-[9px] text-gold-light/30 flex items-center gap-2 mt-1 font-black uppercase tracking-widest truncate max-w-[150px]">
                          <Mail className="w-3 h-3 text-gold/20 shrink-0" /> {client.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="px-3 py-1 rounded-lg bg-gold/5 border border-gold/20 text-[9px] font-black text-pearl/80 uppercase tracking-tighter shimmer-text">
                        {client.matterType || 'General'}
                      </div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-[9px] font-black uppercase tracking-widest rounded-full border ${getStageStyle(client.stage)}`}>
                        {client.stage}
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Star className={`w-3.5 h-3.5 ${client.score > 70 ? 'text-gold fill-gold' : 'text-gold-light/20'}`} />
                        <span className="text-xs font-black text-pearl italic">{client.score || 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center text-[10px] font-black text-gold">
                          {client.assignedAgent?.user?.name?.[0] || 'U'}
                        </div>
                        <span className="text-[9px] font-black text-gold-light/60 uppercase tracking-widest">
                          {client.assignedAgent?.user?.name || 'ALLOCATED'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="text-[10px] font-black text-pearl/40 uppercase tracking-widest">
                        {client.lastContactedAt && !isNaN(new Date(client.lastContactedAt).getTime()) ? format(new Date(client.lastContactedAt), 'MMM dd') : '--'}
                      </div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      {client.nextFollowUpAt && !isNaN(new Date(client.nextFollowUpAt).getTime()) ? (
                        <div className="text-[10px] font-black text-gold flex items-center gap-2 uppercase tracking-widest italic shimmer-text">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {format(new Date(client.nextFollowUpAt), 'MMM dd')}
                        </div>
                      ) : (
                        <span className="text-[9px] text-gold-light/10 font-black uppercase tracking-widest italic">Idle</span>
                      )}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-right">
                      <button className="p-2 rounded-lg hover:bg-gold/20 text-gold-light/40 hover:text-gold transition-all">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add Client Modal */}
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
              className="luxury-card w-full max-w-2xl overflow-hidden relative z-10 border-gold/30"
            >
              <div className="px-8 py-6 border-b border-gold/10 flex justify-between items-center bg-gold/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gold/20">
                    <Sparkles className="w-5 h-5 text-gold" />
                  </div>
                  <h3 className="text-xl font-black text-pearl tracking-tight uppercase tracking-widest text-sm">Register New High-Value Asset</h3>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 rounded-full hover:bg-gold/10 text-gold-light/40 hover:text-gold transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddClient} className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gold/60 uppercase tracking-widest ml-1">Asset Name</label>
                    <input 
                      required
                      type="text"
                      value={newClient.name}
                      onChange={e => setNewClient({...newClient, name: e.target.value})}
                      className="w-full bg-navy/50 border border-gold/10 rounded-xl p-3.5 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all"
                      placeholder="Enter Full Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gold/60 uppercase tracking-widest ml-1">Communication coordinates</label>
                    <input 
                      required
                      type="tel"
                      value={newClient.phone}
                      onChange={e => setNewClient({...newClient, phone: e.target.value})}
                      className="w-full bg-navy/50 border border-gold/10 rounded-xl p-3.5 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gold/60 uppercase tracking-widest ml-1">Digital Identity (Email)</label>
                    <input 
                      type="email"
                      value={newClient.email}
                      onChange={e => setNewClient({...newClient, email: e.target.value})}
                      className="w-full bg-navy/50 border border-gold/10 rounded-xl p-3.5 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all"
                      placeholder="client@vault.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gold/60 uppercase tracking-widest ml-1">Primary Region (City)</label>
                    <input 
                      type="text"
                      value={newClient.city}
                      onChange={e => setNewClient({...newClient, city: e.target.value})}
                      className="w-full bg-navy/50 border border-gold/10 rounded-xl p-3.5 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all"
                      placeholder="Global City"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="block text-[10px] font-black text-gold/60 uppercase tracking-widest ml-1">Entity / Organization</label>
                    <input 
                      type="text"
                      value={newClient.company}
                      onChange={e => setNewClient({...newClient, company: e.target.value})}
                      className="w-full bg-navy/50 border border-gold/10 rounded-xl p-3.5 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all"
                      placeholder="Private Investment / Firm Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gold/60 uppercase tracking-widest ml-1">Portfolio Category</label>
                    <select 
                      value={newClient.matterType}
                      onChange={e => setNewClient({...newClient, matterType: e.target.value})}
                      className="w-full bg-navy/50 border border-gold/10 rounded-xl p-3.5 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Select Domain</option>
                      <option value="Civil Litigation">Civil Litigation</option>
                      <option value="Criminal Defense">Criminal Defense</option>
                      <option value="Family Law">Family Law</option>
                      <option value="Corporate Law">Corporate Law</option>
                      <option value="Property Dispute">Property Dispute</option>
                      <option value="Intellectual Property">Intellectual Property</option>
                      <option value="Other">Custom Portfolio</option>
                    </select>
                  </div>
                  {user?.role === 'ADMIN' && (
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-gold/60 uppercase tracking-widest ml-1">Assigned Executor</label>
                      <select 
                        value={newClient.assignedAgentId}
                        onChange={e => setNewClient({...newClient, assignedAgentId: e.target.value})}
                        className="w-full bg-navy/50 border border-gold/10 rounded-xl p-3.5 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="">Global Pool (Unassigned)</option>
                        {agents.map(agent => (
                          <option key={agent.id} value={agent.id}>{agent.user?.name} (EXT: {agent.extension})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                
                <div className="pt-6 flex justify-end gap-6 items-center">
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="text-xs font-black text-gold-light/40 hover:text-gold-light uppercase tracking-widest transition-colors"
                  >
                    Discard Session
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="luxury-button min-w-[200px]"
                  >
                    {isSubmitting ? 'Finalizing Registry...' : 'Initialize Asset'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
