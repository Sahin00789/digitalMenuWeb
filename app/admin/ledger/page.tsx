'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/services/api';
import toast from 'react-hot-toast';
import {
  FaArrowLeft,
  FaCalendar,
  FaChartLine,
  FaSpinner,
  FaMoneyBillWave,
  FaCreditCard,
  FaUtensils,
  FaClock,
  FaCalendarDay,
  FaCalendarWeek,
  FaCalendarAlt,
  FaListAlt,
  FaClipboardList,
  FaTimes,
  FaCheckCircle,
  FaSkull
} from 'react-icons/fa';

interface Ledger {
  _id: string;
  date: string;
  cash: {
    received: number;
    verified: number;
    pending: number;
    refunded: number;
    balance: number;
  };
  online: {
    received: number;
    verified: number;
    pending: number;
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

interface LedgerTransaction {
  _id: string;
  type: 'PAYMENT' | 'REFUND';
  paymentMode: 'CASH' | 'ONLINE';
  status: 'PENDING' | 'VERIFIED';
  amount: number;
  transactionDate: string;
  createdAt: string;
  meta: {
    orderNumber: string;
    tableNumber?: number;
    deviceId?: string;
    utr?: string;
  };
}

export default function LedgerPage() {
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [weeklyLedgers, setWeeklyLedgers] = useState<Ledger[]>([]);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [transactionFilter, setTransactionFilter] = useState<'today' | 'week'>('today');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'weekly' | 'transactions'>('today');

  useEffect(() => {
    fetchTodayLedger();
    fetchWeeklyLedger();
  }, []);

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions(transactionFilter);
    }
  }, [activeTab, transactionFilter]);

  const fetchTodayLedger = async () => {
    try {
      const response = await api.get('/ledger/today');
      setLedger(response.data.data);
    } catch (error) {
      console.error('Failed to fetch ledger:', error);
      toast.error('Failed to load today\'s ledger');
    }
  };

  const fetchWeeklyLedger = async () => {
    try {
      const response = await api.get('/ledger/weekly');
      setWeeklyLedgers(response.data.data.ledgers || []);
    } catch (error) {
      console.error('Failed to fetch weekly ledger:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async (filter: 'today' | 'week') => {
    try {
      const today = new Date();
      let startDate, endDate;
      
      if (filter === 'today') {
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
      } else {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        startDate = weekStart.toISOString();
        endDate = weekEnd.toISOString();
      }
      
      const response = await api.get(`/ledger/transactions?startDate=${startDate}&endDate=${endDate}`);
      setTransactions(response.data.data.orders || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour} ${period}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <Link
            href="/admin"
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FaArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ledger</h1>
            <p className="text-gray-600">Track daily sales, orders, and transactional truth</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'today'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            <FaCalendarDay className="w-4 h-4" />
            <span>Today</span>
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'weekly'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            <FaCalendarWeek className="w-4 h-4" />
            <span>This Week</span>
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'transactions'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            <FaClipboardList className="w-4 h-4" />
            <span>Audit Journal</span>
          </button>
        </div>
      </div>

      {activeTab === 'today' && ledger && (
        <>
          {/* Today's Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <FaUtensils className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-xs text-indigo-600 font-medium">Total Orders</span>
              </div>
              <p className="text-2xl font-bold text-indigo-900">{ledger.counts.totalOrders}</p>
            </div>

            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <FaCheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-xs text-green-600 font-medium">Served</span>
              </div>
              <p className="text-2xl font-bold text-green-900">{ledger.counts.servedOrders}</p>
            </div>

            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <FaMoneyBillWave className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-xs text-amber-600 font-medium">Cash Balance</span>
              </div>
              <p className="text-2xl font-bold text-amber-900">
                ₹{Math.round(ledger.cash.balance)}
              </p>
              {ledger.cash.refunded > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  -₹{Math.round(ledger.cash.refunded)} refunded
                </p>
              )}
            </div>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaCreditCard className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-xs text-blue-600 font-medium">Online Balance</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                ₹{Math.round(ledger.online.balance)}
              </p>
              {ledger.online.refunded > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  -₹{Math.round(ledger.online.refunded)} refunded
                </p>
              )}
            </div>

            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FaChartLine className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-xs text-purple-600 font-medium">Net Profit</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">
                ₹{Math.round(ledger.total.netBalance)}
              </p>
              {ledger.total.refunded > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  -₹{Math.round(ledger.total.refunded)} total refunds
                </p>
              )}
            </div>

            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <FaSkull className="w-4 h-4 text-red-600" />
                </div>
                <span className="text-xs text-red-600 font-medium">Lost/Rejected</span>
              </div>
              <p className="text-2xl font-bold text-red-900">{ledger.counts.rejectedOrders + ledger.counts.cancelledOrders}</p>
              <p className="text-[10px] text-red-500 mt-0.5">
                {ledger.counts.rejectedOrders} rej | {ledger.counts.cancelledOrders} can
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <FaChartLine className="w-5 h-5 text-indigo-600" />
                <span>Financial Summary</span>
              </h2>

              <div className="space-y-4">
                {/* Cash Summary */}
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <FaMoneyBillWave className="w-5 h-5 text-amber-600" />
                      <span className="font-medium text-amber-900">Cash Details</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">✓ Collected (Verified)</span>
                      <span className="font-semibold">₹{Math.round(ledger.cash.verified)}</span>
                    </div>
                    <div className="flex justify-between text-orange-600">
                      <span>⏳ Pending Collection</span>
                      <span className="font-semibold">₹{Math.round(ledger.cash.pending)}</span>
                    </div>
                    {ledger.cash.refunded > 0 && (
                      <div className="flex justify-between text-red-600 border-t border-amber-200 pt-2 mt-2">
                        <span>↩ Total Refunded</span>
                        <span className="font-semibold">-₹{Math.round(ledger.cash.refunded)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-amber-900 font-bold border-t border-amber-200 pt-2 mt-2 text-base">
                      <span>Net Cash Balance</span>
                      <span>₹{Math.round(ledger.cash.balance)}</span>
                    </div>
                  </div>
                </div>

                {/* Online Summary */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <FaCreditCard className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Online Details</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">✓ Verified Revenue</span>
                      <span className="font-semibold">₹{Math.round(ledger.online.verified)}</span>
                    </div>
                    <div className="flex justify-between text-orange-600">
                      <span>⏳ Pending Verification</span>
                      <span className="font-semibold">₹{Math.round(ledger.online.pending)}</span>
                    </div>
                    {ledger.online.refunded > 0 && (
                      <div className="flex justify-between text-red-600 border-t border-blue-200 pt-2 mt-2">
                        <span>↩ Total Refunded</span>
                        <span className="font-semibold">-₹{Math.round(ledger.online.refunded)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-blue-900 font-bold border-t border-blue-200 pt-2 mt-2 text-base">
                      <span>Net Online Balance</span>
                      <span>₹{Math.round(ledger.online.balance)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Selling Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <FaUtensils className="w-5 h-5 text-indigo-600" />
                <span>Top Selling Items</span>
              </h2>

              {ledger.soldItems && ledger.soldItems.length > 0 ? (
                <div className="space-y-3">
                  {ledger.soldItems.slice(0, 10).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx < 3 ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-600'
                          }`}>
                          {idx + 1}
                        </span>
                        <span className="font-medium text-gray-900">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{item.count} sold</p>
                        <p className="text-sm text-gray-500">₹{Math.round(item.totalRevenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FaUtensils className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No items sold today</p>
                </div>
              )}
            </div>
          </div>

          {/* Hourly Breakdown */}
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <FaClock className="w-5 h-5 text-indigo-600" />
              <span>Hourly Operational Breakdown</span>
            </h2>

            <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-2">
              {ledger.hourlyBreakdown.map((hour) => (
                <div
                  key={hour.hour}
                  className={`p-2 rounded-lg text-center ${hour.orders > 0 ? 'bg-indigo-50 border border-indigo-100' : 'bg-gray-50'
                    }`}
                >
                  <p className="text-[10px] text-gray-500 mb-1">{formatTime(hour.hour)}</p>
                  <p className={`text-lg font-bold ${hour.orders > 0 ? 'text-indigo-600' : 'text-gray-400'}`}>
                    {hour.orders}
                  </p>
                  <p className="text-[10px] text-gray-500">orders</p>
                  {hour.servedOrders > 0 && (
                    <p className="text-[10px] text-green-600 mt-1">{hour.servedOrders} served</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'weekly' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <FaCalendarAlt className="w-5 h-5 text-indigo-600" />
            <span>Weekly Detailed Reports</span>
          </h2>

          {weeklyLedgers.length > 0 ? (
            <div className="space-y-4">
              {weeklyLedgers.map((dayLedger) => (
                <div key={dayLedger._id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <FaCalendarDay className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{formatDate(dayLedger.date)}</p>
                        <p className="text-sm text-gray-500">
                          {dayLedger.counts.totalOrders} total • {dayLedger.counts.servedOrders} served • {dayLedger.counts.rejectedOrders + dayLedger.counts.cancelledOrders} lost
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-indigo-700">
                        ₹{Math.round(dayLedger.total.netBalance)}
                      </p>
                      <p className="text-xs text-gray-500">net profit</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-amber-700 font-medium">Cash Balance</p>
                      <p className="text-amber-900 font-bold">₹{Math.round(dayLedger.cash.balance)}</p>
                      <p className="text-[10px] text-amber-600">Verified: ₹{Math.round(dayLedger.cash.verified)} | Ref: ₹{Math.round(dayLedger.cash.refunded)}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-blue-700 font-medium">Online Balance</p>
                      <p className="text-blue-900 font-bold">₹{Math.round(dayLedger.online.balance)}</p>
                      <p className="text-[10px] text-blue-600">Verified: ₹{Math.round(dayLedger.online.verified)} | Ref: ₹{Math.round(dayLedger.online.refunded)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FaCalendarAlt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No ledger data available for this range</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <FaListAlt className="w-5 h-5 text-indigo-600" />
              <span>Audit Journal (Transactions)</span>
            </h2>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setTransactionFilter('today')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  transactionFilter === 'today'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FaCalendarDay className="w-4 h-4" />
                <span>Today</span>
              </button>
              <button
                onClick={() => setTransactionFilter('week')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  transactionFilter === 'week'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FaCalendarWeek className="w-4 h-4" />
                <span>This Week</span>
              </button>
            </div>
          </div>

          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx._id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-bold text-gray-900">#{tx.meta.orderNumber}</span>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          tx.type === 'PAYMENT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {tx.type}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          tx.paymentMode === 'CASH' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {tx.paymentMode}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          tx.status === 'VERIFIED' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {tx.meta.tableNumber && <span className="mr-2">Table #{tx.meta.tableNumber}</span>}
                        <span className="mr-2">• {new Date(tx.createdAt).toLocaleTimeString()}</span>
                        {tx.meta.utr && <span className="text-indigo-600 ml-2 font-medium">UTR: {tx.meta.utr}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${tx.type === 'REFUND' ? 'text-red-600' : 'text-green-700'}`}>
                        {tx.type === 'REFUND' ? '-' : ''}₹{Math.round(Math.abs(tx.amount))}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium uppercase">{tx.paymentMode} {tx.type}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FaClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-200" />
              <p className="text-lg">No transactions recorded for this period</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
