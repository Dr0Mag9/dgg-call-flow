import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Phone, Clock, PhoneMissed, PhoneIncoming, CheckSquare, Calendar } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import Dialer from './Dialer';

export default function AgentDashboard() {
  const { user, token, setSelectedClient, setClientDrawerOpen } = useAppStore();
  const [calls, setCalls] = useState<any[]>([]);
  const [allCalls, setAllCalls] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/calls', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setAllCalls(data);
        setCalls(data.slice(0, 5));
      })
      .catch(console.error);

    fetch('/api/tasks', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setTasks(data.filter((t: any) => t.status === 'PENDING').slice(0, 5)))
      .catch(console.error);
  }, [token]);

  const handleClientClick = (client: any) => {
    if (client) {
      setSelectedClient(client);
      setClientDrawerOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}</h2>
            <p className="text-gray-500 mt-1">You are currently receiving calls.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
            </span>
            <span className="font-medium text-green-600">Online & Ready</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Dialer Column */}
        <div className="xl:col-span-1">
          <Dialer embedded={true} />
        </div>

        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Calls</h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {calls.map((call) => (
                <li 
                  key={call.id} 
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleClientClick(call.client)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${
                        call.direction === 'INBOUND' ? 'bg-indigo-100 text-indigo-600' : 'bg-purple-100 text-purple-600'
                      }`}>
                        {call.direction === 'INBOUND' ? <PhoneIncoming className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{call.client?.name || call.phoneNumber}</p>
                        <p className="text-xs text-gray-500">{format(new Date(call.startedAt), 'MMM d, h:mm a')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">{call.duration ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : '--'}</p>
                      <p className={`text-xs font-medium ${
                        call.status === 'MISSED' ? 'text-red-600' : 'text-gray-500'
                      }`}>{call.status}</p>
                    </div>
                  </div>
                </li>
              ))}
              {calls.length === 0 && (
                <li className="px-6 py-8 text-center text-gray-500">No recent calls</li>
              )}
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-lg border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Upcoming Tasks</h3>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{tasks.length}</span>
              </div>
              <ul className="divide-y divide-gray-200">
                {tasks.map((task) => (
                  <li 
                    key={task.id} 
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleClientClick(task.client)}
                  >
                    <div className="flex items-start gap-3">
                      <CheckSquare className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(task.dueAt), 'MMM d, h:mm a')}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">{task.client?.name}</p>
                      </div>
                    </div>
                  </li>
                ))}
                {tasks.length === 0 && (
                  <li className="px-6 py-8 text-center text-gray-500">No pending tasks</li>
                )}
              </ul>
            </div>

            <div className="bg-white shadow rounded-lg border border-gray-100 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Calls Today</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {allCalls.filter(c => new Date(c.startedAt) >= startOfDay(new Date())).length}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Avg Duration</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {(() => {
                      const totalSec = allCalls.reduce((acc, c) => acc + (c.duration || 0), 0);
                      const avg = allCalls.length ? Math.floor(totalSec / allCalls.length) : 0;
                      return `${Math.floor(avg / 60)}m ${avg % 60}s`;
                    })()}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Missed</dt>
                  <dd className="text-sm font-medium text-red-600">
                    {allCalls.filter(c => c.status === 'MISSED').length}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
