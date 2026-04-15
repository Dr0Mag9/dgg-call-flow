import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Globe, Plus, Trash2, Edit, Save, X, Cpu, PhoneCall, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Settings() {
  const { token, user } = useAppStore();
  const isAdmin = user?.role === 'ADMIN';
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<Record<string, string>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', url: '', secret: '', events: '[]' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchWebhooks = () => {
    fetch('/api/settings/webhooks', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setWebhooks(data))
      .catch(console.error);
  };

  const fetchSystemSettings = () => {
    fetch('/api/settings/system', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setSystemSettings(data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchWebhooks();
    fetchSystemSettings();
  }, [token]);

  const updateSystemSetting = async (key: string, value: any) => {
    try {
      const res = await fetch('/api/settings/system', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ key, value })
      });
      if (res.ok) {
        fetchSystemSettings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/settings/webhooks/${editingId}` : '/api/settings/webhooks';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ name: '', url: '', secret: '', events: '[]' });
        fetchWebhooks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    try {
      const res = await fetch(`/api/settings/webhooks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchWebhooks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (webhook: any) => {
    setEditingId(webhook.id);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      secret: webhook.secret || '',
      events: webhook.events
    });
    setIsAdding(true);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-pearl tracking-tight">System Core</h2>
          <p className="text-gold-light/40 text-xs font-bold uppercase tracking-[0.2em] mt-1">Global Configuration & Protocols</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="luxury-card overflow-hidden border-gold/10"
      >
        <div className="p-10 space-y-12 bg-navy/20">
          
          <section>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-gold/10 rounded-xl border border-gold/20">
                  <PhoneCall className="w-5 h-5 text-gold" />
                </div>
                <h3 className="text-xl font-bold text-pearl tracking-tight uppercase tracking-widest text-sm">Telephony Infrastructure</h3>
              </div>
              {!isAdmin && <span className="px-3 py-1 bg-red-500/10 text-red-400 text-[10px] font-black rounded-lg border border-red-500/20 tracking-widest">RESTRICTED ACCESS</span>}
            </div>
            
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {[
                { label: "SIP Provider WSS URL", key: "sip_wss_url", placeholder: "wss://sip.vault.com", type: "text" },
                { label: "SIP Domain / Proxy", key: "sip_domain", placeholder: "sip.vault.com", type: "text" },
                { label: "Main Business Number", key: "main_business_number", placeholder: "+1-800-GOLD-LINE", type: "text" },
                { label: "SIP Default Secure Key", key: "sip_default_password", placeholder: "Enter Encryption Key", type: "password" },
              ].map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="block text-[10px] font-black text-gold/40 uppercase tracking-widest ml-1">{field.label}</label>
                  <input 
                    disabled={!isAdmin} 
                    type={field.type} 
                    className="w-full bg-navy/40 border border-gold/10 rounded-xl p-3.5 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all placeholder:text-gold-light/10 disabled:opacity-30 disabled:cursor-not-allowed" 
                    defaultValue={systemSettings[field.key] || ''} 
                    onBlur={(e) => updateSystemSetting(field.key, e.target.value)}
                    placeholder={field.placeholder} 
                  />
                </div>
              ))}
            </div>
          </section>section

          <section className="border-t border-gold/10 pt-12">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-gold/10 rounded-xl border border-gold/20">
                  <Cpu className="w-5 h-5 text-gold" />
                </div>
                <h3 className="text-xl font-bold text-pearl tracking-tight uppercase tracking-widest text-sm">Autonomous Intelligence</h3>
              </div>
              {!isAdmin && <span className="px-3 py-1 bg-red-500/10 text-red-400 text-[10px] font-black rounded-lg border border-red-500/20 tracking-widest">RESTRICTED ACCESS</span>}
            </div>
            
            <div className="luxury-card p-6 bg-gold/5 border-gold/20">
              <div className="flex items-start">
                <div className="flex items-center h-6">
                  <input 
                    id="route_available" 
                    type="checkbox" 
                    disabled={!isAdmin}
                    checked={systemSettings.route_available === 'true'}
                    onChange={e => updateSystemSetting('route_available', e.target.checked)}
                    className="w-5 h-5 rounded-lg border-2 border-gold/20 bg-navy text-gold focus:ring-gold/20 transition-all cursor-pointer disabled:opacity-20" 
                  />
                </div>
                <div className="ml-4">
                  <label htmlFor="route_available" className="text-sm font-bold text-pearl uppercase tracking-widest">Proprietary Load Balancing</label>
                  <p className="text-gold-light/40 text-xs mt-1 leading-relaxed">Incoming signals will be autonomously routed to the executor with the highest idle state efficiency.</p>
                </div>
              </div>
            </div>
          </section>section

          <section className="border-t border-gold/10 pt-12">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-gold/10 rounded-xl border border-gold/20">
                  <Globe className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-pearl tracking-tight uppercase tracking-widest text-sm">External API Bridges</h3>
                  <p className="text-gold-light/40 text-[10px] font-bold uppercase tracking-widest mt-1">Real-time Wealth Data Sync</p>
                </div>
              </div>
              {isAdmin && !isAdding && (
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsAdding(true)}
                  className="luxury-button text-[10px] py-2 px-4 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Link New Terminal
                </motion.button>
              )}
            </div>

            <AnimatePresence>
              {isAdding && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gold/5 p-8 rounded-2xl border border-gold/20 mb-10 overflow-hidden"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-xs font-black text-gold uppercase tracking-[0.3em]">{editingId ? 'Modify Connection' : 'Initialize New Terminal'}</h4>
                    <button onClick={() => { setIsAdding(false); setEditingId(null); setFormData({ name: '', url: '', secret: '', events: '[]' }); }} className="text-gold-light/40 hover:text-gold transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <form onSubmit={handleSaveWebhook} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gold/60 uppercase tracking-widest ml-1">Terminal Alias</label>
                        <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g., Global Ledger Sync" className="w-full bg-navy/50 border border-gold/10 rounded-xl p-3.5 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gold/60 uppercase tracking-widest ml-1">Secure Endpoint URL</label>
                        <input required type="url" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} placeholder="https://api.vault.com/v1/sync" className="w-full bg-navy/50 border border-gold/10 rounded-xl p-3.5 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gold/60 uppercase tracking-widest ml-1">Authentication Secret</label>
                        <input type="text" value={formData.secret} onChange={e => setFormData({...formData, secret: e.target.value})} placeholder="Signature HMAC Key" className="w-full bg-navy/50 border border-gold/10 rounded-xl p-3.5 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gold/60 uppercase tracking-widest ml-1">Trigger Protocols</label>
                        <select 
                          value={formData.events} 
                          onChange={e => setFormData({...formData, events: e.target.value})}
                          className="w-full bg-navy/50 border border-gold/10 rounded-xl p-3.5 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all appearance-none cursor-pointer"
                        >
                          <option value="[]">Absolute Oversight (All Pulse)</option>
                          <option value='["client_created"]'>Asset Registry Pulse</option>
                          <option value='["call_ended"]'>Transaction Conclusion Pulse</option>
                          <option value='["task_completed"]'>Objective Neutralized Pulse</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end pt-4">
                      <button type="submit" className="luxury-button flex items-center gap-3 text-xs py-4 px-10">
                        <Save className="w-4 h-4" /> Finalize Connection
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              {webhooks.length === 0 && !isAdding ? (
                <div className="py-16 text-center border border-dashed border-gold/10 rounded-2xl bg-gold/5">
                  <Sparkles className="w-8 h-8 text-gold/20 mx-auto mb-4" />
                  <p className="text-gold-light/20 font-bold uppercase tracking-widest text-xs">No active API bridges found.</p>
                </div>
              ) : (
                webhooks.map(webhook => (
                  <motion.div 
                    layout
                    key={webhook.id} 
                    className="flex items-center justify-between p-6 bg-navy-light/10 border border-gold/10 rounded-2xl hover:bg-gold/5 transition-all group"
                  >
                    <div className="flex items-center gap-6">
                      <div className="p-3 bg-gold/10 rounded-xl border border-gold/20 group-hover:scale-110 transition-transform">
                        <Globe className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-pearl uppercase tracking-widest group-hover:text-gold transition-colors">{webhook.name}</h4>
                        <p className="text-[10px] text-gold-light/40 font-bold mt-1 tracking-wider">{webhook.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-gold/10 bg-gold/5">
                        <div className={`w-1.5 h-1.5 rounded-full ${webhook.isActive ? 'bg-gold animate-pulse' : 'bg-slate-500'}`} />
                        <span className="text-[9px] font-black text-gold uppercase tracking-widest">{webhook.isActive ? 'OPERATIONAL' : 'OFFLINE'}</span>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-3">
                          <button onClick={() => startEdit(webhook)} className="p-2 text-gold-light/30 hover:text-gold transition-colors rounded-lg hover:bg-gold/10">
                            <Edit className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleDeleteWebhook(webhook.id)} className="p-2 text-gold-light/30 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </section>section

          {isAdmin && (
            <div className="pt-12 flex justify-end items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-gold-deep font-black tracking-widest uppercase mb-1">Status Report</span>
                <span className="text-xs text-gold-light/40 font-bold italic">Protocols are autonomously synchronized in real-time.</span>
              </div>
              <ShieldCheck className="w-10 h-10 text-gold/40" />
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
