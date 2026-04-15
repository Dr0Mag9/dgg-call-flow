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
      <aside className="w-68 bg-[#0A1221]/60 backdrop-blur-3xl border-r border-gold/20 flex flex-col z-20 relative before:absolute before:inset-y-0 before:right-0 before:w-[1px] before:bg-gradient-to-b before:from-transparent before:via-gold/50 before:to-transparent">
        <div className="p-8 flex items-center gap-4 border-b border-gold/10 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl" />
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-light via-gold to-gold-deep flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.4)] relative z-10">
            <PhoneCall className="w-7 h-7 text-navy" />
          </div>
          <span className="text-2xl font-black gold-text-gradient tracking-tighter relative z-10 italic">CallFlow</span>
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
                    "group flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-500 relative overflow-hidden",
                    isActive 
                      ? "bg-gold/10 text-gold-light shadow-[inset_0_0_30px_rgba(212,175,55,0.15)] border border-gold/20" 
                      : "text-slate-400 hover:text-gold-light hover:bg-gold/5"
                  )}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeNav"
                      className="absolute left-0 w-1.5 h-8 bg-gold rounded-r-full shadow-[0_0_15px_#D4AF37]"
                    />
                  )}
                  <Icon className={cn(
                    "w-5 h-5 transition-all duration-500",
                    isActive ? "text-gold scale-110" : "group-hover:text-gold-light group-hover:scale-110"
                  )} />
                  <span className={cn(
                    "font-bold text-sm tracking-wide lowercase",
                    isActive ? "shimmer-text" : ""
                  )}>{link.name}</span>
                  {isActive && (
                    <motion.div 
                      initial={{ x: '-100%' }}
                      animate={{ x: '200%' }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/10 to-transparent skew-x-12 pointer-events-none" 
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-gold/10 bg-navy/40 relative overflow-hidden">
          <div className="flex items-center gap-4 mb-5 p-3 rounded-2xl bg-gold/5 border border-gold/20 hover:border-gold/40 transition-all duration-500 group/profile">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold/30 to-gold/5 border border-gold/40 flex items-center justify-center font-black text-xl text-gold-light shadow-[0_0_15px_rgba(212,175,55,0.2)] group-hover/profile:scale-110 transition-transform">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <div className="font-black text-sm truncate text-pearl tracking-tight uppercase">{user.name}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-gold-deep font-black mt-0.5">{user.role}</div>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center gap-3 text-slate-400 hover:text-white transition-all duration-500 w-full px-4 py-2.5 rounded-xl hover:bg-red-500/10 hover:text-red-400 group/logout"
          >
            <LogOut className="w-5 h-5 group-hover/logout:rotate-12 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Topbar */}
        <header className="h-20 bg-navy/40 backdrop-blur-3xl border-b border-gold/20 flex items-center justify-between px-10 shadow-2xl relative">
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-black text-pearl tracking-tighter uppercase italic">
              {links.find(l => l.href === location.pathname)?.name || 'Dashboard'}
            </h1>
            <div className="h-6 w-[1px] bg-gold/30 mx-2" />
            <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
              <motion.div 
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={cn(
                  "w-2.5 h-2.5 rounded-full",
                  user.status === 'ONLINE' ? "bg-gold shadow-[0_0_12px_#D4AF37]" : "bg-slate-500"
                )} 
              />
              <span className="text-[10px] font-black text-gold tracking-[0.2em] uppercase">{user.status}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-end">
              <span className="text-[11px] text-gold font-black tracking-[0.3em] uppercase shimmer-text">Quantum Ready</span>
              <span className="text-[10px] text-pearl/40 font-bold uppercase tracking-widest mt-1">Secured Node</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold shadow-lg">
              <Settings className="w-5 h-5 animate-[spin_8s_linear_infinite]" />
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
