import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Globe, Plus, Trash2, Edit, Save, X } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-100 overflow-hidden">
        <div className="p-6 space-y-8">
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Telephony Configuration</h3>
              {!isAdmin && <span className="px-2 py-1 bg-red-50 text-red-700 text-xs font-bold rounded border border-red-100">VIEW ONLY</span>}
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">SIP Provider WSS URL</label>
                <input 
                  disabled={!isAdmin} 
                  type="text" 
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500" 
                  defaultValue={systemSettings.sip_wss_url || ''} 
                  onBlur={(e) => updateSystemSetting('sip_wss_url', e.target.value)}
                  placeholder="wss://sip.example.com" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">SIP Domain / Proxy</label>
                <input 
                  disabled={!isAdmin} 
                  type="text" 
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500" 
                  defaultValue={systemSettings.sip_domain || ''} 
                  onBlur={(e) => updateSystemSetting('sip_domain', e.target.value)}
                  placeholder="sip.example.com" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Main Business Number</label>
                <input 
                  disabled={!isAdmin} 
                  type="text" 
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500" 
                  defaultValue={systemSettings.main_business_number || ''} 
                  onBlur={(e) => updateSystemSetting('main_business_number', e.target.value)}
                  placeholder="+15550000000" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">SIP Default Password</label>
                <input 
                  disabled={!isAdmin} 
                  type="password" 
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500" 
                  defaultValue={systemSettings.sip_default_password || ''} 
                  onBlur={(e) => updateSystemSetting('sip_default_password', e.target.value)}
                  placeholder="Password for SIP extensions" 
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Call Routing & Recording</h3>
              {!isAdmin && <span className="px-2 py-1 bg-red-50 text-red-700 text-xs font-bold rounded border border-red-100">VIEW ONLY</span>}
            </div>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input 
                    id="route_available" 
                    type="checkbox" 
                    disabled={!isAdmin}
                    checked={systemSettings.route_available === 'true'}
                    onChange={e => updateSystemSetting('route_available', e.target.checked)}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded disabled:opacity-50" 
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="route_available" className="font-medium text-gray-700">Route to longest idle agent</label>
                  <p className="text-gray-500">Incoming calls will be routed to the agent who has been waiting the longest.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input 
                    id="auto_record" 
                    type="checkbox" 
                    disabled={!isAdmin}
                    checked={systemSettings.auto_record === 'true'}
                    onChange={e => updateSystemSetting('auto_record', e.target.checked)}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded disabled:opacity-50" 
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="auto_record" className="font-medium text-gray-700">Auto Call Recording</label>
                  <p className="text-gray-500">Automatically record all calls for training and marketing purposes.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Web Integrations (Webhooks)</h3>
                <p className="text-sm text-gray-500">Send real-time data to external systems when events occur.</p>
              </div>
              {isAdmin && !isAdding && (
                <button 
                  onClick={() => setIsAdding(true)}
                  className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-100 font-medium text-sm"
                >
                  <Plus className="w-4 h-4" /> Add Webhook
                </button>
              )}
            </div>

            {isAdding && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-gray-900">{editingId ? 'Edit Webhook' : 'New Webhook'}</h4>
                  <button onClick={() => { setIsAdding(false); setEditingId(null); setFormData({ name: '', url: '', secret: '', events: '[]' }); }} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleSaveWebhook} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g., Zapier Integration" className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payload URL</label>
                      <input required type="url" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} placeholder="https://" className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Secret (Optional)</label>
                      <input type="text" value={formData.secret} onChange={e => setFormData({...formData, secret: e.target.value})} placeholder="Secret token for signature" className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Events</label>
                      <select 
                        value={formData.events} 
                        onChange={e => setFormData({...formData, events: e.target.value})}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="[]">All Events</option>
                        <option value='["client_created"]'>Client Created</option>
                        <option value='["call_ended"]'>Call Ended</option>
                        <option value='["task_completed"]'>Task Completed</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium">
                      <Save className="w-4 h-4" /> Save Webhook
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-3">
              {webhooks.length === 0 && !isAdding ? (
                <p className="text-sm text-gray-500 text-center py-4 border border-dashed border-gray-300 rounded-lg">No webhooks configured.</p>
              ) : (
                webhooks.map(webhook => (
                  <div key={webhook.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Globe className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{webhook.name}</h4>
                        <p className="text-xs text-gray-500">{webhook.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${webhook.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {webhook.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {isAdmin && (
                        <>
                          <button onClick={() => startEdit(webhook)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteWebhook(webhook.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="border-t border-gray-200 pt-8 flex justify-end">
              <span className="text-sm text-gray-500 pt-2 mr-4">All settings auto-save as you type.</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
