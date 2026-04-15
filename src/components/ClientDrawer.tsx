import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { X, Phone, Mail, Building, Star, Calendar, Clock, FileText, CheckCircle, Activity, CheckSquare, Send, Play } from 'lucide-react';
import { format } from 'date-fns';

export default function ClientDrawer() {
  const { selectedClient, isClientDrawerOpen, setClientDrawerOpen, token, activeCall } = useAppStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [clientDetails, setClientDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Note State
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Meeting State
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [isSavingMeeting, setIsSavingMeeting] = useState(false);

  // Email State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    if (selectedClient && isClientDrawerOpen) {
      setLoading(true);
      fetch(`/api/clients/${selectedClient.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setClientDetails(data);
          setLoading(false);
        })
        .catch(console.error);
    }
  }, [selectedClient, isClientDrawerOpen, token]);

  if (!isClientDrawerOpen || !selectedClient) return null;

  const handleCall = async () => {
    if (!clientDetails?.phone || activeCall) return;
    try {
      await fetch('/api/calls/outbound', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phoneNumber: clientDetails.phone, clientId: clientDetails.id })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveNote = async () => {
    if (!newNote.trim()) return;
    setIsSavingNote(true);
    try {
      const res = await fetch(`/api/clients/${clientDetails.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newNote, noteType })
      });
      if (res.ok) {
        const savedNote = await res.json();
        setClientDetails({
          ...clientDetails,
          notes: [savedNote, ...(clientDetails.notes || [])]
        });
        setNewNote('');
        setNoteType('general');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingDate || !meetingTitle) return;
    setIsSavingMeeting(true);
    try {
      const res = await fetch(`/api/clients/${clientDetails.id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: meetingTitle,
          dueAt: (meetingDate && !isNaN(new Date(meetingDate).getTime())) ? new Date(meetingDate).toISOString() : new Date().toISOString(),
          taskType: 'meeting'
        })
      });
      if (res.ok) {
        const savedTask = await res.json();
        setClientDetails({
          ...clientDetails,
          tasks: [savedTask, ...(clientDetails.tasks || [])]
        });
        setIsMeetingModalOpen(false);
        setMeetingTitle('');
        setMeetingDate('');
        setActiveTab('tasks');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingMeeting(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSubject || !emailBody) return;
    setIsSendingEmail(true);
    try {
      // Simulate sending email and log it as a note
      const res = await fetch(`/api/clients/${clientDetails.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          content: `Email Sent:\nSubject: ${emailSubject}\n\n${emailBody}`, 
          noteType: 'general' 
        })
      });
      if (res.ok) {
        const savedNote = await res.json();
        setClientDetails({
          ...clientDetails,
          notes: [savedNote, ...(clientDetails.notes || [])]
        });
        setIsEmailModalOpen(false);
        setEmailSubject('');
        setEmailBody('');
        setActiveTab('notes');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'notes', name: 'Notes' },
    { id: 'tasks', name: 'Tasks' },
    { id: 'calls', name: 'Calls' },
    { id: 'predictions', name: 'AI Insights' }
  ];

  return (
    <>
      <div 
        className="fixed inset-0 bg-navy/60 backdrop-blur-md z-40 transition-opacity duration-500"
        onClick={() => setClientDrawerOpen(false)}
      />
      <div className="fixed inset-y-0 right-0 w-[550px] bg-navy/40 backdrop-blur-3xl border-l border-gold/30 shadow-2xl z-50 flex flex-col transform transition-transform duration-500 ease-in-out relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent pointer-events-none" />
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gold/10 flex justify-between items-start bg-navy/40 relative overflow-hidden group">
          <img src="/assets/@digitalgrowthgurus (1).jpg" className="absolute -right-4 -top-4 w-32 h-32 opacity-5 rotate-12 pointer-events-none group-hover:opacity-10 transition-opacity duration-1000" alt="" />
          <div className="flex gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-light via-gold to-gold-deep border border-gold/40 flex items-center justify-center text-navy text-2xl font-black shadow-[0_0_20px_rgba(212,175,55,0.4)]">
              {selectedClient.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-black text-pearl tracking-tighter italic gold-text-gradient uppercase">{selectedClient.name}</h2>
              <div className="flex items-center gap-4 mt-1 text-[10px] font-black uppercase tracking-widest text-gold-light/40">
                <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-gold/60" /> {selectedClient.company || 'Private Asset'}</span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gold/10 border border-gold/20 text-gold shimmer-text"><Star className="w-3 h-3 fill-gold" /> Rank: {selectedClient.score}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setClientDrawerOpen(false)}
            className="p-2 hover:bg-gold/10 rounded-xl transition-all duration-300 border border-transparent hover:border-gold/20 text-gold/40 hover:text-gold relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="px-6 py-3 border-b border-gold/10 flex gap-3 bg-navy/20 relative z-10">
          <button 
            onClick={handleCall}
            disabled={!!activeCall}
            className="flex-1 luxury-button py-2 flex items-center justify-center gap-2 text-xs transition-all disabled:opacity-30 disabled:grayscale"
          >
            <Phone className="w-4 h-4" /> Call Now
          </button>
          <button 
            onClick={() => setIsEmailModalOpen(true)}
            className="flex-1 bg-gold/5 border border-gold/20 hover:border-gold/40 text-gold-light py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all hover:bg-gold/10"
          >
            <Mail className="w-4 h-4" /> Email
          </button>
          <button 
            onClick={() => setIsMeetingModalOpen(true)}
            className="flex-1 bg-gold/5 border border-gold/20 hover:border-gold/40 text-gold-light py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all hover:bg-gold/10"
          >
            <Calendar className="w-4 h-4" /> Meeting
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gold/10 bg-navy/20 relative z-10">
          <nav className="flex gap-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 text-[10px] font-black uppercase tracking-[0.2em] border-b border-transparent transition-all relative ${
                  activeTab === tab.id 
                    ? 'text-gold' 
                    : 'text-gold-light/20 hover:text-gold-light'
                }`}
              >
                {tab.name}
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="drawer-tab"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold shadow-[0_0_10px_rgba(212,175,55,0.8)]"
                  />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-navy/10 p-4 custom-scrollbar relative z-10">
          {loading ? (
            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold/40"></div></div>
          ) : !clientDetails ? (
            <div className="text-center py-10 text-gold-light/20 font-black uppercase tracking-widest text-[10px] italic">Failed to synchronise asset details</div>
          ) : (
            <div className="space-y-4">
              
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <>
                  <div className="luxury-card-gold p-4 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-gold/10 transition-colors" />
                    <h3 className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                       <CheckCircle className="w-3.5 h-3.5" /> Contact Information
                    </h3>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-6 relative z-10">
                      {[
                        { label: 'Coordinates (Phone)', value: clientDetails.phone },
                        { label: 'Digital Identity (Email)', value: clientDetails.email || '--' },
                        { label: 'Regional Sector (City)', value: clientDetails.city || '--' },
                        { label: 'Matter Category', value: clientDetails.matterType || '--' },
                        { label: 'Acquisition Source', value: clientDetails.source || '--' },
                        { label: 'Assigned Executor', value: clientDetails.assignedAgent?.user?.name || 'Unassigned' },
                      ].map((item) => (
                        <div key={item.label}>
                          <span className="block text-[8px] font-black text-gold-light/30 uppercase tracking-widest mb-1">{item.label}</span>
                          <span className="text-[11px] font-black text-pearl italic tracking-tight">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="luxury-card-gold p-4 relative overflow-hidden group">
                    <h3 className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                       <Activity className="w-3.5 h-3.5" /> Pipeline Status
                    </h3>
                    <div className="flex items-center justify-between mb-3 relative z-10">
                      <span className="text-[10px] font-black text-pearl/60 uppercase tracking-widest">Current Stage</span>
                      <span className="px-3 py-1 bg-gold/10 text-gold rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border border-gold/20 shimmer-text">{clientDetails.stage}</span>
                    </div>
                    {/* Visual Pipeline */}
                    <div className="flex h-1.5 bg-navy rounded-full overflow-hidden border border-gold/10 relative z-10">
                      <div className="w-1/3 bg-gradient-to-r from-gold via-gold-light to-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]"></div>
                    </div>
                  </div>
                </>
              )}

              {/* NOTES TAB */}
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <div className="luxury-card-gold p-3 border-gold/40">
                    <textarea 
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Append secure transmission note..." 
                      className="w-full bg-transparent border-0 focus:ring-0 p-0 text-xs text-pearl resize-none placeholder:text-gold-light/10 italic"
                      rows={2}
                    />
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gold/10">
                      <select 
                        value={noteType}
                        onChange={(e) => setNoteType(e.target.value)}
                        className="text-[9px] font-black uppercase tracking-widest bg-navy/40 border-gold/20 rounded-lg py-1 pl-2 pr-8 text-gold-light outline-none focus:border-gold/50"
                      >
                        <option value="general">Protocol Note</option>
                        <option value="objection">Resistance Encountered</option>
                        <option value="pricing">Value Conflict</option>
                      </select>
                      <button 
                        onClick={handleSaveNote}
                        disabled={isSavingNote || !newNote.trim()}
                        className="luxury-button py-1.5 px-4 text-[9px] font-black flex items-center gap-2"
                      >
                        <Send className="w-3.5 h-3.5" /> {isSavingNote ? 'Syncing...' : 'Sync Note'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {clientDetails.notes?.map((note: any) => (
                      <div key={note.id} className="luxury-card p-3 border-gold/10 group hover:border-gold/30 transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center text-[8px] font-black text-gold uppercase">
                              {note.agent?.user?.name?.charAt(0) || '?'}
                            </div>
                            <span className="text-[9px] font-black text-pearl/80 uppercase tracking-widest">{note.agent?.user?.name || 'NODE'}</span>
                            <span className="text-[8px] text-gold-light/20 font-black">• {note.createdAt && !isNaN(new Date(note.createdAt).getTime()) ? format(new Date(note.createdAt), 'MMM d, h:mm a') : 'Recent'}</span>
                          </div>
                          <span className="text-[7px] px-1.5 py-0.5 bg-gold/5 border border-gold/10 rounded text-gold-light/40 uppercase tracking-[0.2em] font-black italic">{note.noteType}</span>
                        </div>
                        <p className="text-[10px] text-pearl/70 leading-relaxed font-medium">{note.content}</p>
                      </div>
                    ))}
                    {clientDetails.notes?.length === 0 && <p className="text-center text-gold-light/10 text-[9px] font-black uppercase tracking-widest py-4 italic">No protocol logs found.</p>}
                  </div>
                </div>
              )}

              {/* TASKS TAB */}
              {activeTab === 'tasks' && (
                <div className="space-y-4">
                  <div className="luxury-card-gold p-3 border-gold/40">
                    <h4 className="text-[9px] font-black text-gold uppercase tracking-[0.3em] mb-3">Schedule Task</h4>
                    <form onSubmit={handleScheduleMeeting} className="space-y-2">
                      <input 
                        required
                        type="text"
                        value={meetingTitle}
                        onChange={e => setMeetingTitle(e.target.value)}
                        placeholder="Task designation..."
                        className="w-full bg-navy/40 border border-gold/20 rounded-lg p-2 text-xs text-pearl focus:border-gold/50 outline-none"
                      />
                      <div className="flex gap-2">
                        <input 
                          required
                          type="datetime-local"
                          value={meetingDate}
                          onChange={e => setMeetingDate(e.target.value)}
                          className="flex-1 bg-navy/40 border border-gold/20 rounded-lg p-2 text-[10px] text-pearl focus:border-gold/50 outline-none"
                        />
                        <button 
                          type="submit"
                          disabled={isSavingMeeting || !meetingTitle || !meetingDate}
                          className="luxury-button px-4 text-[9px] font-black whitespace-nowrap"
                        >
                          {isSavingMeeting ? 'Assigning...' : 'Assign'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {clientDetails.tasks?.length === 0 ? (
                    <p className="text-center text-gold-light/10 text-[9px] font-black uppercase tracking-widest py-4 italic">No pending assignments.</p>
                  ) : (
                    clientDetails.tasks?.map((task: any) => (
                      <div key={task.id} className="luxury-card p-3 border-gold/10 flex items-start gap-3">
                        <CheckSquare className={`w-4 h-4 mt-0.5 ${task.status === 'COMPLETED' ? 'text-gold' : 'text-gold-light/20'}`} />
                        <div className="flex-1">
                          <h4 className={`text-[10px] font-black uppercase tracking-widest ${task.status === 'COMPLETED' ? 'text-gold-light/20 line-through' : 'text-pearl'}`}>
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-3 mt-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-gold-light/30">
                            <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {task.dueAt && !isNaN(new Date(task.dueAt).getTime()) ? format(new Date(task.dueAt), 'MMM d, h:mm a') : 'TBD'}</span>
                            <span className="text-gold italic">{task.taskType}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* CALLS TAB */}
              {activeTab === 'calls' && (
                <div className="space-y-4">
                  {clientDetails.calls?.length === 0 ? (
                    <p className="text-center text-gold-light/10 text-[9px] font-black uppercase tracking-widest py-4 italic">No transmission history.</p>
                  ) : (
                    clientDetails.calls?.map((call: any) => (
                      <div key={call.id} className="luxury-card p-3 border-gold/10 flex items-center justify-between group hover:border-gold/30 transition-all">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg border ${call.direction === 'INBOUND' ? 'bg-gold/10 text-gold border-gold/30' : 'bg-gold-light/10 text-gold-light border-gold-light/20'}`}>
                            <Phone className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-[10px] font-black text-pearl uppercase tracking-widest">{call.direction} CALL</div>
                            <div className="text-[8px] text-gold-light/30 font-black flex items-center gap-2 mt-0.5 uppercase tracking-widest">{call.startedAt && !isNaN(new Date(call.startedAt).getTime()) ? format(new Date(call.startedAt), 'MMM d, h:mm a') : 'Static Log'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {call.recordingUrl && (
                            <a 
                              href={call.recordingUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 bg-gold/10 text-gold rounded-lg hover:bg-gold/20 transition-all border border-gold/20"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </a>
                          )}
                          <div className="text-right">
                            <div className="text-[10px] font-black text-pearl italic">{call.duration ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : '-'}</div>
                            <div className="text-[8px] font-black text-gold uppercase tracking-[0.2em] shimmer-text">{call.status}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* PREDICTIONS TAB */}
              {activeTab === 'predictions' && clientDetails.predictions?.[0] && (
                <div className="space-y-4">
                  <div className="luxury-card-gold p-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-transparent opacity-50" />
                    <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-gold/40 to-transparent" />
                    
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                      <Activity className="w-5 h-5 text-gold animate-pulse" />
                      <h3 className="text-xs font-black text-gold uppercase tracking-[0.3em] italic">AI Asset Analysis</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 mb-6 relative z-10">
                      <div>
                        <span className="block text-gold-light/40 text-[9px] font-black uppercase tracking-widest mb-1.5">Conversion Matrix</span>
                        <div className="text-4xl font-black text-pearl italic tracking-tighter shimmer-text">{clientDetails.predictions[0].score}/<span className="text-lg opacity-30 italic">100</span></div>
                      </div>
                      <div>
                        <span className="block text-gold-light/40 text-[9px] font-black uppercase tracking-widest mb-1.5">Urgency Pulse</span>
                        <div className="text-lg font-black text-gold-light italic uppercase tracking-widest">{clientDetails.predictions[0].urgency}</div>
                      </div>
                    </div>

                    <div className="bg-navy/40 border border-gold/20 rounded-xl p-4 relative z-10 backdrop-blur-md">
                      <span className="block text-gold/60 text-[8px] font-black uppercase tracking-[0.3em] mb-2">Recommended Strategy</span>
                      <p className="font-black text-pearl italic text-sm tracking-tight leading-relaxed">"{clientDetails.predictions[0].recommendation}"</p>
                    </div>
                  </div>

                  <div className="luxury-card-gold p-4 relative overflow-hidden group">
                    <h3 className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                       <CheckCircle className="w-3.5 h-3.5" /> Predictive Factors
                    </h3>
                    <ul className="space-y-3 relative z-10">
                      {JSON.parse(clientDetails.predictions[0].reasonJson).map((reason: string, i: number) => (
                        <li key={i} className="flex items-start gap-4 text-[10px] font-bold text-pearl/80 italic group/item">
                          <div className="mt-1 w-1.5 h-1.5 rounded-full bg-gold/40 border border-gold shadow-[0_0_8px_rgba(212,175,55,0.6)] shrink-0 group-hover/item:scale-125 transition-transform" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      {isMeetingModalOpen && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-md flex items-center justify-center z-[60] transition-all duration-500">
          <div className="luxury-card-gold w-[400px] overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent pointer-events-none" />
            <div className="px-6 py-4 border-b border-gold/10 flex justify-between items-center bg-navy/40 relative z-10">
              <h3 className="text-xs font-black text-gold uppercase tracking-[0.3em] shimmer-text">Schedule Meeting</h3>
              <button onClick={() => setIsMeetingModalOpen(false)} className="text-gold/40 hover:text-gold transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleScheduleMeeting} className="p-6 space-y-4 relative z-10">
              <div>
                <label className="block text-[10px] font-black text-gold-light/40 uppercase tracking-widest mb-2">Meeting Title *</label>
                <input 
                  required
                  type="text"
                  value={meetingTitle}
                  onChange={e => setMeetingTitle(e.target.value)}
                  placeholder="e.g. Asset Valuation"
                  className="w-full bg-navy/40 border border-gold/20 rounded-xl p-2.5 text-xs text-pearl focus:border-gold/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gold-light/40 uppercase tracking-widest mb-2">Timestamp *</label>
                <input 
                  required
                  type="datetime-local"
                  value={meetingDate}
                  onChange={e => setMeetingDate(e.target.value)}
                  className="w-full bg-navy/40 border border-gold/20 rounded-xl p-2.5 text-xs text-pearl focus:border-gold/50 outline-none"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsMeetingModalOpen(false)}
                  className="px-4 py-2 text-[10px] font-black text-gold/40 hover:text-gold uppercase tracking-widest"
                >
                  Terminate
                </button>
                <button 
                  type="submit"
                  disabled={isSavingMeeting}
                  className="luxury-button px-6 py-2 text-[10px] font-black"
                >
                  {isSavingMeeting ? 'Scheduling...' : 'Schedule Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Send Email Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-md flex items-center justify-center z-[60] transition-all duration-500">
          <div className="luxury-card-gold w-[550px] overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent pointer-events-none" />
            <div className="px-6 py-4 border-b border-gold/10 flex justify-between items-center bg-navy/40 relative z-10">
              <h3 className="text-xs font-black text-gold uppercase tracking-[0.3em] shimmer-text">Encrypted Dispatch to {clientDetails?.name}</h3>
              <button onClick={() => setIsEmailModalOpen(false)} className="text-gold/40 hover:text-gold transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSendEmail} className="p-6 space-y-4 relative z-10">
              <div>
                <label className="block text-[10px] font-black text-gold-light/40 uppercase tracking-widest mb-2">Target Asset</label>
                <input 
                  type="email"
                  value={clientDetails?.email || ''}
                  disabled
                  className="w-full bg-navy/20 border border-gold/10 rounded-xl p-2.5 text-xs text-gold-light/40 italic"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gold-light/40 uppercase tracking-widest mb-2">Subject *</label>
                <input 
                  required
                  type="text"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  placeholder="Dispatch identifier..."
                  className="w-full bg-navy/40 border border-gold/20 rounded-xl p-2.5 text-xs text-pearl focus:border-gold/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gold-light/40 uppercase tracking-widest mb-2">Transmission Message *</label>
                <textarea 
                  required
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  rows={6}
                  className="w-full bg-navy/40 border border-gold/20 rounded-xl p-2.5 text-xs text-pearl focus:border-gold/50 outline-none resize-none custom-scrollbar"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2 text-[10px] font-black text-gold/40 hover:text-gold uppercase tracking-widest"
                >
                  Abort
                </button>
                <button 
                  type="submit"
                  disabled={isSendingEmail || !clientDetails?.email}
                  className="luxury-button px-8 py-2 text-[10px] font-black flex items-center gap-2"
                >
                  <Send className="w-4 h-4" /> {isSendingEmail ? 'Dispatching...' : 'Send Transmission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
