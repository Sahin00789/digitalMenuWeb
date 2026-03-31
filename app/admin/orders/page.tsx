'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import toast from 'react-hot-toast';
import {
  FaClipboardList,
  FaCheckCircle,
  FaClock,
  FaSpinner,
  FaSearch,
  FaCalendarDay,
  FaTasks,
  FaHome,
  FaStar,
  FaComment,
  FaUsers,
  FaMoneyBillWave,
  FaTimes,
  FaUndo,
  FaCreditCard,
  FaUtensils,
  FaCheck,
  FaHashtag,
  FaExclamationCircle
} from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { socketService } from '@/services/socket';
import { playNotificationSound } from '@/utils/notifications';
import { getTodayISTDateString } from '@/utils/date';

interface Order {
  _id: string;
  orderNumber?: string;
  tableNumber: number;
  customerName: string;
  customerPhone?: string;
  numberOfPersons?: number;
  specialInstructions?: string;
  orderType?: 'dine-in' | 'takeaway' | 'delivery';
  deviceId: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
  status: 'placed' | 'preparing' | 'served' | 'rejected' | 'cancelled';
  paymentMethod?: 'cash' | 'online';
  paymentStatus: 'PENDING' | 'VERIFIED';
  refund: {
    status: 'none' | 'pending' | 'refunded';
    method?: 'cash' | 'online';
    amount?: number;
    processedAt?: string;
  };
  utrNumber?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt?: string;
  feedback?: {
    rating?: number;
    comment?: string;
    submittedAt?: string;
  };
  transactions?: any[];
}

type OrderStatus = 'all' | 'placed' | 'preparing' | 'served' | 'rejected' | 'cancelled';

interface RefundModalData {
  orderId: string;
  orderNumber?: string;
  tableNumber: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'online';
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orderFilter, setOrderFilter] = useState<OrderStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => getTodayISTDateString());
  const { user } = useAuth();
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundModalData, setRefundModalData] = useState<RefundModalData | null>(null);
  const [refundMethod, setRefundMethod] = useState<'cash' | 'online'>('cash');
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // New Payment Verification State
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedOrderForVerify, setSelectedOrderForVerify] = useState<Order | null>(null);
  const [utrInput, setUtrInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const isOrderPaid = (order: Order) => {
    return order.transactions?.some(tx => tx.type === 'PAYMENT' && tx.status === 'VERIFIED') || order.paymentStatus === 'VERIFIED';
  };

  useEffect(() => {
    if (user?._id) {
      socketService.connect();
      socketService.join(user._id);

      socketService.on('newOrder', (order: Order) => {
        toast.success(`New order from Table #${order.tableNumber}!`);
        playNotificationSound();
        fetchOrders();
      });

      socketService.on('orderCancelled', (order: Order) => {
        toast.error(`Order from Table #${order.tableNumber} was cancelled`);
        playNotificationSound();
        fetchOrders();
      });

      socketService.on('orderUpdate', (order: Order) => {
        // Just refetch data to keep UI in sync
        fetchOrders();
      });

      return () => {
        socketService.off('newOrder');
        socketService.off('orderCancelled');
        socketService.off('orderUpdate');
      };
    }
  }, [user?._id]);

  useEffect(() => {
    fetchOrders();
  }, [searchQuery, selectedDate, activeTab]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);

      // Only append date if activeTab is 'today', otherwise send current month/year
      if (activeTab === 'today') {
        params.append('date', selectedDate);
      } else {
        const now = new Date();
        params.append('month', (now.getMonth() + 1).toString());
        params.append('year', now.getFullYear().toString());
      }

      const response = await api.get(`/order?${params.toString()}`);
      setOrders(response.data.data || []);
      if (response.data.stats) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await api.put(`/order/${orderId}/status`, { status });
      const statusMessages: Record<string, string> = {
        placed: 'Order placed and pending',
        preparing: 'Order is now being prepared',
        served: 'Order has been served'
      };
      toast.success(statusMessages[status] || `Order ${status}`);
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(response.data.data);
      }
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const verifyOnlinePayment = async () => {
    if (!selectedOrderForVerify || utrInput.length < 6) {
      toast.error('Please enter last 6 digits of UTR');
      return;
    }
    setIsVerifying(true);
    try {
      const response = await api.put(`/order/${selectedOrderForVerify._id}/verify-payment`, { utrNumber: utrInput });
      toast.success('Payment verified successfully');
      setVerifyModalOpen(false);
      setUtrInput('');

      if (selectedOrder?._id === selectedOrderForVerify._id) {
        setSelectedOrder(response.data.data);
      }

      setSelectedOrderForVerify(null);
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to verify payment');
    } finally {
      setIsVerifying(false);
    }
  };

  const markCashCollected = async (orderId: string) => {
    try {
      const response = await api.put(`/order/${orderId}/collect-cash`);
      toast.success('Cash marked as collected');
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(response.data.data);
      }
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to mark cash collected');
    }
  };

  const rejectOrder = async (orderId: string, reason?: string) => {
    try {
      const response = await api.put(`/order/${orderId}/reject`, { reason });
      toast.success('Order rejected');
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(response.data.data);
      }
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject order');
    }
  };

  const handleRefundClick = (order: Order) => {
    if (!isOrderPaid(order)) {
      toast.error('Order was not paid, no refund needed');
      return;
    }
    setRefundModalData({
      orderId: order._id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod || 'cash'
    });
    setRefundMethod(order.paymentMethod || 'cash');
    setRefundAmount(order.totalAmount.toFixed(2));
    setRefundModalOpen(true);
  };

  const processRefund = async () => {
    if (!refundModalData) return;

    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0 || amount > refundModalData.totalAmount) {
      toast.error('Invalid refund amount');
      return;
    }

    setIsProcessingRefund(true);
    try {
      await api.post(`/order/${refundModalData.orderId}/refund`, {
        refundMethod,
        refundAmount: amount
      });
      toast.success(`Refund of ₹${amount.toFixed(2)} processed successfully`);
      setRefundModalOpen(false);
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process refund');
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const getPaymentStatusDisplay = (order: Order) => {
    const isPaid = isOrderPaid(order);

    // For cancelled/rejected orders that were never paid
    if ((order.status === 'cancelled' || order.status === 'rejected') && !isPaid) {
      return { text: 'Payment not done', color: 'text-gray-500' };
    }

    // For refunded orders
    if (order.refund?.status === 'refunded') {
      return { text: `Refunded ${order.refund.method === 'online' ? '(Online)' : '(Cash)'}`, color: 'text-purple-600' };
    }

    // For pending refunds
    if (order.refund?.status === 'pending') {
      return { text: 'Refund pending', color: 'text-orange-500' };
    }

    // For paid orders
    if (isPaid) {
      return {
        text: order.paymentMethod === 'cash' ? 'Cash Collected' : `Paid ${order.paymentMethod === 'online' ? '(Online)' : '(Cash)'}`,
        color: 'text-green-600'
      };
    }

    // Default pending
    return { text: 'Payment pending', color: 'text-yellow-600' };
  };

  const filteredOrders = orderFilter === 'all'
    ? orders
    : orders.filter((o: Order) => o.status === orderFilter);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      placed: 'bg-amber-100 text-amber-700 border-amber-200',
      preparing: 'bg-blue-100 text-blue-700 border-blue-200',
      served: 'bg-green-100 text-green-700 border-green-200',
      rejected: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const orderCounts = stats || {
    all: orders.length,
    placed: orders.filter((o: Order) => o.status === 'placed').length,
    preparing: orders.filter((o: Order) => o.status === 'preparing').length,
    served: orders.filter((o: Order) => o.status === 'served').length,
    rejected: orders.filter((o: Order) => o.status === 'rejected').length,
    cancelled: orders.filter((o: Order) => o.status === 'cancelled').length,
  };

  const paymentStats = stats || {
    totalRevenue: orders
      .filter(o => o.paymentStatus === 'VERIFIED' && o.refund?.status !== 'refunded')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    onlinePending: 0,
    cashPending: 0,
    totalRefunds: 0,
    totalRefundAmount: 0,
    cashGross: 0,
    cashRefunded: 0,
    onlineGross: 0,
    onlineRefunded: 0
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Tabs & Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders & Payments</h1>
            <p className="text-sm text-gray-500 mt-1">Manage real-time orders and verify payments</p>
          </div>

          <div className="flex items-center bg-gray-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('today')}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'today'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Today
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'all'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              All Orders
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                <FaClipboardList className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Total</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{orders.length}</p>
            <p className="text-[10px] text-gray-500 mt-1">{activeTab === 'today' ? "Today's" : "All-time"} orders</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm border-l-red-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                <FaTimes className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-[10px] font-black text-red-400 uppercase tracking-wider">Cancelled</span>
            </div>
            <p className="text-xl font-bold text-red-600">{orderCounts.cancelled}</p>
            <p className="text-[10px] text-gray-500 mt-1">Orders cancelled</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm border-l-yellow-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center">
                <FaExclamationCircle className="w-4 h-4 text-yellow-600" />
              </div>
              <span className="text-[10px] font-black text-yellow-500 uppercase tracking-wider">Rejected</span>
            </div>
            <p className="text-xl font-bold text-yellow-600">{orderCounts.rejected}</p>
            <p className="text-[10px] text-gray-500 mt-1">Orders rejected</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <FaCreditCard className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">Online</span>
            </div>
            <p className="text-xl font-bold text-blue-600">{paymentStats.onlinePending}</p>
            <p className="text-[10px] text-gray-500 mt-1">Verification pending</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <FaMoneyBillWave className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Cash</span>
            </div>
            <p className="text-xl font-bold text-amber-600">{paymentStats.cashPending}</p>
            <p className="text-[10px] text-gray-500 mt-1">Collection pending</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm border-l-green-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                <FaCheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-[10px] font-black text-green-400 uppercase tracking-wider">Revenue</span>
            </div>
            <p className="text-xl font-bold text-green-600">₹{paymentStats.totalRevenue.toFixed(0)}</p>
            <p className="text-[10px] text-gray-500 mt-1">From {activeTab === 'today' ? 'today' : 'all'}</p>
          </div>
        </div>

        {/* Financial Summaries (Cash vs Online) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Cash Summary Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-all">
            <div className="bg-amber-50/50 px-4 py-3 border-b border-amber-100/50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
                  <FaMoneyBillWave className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <h3 className="text-sm font-black text-amber-900 uppercase tracking-tight">Cash Summary</h3>
              </div>
              <span className="text-[10px] font-black text-amber-600/50 uppercase tracking-widest">Today</span>
            </div>
            <div className="p-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Gross Received</p>
                <p className="text-base font-black text-gray-900">₹{paymentStats.cashGross.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Total Refunded</p>
                <p className="text-base font-black text-red-600">₹{paymentStats.cashRefunded.toFixed(0)}</p>
              </div>
              <div className="bg-amber-50/30 p-2 rounded-xl border border-amber-100/30">
                <p className="text-[9px] font-black text-amber-600 uppercase mb-1 tracking-tighter">Net Cash</p>
                <p className="text-lg font-black text-amber-700">₹{(paymentStats.cashGross - paymentStats.cashRefunded).toFixed(0)}</p>
              </div>
            </div>
          </div>

          {/* Online Summary Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-all">
            <div className="bg-blue-50/50 px-4 py-3 border-b border-blue-100/50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaCreditCard className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <h3 className="text-sm font-black text-blue-900 uppercase tracking-tight">Online Summary</h3>
              </div>
              <span className="text-[10px] font-black text-blue-600/50 uppercase tracking-widest">Today</span>
            </div>
            <div className="p-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Gross Received</p>
                <p className="text-base font-black text-gray-900">₹{paymentStats.onlineGross.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Total Refunded</p>
                <p className="text-base font-black text-red-600">₹{paymentStats.onlineRefunded.toFixed(0)}</p>
              </div>
              <div className="bg-blue-50/30 p-2 rounded-xl border border-blue-100/30">
                <p className="text-[9px] font-black text-blue-600 uppercase mb-1 tracking-tighter">Net Online</p>
                <p className="text-lg font-black text-blue-700">₹{(paymentStats.onlineGross - paymentStats.onlineRefunded).toFixed(0)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative w-full md:w-64 lg:w-72 shrink-0">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm shadow-sm transition-all placeholder:text-gray-400 font-medium"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center bg-gray-100/80 border border-gray-200/50 rounded-2xl p-1.5 shadow-inner overflow-x-auto no-scrollbar scroll-smooth">
            {(['all', 'placed', 'preparing', 'served', 'rejected', 'cancelled'] as OrderStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setOrderFilter(status)}
                className={`px-5 py-2.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-all duration-300 uppercase tracking-widest flex items-center space-x-2.5 ${orderFilter === status
                  ? 'bg-white text-indigo-600 shadow-lg shadow-indigo-100 scale-[1.02] border border-indigo-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/40'
                  }`}
              >
                <span>{status}</span>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${orderFilter === status ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-200/50 text-gray-400'}`}>
                  {status === 'all' ? orderCounts.totalOrders || orderCounts.all : (orderCounts as any)[status] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'today' && (
          <div className="w-full md:w-auto flex items-center space-x-3 bg-white border border-gray-100/50 px-4 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all group shrink-0">
            <FaCalendarDay className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-none focus:ring-0 p-0 text-xs font-black text-gray-700 uppercase tracking-widest bg-transparent cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Orders Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-2 no-scrollbar">
        <AnimatePresence mode="wait">
          {filteredOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-20 text-center"
            >
              <FaClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">No orders found</p>
            </motion.div>
          ) : (
            <motion.div
              layout
              className={`grid gap-4 pb-10 ${activeTab === 'today'
                ? 'grid-cols-1 lg:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
                }`}
            >
              {filteredOrders.map((order) => (
                <motion.div
                  key={order._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`relative rounded-[2rem] border transition-all duration-300 overflow-hidden group/card shadow-sm hover:shadow-xl ${order.status === 'placed' ? 'bg-amber-50/50 border-amber-100/50 hover:border-amber-200' :
                    order.status === 'preparing' ? 'bg-blue-50/50 border-blue-100/50 hover:border-blue-200' :
                      order.status === 'served' ? 'bg-green-50/50 border-green-100/50 hover:border-green-200' :
                        order.status === 'rejected' ? 'bg-yellow-50/50 border-yellow-100/50 hover:border-yellow-200' :
                          order.status === 'cancelled' ? 'bg-red-50/50 border-red-100/50 hover:border-red-200' :
                            'bg-white border-gray-100'
                    } {!isOrderPaid(order) && order.paymentMethod === 'cash'
                      ? 'ring-2 ring-amber-400 ring-offset-2 shadow-amber-100'
                      : ''
                    }`}
                >
                  {/* Today Tab - Larger Card */}
                  {activeTab === 'today' ? (
                    <div className="flex flex-col h-full relative group/card">
                      {/* Premium Card Header */}
                      <div className={`p-5 border-b border-gray-100/50 flex items-center justify-between transition-colors duration-300 ${order.status === 'placed' ? 'bg-gradient-to-br from-amber-50/80 to-white/40' :
                        order.status === 'preparing' ? 'bg-gradient-to-br from-blue-50/80 to-white/40' :
                          order.status === 'served' ? 'bg-gradient-to-br from-green-50/80 to-white/40' :
                            order.status === 'rejected' ? 'bg-gradient-to-br from-yellow-50/80 to-white/40' :
                              'bg-gradient-to-br from-red-50/80 to-white/40'
                        }`}>
                        <div className="flex items-center space-x-4">
                          <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl transition-transform duration-300 group-hover/card:scale-110 ${order.status === 'placed' ? 'bg-white text-amber-600 shadow-amber-200/50 border border-amber-100' :
                            order.status === 'preparing' ? 'bg-white text-blue-600 shadow-blue-200/50 border border-blue-100' :
                              order.status === 'served' ? 'bg-white text-green-600 shadow-green-200/50 border border-green-100' :
                                order.status === 'rejected' ? 'bg-white text-yellow-600 shadow-yellow-200/50 border border-yellow-100' :
                                  'bg-white text-red-600 shadow-red-200/50 border border-red-100'
                            }`}>
                            {order.tableNumber}
                            {order.status === 'placed' && (
                              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover/card:text-indigo-600 transition-colors uppercase tracking-tight">{order.customerName}</h3>
                              {order.numberOfPersons && (
                                <span className="flex items-center space-x-1 px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-black text-gray-500">
                                  <FaUsers className="w-2.5 h-2.5" />
                                  <span>{order.numberOfPersons}</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center mt-2">
                              <span className="text-sm font-black text-gray-600 flex items-center bg-white/60 px-2.5 py-1 rounded-xl border border-gray-100 shadow-sm group-hover/card:bg-white transition-colors">
                                <FaClock className="mr-2 text-indigo-500 w-3.5 h-3.5" />
                                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-indigo-600 tracking-tighter">₹{order.totalAmount}</p>
                          <span className={`inline-flex items-center mt-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${order.status === 'placed' ? 'bg-amber-100/50 text-amber-700 border border-amber-200/50' :
                            order.status === 'preparing' ? 'bg-blue-100/50 text-blue-700 border border-blue-200/50' :
                              order.status === 'served' ? 'bg-green-100/50 text-green-700 border border-green-200/50' :
                                order.status === 'rejected' ? 'bg-yellow-100/50 text-yellow-700 border border-yellow-200/50' :
                                  'bg-red-100/50 text-red-700 border border-red-200/50'
                            }`}>
                            {order.status === 'placed' && <FaSpinner className="animate-spin mr-1.5 w-2 h-2" />}
                            {order.status === 'preparing' && <FaUtensils className="mr-1.5 w-2 h-2" />}
                            {order.status === 'served' && <FaCheck className="mr-1.5 w-2 h-2" />}
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Premium Card Content */}
                      <div className="p-5 flex-1 flex flex-col min-h-0 bg-white/40">
                        <div className="flex-1 min-h-0 mb-4">
                          <div className="flex justify-between items-center text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">
                            <span className="flex items-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2"></span>
                              ITEMS ({order.items.length})
                            </span>
                            <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg border border-indigo-100/50">
                              {order.items.reduce((sum, item) => sum + item.quantity, 0)} Total Qty
                            </span>
                          </div>
                          <div className="space-y-2.5 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                            {order.items.map((item, i) => (
                              <div key={i} className="flex justify-between items-center bg-gray-50/50 hover:bg-indigo-50/30 p-2 rounded-xl transition-all border border-transparent hover:border-indigo-100/30 group/item">
                                <div className="flex items-center space-x-3">
                                  <span className="w-8 h-8 rounded-lg bg-white border border-gray-200/50 flex items-center justify-center text-xs font-black text-indigo-600 shadow-sm group-hover/item:scale-110 transition-transform">
                                    {item.quantity}x
                                  </span>
                                  <span className="text-sm font-bold text-gray-700 group-hover/item:text-gray-900 transition-colors">{item.name}</span>
                                </div>
                                <span className="text-xs font-black text-gray-400 group-hover/item:text-indigo-600 transition-colors font-mono">₹{item.price * item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Status Info Row */}
                        <div className="flex flex-col space-y-2.5 pb-1">
                          <div className="grid grid-cols-2 gap-3">
                            <div className={`group/stat relative p-3 rounded-2xl border transition-all duration-300 ${isOrderPaid(order)
                              ? 'bg-green-50/30 border-green-100/50 hover:bg-green-50/50'
                              : 'bg-amber-50/30 border-amber-100/50 hover:bg-amber-50/50'
                              }`}>
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg transition-transform group-hover/stat:rotate-12 ${isOrderPaid(order) ? 'bg-white text-green-600 shadow-sm' : 'bg-white text-amber-600 shadow-sm'
                                  }`}>
                                  {order.paymentMethod === 'online' ? <FaCreditCard className="w-3.5 h-3.5" /> : <FaMoneyBillWave className="w-3.5 h-3.5" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">PAYMENT</p>
                                  <p className={`text-[11px] font-black truncate ${isOrderPaid(order) ? 'text-green-600' : 'text-amber-600'} flex items-center`}>
                                    {isOrderPaid(order) && <FaCheckCircle className="mr-1 w-2.5 h-2.5" />}
                                    <span className="capitalize">{order.paymentMethod || 'Cash'}</span>
                                  </p>
                                  <p className="text-[8px] text-gray-400 font-bold mt-0.5 whitespace-nowrap">
                                    {isOrderPaid(order)
                                      ? `Verified at ${new Date(order.updatedAt || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                      : 'Verification Pending'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="group/stat bg-indigo-50/30 border border-indigo-100/50 p-3 rounded-2xl flex items-center space-x-3 transition-all duration-300 hover:bg-indigo-50/50">
                              <div className="w-8 h-8 bg-white text-indigo-600 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover/stat:scale-110">
                                <FaHashtag className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">ORDER ID</p>
                                <p className="text-[11px] font-black text-indigo-700 truncate">#{order.orderNumber || order._id.slice(-6)}</p>
                              </div>
                            </div>
                          </div>

                          {/* REFUND BLOCK - Only for rejected/cancelled paid orders */}
                          {order.refund && order.refund.status !== 'none' && (
                            <div className={`group/stat relative p-3 rounded-2xl border transition-all duration-300 ${order.refund.status === 'refunded'
                              ? 'bg-purple-50/30 border-purple-100/50 hover:bg-purple-50/50'
                              : 'bg-orange-50/30 border-orange-100/50 hover:bg-orange-50/50'
                              }`}>
                              <div className="flex items-center justify-between transition-all">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg transition-transform group-hover/stat:rotate-12 ${order.refund.status === 'refunded' ? 'bg-white text-purple-600 shadow-sm' : 'bg-white text-orange-600 shadow-sm'
                                    }`}>
                                    <FaUndo className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">REFUND</p>
                                    <p className={`text-[11px] font-black truncate ${order.refund.status === 'refunded' ? 'text-purple-600' : 'text-orange-600'} flex items-center`}>
                                      {order.refund.status === 'refunded' ? 'Refunded' : 'Refund Pending'} (₹{order.refund.amount || order.totalAmount})
                                    </p>
                                    <p className="text-[8px] text-gray-400 font-bold mt-0.5 flex items-center uppercase tracking-tighter">
                                      {order.refund.method || order.paymentMethod}
                                      {order.refund.processedAt && (
                                        <>
                                          <span className="mx-1 opacity-50">•</span>
                                          <span>{new Date(order.refund.processedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </>
                                      )}
                                    </p>
                                  </div>
                                </div>
                                {order.refund.status === 'refunded' && <FaCheckCircle className="w-4 h-4 text-purple-500 mr-2 shrink-0" />}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Order Info Blocks (Special Instructions, Feedback, Reasons) */}
                        {order.specialInstructions && (
                          <div className="mt-3 p-3 bg-amber-50/50 border border-amber-100/50 rounded-xl text-[11px] text-amber-700 italic flex items-start space-x-2">
                            <FaComment className="mt-0.5 shrink-0 opacity-50" />
                            <span className="leading-tight font-medium">"{order.specialInstructions}"</span>
                          </div>
                        )}

                        {/* Feedback (if any) */}
                        {(order.feedback?.rating || order.feedback?.comment) && (
                          <div className="mt-3 p-3 bg-purple-50/50 border border-purple-100/50 rounded-xl text-[11px] text-purple-700 flex flex-col space-y-1">
                            <div className="flex items-center space-x-1 mb-1">
                              {[...Array(5)].map((_, i) => (
                                <FaStar key={i} className={`w-2.5 h-2.5 ${i < (order.feedback?.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} />
                              ))}
                              <span className="text-[10px] font-black uppercase ml-1 opacity-70">Customer Feedback</span>
                            </div>
                            {order.feedback?.comment && (
                              <p className="leading-tight font-medium italic">"{order.feedback.comment}"</p>
                            )}
                          </div>
                        )}

                        {/* Rejection/Cancellation Reason */}
                        {order.status === 'rejected' && order.rejectionReason && (
                          <div className="mt-3 p-3 bg-yellow-50/50 border border-yellow-100/50 rounded-xl text-[11px] text-yellow-700 flex items-start space-x-2">
                            <FaExclamationCircle className="mt-0.5 shrink-0 opacity-50" />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase opacity-70">Rejection Reason</span>
                              <span className="leading-tight font-medium">"{order.rejectionReason}"</span>
                            </div>
                          </div>
                        )}

                        {order.status === 'cancelled' && order.cancellationReason && (
                          <div className="mt-3 p-3 bg-red-50/50 border border-red-100/50 rounded-xl text-[11px] text-red-700 flex items-start space-x-2">
                            <FaExclamationCircle className="mt-0.5 shrink-0 opacity-50" />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase opacity-70">Cancellation Reason</span>
                              <span className="leading-tight font-medium">"{order.cancellationReason}"</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Premium Action Bar */}
                      <div className={`p-5 rounded-b-2xl border-t transition-all duration-300 ${order.status === 'placed' ? 'bg-amber-50/20 border-amber-100/50' :
                        order.status === 'preparing' ? 'bg-blue-50/20 border-blue-100/50' :
                          order.status === 'served' ? 'bg-green-50/20 border-green-100/50' :
                            'bg-gray-50/20 border-gray-100/50'
                        }`}>
                        <div className="flex flex-wrap gap-3">
                          {/* Main Status Actions */}
                          {order.status === 'placed' && (
                            <button
                              onClick={() => updateOrderStatus(order._id, 'preparing')}
                              disabled={order.paymentMethod === 'online' && !isOrderPaid(order)}
                              className={`flex-1 min-w-[120px] h-12 rounded-xl font-black text-xs transition-all duration-300 flex items-center justify-center space-x-2 group/btn ${order.paymentMethod === 'online' && !isOrderPaid(order)
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200/50 hover:-translate-y-0.5 active:translate-y-0'
                                }`}
                            >
                              <FaCheck className="w-3 h-3 transition-transform group-hover/btn:scale-110" />
                              <span className="uppercase tracking-widest">Approve Order</span>
                            </button>
                          )}
                          {order.status === 'preparing' && (
                            <button
                              onClick={() => updateOrderStatus(order._id, 'served')}
                              className="flex-1 min-w-[120px] h-12 bg-green-600 text-white rounded-xl font-black text-xs transition-all duration-300 flex items-center justify-center space-x-2 hover:bg-green-700 shadow-lg shadow-green-200/50 hover:-translate-y-0.5 active:translate-y-0 group/btn"
                            >
                              <div className="w-6 h-6 rounded-lg bg-green-500/50 flex items-center justify-center text-xs">
                                <FaUtensils className="w-3 h-3 group-hover/btn:rotate-12 transition-transform" />
                              </div>
                              <span className="uppercase tracking-widest">Serve Items</span>
                            </button>
                          )}

                          {/* Payment Support Actions */}
                          {order.paymentMethod === 'online' && !isOrderPaid(order) && (
                            <button
                              onClick={() => {
                                setSelectedOrderForVerify(order);
                                setVerifyModalOpen(true);
                              }}
                              className="flex-1 min-w-[120px] h-12 bg-blue-600 text-white rounded-xl font-black text-xs transition-all duration-300 flex items-center justify-center space-x-2 hover:bg-blue-700 shadow-lg shadow-blue-200/50 hover:-translate-y-0.5 active:translate-y-0 group/btn"
                            >
                              <FaCreditCard className="w-3 h-3 group-hover/btn:scale-110 transition-transform" />
                              <span className="uppercase tracking-widest">Verify Payment</span>
                            </button>
                          )}
                          {order.paymentMethod === 'cash' && !isOrderPaid(order) && (
                            <button
                              onClick={() => markCashCollected(order._id)}
                              className="flex-1 min-w-[120px] h-12 bg-amber-600 text-white rounded-xl font-black text-xs transition-all duration-300 flex items-center justify-center space-x-2 hover:bg-amber-700 shadow-lg shadow-amber-200/50 hover:-translate-y-0.5 active:translate-y-0 group/btn"
                            >
                              <FaMoneyBillWave className="w-3 h-3 group-hover/btn:rotate-12 transition-transform" />
                              <span className="uppercase tracking-widest">Collect Cash</span>
                            </button>
                          )}

                          {/* Refund Action */}
                          {(order.status === 'cancelled' || order.status === 'rejected') &&
                            isOrderPaid(order) &&
                            order.refund?.status !== 'refunded' && (
                              <button
                                onClick={() => handleRefundClick(order)}
                                className="h-12 px-6 bg-purple-600 text-white rounded-xl font-black text-xs transition-all duration-300 flex items-center justify-center space-x-2 hover:bg-purple-700 shadow-lg shadow-purple-200/50 hover:-translate-y-0.5 active:translate-y-0 group/btn"
                              >
                                <FaUndo className="w-3 h-3 group-hover/btn:-rotate-45 transition-transform" />
                                <span className="uppercase tracking-widest">Refund</span>
                              </button>
                            )}

                          {/* Secondary Quick Actions */}
                          <div className="flex gap-2">
                            {(order.status === 'placed') && (
                              <button
                                onClick={() => rejectOrder(order._id)}
                                className="w-12 h-12 bg-white border border-red-100 text-red-500 rounded-xl hover:bg-red-50 transition-all flex items-center justify-center shadow-sm hover:shadow-md active:scale-95 group/reject"
                                title="Reject Order"
                              >
                                <FaTimes className="w-4 h-4 group-hover/reject:rotate-90 transition-transform" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* All Tab - Compact Card (status-tinted) */
                    <div className={`p-4 backdrop-blur-sm group/compact transition-all duration-300 border-b border-gray-100 last:border-0 ${order.status === 'placed' ? 'bg-amber-50/40 hover:bg-amber-50/60' :
                      order.status === 'preparing' ? 'bg-blue-50/40 hover:bg-blue-50/60' :
                        order.status === 'served' ? 'bg-green-50/40 hover:bg-green-50/60' :
                          order.status === 'rejected' ? 'bg-yellow-50/40 hover:bg-yellow-50/60' :
                            order.status === 'cancelled' ? 'bg-red-50/40 hover:bg-red-50/60' :
                              'bg-white/40 hover:bg-white/60'
                      } ${(!isOrderPaid(order) && order.paymentMethod === 'cash')
                        ? 'border-l-4 border-l-amber-400'
                        : ''
                      }`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-sm shrink-0 transition-transform group-hover/compact:scale-110 ${order.status === 'placed' ? 'bg-amber-100/50 text-amber-700' :
                            order.status === 'preparing' ? 'bg-blue-100/50 text-blue-700' :
                              order.status === 'served' ? 'bg-green-100/50 text-green-700' :
                                'bg-gray-100/50 text-gray-700'
                            }`}>
                            {order.tableNumber}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-gray-900 truncate text-sm leading-tight group-hover/compact:text-indigo-600 transition-colors uppercase tracking-tight">{order.customerName}</h3>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5 uppercase">
                              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black text-indigo-600">₹{order.totalAmount}</p>
                          <span className={`inline-block mt-1 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col pt-3 border-t border-gray-100/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex -space-x-2">
                            {order.items.slice(0, 3).map((_, i) => (
                              <div key={i} className="w-6 h-6 rounded-lg border-2 border-white bg-gray-50 flex items-center justify-center text-[8px] font-black text-gray-400 shadow-sm">
                                {i === 2 && order.items.length > 3 ? `+${order.items.length - 2}` : <FaUtensils className="w-2.5 h-2.5 opacity-30" />}
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setDetailModalOpen(true);
                            }}
                            className="text-[10px] font-black text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg transition-all uppercase tracking-widest border border-indigo-100/50 hover:shadow-md"
                          >
                            Details
                          </button>
                        </div>

                        {/* Compact Feedback or Reasons */}
                        {((order.feedback?.rating || order.feedback?.comment) ||
                          (order.status === 'rejected' && order.rejectionReason) ||
                          (order.status === 'cancelled' && order.cancellationReason)) && (
                            <div className="pt-2 flex flex-col space-y-1 border-t border-gray-100/30">
                              {order.feedback?.rating && (
                                <div className="flex items-center space-x-1">
                                  <FaStar className="w-2 h-2 text-yellow-400" />
                                  <span className="text-[9px] font-black text-purple-600 uppercase">Feedback Given</span>
                                </div>
                              )}
                              {(order.rejectionReason || order.cancellationReason) && (
                                <div className="flex items-center space-x-1">
                                  <FaExclamationCircle className={`w-2 h-2 ${order.status === 'rejected' ? 'text-yellow-500' : 'text-red-500'}`} />
                                  <span className={`text-[9px] font-black uppercase ${order.status === 'rejected' ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {order.status === 'rejected' ? 'Rejected' : 'Cancelled'} Reason
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                        {/* Quick Actions for Compact Card */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {order.status === 'placed' && (
                            <>
                              <button
                                onClick={() => updateOrderStatus(order._id, 'preparing')}
                                disabled={order.paymentMethod === 'online' && !isOrderPaid(order)}
                                className={`flex-1 h-8 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${order.paymentMethod === 'online' && !isOrderPaid(order)
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-indigo-600 text-white shadow-sm hover:shadow-indigo-200'
                                  }`}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => rejectOrder(order._id)}
                                className="w-8 h-8 flex items-center justify-center bg-white border border-red-100 text-red-500 rounded-lg hover:bg-red-50 transition-all shadow-sm"
                                title="Reject"
                              >
                                <FaTimes className="w-3 h-3" />
                              </button>
                            </>
                          )}
                          {order.status === 'preparing' && (
                            <button
                              onClick={() => updateOrderStatus(order._id, 'served')}
                              className="flex-1 h-8 bg-green-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm hover:shadow-green-200 transition-all"
                            >
                              Serve
                            </button>
                          )}
                          {order.paymentMethod === 'online' && !isOrderPaid(order) && (
                            <button
                              onClick={() => {
                                setSelectedOrderForVerify(order);
                                setVerifyModalOpen(true);
                              }}
                              className="flex-1 h-8 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm hover:shadow-blue-200 transition-all"
                            >
                              Verify
                            </button>
                          )}
                          {order.paymentMethod === 'cash' && !isOrderPaid(order) && (
                            <button
                              onClick={() => markCashCollected(order._id)}
                              className="flex-1 h-8 bg-amber-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm hover:shadow-amber-200 transition-all"
                            >
                              Collect
                            </button>
                          )}

                          {/* Refund Action for Compact Card */}
                          {(order.status === 'cancelled' || order.status === 'rejected') &&
                            isOrderPaid(order) &&
                            order.refund?.status !== 'refunded' && (
                              <button
                                onClick={() => handleRefundClick(order)}
                                className="flex-1 h-8 bg-purple-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm hover:shadow-purple-200 transition-all"
                              >
                                Refund
                              </button>
                            )}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
              }
            </motion.div >
          )}
        </AnimatePresence >
      </div >

      {/* Order Detail Modal */}
      <AnimatePresence>
        {
          detailModalOpen && selectedOrder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
              onClick={() => setDetailModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-br from-indigo-50/50 to-white/30 backdrop-blur-md">
                  <div className="flex items-center space-x-5">
                    <div className="relative">
                      <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-indigo-200/50 transition-transform hover:scale-105 active:scale-95">
                        {selectedOrder.tableNumber}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-lg shadow-md flex items-center justify-center border border-gray-100">
                        <FaUtensils className="w-3 h-3 text-indigo-500" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 leading-tight uppercase tracking-tight">{selectedOrder.customerName}</h2>
                      <div className="flex items-center space-x-3 mt-1.5">
                        <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg uppercase tracking-widest border border-gray-200/50">#{selectedOrder.orderNumber || selectedOrder._id.slice(-6)}</span>
                        <span className="text-gray-300">•</span>
                        <span className={`inline-flex items-center text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest ${getStatusColor(selectedOrder.status)}`}>
                          {selectedOrder.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setDetailModalOpen(false)}
                    className="p-3 hover:bg-gray-100 rounded-2xl transition-all hover:rotate-90 active:scale-95 group"
                  >
                    <FaTimes className="w-6 h-6 text-gray-300 group-hover:text-red-500 transition-colors" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  {/* Items List */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center">
                      <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></span>
                      Ordered Items
                    </h4>
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1">
                          <div className="flex items-center space-x-3">
                            <span className="w-8 h-8 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-indigo-600">
                              {item.quantity}x
                            </span>
                            <span className="text-sm font-semibold text-gray-700">{item.name}</span>
                          </div>
                          <span className="text-sm font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="pt-3 mt-3 border-t border-gray-200 flex justify-between items-center font-bold text-lg">
                        <span className="text-gray-900">Total Amount</span>
                        <span className="text-indigo-600">₹{selectedOrder.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-50">
                      <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Customer Info</h4>
                      <p className="text-sm font-bold text-gray-800">{selectedOrder.customerPhone || 'No phone provided'}</p>
                      <p className="text-xs text-gray-500 mt-1 uppercase font-black tracking-tighter">{selectedOrder.numberOfPersons || 0} Persons • {new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>

                    <div className="flex flex-col space-y-4">
                      {/* Payment Card */}
                      <div className={`group/modal-card relative p-4 rounded-2xl border transition-all duration-300 ${isOrderPaid(selectedOrder)
                        ? 'bg-green-50/50 border-green-100/50'
                        : 'bg-amber-50/50 border-amber-100/50'
                        }`}>
                        <h4 className={`text-[10px] font-black uppercase tracking-widest mb-2.5 ${isOrderPaid(selectedOrder) ? 'text-green-500' : 'text-amber-500'}`}>Payment Details</h4>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-black text-gray-900 capitalize flex items-center">
                              {selectedOrder.paymentMethod === 'online' ? <FaCreditCard className="mr-2 opacity-50" /> : <FaMoneyBillWave className="mr-2 opacity-50" />}
                              {selectedOrder.paymentMethod || 'Cash'} Payment
                            </p>
                            <div className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${isOrderPaid(selectedOrder) ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                              {isOrderPaid(selectedOrder) && <FaCheckCircle className="mr-1 w-2.5 h-2.5" />}
                              {isOrderPaid(selectedOrder) ? 'Verified / Paid' : 'Pending'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Refund Card */}
                      {(selectedOrder.status === 'rejected' || selectedOrder.status === 'cancelled') && isOrderPaid(selectedOrder) && selectedOrder.refund?.status !== 'none' && (
                        <div className={`group/modal-card relative p-4 rounded-2xl border transition-all duration-300 ${selectedOrder.refund.status === 'refunded'
                          ? 'bg-purple-50/50 border-purple-100/50'
                          : 'bg-orange-50/50 border-orange-100/50'
                          }`}>
                          <h4 className={`text-[10px] font-black uppercase tracking-widest mb-2.5 ${selectedOrder.refund.status === 'refunded' ? 'text-purple-500' : 'text-orange-500'}`}>Refund Details</h4>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-black text-gray-900 capitalize flex items-center">
                                <FaUndo className="mr-2 opacity-50" />
                                Mode: {selectedOrder.refund.method || selectedOrder.paymentMethod}
                              </p>
                              <div className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${selectedOrder.refund.status === 'refunded' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                                {selectedOrder.refund.status === 'refunded' ? `Refunded ₹${selectedOrder.refund.amount}` : 'Refund Pending'}
                              </div>
                            </div>
                            {selectedOrder.refund.processedAt && (
                              <div className="text-right">
                                <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Time</p>
                                <p className="text-[10px] font-bold text-gray-600 bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm whitespace-nowrap">
                                  {new Date(selectedOrder.refund.processedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Instructions */}
                  {selectedOrder.specialInstructions && (
                    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                      <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2 flex items-center">
                        <FaComment className="mr-1.5" /> Instructions
                      </h4>
                      <p className="text-sm text-amber-800 font-medium italic">"{selectedOrder.specialInstructions}"</p>
                    </div>
                  )}

                  {/* Feedback */}
                  {(selectedOrder.feedback?.rating || selectedOrder.feedback?.comment) && (
                    <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                      <h4 className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mb-2 flex items-center">
                        <FaStar className="mr-1.5" /> Customer Feedback
                      </h4>
                      <div className="flex items-center space-x-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <FaStar key={i} className={`w-3 h-3 ${i < (selectedOrder.feedback?.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <p className="text-sm text-purple-800 italic">"{selectedOrder.feedback?.comment}"</p>
                    </div>
                  )}
                </div>

                {/* Modal Footer - Actions */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-end gap-3">
                  {/* Payment Actions */}
                  {selectedOrder.paymentMethod === 'online' && !isOrderPaid(selectedOrder) && (
                    <button
                      onClick={() => {
                        setSelectedOrderForVerify(selectedOrder);
                        setVerifyModalOpen(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center space-x-2"
                    >
                      <FaCreditCard />
                      <span>Verify Payment</span>
                    </button>
                  )}

                  {selectedOrder.paymentMethod === 'cash' && !isOrderPaid(selectedOrder) && (
                    <button
                      onClick={() => markCashCollected(selectedOrder._id)}
                      className="px-4 py-2 bg-amber-600 text-white text-sm font-bold rounded-xl hover:bg-amber-700 transition-all flex items-center space-x-2"
                    >
                      <FaMoneyBillWave />
                      <span>Collect Cash</span>
                    </button>
                  )}

                  {/* Status Actions */}
                  {selectedOrder.status === 'placed' && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(selectedOrder._id, 'preparing')}
                        disabled={selectedOrder.paymentMethod === 'online' && !isOrderPaid(selectedOrder)}
                        className={`px-5 py-2 text-white text-sm font-bold rounded-xl transition-all ${selectedOrder.paymentMethod === 'online' && !isOrderPaid(selectedOrder)
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                          }`}
                      >
                        Approve Order
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Enter rejection reason (optional):');
                          rejectOrder(selectedOrder._id, reason || undefined);
                        }}
                        className="px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-bold rounded-xl hover:bg-red-50 transition-all"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {selectedOrder.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder._id, 'served')}
                      className="px-5 py-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-100 transition-all"
                    >
                      Mark as Served
                    </button>
                  )}

                  {/* Refund Action */}
                  {(selectedOrder.status === 'cancelled' || selectedOrder.status === 'rejected') &&
                    isOrderPaid(selectedOrder) &&
                    selectedOrder.refund?.status !== 'refunded' && (
                      <button
                        onClick={() => handleRefundClick(selectedOrder)}
                        className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 transition-all flex items-center space-x-2"
                      >
                        <FaUndo />
                        <span>Refund</span>
                      </button>
                    )}

                  {/* Close Button UI-wise redundant but good for accessibility */}
                  <button
                    onClick={() => setDetailModalOpen(false)}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )
        }
      </AnimatePresence >

      {/* Verify Payment Modal */}
      <AnimatePresence>
        {
          verifyModalOpen && selectedOrderForVerify && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => !isVerifying && setVerifyModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 25 }}
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FaCreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Verify Online Payment
                    </h2>
                  </div>
                  <button
                    onClick={() => !isVerifying && setVerifyModalOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Order</p>
                      <p className="text-lg font-bold text-gray-900">#{selectedOrderForVerify.orderNumber || selectedOrderForVerify._id.slice(-6)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Table</p>
                      <p className="text-lg font-bold text-gray-900">#{selectedOrderForVerify.tableNumber}</p>
                    </div>
                  </div>

                  <div className="bg-indigo-50 rounded-lg p-4">
                    <p className="text-xs text-indigo-600 font-medium">Amount to Verify</p>
                    <p className="text-2xl font-bold text-indigo-700">₹{selectedOrderForVerify.totalAmount.toFixed(2)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last 6 digits of UTR Number
                    </label>
                    <input
                      type="text"
                      value={utrInput}
                      onChange={(e) => setUtrInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter last 6 digits"
                      maxLength={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center tracking-widest font-mono text-xl font-bold"
                    />
                    <p className="text-xs text-center text-gray-500 mt-2">
                      Customer provided UTR: <span className="font-mono font-bold text-gray-700">{selectedOrderForVerify.utrNumber || 'None'}</span>
                    </p>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setVerifyModalOpen(false)}
                      disabled={isVerifying}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={verifyOnlinePayment}
                      disabled={isVerifying || utrInput.length < 6}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-blue-200"
                    >
                      {isVerifying ? (
                        <>
                          <FaSpinner className="w-4 h-4 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <FaCheckCircle className="w-4 h-4" />
                          <span>Verify Payment</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )
        }
      </AnimatePresence >

      {/* Refund Modal */}
      <AnimatePresence>
        {
          refundModalOpen && refundModalData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => !isProcessingRefund && setRefundModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 25 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="bg-purple-600 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FaMoneyBillWave className="w-6 h-6 text-white" />
                    <h2 className="text-xl font-bold text-white">Process Refund</h2>
                  </div>
                  <button
                    onClick={() => !isProcessingRefund && setRefundModalOpen(false)}
                    className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Order Info */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Table</span>
                      <span className="font-semibold text-gray-900">#{refundModalData.tableNumber}</span>
                    </div>
                    {refundModalData.orderNumber && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Order #</span>
                        <span className="font-semibold text-gray-900">{refundModalData.orderNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Original Amount</span>
                      <span className="font-semibold text-gray-900">₹{refundModalData.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Original Payment</span>
                      <span className="font-semibold text-gray-900 capitalize">{refundModalData.paymentMethod}</span>
                    </div>
                  </div>

                  {/* Refund Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Refund Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      max={refundModalData.totalAmount}
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg font-semibold"
                      placeholder="Enter amount"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum refund: ₹{refundModalData.totalAmount.toFixed(2)}
                    </p>
                  </div>

                  {/* Refund Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Refund Method
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setRefundMethod('cash')}
                        className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border-2 transition-all ${refundMethod === 'cash'
                          ? 'border-purple-600 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                      >
                        <span className="font-medium">Cash</span>
                      </button>
                      <button
                        onClick={() => setRefundMethod('online')}
                        className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border-2 transition-all ${refundMethod === 'online'
                          ? 'border-purple-600 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                      >
                        <span className="font-medium">Online</span>
                      </button>
                    </div>
                    {refundMethod === 'online' && (
                      <p className="text-xs text-orange-600 mt-2 bg-orange-50 p-2 rounded-lg">
                        Online refunds require UPI/Account details from customer
                      </p>
                    )}
                  </div>

                  {/* Warning */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start space-x-3">
                    <span className="text-amber-600 text-lg">⚠️</span>
                    <p className="text-sm text-amber-800">
                      This action will mark the order as refunded. Please ensure you have processed the actual refund to the customer.
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex space-x-3">
                  <button
                    onClick={() => setRefundModalOpen(false)}
                    disabled={isProcessingRefund}
                    className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={processRefund}
                    disabled={isProcessingRefund}
                    className="flex-1 px-4 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {isProcessingRefund ? (
                      <>
                        <FaSpinner className="w-4 h-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <FaUndo className="w-4 h-4" />
                        <span>Confirm Refund</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )
        }
      </AnimatePresence >
    </div >
  );
}
