'use client';

import { useState } from 'react';
import { FaClipboardList, FaClock, FaCheckCircle, FaTimesCircle, FaSpinner, FaMoneyBillWave, FaCreditCard, FaStar, FaComment } from 'react-icons/fa';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Order } from '@/types/order';


interface OrdersTabProps {
  orders: Order[];
  session: any;
}

interface FeedbackFormProps {
  orderId: string;
  onSubmit: (orderId: string, feedback: string, rating: number) => void;
}

function FeedbackForm({ orderId, onSubmit }: FeedbackFormProps) {
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast.error('Please enter your feedback');
      return;
    }
    setIsSubmitting(true);
    await onSubmit(orderId, feedback, rating);
    setIsSubmitting(false);
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="text-sm font-medium text-gray-900 mb-3">Rate Your Experience</h4>

      {/* Star Rating */}
      <div className="flex items-center space-x-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className="focus:outline-none"
          >
            <FaStar
              className={`w-6 h-6 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            />
          </button>
        ))}
      </div>

      {/* Feedback Text */}
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value.slice(0, 500))}
        placeholder="Share your experience with this order..."
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none mb-3"
      />
      <p className="text-xs text-gray-500 mb-3 text-right">
        {feedback.length}/500
      </p>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </div>
  );
}

export default function OrdersTab({ orders, session }: OrdersTabProps) {
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <FaClock className="w-5 h-5 text-yellow-500" />;
      case 'confirmed':
        return <FaCheckCircle className="w-5 h-5 text-blue-500" />;
      case 'preparing':
        return <FaClipboardList className="w-5 h-5 text-orange-500" />;
      case 'ready':
        return <FaCheckCircle className="w-5 h-5 text-green-500" />;
      case 'completed':
        return <FaCheckCircle className="w-5 h-5 text-green-600" />;
      case 'cancelled':
        return <FaTimesCircle className="w-5 h-5 text-red-500" />;
      case 'rejected':
        return <FaTimesCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FaClock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'rejected':
        return 'bg-red-100 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' at ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOrderPaid = (order: Order) => {
    if (!order.transactions || order.transactions.length === 0) return false;
    return order.transactions.some(tx => 
      tx.type === 'PAYMENT' && tx.status === 'VERIFIED'
    );
  };

  const cancelOrder = async (orderId: string) => {
    try {
      const reason = prompt('Please enter a reason for cancellation (optional):');
      const url = reason
        ? `/order/${orderId}/cancel?deviceId=${session.deviceId}&reason=${encodeURIComponent(reason)}`
        : `/order/${orderId}/cancel?deviceId=${session.deviceId}`;

      await api.put(url);
      toast.success('Order cancelled');
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const submitFeedback = async (orderId: string, comment: string, rating: number) => {
    try {
      await api.put(`/order/${orderId}/feedback`, { comment, rating });
      toast.success('Feedback submitted');
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    }
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FaClipboardList className="w-5 h-5 text-indigo-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Your Orders</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <FaClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No orders yet</h3>
            <p className="text-gray-500 mt-2">Your order history will appear here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden">
                {/* Order Header */}
                <div className={`bg-gradient-to-r ${order.status === 'rejected' ? 'from-red-50 to-red-100' :
                  order.status === 'cancelled' ? 'from-orange-50 to-orange-100' :
                    order.status === 'served' ? 'from-green-50 to-green-100' :
                      order.status === 'preparing' ? 'from-blue-50 to-blue-100' :
                        'from-indigo-50 to-indigo-100'
                  } px-6 py-4 border-b border-gray-200`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(order.status)}
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        #{order.orderNumber || order._id.slice(-8)}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-indigo-600">
                        ₹{order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Content */}
                <div className="p-6 space-y-4">
                  {/* Order Items */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
                      Order Items
                    </h4>
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                          <div className="flex items-center space-x-3">
                            <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-sm font-bold text-indigo-600 shadow-sm">
                              {item.quantity}x
                            </span>
                            <span className="text-gray-800 font-medium">{item.name}</span>
                          </div>
                          <span className="font-semibold text-gray-900">
                            ₹{(item.offerPrice || (item.price * item.quantity)).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t-2 border-gray-300">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-900">Total:</span>
                        <span className="text-xl font-bold text-indigo-600">
                          ₹{order.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Special Instructions */}
                  {order.specialInstructions && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm font-medium text-amber-800 mb-1">Special Instructions:</p>
                      <p className="text-sm text-amber-700">{order.specialInstructions}</p>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {order.status === 'rejected' && order.rejectionReason && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</p>
                      <p className="text-sm text-red-700">{order.rejectionReason}</p>
                    </div>
                  )}

                  {/* Cancellation Reason */}
                  {order.status === 'cancelled' && order.cancellationReason && (
                    <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm font-medium text-orange-800 mb-1">Cancellation Reason:</p>
                      <p className="text-sm text-orange-700">{order.cancellationReason}</p>
                    </div>
                  )}

                  {/* PAYMENT BLOCK */}
                  <div className={`p-4 rounded-2xl border transition-all duration-300 ${isOrderPaid(order)
                    ? 'bg-green-50/50 border-green-100'
                    : 'bg-amber-50/50 border-amber-100'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${isOrderPaid(order) ? 'bg-white text-green-600' : 'bg-white text-amber-600'
                          }`}>
                          {order.paymentMethod === 'online' ? <FaCreditCard className="w-6 h-6" /> : <FaMoneyBillWave className="w-6 h-6" />}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Payment Status</p>
                          <h4 className={`text-base font-bold flex items-center ${isOrderPaid(order) ? 'text-green-700' : 'text-amber-700'}`}>
                            {isOrderPaid(order) ? (
                              <><FaCheckCircle className="mr-1.5 w-4 h-4" /> Paid {order.paymentMethod === 'online' ? '(Online)' : '(Cash)'}</>
                            ) : (
                              <><FaClock className="mr-1.5 w-4 h-4" /> Payment Pending</>
                            )}
                          </h4>
                          <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                            {isOrderPaid(order) 
                              ? `Verified at ${formatDate(order.updatedAt || order.createdAt)}` 
                              : `Initiated at ${formatDate(order.createdAt)}`}
                          </p>
                        </div>
                      </div>
                      {isOrderPaid(order) ? (
                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200">
                          Verified
                        </div>
                      ) : (
                        <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200 animate-pulse">
                          Pending
                        </div>
                      )}
                    </div>
                  </div>

                  {/* REFUND BLOCK - Only for rejected/cancelled orders with payment */}
                  {(order.status === 'cancelled' || order.status === 'rejected') && isOrderPaid(order) && (
                    <div className={`p-4 rounded-2xl border transition-all duration-300 ${order.refund?.status === 'refunded'
                      ? 'bg-purple-50 border-purple-100'
                      : 'bg-orange-50 border-orange-100'
                      }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${order.refund?.status === 'refunded' ? 'bg-white text-purple-600' : 'bg-white text-orange-600'
                            }`}>
                            <FaSpinner className={`w-6 h-6 ${order.refund?.status === 'refunded' ? '' : 'animate-spin'}`} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Refund Status</p>
                            <h4 className={`text-base font-bold flex items-center ${order.refund?.status === 'refunded' ? 'text-purple-700' : 'text-orange-700'}`}>
                              {order.refund?.status === 'refunded' ? (
                                <><FaCheckCircle className="mr-1.5 w-4 h-4" /> Refund Completed</>
                              ) : (
                                <><FaSpinner className="mr-1.5 w-4 h-4 animate-spin" /> Refund Processing</>
                              )}
                            </h4>
                            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                              {order.refund?.status === 'refunded'
                                ? `₹${(order.refund?.amount || order.totalAmount).toFixed(2)} refunded via ${order.refund?.method || 'original method'} at ${formatDate(order.refund?.processedAt || order.updatedAt)}`
                                : `Your refund of ₹${order.totalAmount.toFixed(2)} is being processed by the restaurant.`}
                            </p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${order.refund?.status === 'refunded'
                          ? 'bg-purple-100 text-purple-700 border-purple-200'
                          : 'bg-orange-100 text-orange-700 border-orange-200'
                          }`}>
                          {order.refund?.status === 'refunded' ? 'Refunded' : 'Processing'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Feedback Section - Show for completed/served orders without feedback */}
                  {(order.status === 'completed' || order.status === 'served') && !order.feedback?.rating && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                        Rate Your Experience
                      </h4>
                      <FeedbackForm orderId={order._id} onSubmit={submitFeedback} />
                    </div>
                  )}

                  {/* Show existing feedback */}
                  {(order.feedback?.comment || order.feedback?.rating) && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                        Your Feedback
                      </h4>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {order.feedback?.rating && (
                            <div className="flex items-center mb-2">
                              {[...Array(5)].map((_, i) => (
                                <FaStar
                                  key={i}
                                  className={`w-5 h-5 ${i < order.feedback!.rating! ? 'text-yellow-400' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          )}
                          {order.feedback.comment && (
                            <p className="text-sm text-green-700 italic">"{order.feedback.comment}"</p>
                          )}
                        </div>
                        <FaComment className="w-5 h-5 text-green-600 ml-3" />
                      </div>
                    </div>
                  )}

                  {/* Cancel Button */}
                  {order.status === 'placed' && (
                    <div className="mt-4">
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to cancel this order?')) {
                            cancelOrder(order._id);
                          }
                        }}
                        className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm"
                      >
                        Cancel Order
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
