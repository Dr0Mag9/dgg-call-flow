import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Phone, Smartphone, Plus, Trash2, Signal, Shield, Key, ExternalLink, Activity, Save } from 'lucide-react';

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
    alert('Copied to clipboard!');
  };

  const verifyGateway = (gw: any) => {
    if (gw.status === 'ONLINE') {
      alert(`Success! ${gw.name} is connected and ready.`);
    } else {
      alert(`${gw.name} is currently offline. Please check the Android app.`);
    }
    fetchData();
  };

  const handleDeleteGateway = async (id: string) => {
    if (!confirm('Delete this gateway? This will unlink any associated lines.')) return;
    await fetch(`/api/admin/gateways/${id}`, {
      method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchData();
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Telephony Suite...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Unified Telephony Management</h2>
        <p className="text-gray-500 mt-1">Manage SIP Trunks, Global Connectors, and Android SIM Gateways.</p>
      </div>

      {/* Global SIP Settings */}
      <div className="bg-white shadow rounded-lg border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" /> Global SIP Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">SIP WSS URL</label>
            <input 
              type="text" 
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm" 
              defaultValue={systemSettings.sip_wss_url}
              onBlur={(e) => updateSystemSetting('sip_wss_url', e.target.value)}
              placeholder="wss://sip.example.com:443"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">SIP Domain/Proxy</label>
            <input 
              type="text" 
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm" 
              defaultValue={systemSettings.sip_domain}
              onBlur={(e) => updateSystemSetting('sip_domain', e.target.value)}
              placeholder="sip.example.com"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Gateway Devices Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-orange-600" /> Android SIM Gateways
            </h3>
            <button 
              onClick={() => setIsAddingGateway(true)}
              className="text-sm bg-orange-50 text-orange-700 px-3 py-1.5 rounded-md hover:bg-orange-100 font-medium flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Device
            </button>
          </div>

          <div className="bg-white shadow rounded-lg border border-gray-100 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">API Key</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {gateways.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No devices registered</td></tr>
                ) : (
                  gateways.map(gw => (
                    <tr key={gw.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{gw.name}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${gw.status === 'ONLINE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          <Signal className="w-3 h-3" /> {gw.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-400 flex items-center gap-2">
                        {gw.apiKey.substring(0, 8)}...
                        <button onClick={() => copyToClipboard(gw.apiKey)} className="text-gray-400 hover:text-blue-600">
                          <Plus className="w-3 h-3 rotate-45" /> 
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button 
                          onClick={() => verifyGateway(gw)}
                          className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                        >
                          Verify
                        </button>
                        <button onClick={() => handleDeleteGateway(gw.id)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Telephony Lines Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Phone className="w-5 h-5 text-purple-600" /> Business Lines
            </h3>
            <button 
              onClick={() => setIsAddingLine(true)}
              className="text-sm bg-purple-50 text-purple-700 px-3 py-1.5 rounded-md hover:bg-purple-100 font-medium flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Line
            </button>
          </div>

          <div className="bg-white shadow rounded-lg border border-gray-100 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gateway/Ref</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                 {lines.length === 0? (
                   <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No lines added</td></tr>
                 ) : (
                   lines.map(line => (
                    <tr key={line.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{line.number}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-600">{line.providerType}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {line.providerType === 'GATEWAY' ? (line.gateway?.name || 'Unlinked') : (line.providerRef || 'PBX Default')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleDeleteLine(line.id)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                   ))
                 )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isAddingGateway && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl">
            {!lastCreatedKey ? (
              <>
                <h3 className="text-lg font-bold mb-4">Register Android Gateway</h3>
                <form onSubmit={handleCreateGateway} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Device Name</label>
                    <input required type="text" className="w-full border p-2 rounded" value={gwName} onChange={e => setGwName(e.target.value)} placeholder="e.g. Office Phone 1" />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setIsAddingGateway(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-medium">Create API Key</button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Gateway Registered!</h3>
                <p className="text-gray-500 text-sm mb-6">Copy this key into your Android app to connect.</p>
                
                <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm break-all border border-gray-200 mb-6 flex items-center justify-between gap-2">
                  <span className="text-gray-700">{lastCreatedKey}</span>
                  <button 
                    onClick={() => copyToClipboard(lastCreatedKey)}
                    className="p-1.5 hover:bg-gray-200 rounded-md text-blue-600 shrink-0"
                    title="Copy Key"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>

                <button 
                  onClick={() => {
                    setIsAddingGateway(false);
                    setLastCreatedKey(null);
                    setGwName('');
                  }}
                  className="w-full py-2 bg-gray-900 text-white rounded font-medium hover:bg-gray-800"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isAddingLine && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4">Add Business Line</h3>
            <form onSubmit={handleCreateLine} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <input required type="text" className="w-full border p-2 rounded" value={lineFormData.number} onChange={e => setLineFormData({...lineFormData, number: e.target.value})} placeholder="+91..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Provider Type</label>
                  <select className="w-full border p-2 rounded" value={lineFormData.providerType} onChange={e => setLineFormData({...lineFormData, providerType: e.target.value})}>
                    <option value="GATEWAY">Android Gateway</option>
                    <option value="SIP">Cloud SIP Trunk</option>
                  </select>
                </div>
              </div>
              
              {lineFormData.providerType === 'GATEWAY' ? (
                <div>
                  <label className="block text-sm font-medium mb-1">Link to Device</label>
                  <select required className="w-full border p-2 rounded" value={lineFormData.gatewayId} onChange={e => setLineFormData({...lineFormData, gatewayId: e.target.value})}>
                    <option value="">Select a device...</option>
                    {gateways.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-1">SIP Extension / Username</label>
                  <input required type="text" className="w-full border p-2 rounded" value={lineFormData.providerRef} onChange={e => setLineFormData({...lineFormData, providerRef: e.target.value})} placeholder="e.g. 101" />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsAddingLine(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-medium">Add Line</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
