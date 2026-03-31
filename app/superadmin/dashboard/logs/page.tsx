'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Clock,
  User as UserIcon,
  Globe,
  Database,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { superadminService } from '@/services/superadmin.service';
import { toast } from 'react-hot-toast';

export default function SuperadminLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await superadminService.getAuditLogs({
        type: filterType === 'all' ? undefined : filterType,
        status: filterStatus === 'all' ? undefined : filterStatus,
        search: searchTerm || undefined,
        page
      });
      if (data.success) {
        setLogs(data.logs);
        setPagination(data.pagination);
      }
    } catch (error) {
      toast.error('Failed to fetch system logs');
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus, searchTerm, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 500); // Debounce search
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'auth': return <Clock size={16} />;
      case 'order': return <Database size={16} />;
      case 'system': return <Globe size={16} />;
      default: return <UserIcon size={16} />;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'auth': return 'bg-indigo-500/10 text-indigo-400';
      case 'order': return 'bg-emerald-500/10 text-emerald-400';
      case 'system': return 'bg-amber-500/10 text-amber-400';
      default: return 'bg-slate-500/10 text-slate-400';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">System Logs</h1>
          <p className="text-slate-400 mt-1">Audit trail and system activity tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all border border-slate-700">
            <Download size={18} />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-6 relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Search action, user, or IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800 text-white rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none"
          />
        </div>
        <div className="md:col-span-3">
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800 text-white rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer outline-none"
          >
            <option value="all">All Types</option>
            <option value="auth">Authentication</option>
            <option value="user">User Management</option>
            <option value="order">Orders</option>
            <option value="system">System</option>
          </select>
        </div>
        <div className="md:col-span-3">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800 text-white rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer outline-none"
          >
            <option value="all">Any Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl relative min-h-[400px]">
        {loading && !logs.length && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/20 backdrop-blur-[2px]">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/30 border-b border-slate-800">
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Activity</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Source IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              <AnimatePresence mode="popLayout">
                {logs.map((log, index) => (
                  <motion.tr 
                    key={log._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-slate-800/20 transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl ${getLogColor(log.type)} group-hover:scale-110 transition-transform`}>
                          {getLogIcon(log.type)}
                        </div>
                        <span className="font-bold text-white text-sm tracking-tight">{log.action}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-indigo-400 text-xs font-bold font-mono bg-indigo-500/10 px-2.5 py-1 rounded-lg">{log.user}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-slate-400 text-xs flex items-center gap-1.5">
                        <Activity size={10} className="text-slate-600" />
                        {formatTime(log.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm">
                      {log.status === 'success' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
                          <CheckCircle2 size={12} />
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-widest border border-red-500/20">
                          <AlertCircle size={12} />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-slate-500 text-xs font-mono tracking-tight">{log.ip}</span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        {logs.length === 0 && !loading && (
          <div className="py-24 flex flex-col items-center justify-center text-slate-500">
            <div className="w-20 h-20 bg-slate-800/30 rounded-full flex items-center justify-center mb-6">
              <Search size={40} className="opacity-20" />
            </div>
            <p className="text-lg font-bold text-white">No activity logs found</p>
            <p className="text-slate-500 mt-1">Try adjusting your filters or search term</p>
            <button 
              onClick={() => { setSearchTerm(''); setFilterType('all'); setFilterStatus('all'); }}
              className="mt-6 text-indigo-400 hover:text-indigo-300 font-bold text-sm underline underline-offset-4"
            >
              Reset all filters
            </button>
          </div>
        )}

        {pagination && (
          <div className="px-8 py-5 bg-slate-800/10 border-t border-slate-800/50 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium tracking-wide">
              Total <span className="font-bold text-white">{pagination.total}</span> activity records
            </span>
            <div className="flex gap-3">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-slate-800/50 text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-slate-800/50 disabled:hover:text-slate-400"
              >
                Prev
              </button>
              <div className="flex items-center gap-2 px-3 text-[10px] font-bold text-indigo-400">
                {page} / {pagination.pages}
              </div>
              <button 
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="px-4 py-2 bg-slate-800/50 text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-slate-800/50 disabled:hover:text-slate-400"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
