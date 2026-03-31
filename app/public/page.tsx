'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  FaUtensils,
  FaQrcode,
  FaMobileAlt,
  FaChartLine,
  FaArrowRight,
  FaCheckCircle,
  FaClock,
  FaShieldAlt,
  FaSpinner,
  FaSignOutAlt,
} from 'react-icons/fa';

export default function PublicHomepage() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <FaUtensils className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <FaSpinner className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If admin is logged in, show welcome dashboard
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-2">
                <FaQrcode className="w-8 h-8 text-indigo-600" />
                <span className="text-2xl font-bold text-gray-900">DigitalMenu</span>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin"
                  className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <FaChartLine className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 text-gray-700 hover:text-red-600 font-medium"
                >
                  <FaSignOutAlt className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Welcome Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome back, {user.ownerName || user.email}!
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                {user.restaurantName ? `Managing ${user.restaurantName}` : 'Ready to manage your restaurant'}
              </p>
              <Link
                href="/admin"
                className="inline-flex items-center px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-lg font-medium"
              >
                <FaChartLine className="w-5 h-5 mr-2" />
                Go to Dashboard
                <FaArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                  <FaUtensils className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Menu Management</h3>
                <p className="text-gray-600 text-sm">Manage your restaurant menu items and pricing</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <FaQrcode className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">QR Codes</h3>
                <p className="text-gray-600 text-sm">Generate QR codes for your restaurant tables</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <FaChartLine className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
                <p className="text-gray-600 text-sm">View sales reports and customer insights</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Public homepage for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <FaQrcode className="w-8 h-8 text-indigo-600" />
              <span className="text-2xl font-bold text-gray-900">DigitalMenu</span>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/auth"
                className="text-gray-700 hover:text-indigo-600 font-medium"
              >
                Admin Login
              </Link>
              <Link
                href="/auth?mode=register"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Transform Your Restaurant with
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              {' '}Digital Menu
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Complete restaurant management solution with QR code menus, order tracking,
            customer feedback, and real-time analytics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth?mode=register"
              className="inline-flex items-center px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-lg font-medium"
            >
              Start Free Trial
              <FaArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <div className="inline-flex items-center px-8 py-3 bg-gray-100 text-gray-600 rounded-lg text-lg font-medium">
              <FaQrcode className="w-5 h-5 mr-2" />
              Scan QR Code to Access Menu
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Customers can only access the menu by scanning QR codes at restaurant tables
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Run Your Restaurant
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed to streamline operations and enhance customer experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* QR Code Menus */}
            <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <FaQrcode className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">QR Code Menus</h3>
              <p className="text-gray-600 mb-4">
                Contactless digital menus accessible via QR codes. No app downloads required.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <FaCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Instant menu access
                </li>
                <li className="flex items-center">
                  <FaCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Real-time updates
                </li>
                <li className="flex items-center">
                  <FaCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Beautiful design
                </li>
              </ul>
            </div>

            {/* Order Management */}
            <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <FaClock className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Order Tracking</h3>
              <p className="text-gray-600 mb-4">
                Complete order lifecycle management from placement to delivery.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <FaCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Real-time status updates
                </li>
                <li className="flex items-center">
                  <FaCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Kitchen notifications
                </li>
                <li className="flex items-center">
                  <FaCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Order history
                </li>
              </ul>
            </div>

            {/* Payment Processing */}
            <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <FaMobileAlt className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Multiple Payments</h3>
              <p className="text-gray-600 mb-4">
                Support for cash and online payments with secure processing.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <FaCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Cash payments
                </li>
                <li className="flex items-center">
                  <FaCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Online payments
                </li>
                <li className="flex items-center">
                  <FaCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Payment verification
                </li>
              </ul>
            </div>

            {/* Customer Feedback */}
            <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <FaChartLine className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Customer Feedback</h3>
              <p className="text-gray-600 mb-4">
                Collect and analyze customer ratings and reviews to improve service.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <FaCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Star ratings
                </li>
                <li className="flex items-center">
                  <FaCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Customer reviews
                </li>
                <li className="flex items-center">
                  <FaCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Feedback analytics
                </li>
              </ul>
            </div>

            {/* Analytics Dashboard */}
            <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                <FaChartLine className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Analytics</h3>
              <p className="text-gray-600 mb-4">
                Comprehensive insights into sales, orders, and customer behavior.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <FaCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Sales reports
                </li>
                <li className="flex items-center">
                  <FaCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Popular items
                </li>
                <li className="flex items-center">
                  <FaCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Revenue tracking
                </li>
              </ul>
            </div>

            {/* Security */}
            <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                <FaShieldAlt className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure & Reliable</h3>
              <p className="text-gray-600 mb-4">
                Enterprise-grade security with 99.9% uptime guarantee.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <FaCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Data encryption
                </li>
                <li className="flex items-center">
                  <FaCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Secure payments
                </li>
                <li className="flex items-center">
                  <FaCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Regular backups
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Modernize Your Restaurant?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of restaurants already using DigitalMenu to streamline operations and delight customers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth?mode=register"
              className="inline-flex items-center px-8 py-3 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors text-lg font-medium"
            >
              Start Free Trial
              <FaArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/customer/menu"
              className="inline-flex items-center px-8 py-3 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 transition-colors text-lg font-medium"
            >
              View Demo
              <FaUtensils className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <FaQrcode className="w-6 h-6 text-indigo-400" />
                <span className="text-xl font-bold">DigitalMenu</span>
              </div>
              <p className="text-gray-400">
                Complete restaurant management solution for the digital age.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/customer/menu" className="hover:text-white">Demo</Link></li>
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#about" className="hover:text-white">About</Link></li>
                <li><Link href="#contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="#blog" className="hover:text-white">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="#api" className="hover:text-white">API Docs</Link></li>
                <li><Link href="#status" className="hover:text-white">Status</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 DigitalMenu. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
