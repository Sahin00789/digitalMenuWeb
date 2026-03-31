'use client';

import { useState, useEffect } from 'react';
import { superadminService } from '@/services/superadmin.service';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  ExternalLink,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ShieldX,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  Edit3,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserMonitoring() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Modal form state
  const [isFree, setIsFree] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');

  const fetchUsers = async () => {
    try {
      const data = await superadminService.getUsers();
      setUsers(data.users);
    } catch (error) {
      toast.error('Failed to load user database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      setUpdating(true);
      await superadminService.updateUserStatus(userId, !currentStatus);
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    } finally {
      setUpdating(false);
    }
  };

  const openSubscriptionModal = (user: any) => {
    setSelectedUser(user);
    setIsFree(user.isFreeSubscription || false);
    setExpiryDate(user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toISOString().split('T')[0] : '');
    setIsModalOpen(true);
  };

  const handleUpdateSubscription = async () => {
    if (!selectedUser) return;
    try {
      setUpdating(true);
      await superadminService.updateSubscription(selectedUser._id, {
        isFreeSubscription: isFree,
        subscriptionExpiresAt: expiryDate || null
      });
      toast.success('Subscription updated successfully');
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update subscription');
    } finally {
      setUpdating(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.restaurantName?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase()) ||
    user.ownerName?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-white tracking-tight">User Database</h1>
          <p className="text-slate-400">Manage restaurant accounts, access status, and subscriptions</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group flex-1 md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by restaurant or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-800 text-slate-200 rounded-2xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-600 outline-none"
            />
          </div>
          <button className="p-3 bg-slate-900/50 border border-slate-800 text-slate-400 rounded-2xl hover:text-white hover:border-slate-700 transition-all">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl p-16 text-center">
          <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} className="text-slate-600" />
          </div>
          <h3 className="text-white font-bold text-xl mb-2">No partners found</h3>
          <p className="text-slate-500 max-w-sm mx-auto">Start by registering restaurant partners in the system.</p>
        </div>
      ) : (
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/20 text-slate-500 text-xs uppercase tracking-widest font-bold">
                  <th className="px-8 py-5">Restaurant Info</th>
                  <th className="px-6 py-5">Account Status</th>
                  <th className="px-6 py-5">Subscription</th>
                  <th className="px-6 py-5">Expiry Date</th>
                  <th className="px-8 py-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {filteredUsers.map((user, index) => (
                  <motion.tr 
                    key={user._id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group hover:bg-slate-800/10 transition-colors"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center overflow-hidden border border-slate-700 group-hover:border-indigo-500/50 transition-all shadow-lg">
                          {user.logo ? (
                            <img src={user.logo} alt={user.restaurantName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl font-bold text-indigo-400">{user.restaurantName?.charAt(0) || user.email.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-lg tracking-tight leading-tight mb-1">{user.restaurantName || 'Unnamed Restaurant'}</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1.5 group-hover:text-indigo-400 transition-colors">
                            <Mail size={12} /> {user.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-6">
                      <div className="flex flex-col gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit ${user.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                          {user.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {user.isActive ? 'Active Account' : 'Deactivated'}
                        </span>
                        <span className={`text-[10px] text-slate-500 italic pl-1`}>
                          {user.isVerified ? '✓ Email Verified' : '! Pending Verification'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-6 font-medium">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-slate-200">
                          <CreditCard size={14} className="text-indigo-400" />
                          <span className="text-sm">{user.isFreeSubscription ? 'Free Plan' : 'Premium Plan'}</span>
                        </div>
                        {user.isFreeSubscription && (
                          <span className="text-[10px] text-indigo-500/80 font-bold uppercase tracking-widest pl-5">Lifetime</span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock size={14} className={user.subscriptionExpiresAt ? 'text-amber-500/70' : 'text-slate-600'} />
                        <span className="text-sm">
                          {user.isFreeSubscription ? 'No Expiry' : (user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toLocaleDateString() : 'Not Set')}
                        </span>
                      </div>
                    </td>

                    <td className="px-8 py-6 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => handleToggleStatus(user._id, user.isActive)}
                          className={`p-2.5 rounded-xl transition-all ${user.isActive ? 'bg-red-500/10 text-red-400 hover:bg-red-500 border border-red-500/20 hover:text-white' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 border border-emerald-500/20 hover:text-white'}`}
                          title={user.isActive ? 'Deactivate Account' : 'Activate Account'}
                        >
                          {user.isActive ? <ShieldX size={18} /> : <ShieldCheck size={18} />}
                        </button>
                        <button 
                          onClick={() => openSubscriptionModal(user)}
                          className="p-2.5 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 rounded-xl transition-all shadow-md" 
                          title="Manage Subscription"
                        >
                          <Edit3 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="bg-slate-800/10 px-8 py-5 flex items-center justify-between border-t border-slate-800/50">
            <span className="text-xs text-slate-500 font-medium tracking-wide">Total {filteredUsers.length} restaurant partners registered</span>
            <div className="flex items-center gap-3">
              <button disabled className="px-4 py-2 bg-slate-800/50 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest cursor-not-allowed">Prev</button>
              <button className="px-4 py-2 bg-slate-800/50 text-slate-400 hover:text-white hover:bg-indigo-600 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">Next</button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Management Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-3xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex flex-col gap-2 mb-10">
                <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-2">
                  <Edit3 size={28} />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Manage Subscription</h2>
                <p className="text-slate-400">Updating settings for <span className="text-indigo-400 font-bold">{selectedUser?.restaurantName}</span></p>
              </div>

              <div className="space-y-8">
                {/* Free Subscription Toggle */}
                <div className="flex items-center justify-between p-5 bg-slate-800/30 rounded-3xl border border-slate-800">
                  <div className="flex flex-col gap-1">
                    <span className="text-white font-bold">Lifetime Free Access</span>
                    <span className="text-xs text-slate-500">Enable this to bypass normal expiry logic</span>
                  </div>
                  <button 
                    onClick={() => setIsFree(!isFree)}
                    className={`w-14 h-7 rounded-full relative transition-all duration-300 ${isFree ? 'bg-indigo-600' : 'bg-slate-700'}`}
                  >
                    <motion.div 
                      animate={{ x: isFree ? 28 : 4 }}
                      className="absolute inset-y-1 w-5 bg-white rounded-full shadow-lg"
                    />
                  </button>
                </div>

                {/* Expiry Date Picker */}
                <div className={`space-y-3 transition-opacity duration-300 ${isFree ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                  <label className="text-sm font-bold text-slate-300 ml-1 uppercase tracking-widest">Subscription Expiry Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                    <input 
                      type="date" 
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 ml-1 italic">* Leave empty for undefined duration</p>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpdateSubscription}
                    disabled={updating}
                    className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {updating ? <Loader2 size={20} className="animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
