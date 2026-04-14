import React, { useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { Phone, Users, LayoutDashboard, Settings, LogOut, PhoneCall, History, CheckSquare, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import ActiveCallPanel from '../components/ActiveCallPanel';
import IncomingCallModal from '../components/IncomingCallModal';
import CallDispositionScreen from '../components/CallDispositionScreen';
import ClientDrawer from '../components/ClientDrawer';

export default function DashboardLayout() {
  const { user, logout, connectSocket } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      connectSocket();
    }
  }, [user, navigate, connectSocket]);

  if (!user) return null;

  const adminLinks = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'CRM Overview', href: '/admin/crm', icon: Users },
    { name: 'Agents', href: '/admin/agents', icon: Users },
    { name: 'Telephony', href: '/admin/telephony', icon: Phone },
    { name: 'Call History', href: '/admin/history', icon: History },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const agentLinks = [
    { name: 'Workspace', href: '/agent', icon: LayoutDashboard },
    { name: 'CRM', href: '/agent/crm', icon: Users },
    { name: 'Tasks', href: '/agent/tasks', icon: CheckSquare },
    { name: 'Dialer', href: '/agent/dialer', icon: Phone },
    { name: 'Study Library', href: '/agent/library', icon: BookOpen },
    { name: 'Call History', href: '/agent/history', icon: History },
    { name: 'Settings', href: '/agent/settings', icon: Settings },
  ];

  const links = user.role === 'ADMIN' ? adminLinks : agentLinks;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-4 flex items-center gap-2 border-b border-slate-800">
          <PhoneCall className="w-6 h-6 text-blue-400" />
          <span className="text-xl font-bold">CallFlow CRM</span>
        </div>
        
        <div className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                    isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="font-medium text-sm">{user.name}</div>
              <div className="text-xs text-slate-400">{user.role}</div>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-full px-2 py-1"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Topbar */}
        <header className="h-14 bg-white border-b flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-gray-800">
            {links.find(l => l.href === location.pathname)?.name || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2.5 h-2.5 rounded-full",
                user.status === 'ONLINE' ? "bg-green-500" : "bg-gray-400"
              )} />
              <span className="text-sm text-gray-600">{user.status}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
        
        {/* Global Call UI */}
        <ActiveCallPanel />
        <IncomingCallModal />
        <CallDispositionScreen />
        <ClientDrawer />
      </div>
    </div>
  );
}
