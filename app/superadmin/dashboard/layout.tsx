'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck,
  ChevronRight,
  Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SuperadminAuthProvider, useSuperadminAuth } from '@/context/SuperadminAuthContext';

interface SuperadminLayoutProps {
  children: React.ReactNode;
}

export default function SuperadminLayout({ children }: SuperadminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { superadmin, isLoading, isAuthenticated, logout } = useSuperadminAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/superadmin/login') {
      router.push('/superadmin/login');
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  const menuItems = [
    { name: 'Overview', icon: <LayoutDashboard size={20} />, href: '/superadmin/dashboard' },
    { name: 'User Monitoring', icon: <Users size={20} />, href: '/superadmin/dashboard/users' },
    { name: 'System Logs', icon: <Activity size={20} />, href: '/superadmin/dashboard/logs' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Activity className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-slate-900/50 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <span className="font-bold text-white">Superadmin</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-400 hover:text-white"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col h-full p-6">
            <div className="flex items-center gap-3 mb-10 px-2">
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <ShieldCheck size={24} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white tracking-tight">DigitalMenu</span>
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Superadmin</span>
              </div>
            </div>

            <nav className="flex-1 space-y-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                      ${isActive 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}
                    `}
                  >
                    <span className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'} transition-colors`}>
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.name}</span>
                    {isActive && <ChevronRight size={16} className="ml-auto opacity-50" />}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-6 border-t border-slate-800">
              <div className="px-4 py-3 bg-slate-800/30 rounded-2xl mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-indigo-400">
                    SA
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-white truncate">{superadmin?.email.split('@')[0] || 'Admin'}</span>
                    <span className="text-[10px] text-slate-500 truncate">Super Admin</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={logout}
                className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all group"
              >
                <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 h-screen overflow-y-auto bg-[#020617]">
          <div className="max-w-7xl mx-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
