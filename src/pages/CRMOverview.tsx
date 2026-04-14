import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Search, Filter, Star, Phone, Mail, Building, MoreVertical, X, MapPin, Scale } from 'lucide-react';
import { format } from 'date-fns';

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
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.company?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.city?.toLowerCase().includes(search.toLowerCase()) ||
    c.matterType?.toLowerCase().includes(search.toLowerCase())
  );

  const getStageColor = (stage: string) => {
    switch(stage) {
      case 'New Lead': return 'bg-blue-100 text-blue-800';
      case 'Consultation Scheduled': return 'bg-indigo-100 text-indigo-800';
      case 'Contacted': return 'bg-yellow-100 text-yellow-800';
      case 'Follow-Up': return 'bg-orange-100 text-orange-800';
      case 'Case Review': return 'bg-purple-100 text-purple-800';
      case 'Retainer Discussion': return 'bg-pink-100 text-pink-800';
      case 'Converted': return 'bg-green-100 text-green-800';
      case 'Lost': return 'bg-red-100 text-red-800';
      case 'Not Reachable': return 'bg-gray-200 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">CRM Overview</h2>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
        >
          Add Client
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search clients, phones, city, matter type..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">
          <Filter className="w-5 h-5" />
          Filters
        </button>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-200 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matter Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Contact</th>
                <th className="px-6 py-3 relative"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">Loading clients...</td></tr>
              ) : filteredClients.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">No clients found</td></tr>
              ) : (
                filteredClients.map((client) => (
                  <tr 
                    key={client.id} 
                    onClick={() => handleClientClick(client)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                          {client.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{client.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Building className="w-3 h-3" /> {client.company || 'No Company'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-1"><Phone className="w-3 h-3 text-gray-400" /> {client.phone}</div>
                      {client.email && <div className="text-sm text-gray-500 flex items-center gap-1 mt-1"><Mail className="w-3 h-3 text-gray-400" /> {client.email}</div>}
                      {client.city && <div className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3 text-gray-400" /> {client.city}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        {client.matterType ? (
                          <><Scale className="w-4 h-4 text-gray-400" /> {client.matterType}</>
                        ) : (
                          <span className="text-gray-400 italic">Unspecified</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStageColor(client.stage)}`}>
                        {client.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Star className={`w-4 h-4 ${client.score > 70 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                        <span className="text-sm font-medium text-gray-900">{client.score}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.assignedAgent?.user?.name || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.lastContactedAt ? format(new Date(client.lastContactedAt), 'MMM d, yyyy') : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[600px] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Add New Client</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddClient} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input 
                    required
                    type="text"
                    value={newClient.name}
                    onChange={e => setNewClient({...newClient, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input 
                    required
                    type="tel"
                    value={newClient.phone}
                    onChange={e => setNewClient({...newClient, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email"
                    value={newClient.email}
                    onChange={e => setNewClient({...newClient, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input 
                    type="text"
                    value={newClient.city}
                    onChange={e => setNewClient({...newClient, city: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company / Organization</label>
                  <input 
                    type="text"
                    value={newClient.company}
                    onChange={e => setNewClient({...newClient, company: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Matter Type</label>
                  <select 
                    value={newClient.matterType}
                    onChange={e => setNewClient({...newClient, matterType: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Matter Type</option>
                    <option value="Civil Litigation">Civil Litigation</option>
                    <option value="Criminal Defense">Criminal Defense</option>
                    <option value="Family Law">Family Law</option>
                    <option value="Corporate Law">Corporate Law</option>
                    <option value="Property Dispute">Property Dispute</option>
                    <option value="Intellectual Property">Intellectual Property</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {user?.role === 'ADMIN' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign To Agent</label>
                    <select 
                      value={newClient.assignedAgentId}
                      onChange={e => setNewClient({...newClient, assignedAgentId: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {agents.map(agent => (
                        <option key={agent.id} value={agent.id}>{agent.user?.name} (Ext: {agent.extension})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
