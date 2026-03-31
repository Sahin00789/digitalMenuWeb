'use client';

import { useState, useEffect } from 'react';
import { superadminService } from '@/services/superadmin.service';
import Link from 'next/link';
import { 
  Users, 
  ShoppingBag, 
  UserCheck, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight,
  Loader2,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SuperadminOverview() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await superadminService.getStats();
        setStats(data.stats);
      } catch (error) {
        toast.error('Failed to fetch system statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const cards = [
    { 
      label: 'Total Restaurants', 
      value: stats?.totalUsers || 0, 
      icon: <Users className="text-indigo-400" />, 
      change: '+12%', 
      isUp: true,
      color: 'from-indigo-500/20 to-indigo-600/5' 
    },
    { 
      label: 'Active Users (7d)', 
      value: stats?.activeUsers || 0, 
      icon: <UserCheck className="text-emerald-400" />, 
      change: '+24%', 
      isUp: true,
      color: 'from-emerald-500/20 to-emerald-600/5' 
    },
    { 
      label: 'Total Orders System-wide', 
      value: stats?.totalOrders || 0, 
      icon: <ShoppingBag className="text-purple-400" />, 
      change: '+18.5%', 
      isUp: true,
      color: 'from-purple-500/20 to-purple-600/5' 
    },
    { 
      label: 'Growth This Month', 
      value: stats?.usersThisMonth || 0, 
      icon: <TrendingUp className="text-amber-400" />, 
      change: '+8%', 
      isUp: true,
      color: 'from-amber-500/20 to-amber-600/5' 
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-white tracking-tight">System Overview</h1>
        <p className="text-slate-400">Monitoring real-time platform statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <div 
            key={card.label} 
            className={`bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition-all group relative overflow-hidden`}
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} blur-[50px] -mr-16 -mt-16 opacity-50 group-hover:opacity-100 transition-opacity`} />
            
            <div className="flex items-start justify-between relative z-10">
              <div className="p-3 bg-slate-800/50 rounded-2xl border border-slate-700 group-hover:scale-110 transition-transform">
                {card.icon}
              </div>
              <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${card.isUp ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                {card.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {card.change}
              </div>
            </div>

            <div className="mt-6 relative z-10">
              <span className="text-slate-500 text-sm font-medium tracking-wide grow-0">{card.label}</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-bold text-white tracking-tighter">
                  {card.value.toLocaleString()}
                </span>
                <span className="text-slate-500 text-xs">Total</span>
              </div>
            </div>
            
            <button className="absolute bottom-6 right-6 p-2 bg-slate-800/50 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-600 hover:text-white">
              <ArrowUpRight size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* System Health / Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-3xl p-8 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <Activity className="text-indigo-500" />
              Platform Reliability
            </h2>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Status</span>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-800/20 rounded-2xl border border-slate-800/50">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-300 font-medium tracking-tight">API Server Core</span>
              </div>
              <span className="text-emerald-400 text-sm font-bold">99.9% Uptime</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-800/20 rounded-2xl border border-slate-800/50">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-300 font-medium tracking-tight">Database Clusters</span>
              </div>
              <span className="text-emerald-400 text-sm font-bold">Operational</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-800/20 rounded-2xl border border-slate-800/50">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-300 font-medium tracking-tight">Email Service SMTP</span>
              </div>
              <span className="text-emerald-400 text-sm font-bold">Healthy</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 backdrop-blur-sm border border-indigo-500/30 rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 opacity-10 group-hover:opacity-20 transition-opacity" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="bg-indigo-500 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-indigo-500/50 shadow-lg">
              <ShieldCheck size={28} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Security Audit</h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-8">
              System is running in hardened mode. Multi-factor OTP authentication is active for all superadmin sessions.
            </p>
            <Link href="/superadmin/dashboard/logs" className="mt-auto">
              <button className="w-full py-4 bg-white text-indigo-900 font-bold rounded-2xl hover:bg-indigo-50 transition-colors shadow-xl shadow-black/20">
                View Audit Logs
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
