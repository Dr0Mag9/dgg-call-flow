import React, { useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { Phone, Users, LayoutDashboard, Settings, LogOut, PhoneCall, History, CheckSquare, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import ActiveCallPanel from '../components/ActiveCallPanel';
import IncomingCallModal from '../components/IncomingCallModal';
import CallDispositionScreen from '../components/CallDispositionScreen';
import ClientDrawer from '../components/ClientDrawer';
import LuxuryBackground from '../components/LuxuryBackground';
import { motion } from 'motion/react';

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
    <div className="flex h-screen bg-navy text-white overflow-hidden font-sans">
      <LuxuryBackground />
      
      {/* Sidebar */}
      <aside className="w-64 bg-navy-light/40 backdrop-blur-2xl border-r border-gold/10 flex flex-col z-20">
        <div className="p-6 flex items-center gap-3 border-b border-gold/10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-light via-gold to-gold-deep flex items-center justify-center shadow-lg shadow-gold/20">
            <PhoneCall className="w-6 h-6 text-navy" />
          </div>
          <span className="text-xl font-bold gold-text-gradient tracking-tight">CallFlow</span>
        </div>
        
        <div className="flex-1 py-6 overflow-y-auto">
          <nav className="space-y-1.5 px-3">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className={cn(
                    "group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 relative overflow-hidden",
                    isActive 
                      ? "bg-gold/10 text-gold-light shadow-[inset_0_0_20px_rgba(212,175,55,0.1)]" 
                      : "text-slate-400 hover:text-gold-light hover:bg-gold/5"
                  )}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeNav"
                      className="absolute left-0 w-1 h-6 bg-gold rounded-r-full"
                    />
                  )}
                  <Icon className={cn(
                    "w-5 h-5 transition-colors duration-300",
                    isActive ? "text-gold" : "group-hover:text-gold-light"
                  )} />
                  <span className="font-medium text-sm">{link.name}</span>
                  {isActive && (
                    <div className="absolute inset-0 bg-gold/5 animate-pulse pointer-events-none" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-gold/10 bg-navy/20">
          <div className="flex items-center gap-3 mb-4 p-2 rounded-xl bg-gold/5 border border-gold/10">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center font-bold text-gold-light shadow-inner">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <div className="font-semibold text-sm truncate text-pearl">{user.name}</div>
              <div className="text-[10px] uppercase tracking-wider text-gold-deep font-bold">{user.role}</div>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300 w-full px-3 py-2 rounded-lg hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Topbar */}
        <header className="h-16 bg-navy/20 backdrop-blur-md border-b border-gold/10 flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-pearl tracking-tight">
              {links.find(l => l.href === location.pathname)?.name || 'Dashboard'}
            </h1>
            <div className="h-4 w-[1px] bg-gold/20 mx-2" />
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gold/5 border border-gold/10">
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={cn(
                  "w-2 h-2 rounded-full",
                  user.status === 'ONLINE' ? "bg-gold-light shadow-[0_0_8px_#F5D77A]" : "bg-slate-500"
                )} 
              />
              <span className="text-xs font-bold text-gold-light/80 tracking-widest uppercase">{user.status}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gold-deep font-bold tracking-widest uppercase">System Ready</span>
              <span className="text-xs text-pearl/60 font-medium">Secured Connection</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8 relative">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
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
