import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Users, PhoneIncoming, PhoneOutgoing, PhoneMissed, Activity, Star } from 'lucide-react';

export default function AdminDashboard() {
  const { token } = useAppStore();
  const [stats, setStats] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error);

    fetch('/api/admin/agents', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setAgents(data))
      .catch(console.error);
  }, [token]);

  if (!stats) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;

  const cards = [
    { name: 'Total Agents', value: stats.totalAgents, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Online Agents', value: stats.onlineAgents, icon: Activity, color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'Inbound Calls', value: stats.inboundCallsToday, icon: PhoneIncoming, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { name: 'Outbound Calls', value: stats.outboundCallsToday, icon: PhoneOutgoing, color: 'text-purple-600', bg: 'bg-purple-100' },
    { name: 'Missed Calls', value: stats.missedCalls, icon: PhoneMissed, color: 'text-red-600', bg: 'bg-red-100' },
    { name: 'Active Calls', value: stats.activeCalls, icon: PhoneIncoming, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.name} className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`rounded-md p-3 ${card.bg}`}>
                      <Icon className={`h-6 w-6 ${card.color}`} aria-hidden="true" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{card.name}</dt>
                      <dd>
                        <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg border border-gray-100 p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Live System Status</h3>
          <div className="h-64 bg-gray-50 rounded border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
            Real-time activity chart would go here
          </div>
        </div>

        <div className="bg-white shadow rounded-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Agent Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ext</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agents.slice(0, 5).map((agent) => (
                  <tr key={agent.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                          {agent.user?.name?.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{agent.user?.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        agent.status === 'ONLINE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {agent.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {agent.extension}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
