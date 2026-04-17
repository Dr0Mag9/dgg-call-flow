import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { CheckCircle2, XCircle, Clock, User, MessageSquare, Calendar, ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CallDispositionScreen() {
  const { activeCall, setActiveCall, token } = useAppStore();
  const [outcome, setOutcome] = useState('Connected');
  const [notes, setNotes] = useState('');
  const [stageAfterCall, setStageAfterCall] = useState('');
  const [nextFollowUpAt, setNextFollowUpAt] = useState('');
  const [loading, setLoading] = useState(false);

  if (!activeCall || (activeCall.status !== 'ENDED' && activeCall.status !== 'REJECTED')) return null;

  const outcomes = [
    'Connected', 'No Answer', 'Busy', 'Callback Later', 
    'Interested', 'Not Interested', 'Wrong Number', 
    'Follow-Up Required', 'Closed Won', 'Closed Lost'
  ];

  const stages = [
    'New Lead', 'Consultation Scheduled', 'Contacted', 'Follow-Up', 
    'Case Review', 'Retainer Discussion', 'Converted', 'Lost', 'Not Reachable'
  ];

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`/api/calls/${activeCall.id}/disposition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          outcome,
          notes,
          stageAfterCall: stageAfterCall || undefined,
          nextFollowUpAt: nextFollowUpAt || undefined
        })
      });
      setActiveCall(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[110] p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-navy/80 backdrop-blur-md" 
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="luxury-card w-full max-w-lg overflow-hidden relative z-10 border-gold/30 shadow-[0_0_50px_rgba(212,175,55,0.15)]"
      >
        <div className="px-8 py-6 border-b border-gold/10 bg-gold/5 flex justify-between items-center relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gold/10 rounded-xl border border-gold/20">
              <CheckCircle2 className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h3 className="text-lg font-black text-pearl uppercase tracking-[0.2em]">Transaction Log</h3>
              <p className="text-[8px] text-gold-light/40 font-black uppercase tracking-[0.3em] mt-0.5 italic">Finalizing Protocol Transmission</p>
            </div>
          </div>
          <button onClick={() => setActiveCall(null)} className="p-2 hover:bg-gold/10 rounded-full text-gold-light/40 hover:text-gold transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Call Summary Bar */}
        <div className="bg-navy/40 px-8 py-4 flex items-center justify-between border-b border-gold/5">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-gold/5 border border-gold/20 flex items-center justify-center text-gold/60">
                <User className="w-4 h-4" />
             </div>
             <div>
               <p className="text-[10px] font-black text-gold/40 uppercase tracking-widest">Target Identity</p>
               <p className="text-sm font-bold text-pearl italic">{activeCall.client?.name || activeCall.phoneNumber}</p>
             </div>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black text-gold/40 uppercase tracking-widest flex items-center justify-end gap-1.5">
               <Clock className="w-3 h-3" /> Link Duration
             </p>
             <p className="text-sm font-black text-gold-light italic tracking-tight">{formatDuration(activeCall.duration)}</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-navy/20">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gold/40 uppercase tracking-widest ml-1">Strategic Outcome *</label>
              <div className="relative">
                <select 
                  required
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="w-full bg-navy/50 border border-gold/10 rounded-xl p-3.5 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all cursor-pointer appearance-none italic font-bold"
                >
                  {outcomes.map(o => <option key={o} value={o} className="bg-navy">{o}</option>)}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/40 rotate-90 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gold/40 uppercase tracking-widest ml-1 flex items-center justify-between">
                Protocol Observations
                <MessageSquare className="w-3 h-3 opacity-20" />
              </label>
              <textarea 
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-navy/50 border border-gold/10 rounded-xl p-3.5 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all placeholder:text-gold-light/10 italic text-sm"
                placeholder="Document transaction details..."
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gold/40 uppercase tracking-widest ml-1">Future Status</label>
                <div className="relative">
                  <select 
                    value={stageAfterCall}
                    onChange={(e) => setStageAfterCall(e.target.value)}
                    className="w-full bg-navy/50 border border-gold/10 rounded-xl p-3.5 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all cursor-pointer appearance-none text-xs font-bold italic"
                  >
                    <option value="" className="bg-navy">No change</option>
                    {stages.map(s => <option key={s} value={s} className="bg-navy">{s}</option>)}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/40 rotate-90 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gold/40 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Re-Link At
                </label>
                <input 
                  type="datetime-local"
                  value={nextFollowUpAt}
                  onChange={(e) => setNextFollowUpAt(e.target.value)}
                  className="w-full bg-navy/50 border border-gold/10 rounded-xl p-3.5 text-pearl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 outline-none transition-all text-xs font-bold"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-6 items-center border-t border-gold/5">
            <button 
              type="button"
              onClick={() => setActiveCall(null)}
              className="text-[10px] font-black text-gold-light/30 hover:text-gold-light uppercase tracking-widest transition-colors italic"
            >
              Skip Logging
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="luxury-button min-w-[180px] text-xs py-4 px-8 relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>{loading ? 'Committing...' : 'Commit Protocol'}</span>
              </div>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
