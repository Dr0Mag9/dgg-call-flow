import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Phone, PhoneIncoming, PhoneMissed, Clock, Search, Filter, Play } from 'lucide-react';
import { format } from 'date-fns';

export default function CallHistory() {
  const { token } = useAppStore();
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/calls', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setCalls(data);
        setLoading(false);
      })
      .catch(console.error);
  }, [token]);

  const filteredCalls = calls.filter(call => 
    call.client?.name.toLowerCase().includes(search.toLowerCase()) ||
    call.phoneNumber.includes(search) ||
    call.agent?.user?.name.toLowerCase().includes(search.toLowerCase()) ||
    call.disposition?.outcome?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Call History</h2>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by client, number, agent, or outcome..." 
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

      <div className="bg-white shadow rounded-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client / Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Line</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recording</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outcome</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={9} className="px-6 py-8 text-center text-gray-500">Loading call history...</td></tr>
              ) : filteredCalls.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-8 text-center text-gray-500">No calls found</td></tr>
              ) : (
                filteredCalls.map((call) => (
                  <tr key={call.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex p-2 rounded-full ${
                        call.direction === 'INBOUND' ? 'bg-indigo-100 text-indigo-600' : 'bg-purple-100 text-purple-600'
                      }`}>
                        {call.direction === 'INBOUND' ? <PhoneIncoming className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{call.client?.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{call.phoneNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{call.agent?.user?.name || 'Unassigned'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">{call.assignedLine || '--'}</div>
                      {call.providerType && <div className="text-xs text-gray-500 text-center bg-gray-100 rounded px-1 mt-1 inline-block">{call.providerType}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{format(new Date(call.startedAt), 'MMM d, yyyy')}</div>
                      <div className="text-sm text-gray-500">{format(new Date(call.startedAt), 'h:mm a')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {call.duration ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : '--'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {call.recordingUrl ? (
                        <a 
                          href={call.recordingUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors inline-block"
                          title="Play Recording"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </a>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        call.status === 'ENDED' ? 'bg-green-100 text-green-800' :
                        call.status === 'MISSED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {call.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {call.disposition?.outcome || '--'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
