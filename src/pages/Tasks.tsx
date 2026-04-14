import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { CheckSquare, Calendar, Clock, AlertCircle } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';

export default function Tasks() {
  const { token, setSelectedClient, setClientDrawerOpen } = useAppStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tasks', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setTasks(data);
        setLoading(false);
      })
      .catch(console.error);
  }, [token]);

  const handleTaskClick = (client: any) => {
    if (client) {
      setSelectedClient(client);
      setClientDrawerOpen(true);
    }
  };

  const handleComplete = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'COMPLETED' })
      });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'COMPLETED' } : t));
    } catch (err) {
      console.error(err);
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'PENDING');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Tasks</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Tasks */}
        <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Pending</h3>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{pendingTasks.length}</span>
          </div>
          <ul className="divide-y divide-gray-200">
            {loading ? (
              <li className="px-6 py-8 text-center text-gray-500">Loading tasks...</li>
            ) : pendingTasks.length === 0 ? (
              <li className="px-6 py-8 text-center text-gray-500">No pending tasks. Great job!</li>
            ) : (
              pendingTasks.map(task => {
                const dueDate = new Date(task.dueAt);
                const isOverdue = isPast(dueDate) && !isToday(dueDate);
                return (
                  <li 
                    key={task.id} 
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleTaskClick(task.client)}
                  >
                    <div className="flex items-start gap-4">
                      <button 
                        onClick={(e) => handleComplete(e, task.id)}
                        className="mt-1 text-gray-400 hover:text-green-500 transition-colors"
                      >
                        <CheckSquare className="w-5 h-5" />
                      </button>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium text-gray-900">{task.title}</p>
                          <span className={`text-xs font-medium flex items-center gap-1 ${
                            isOverdue ? 'text-red-600' : isToday(dueDate) ? 'text-amber-600' : 'text-gray-500'
                          }`}>
                            {isOverdue && <AlertCircle className="w-3 h-3" />}
                            {format(dueDate, 'MMM d, h:mm a')}
                          </span>
                        </div>
                        {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
                        <div className="mt-2 flex items-center gap-2">
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded uppercase tracking-wider">{task.taskType}</span>
                          <span className="text-sm text-blue-600 font-medium">{task.client?.name}</span>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        {/* Completed Tasks */}
        <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden opacity-75">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Completed</h3>
            <span className="bg-gray-200 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{completedTasks.length}</span>
          </div>
          <ul className="divide-y divide-gray-200">
            {completedTasks.length === 0 ? (
              <li className="px-6 py-8 text-center text-gray-500">No completed tasks yet.</li>
            ) : (
              completedTasks.map(task => (
                <li key={task.id} className="px-6 py-4 bg-gray-50">
                  <div className="flex items-start gap-4">
                    <CheckSquare className="w-5 h-5 text-green-500 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500 line-through">{task.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm text-gray-400">{task.client?.name}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
