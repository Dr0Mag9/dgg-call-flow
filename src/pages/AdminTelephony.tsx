import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Phone, Smartphone, Plus, Trash2, Signal, Shield, Key, ExternalLink, Activity, Save, X, Sparkles, Zap, Cpu, Radio, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminTelephony() {
  const { token } = useAppStore();
  const [lines, setLines] = useState<any[]>([]);
  const [gateways, setGateways] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Modals / Forms
  const [isAddingLine, setIsAddingLine] = useState(false);
  const [isAddingGateway, setIsAddingGateway] = useState(false);
  const [lastCreatedKey, setLastCreatedKey] = useState<string | null>(null);
  const [lineFormData, setLineFormData] = useState({ number: '', providerType: 'GATEWAY', gatewayId: '', providerRef: '' });
  const [gwName, setGwName] = useState('');

  const fetchData = async () => {
    try {
      const [linesRes, gwRes, settingsRes] = await Promise.all([
        fetch('/api/admin/telephony-lines', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/gateways', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/settings/system', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      setLines(await linesRes.json());
      setGateways(await gwRes.json());
      setSystemSettings(await settingsRes.json());
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const updateSystemSetting = async (key: string, value: any) => {
    await fetch('/api/settings/system', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ key, value })
    });
    fetchData();
  };

  const handleCreateLine = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/telephony-lines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(lineFormData)
    });
    if (res.ok) {
      setIsAddingLine(false);
      setLineFormData({ number: '', providerType: 'GATEWAY', gatewayId: '', providerRef: '' });
      fetchData();
    }
  };

  const handleDeleteLine = async (id: string) => {
    if (!confirm('Delete this line?')) return;
    await fetch(`/api/admin/telephony-lines/${id}`, {
      method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchData();
  };

  const handleCreateGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/gateways', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: gwName })
    });
    if (res.ok) {
      const data = await res.json();
      setLastCreatedKey(data.apiKey);
      fetchData();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const verifyGateway = (gw: any) => {
    fetchData();
  };

  const handleDeleteGateway = async (id: string) => {
    if (!confirm('Delete this gateway? This will unlink any associated lines.')) return;
    await fetch(`/api/admin/gateways/${id}`, {
      method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchData();
  };

  if (loading) return (
    <div className="p-24 text-center">
      <Sparkles className="w-12 h-12 text-gold animate-spin mx-auto mb-6 opacity-20" />
      <span className="text-gold-light/30 font-black uppercase tracking-[0.3em] text-sm">Synchronizing Telephony Suite...</span>
    </div>
  );

  return (
    <div className="space-y-10 pb-12">
      <div className="flex justify-between items-center px-2">
        <div>
          <h2 className="text-xl font-black text-pearl tracking-tight font-serif italic uppercase underline decoration-gold/30">Telephony Nexus</h2>
          <p className="text-gold-light/40 text-[9px] font-black uppercase tracking-[0.3em] mt-0.5">Global Infrastructure Control</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-gold/5 border border-gold/20 rounded-xl block">
          <ShieldCheck className="w-4 h-4 text-gold" />
          <span className="text-[9px] font-black text-gold-light uppercase tracking-widest">Protocol Encryption Active</span>
        </div>
      </div>

      {/* Global SIP Settings */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="luxury-card p-6 bg-navy/20 border-gold/10 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-[100px] rounded-full -mr-32 -mt-32" />
        <h3 className="text-[10px] font-black text-pearl mb-6 flex items-center gap-4 uppercase tracking-[0.3em]">
          <div className="p-2 bg-gold/10 rounded-lg border border-gold/20">
            <Cpu className="w-4 h-4 text-gold" />
          </div>
          Core SIP Protocol Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-[8px] font-black text-gold/40 uppercase tracking-widest ml-1">SIP Master WSS URL</label>
            <input 
              type="text" 
              className="w-full bg-navy/40 border border-gold/10 rounded-xl p-2.5 text-xs text-pearl focus:ring-1 focus:ring-gold/30 focus:border-gold/30 outline-none transition-all placeholder:text-gold-light/10 italic" 
              defaultValue={systemSettings.sip_wss_url}
              onBlur={(e) => updateSystemSetting('sip_wss_url', e.target.value)}
              placeholder="wss://sip.vault.com:443"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[8px] font-black text-gold/40 uppercase tracking-widest ml-1">SIP Master Domain/Proxy</label>
            <input 
              type="text" 
              className="w-full bg-navy/40 border border-gold/10 rounded-xl p-2.5 text-xs text-pearl focus:ring-1 focus:ring-gold/30 focus:border-gold/30 outline-none transition-all placeholder:text-gold-light/10 italic" 
              defaultValue={systemSettings.sip_domain}
              onBlur={(e) => updateSystemSetting('sip_domain', e.target.value)}
              placeholder="sip.vault.com"
            />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* Gateway Devices Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-sm font-black text-pearl flex items-center gap-4 uppercase tracking-[0.2em]">
              <div className="p-2 bg-gold/10 rounded-lg">
                <Smartphone className="w-4 h-4 text-gold" />
              </div>
              Android SIM Pro-Gateways
            </h3>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAddingGateway(true)}
              className="luxury-button text-[9px] py-2 px-4 flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" /> Initialize Device
            </motion.button>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="luxury-card overflow-hidden border-gold/10 flex flex-col h-[350px]"
          >
            <div className="overflow-x-auto flex-1 custom-scrollbar">
              <table className="min-w-full divide-y divide-gold/10">
                <thead className="bg-navy/60">
                  <tr>
                    <th className="px-6 py-3 text-left text-[8px] font-black text-gold-light/20 uppercase tracking-[0.2em]">Model</th>
                    <th className="px-6 py-3 text-left text-[8px] font-black text-gold-light/20 uppercase tracking-[0.2em]">Signal</th>
                    <th className="px-6 py-3 text-left text-[8px] font-black text-gold-light/20 uppercase tracking-[0.2em]">Key</th>
                    <th className="px-6 py-3 relative"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/5 bg-navy/10">
                  {gateways.length === 0 ? (
                    <tr><td colSpan={4} className="px-8 py-10 text-center text-gold-light/10 italic text-[10px]">No operational gateways.</td></tr>
                  ) : (
                    gateways.map((gw, i) => (
                      <motion.tr 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        key={gw.id} 
                        className="hover:bg-gold/5 transition-all group"
                      >
                        <td className="px-6 py-4 text-[10px] font-black text-pearl uppercase tracking-widest italic">{gw.name}</td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border ${gw.status === 'ONLINE' ? 'bg-gold/10 text-gold border-gold/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                            <Signal className={`w-2.5 h-2.5 ${gw.status === 'ONLINE' ? 'animate-pulse' : ''}`} /> 
                            <span className="text-[8px] font-black uppercase tracking-widest">{gw.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-[8px] text-gold-light/20 italic">
                          <div className="flex items-center gap-2">
                            {gw.apiKey.substring(0, 8)}...
                            <button onClick={() => copyToClipboard(gw.apiKey)} className="hover:text-gold transition-colors">
                              <Plus className="w-2.5 h-2.5 rotate-45" /> 
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right space-x-3">
                          <button onClick={() => handleDeleteGateway(gw.id)} className="text-red-400/20 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-gold/5 border-t border-gold/10 flex items-center justify-between">
              <span className="text-[8px] font-black text-gold/20 uppercase tracking-widest">Gateway Flux: Optimised</span>
              <Radio className="w-3 h-3 text-gold/30 animate-pulse" />
            </div>
          </motion.div>
        </div>

        {/* Telephony Lines Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-sm font-black text-pearl flex items-center gap-4 uppercase tracking-[0.2em]">
              <div className="p-2 bg-gold/10 rounded-lg">
                <Phone className="w-4 h-4 text-gold" />
              </div>
              Strategic Business Channels
            </h3>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAddingLine(true)}
              className="luxury-button text-[9px] py-2 px-4 flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" /> Allocate Line
            </motion.button>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="luxury-card overflow-hidden border-gold/10 flex flex-col h-[350px]"
          >
            <div className="overflow-x-auto flex-1 custom-scrollbar">
              <table className="min-w-full divide-y divide-gold/10">
                <thead className="bg-navy/60">
                  <tr>
                    <th className="px-6 py-3 text-left text-[8px] font-black text-gold-light/20 uppercase tracking-[0.2em]">Transaction Number</th>
                    <th className="px-6 py-3 text-left text-[8px] font-black text-gold-light/20 uppercase tracking-[0.2em]">Link</th>
                    <th className="px-6 py-3 relative"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/5 bg-navy/10">
                   {lines.length === 0? (
                     <tr><td colSpan={3} className="px-8 py-10 text-center text-gold-light/10 italic text-[10px]">No registered channels.</td></tr>
                   ) : (
                     lines.map((line, i) => (
                      <motion.tr 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        key={line.id} 
                        className="hover:bg-gold/5 transition-all group"
                      >
                        <td className="px-6 py-4 text-[11px] font-black text-pearl tracking-[0.1em]">{line.number}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                            <span className="text-[9px] font-black text-gold/60 uppercase tracking-widest truncate max-w-[80px]">
                              {line.gateway?.name || 'CLOUD'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleDeleteLine(line.id)} className="text-red-400/20 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </motion.tr>
                     ))
                   )}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-gold/5 border-t border-gold/10 flex items-center justify-between">
              <span className="text-[8px] font-black text-gold/20 uppercase tracking-widest">Channels Active: {lines.length}</span>
              <Shield className="w-3 h-3 text-gold/30" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isAddingGateway && (
          <div className="fixed inset-0 flex items-center justify-center p-6 z-[200]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsAddingGateway(false); setLastCreatedKey(null); }} className="absolute inset-0 bg-navy/90 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-navy border border-gold/30 rounded-3xl p-10 w-full max-w-lg shadow-[0_0_50px_rgba(212,175,55,0.15)] relative z-10">
              {!lastCreatedKey ? (
                <>
                  <h3 className="text-xl font-black text-pearl mb-8 uppercase tracking-[0.2em] flex items-center gap-4">
                    <Smartphone className="w-6 h-6 text-gold" />
                    Initialize Gateway
                  </h3>
                  <form onSubmit={handleCreateGateway} className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-gold/40 uppercase tracking-widest ml-1">Device Alias</label>
                      <input required type="text" className="w-full bg-navy/50 border border-gold/10 rounded-xl p-4 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all" value={gwName} onChange={e => setGwName(e.target.value)} placeholder="e.g. Nexus-01-Global" />
                    </div>
                    <div className="flex justify-end gap-6 pt-4 items-center">
                      <button type="button" onClick={() => setIsAddingGateway(false)} className="text-[10px] font-black text-gold-light/20 hover:text-gold-light uppercase tracking-widest transition-colors">Terminate</button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" className="luxury-button py-4 px-10 text-xs">Authorize Protocol</motion.button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="text-center py-6">
                  <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }} className="w-20 h-20 bg-gold/10 text-gold rounded-full flex items-center justify-center mx-auto mb-8 border border-gold/40 shadow-xl shadow-gold/10">
                    <Activity className="w-10 h-10" />
                  </motion.div>
                  <h3 className="text-2xl font-black text-pearl mb-4 tracking-tight uppercase tracking-widest">Access Granted</h3>
                  <p className="text-gold-light/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-10">Deploy this cryptographic key to the target unit.</p>
                  
                  <div className="bg-gold/5 p-6 rounded-2xl font-mono text-xs break-all border border-gold/20 mb-10 flex items-center justify-between gap-4 shadow-inner">
                    <span className="text-gold-light/80 select-all">{lastCreatedKey}</span>
                    <button 
                      onClick={() => copyToClipboard(lastCreatedKey)}
                      className="p-2 hover:bg-gold/10 rounded-xl text-gold shrink-0 transition-all"
                      title="Copy Terminal Key"
                    >
                      <Save className="w-5 h-5" />
                    </button>
                  </div>

                  <button 
                    onClick={() => {
                      setIsAddingGateway(false);
                      setLastCreatedKey(null);
                      setGwName('');
                    }}
                    className="luxury-button w-full py-5 text-sm"
                  >
                    DEPLOYMENT COMPLETE
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddingLine && (
          <div className="fixed inset-0 flex items-center justify-center p-6 z-[200]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingLine(false)} className="absolute inset-0 bg-navy/90 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-navy border border-gold/30 rounded-3xl p-10 w-full max-w-xl shadow-[0_0_50px_rgba(212,175,55,0.15)] relative z-10">
              <h3 className="text-xl font-black text-pearl mb-8 uppercase tracking-[0.2em] flex items-center gap-4">
                <Zap className="w-6 h-6 text-gold" />
                Strategic Allocation
              </h3>
              <form onSubmit={handleCreateLine} className="space-y-6">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gold/40 uppercase tracking-widest ml-1">Terminal Number</label>
                    <input required type="text" className="w-full bg-navy/50 border border-gold/10 rounded-xl p-4 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all placeholder:text-gold-light/10" value={lineFormData.number} onChange={e => setLineFormData({...lineFormData, number: e.target.value})} placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gold/40 uppercase tracking-widest ml-1">Protocol Type</label>
                    <select className="w-full bg-navy/50 border border-gold/10 rounded-xl p-4 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all cursor-pointer appearance-none" value={lineFormData.providerType} onChange={e => setLineFormData({...lineFormData, providerType: e.target.value})}>
                      <option value="GATEWAY">SIM Transceiver (Android)</option>
                      <option value="SIP">Virtual Trunk (Cloud)</option>
                    </select>
                  </div>
                </div>
                
                {lineFormData.providerType === 'GATEWAY' ? (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gold/40 uppercase tracking-widest ml-1">Link to Operational Nexus</label>
                    <select required className="w-full bg-navy/50 border border-gold/10 rounded-xl p-4 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all cursor-pointer appearance-none" value={lineFormData.gatewayId} onChange={e => setLineFormData({...lineFormData, gatewayId: e.target.value})}>
                      <option value="">Awaiting Nexus Verification...</option>
                      {gateways.map(g => <option key={g.id} value={g.id}>{g.name} ({g.status})</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gold/40 uppercase tracking-widest ml-1">Cloud SIP Identifier</label>
                    <input required type="text" className="w-full bg-navy/50 border border-gold/10 rounded-xl p-4 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all placeholder:text-gold-light/10" value={lineFormData.providerRef} onChange={e => setLineFormData({...lineFormData, providerRef: e.target.value})} placeholder="e.g. 1001-A" />
                  </div>
                )}

                <div className="flex justify-end gap-6 pt-6 items-center">
                  <button type="button" onClick={() => setIsAddingLine(false)} className="text-[10px] font-black text-gold-light/20 hover:text-gold-light uppercase tracking-widest transition-colors">Decline Allocation</button>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" className="luxury-button py-4 px-10 text-xs text-white">Authorize Asset</motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
