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
          dueAt: new Date(meetingDate).toISOString(),
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
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={() => setClientDrawerOpen(false)}
      />
      <div className="fixed inset-y-0 right-0 w-[600px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-start bg-slate-50">
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold">
              {selectedClient.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedClient.name}</h2>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                <span className="flex items-center gap-1"><Building className="w-4 h-4" /> {selectedClient.company || 'No Company'}</span>
                <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500" /> Score: {selectedClient.score}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setClientDrawerOpen(false)}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="px-6 py-4 border-b border-gray-200 flex gap-3 bg-white">
          <button 
            onClick={handleCall}
            disabled={!!activeCall}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50"
          >
            <Phone className="w-5 h-5" /> Call Now
          </button>
          <button 
            onClick={() => setIsEmailModalOpen(true)}
            className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
          >
            <Mail className="w-5 h-5" /> Email
          </button>
          <button 
            onClick={() => setIsMeetingModalOpen(true)}
            className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors border border-gray-200"
          >
            <Calendar className="w-5 h-5" /> Meeting
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-200 bg-white">
          <nav className="flex gap-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {loading ? (
            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
          ) : !clientDetails ? (
            <div className="text-center py-10 text-gray-500">Failed to load details</div>
          ) : (
            <div className="space-y-6">
              
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Contact Information</h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                      <div>
                        <span className="block text-xs text-gray-500 mb-1">Phone</span>
                        <span className="text-sm font-medium text-gray-900">{clientDetails.phone}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500 mb-1">Email</span>
                        <span className="text-sm font-medium text-gray-900">{clientDetails.email || '--'}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500 mb-1">City</span>
                        <span className="text-sm font-medium text-gray-900">{clientDetails.city || '--'}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500 mb-1">Matter Type</span>
                        <span className="text-sm font-medium text-gray-900">{clientDetails.matterType || '--'}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500 mb-1">Source</span>
                        <span className="text-sm font-medium text-gray-900">{clientDetails.source || '--'}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500 mb-1">Assigned Agent</span>
                        <span className="text-sm font-medium text-gray-900">{clientDetails.assignedAgent?.user?.name || 'Unassigned'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Pipeline Status</h3>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-700">Current Stage</span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">{clientDetails.stage}</span>
                    </div>
                    {/* Visual Pipeline */}
                    <div className="flex h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="w-1/4 bg-blue-500"></div>
                    </div>
                  </div>
                </>
              )}

              {/* NOTES TAB */}
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <textarea 
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note..." 
                      className="w-full border-0 focus:ring-0 p-0 text-sm resize-none"
                      rows={3}
                    />
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                      <select 
                        value={noteType}
                        onChange={(e) => setNoteType(e.target.value)}
                        className="text-sm border-gray-300 rounded-md py-1 pl-2 pr-8"
                      >
                        <option value="general">General Note</option>
                        <option value="objection">Objection</option>
                        <option value="pricing">Pricing</option>
                      </select>
                      <button 
                        onClick={handleSaveNote}
                        disabled={isSavingNote || !newNote.trim()}
                        className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" /> {isSavingNote ? 'Saving...' : 'Save Note'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {clientDetails.notes?.map((note: any) => (
                      <div key={note.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">
                              {note.agent?.user?.name?.charAt(0) || '?'}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{note.agent?.user?.name || 'Unknown'}</span>
                            <span className="text-xs text-gray-500">• {format(new Date(note.createdAt), 'MMM d, h:mm a')}</span>
                          </div>
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600 uppercase tracking-wider font-medium">{note.noteType}</span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))}
                    {clientDetails.notes?.length === 0 && <p className="text-center text-gray-500 py-4">No notes yet.</p>}
                  </div>
                </div>
              )}

              {/* TASKS TAB */}
              {activeTab === 'tasks' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-semibold text-gray-900">Add Task</h4>
                    </div>
                    <form onSubmit={handleScheduleMeeting} className="space-y-3">
                      <input 
                        required
                        type="text"
                        value={meetingTitle}
                        onChange={e => setMeetingTitle(e.target.value)}
                        placeholder="Task title..."
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="flex gap-3">
                        <input 
                          required
                          type="datetime-local"
                          value={meetingDate}
                          onChange={e => setMeetingDate(e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button 
                          type="submit"
                          disabled={isSavingMeeting || !meetingTitle || !meetingDate}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                        >
                          {isSavingMeeting ? 'Adding...' : 'Add Task'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {clientDetails.tasks?.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No tasks scheduled.</p>
                  ) : (
                    clientDetails.tasks?.map((task: any) => (
                      <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-start gap-3">
                        <CheckSquare className={`w-5 h-5 mt-0.5 ${task.status === 'COMPLETED' ? 'text-green-500' : 'text-gray-400'}`} />
                        <div>
                          <h4 className={`text-sm font-medium ${task.status === 'COMPLETED' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(task.dueAt), 'MMM d, h:mm a')}</span>
                            <span className="uppercase tracking-wider font-medium">{task.taskType}</span>
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
                    <p className="text-center text-gray-500 py-4">No call history.</p>
                  ) : (
                    clientDetails.calls?.map((call: any) => (
                      <div key={call.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${call.direction === 'INBOUND' ? 'bg-indigo-100 text-indigo-600' : 'bg-purple-100 text-purple-600'}`}>
                            <Phone className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{call.direction} Call</div>
                            <div className="text-xs text-gray-500">{format(new Date(call.startedAt), 'MMM d, h:mm a')}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {call.recordingUrl && (
                            <a 
                              href={call.recordingUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                              title="Listen to recording"
                            >
                              <Play className="w-4 h-4 fill-current" />
                            </a>
                          )}
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">{call.duration ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : '-'}</div>
                            <div className="text-xs text-gray-500">{call.status}</div>
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
                  <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl shadow-sm p-6 text-white">
                    <div className="flex items-center gap-3 mb-6">
                      <Activity className="w-6 h-6 text-purple-300" />
                      <h3 className="text-lg font-semibold">AI Lead Analysis</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div>
                        <span className="block text-purple-200 text-sm mb-1">Conversion Score</span>
                        <div className="text-4xl font-bold">{clientDetails.predictions[0].score}/100</div>
                      </div>
                      <div>
                        <span className="block text-purple-200 text-sm mb-1">Urgency</span>
                        <div className="text-xl font-semibold text-red-300">{clientDetails.predictions[0].urgency}</div>
                      </div>
                    </div>

                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                      <span className="block text-purple-200 text-sm mb-2">Recommended Action</span>
                      <p className="font-medium text-lg">{clientDetails.predictions[0].recommendation}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Key Factors</h3>
                    <ul className="space-y-3">
                      {JSON.parse(clientDetails.predictions[0].reasonJson).map((reason: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                          <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-xl w-[400px] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Schedule Meeting</h3>
              <button onClick={() => setIsMeetingModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleScheduleMeeting} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title *</label>
                <input 
                  required
                  type="text"
                  value={meetingTitle}
                  onChange={e => setMeetingTitle(e.target.value)}
                  placeholder="e.g. Product Demo"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
                <input 
                  required
                  type="datetime-local"
                  value={meetingDate}
                  onChange={e => setMeetingDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsMeetingModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSavingMeeting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSavingMeeting ? 'Scheduling...' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Send Email Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-xl w-[500px] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Send Email to {clientDetails?.name}</h3>
              <button onClick={() => setIsEmailModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSendEmail} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input 
                  type="email"
                  value={clientDetails?.email || ''}
                  disabled
                  className="w-full border border-gray-300 rounded-lg p-2 bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <input 
                  required
                  type="text"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  placeholder="e.g. Follow-up on your case"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea 
                  required
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSendingEmail || !clientDetails?.email}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" /> {isSendingEmail ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
