import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110]">
      <div className="bg-white rounded-2xl shadow-2xl w-[500px] overflow-hidden">
        <div className="bg-slate-900 p-6 text-white">
          <h2 className="text-xl font-bold">Call Disposition</h2>
          <p className="text-slate-300 text-sm mt-1 uppercase tracking-widest font-black">
            Log outcome for: <span className="text-gold-light italic">{activeCall?.client?.name || activeCall?.phoneNumber || 'Unknown Signal'}</span>
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Outcome *</label>
            <select 
              required
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {outcomes.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea 
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="What happened on the call?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Update Stage</label>
              <select 
                value={stageAfterCall}
                onChange={(e) => setStageAfterCall(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No change</option>
                {stages.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Next Follow-up</label>
              <input 
                type="datetime-local"
                value={nextFollowUpAt}
                onChange={(e) => setNextFollowUpAt(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button 
              type="button"
              onClick={() => setActiveCall(null)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Skip
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Disposition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
