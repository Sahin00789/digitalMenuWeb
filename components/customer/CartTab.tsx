'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FaPlus, FaMinus, FaTrash, FaShoppingCart, FaMoneyBillWave, FaCreditCard } from 'react-icons/fa';
import { MenuItem, CartItem } from '@/types/order';


interface CartTabProps {
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  getItemQuantity: (itemId: string) => number;
  session: any;
  onPlaceOrder: (paymentMethod: 'cash' | 'online', utrNumber?: string, specialInstructions?: string) => void;
}

export default function CartTab({
  cart,
  addToCart,
  removeFromCart,
  getItemQuantity,
  session,
  onPlaceOrder
}: CartTabProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash');
  const [utrNumber, setUtrNumber] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.offerPrice || item.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const handlePlaceOrder = async () => {
    if (paymentMethod === 'online' && utrNumber.length < 6) {
      alert('Please enter last 6 digits of UTR number');
      return;
    }
    setIsSubmitting(true);
    await onPlaceOrder(paymentMethod, utrNumber, specialInstructions);
    setIsSubmitting(false);
    setShowPaymentModal(false);
    setUtrNumber('');
    setSpecialInstructions('');
  };

  const calculateSavings = () => {
    return cart.reduce((total, item) => {
      if (item.offerPrice && item.price > item.offerPrice) {
        return total + ((item.price - item.offerPrice) * item.quantity);
      }
      return total;
    }, 0);
  };

  if (cart.length === 0) {
    return (
      <>
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FaShoppingCart className="w-5 h-5 text-indigo-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Your Cart</h1>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <FaShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Your cart is empty</h3>
            <p className="text-gray-500 mt-2">Add some delicious items from the menu</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FaShoppingCart className="w-5 h-5 text-indigo-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Your Cart</h1>
            </div>
            <div className="text-sm text-gray-600">
              {cart.length} items
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Cart Items */}
        <div className="space-y-4 mb-6">
          {cart.map((item) => (
            <div key={item._id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaShoppingCart className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{item.category}</p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-2">
                      {item.offerPrice ? (
                        <>
                          <span className="text-lg font-bold text-indigo-600">
                            ₹{item.offerPrice.toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-400 line-through">
                            ₹{item.price.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-indigo-600">
                          ₹{item.price.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200"
                      >
                        <FaMinus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => addToCart(item)}
                        className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-700"
                      >
                        <FaPlus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 hover:bg-red-200 ml-2"
                      >
                        <FaTrash className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">₹{calculateTotal().toFixed(2)}</span>
            </div>

            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-indigo-600">
                  ₹{calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Special Instructions (Optional)
            </label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value.slice(0, 500))}
              placeholder="Any special requests for your order..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {specialInstructions.length}/500
            </p>
          </div>

          <button
            onClick={() => setShowPaymentModal(true)}
            className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Place Order
          </button>
        </div>
      </main>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Select Payment Method</h2>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`w-full flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors ${paymentMethod === 'cash'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <FaMoneyBillWave className="w-6 h-6 text-green-600" />
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Cash on Counter</p>
                  <p className="text-sm text-gray-500">Pay at the restaurant counter</p>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('online')}
                className={`w-full flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors ${paymentMethod === 'online'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <FaCreditCard className="w-6 h-6 text-blue-600" />
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Online Payment</p>
                  <p className="text-sm text-gray-500">Pay via UPI/Card/Net Banking</p>
                </div>
              </button>
            </div>

            {paymentMethod === 'online' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last 6 digits of UTR Number
                </label>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter last 6 digits"
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center tracking-widest font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">Enter only the last 6 digits from your UPI payment confirmation</p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePlaceOrder}
                disabled={isSubmitting || (paymentMethod === 'online' && utrNumber.length < 6)}
                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Placing Order...' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
