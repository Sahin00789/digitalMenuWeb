'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { socketService } from '@/services/socket';
import { playNotificationSound } from '@/utils/notifications';
import { getTodayISTDateString } from '@/utils/date';
import {
  FaUtensils,
  FaTable,
  FaArrowRight,
  FaUser,
  FaMapMarkerAlt,
  FaPhone,
  FaEdit,
  FaSpinner,
  FaSave,
  FaTimes,
  FaClipboardList,
  FaCheckCircle,
  FaClock,
  FaMoneyBillWave,
  FaCreditCard,
  FaChartLine,
  FaCalendarDay,
  FaSearch,
  FaSyncAlt,
  FaStar,
  FaCrown,
  FaLock,
  FaEnvelope
} from 'react-icons/fa';
import { motion } from 'framer-motion';

interface Stats {
  menuItems: number;
  tables: number;
  activeItems: number;
}

interface Ledger {
  _id: string;
  date: string;
  cash: {
    received: number;
    refunded: number;
    balance: number;
  };
  online: {
    received: number;
    refunded: number;
    balance: number;
  };
  total: {
    received: number;
    refunded: number;
    netBalance: number;
  };
  counts: {
    totalOrders: number;
    servedOrders: number;
    rejectedOrders: number;
    cancelledOrders: number;
  };
  soldItems: Array<{
    menuItemId: string;
    name: string;
    count: number;
    totalRevenue: number;
  }>;
  hourlyBreakdown: Array<{
    hour: number;
    orders: number;
    revenue: number;
    servedOrders: number;
  }>;
}

interface RestaurantFormData {
  restaurantName: string;
  ownerName: string;
  address: string;
  phone: string;
  description: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, refreshUser, logout } = useAuth();
  const [stats, setStats] = useState<Stats>({ menuItems: 0, tables: 0, activeItems: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => getTodayISTDateString());
  const [formData, setFormData] = useState<RestaurantFormData>({
    restaurantName: '',
    ownerName: '',
    address: '',
    phone: '',
    description: ''
  });

  useEffect(() => {
    fetchStats();
    fetchLedger(selectedDate);
  }, [user, selectedDate]);

  useEffect(() => {
    if (user?._id) {
      socketService.connect();
      socketService.join(user._id);

      socketService.on('newOrder', (order: any) => {
        toast.success(`New order from Table #${order.tableNumber}!`);
        playNotificationSound();
        fetchStats();
        fetchLedger(selectedDate);
      });

      socketService.on('orderUpdate', (order: any) => {
        fetchStats();
        fetchLedger(selectedDate);
      });

      return () => {
        socketService.off('newOrder');
        socketService.off('orderUpdate');
      };
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const [menuRes, tableRes] = await Promise.all([
        api.get('/menu'),
        api.get('/table'),
      ]);

      const menuItems = menuRes.data.data || [];
      const tables = tableRes.data.data || [];

      setStats({
        menuItems: menuItems.length,
        tables: tables.length,
        activeItems: menuItems.filter((item: { isActive: boolean }) => item.isActive).length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLedger = async (date: string) => {
    setIsLoadingLedger(true);
    try {
      const isToday = date === new Date().toISOString().split('T')[0];
      const endpoint = isToday ? '/ledger/today' : `/ledger/date?date=${date}`;
      const response = await api.get(endpoint);
      setLedger(response.data.data);
    } catch (error) {
      console.error('Failed to fetch ledger:', error);
      setLedger(null);
    } finally {
      setIsLoadingLedger(false);
    }
  };

  const refreshLedger = async () => {
    setIsRefreshing(true);
    try {
      // Recalculate both transactions and analytical summary
      await api.post('/ledger/recalculate', { date: selectedDate });
      
      // Re-fetch unified ledger data
      await fetchLedger(selectedDate);
      
      toast.success('Dashboard metrics refreshed successfully!');
      fetchStats();
    } catch (error: any) {
      console.error('Failed to update stats:', error);
      toast.error(error.response?.data?.message || 'Failed to update statistics');
    } finally {
      setIsRefreshing(false);
    }
  };


  const hasRestaurantDetails = user?.restaurantName || user?.ownerName || user?.address;

  // Subscription calculation
  const getSubscriptionStatus = () => {
    if (user?.isFreeSubscription) return { name: 'Premium (Free)', daysLeft: null, isExpired: false, color: 'text-purple-200' };
    if (!user?.subscriptionExpiresAt) return { name: 'Basic', daysLeft: 0, isExpired: false, color: 'text-gray-400' };

    const today = new Date();
    const expiry = new Date(user.subscriptionExpiresAt);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      name: user.isFreeSubscription ? 'Premium (Free)' : 'Premium Plan',
      daysLeft: Math.max(0, diffDays),
      isExpired: diffDays < 0,
      expiryDate: expiry.toLocaleDateString(),
      color: diffDays < 5 ? 'text-red-400' : 'text-purple-200'
    };
  };

  const subStatus = getSubscriptionStatus();

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Restaurant Welcome Card */}
      <div className="mb-8">
        <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl shadow-2xl p-6 text-white relative overflow-hidden border border-purple-500/20">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                {/* Admin Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <FaUtensils className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">DigitalMenu Admin</h3>
                    <p className="text-xs text-purple-200">Restaurant Management</p>
                  </div>
                  <div className="bg-green-500/20 border border-green-400/30 rounded-full px-2 py-0.5 ml-auto self-start mt-1">
                    <span className="text-xs font-bold text-green-300">ACTIVE</span>
                  </div>
                </div>

                {/* Welcome Message */}
                <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                  {user?.restaurantName ? `${user.restaurantName}` : 'Your Restaurant Dashboard'}
                </h1>
                <p className="text-purple-200 text-sm lg:text-base mb-4">
                  {user?.restaurantName
                    ? 'Manage your digital menu, track orders, and grow your business.'
                    : 'Set up your restaurant details to get started with your digital menu.'}
                </p>

                {/* Restaurant Info Cards */}
                {hasRestaurantDetails ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {user?.ownerName && (
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <FaUser className="w-4 h-4 text-purple-200" />
                          </div>
                          <div>
                            <p className="text-xs text-purple-200">Owner</p>
                            <p className="text-sm font-medium text-white">{user.ownerName}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {user?.phone && (
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <FaPhone className="w-4 h-4 text-purple-200" />
                          </div>
                          <div>
                            <p className="text-xs text-purple-200">Contact</p>
                            <p className="text-sm font-medium text-white">{user.phone}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {user?.address && (
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                            <FaMapMarkerAlt className="w-4 h-4 text-purple-200" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-purple-200 uppercase tracking-tighter font-bold">Location</p>
                            <p className="text-sm font-medium text-white truncate">{user.address}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Status Card (Formerly Subscription) */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 border-l-purple-500/40 px-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 ${subStatus.isExpired ? 'bg-red-500/20' : 'bg-gradient-to-br from-amber-400 to-amber-600'} rounded-lg flex items-center justify-center shrink-0`}>
                          <FaStar className={`w-4 h-4 ${subStatus.isExpired ? 'text-red-400' : 'text-white'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <p className="text-xs text-purple-200 uppercase tracking-tighter font-bold">
                              {subStatus.daysLeft === null ? 'Subscription' : 'Status'}
                            </p>
                            {subStatus.isExpired ? (
                              <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded uppercase font-black animate-pulse">Expired</span>
                            ) : subStatus.daysLeft === null ? (
                              <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded uppercase font-black tracking-tight">Free</span>
                            ) : (
                              <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded uppercase font-black">Active</span>
                            )}
                          </div>
                          <div className="flex items-baseline gap-1.5 overflow-hidden">
                            <p className="text-sm font-bold text-white truncate">
                              {subStatus.daysLeft !== null ? `${subStatus.daysLeft} days left` : 'Free'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 border-dashed">
                    <p className="text-purple-200 text-sm italic">No restaurant details added yet.</p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="flex lg:flex-col gap-3">
                <button
                  onClick={() => router.push('/admin/restaurant')}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all border border-white/30 backdrop-blur-sm"
                >
                  <FaEdit className="w-4 h-4" />
                  <span className="text-sm font-medium">{hasRestaurantDetails ? 'Update Details' : 'Add Details'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ledger Section - Daily Summary */}
      <div className="mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <FaChartLine className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Daily Performance</h2>
                  <p className="text-sm text-gray-500">Sales and order summary</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <FaCalendarDay className="w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="bg-white border border-gray-200 text-sm font-medium px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer hover:border-gray-300"
                  />
                </div>
                <button
                  onClick={refreshLedger}
                  disabled={isRefreshing}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaSyncAlt className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="text-sm font-medium">
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {isLoadingLedger ? (
            <div className="p-8 text-center">
              <FaSpinner className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
              <p className="text-gray-500">Loading ledger...</p>
            </div>
          ) : ledger ? (
            <div className="p-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:md-grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-indigo-600 font-medium">Total Orders</p>
                    <FaClipboardList className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-2xl font-bold text-indigo-900">{ledger.counts.totalOrders}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-green-600 font-medium">Served Orders</p>
                    <FaCheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <p className="text-2xl font-bold text-green-900">{ledger.counts.servedOrders}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-amber-600 font-medium">Cash Balance</p>
                    <FaMoneyBillWave className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-2xl font-bold text-amber-900">
                    ₹{Math.round(ledger.cash.balance)}
                  </p>
                  {ledger.cash.refunded > 0 && (
                    <p className="text-[10px] text-gray-500 mt-1">
                      Received ₹{ledger.cash.received} | Refunded ₹{ledger.cash.refunded}
                    </p>
                  )}
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-blue-600 font-medium">Online Balance</p>
                    <FaCreditCard className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    ₹{Math.round(ledger.online.balance)}
                  </p>
                  {ledger.online.refunded > 0 && (
                    <p className="text-[10px] text-gray-500 mt-1">
                      Received ₹{ledger.online.received} | Refunded ₹{ledger.online.refunded}
                    </p>
                  )}
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-purple-600 font-medium">Net Balance</p>
                    <FaChartLine className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    ₹{Math.round(ledger.total.netBalance)}
                  </p>
                  {ledger.total.refunded > 0 && (
                    <p className="text-[10px] text-gray-500 mt-1">
                      Total Rec ₹{ledger.total.received} | Ref ₹{ledger.total.refunded}
                    </p>
                  )}
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                    <FaMoneyBillWave className="w-4 h-4 text-amber-600" />
                    <span>Cash Summary</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gross Received</span>
                      <span className="font-medium">₹{Math.round(ledger.cash.received)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Total Refunded</span>
                      <span className="font-medium">₹{Math.round(ledger.cash.refunded)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 font-semibold">
                      <span>Net Cash</span>
                      <span className="text-amber-700">₹{Math.round(ledger.cash.balance)}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                    <FaCreditCard className="w-4 h-4 text-blue-600" />
                    <span>Online Summary</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gross Received</span>
                      <span className="font-medium">₹{Math.round(ledger.online.received)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Total Refunded</span>
                      <span className="font-medium">₹{Math.round(ledger.online.refunded)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 font-semibold">
                      <span>Net Online</span>
                      <span className="text-blue-700">₹{Math.round(ledger.online.balance)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Selling Items */}
              {ledger.soldItems && ledger.soldItems.length > 0 && (
                <div className="mt-6 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Top Selling Items Today</h4>
                  <div className="space-y-2">
                    {ledger.soldItems.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-medium text-indigo-600">
                            {idx + 1}
                          </span>
                          <span className="text-gray-700">{item.name}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-gray-500">{item.count} sold</span>
                          <span className="font-medium text-gray-900">₹{Math.round(item.totalRevenue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">No ledger data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Orders Card */}
        <Link href="/admin/orders" className="group">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <FaClipboardList className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Manage Orders</h3>
                  <p className="text-sm text-gray-500">Track and update order status</p>
                </div>
              </div>
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                <span className="text-lg font-bold text-gray-700">→</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Payments Card */}
        <Link href="/admin/payments" className="group">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                  <FaMoneyBillWave className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Manage Payments</h3>
                  <p className="text-sm text-gray-500">Verify payments & track cash</p>
                </div>
              </div>
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                <span className="text-lg font-bold text-gray-700">→</span>
              </div>
            </div>
          </div>
        </Link>
      </div>

    </div>
  );
}
