'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { socketService } from '@/services/socket';
import {
  FaUtensils,
  FaTable,
  FaQrcode,
  FaSignOutAlt,
  FaHome,
  FaChevronRight,
  FaDesktop,
  FaChartLine,
  FaClipboardList,
  FaMoneyBillWave,
  FaStore,
  FaBars,
  FaTimes,
  FaLock,
  FaEnvelope,
  FaPhone,
  FaClock,
  FaShieldAlt,
  FaCircle,
  FaCrown
} from 'react-icons/fa';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading, isAuthenticated, logout, refreshUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Real-time account status monitoring
  useEffect(() => {
    if (isAuthenticated && user?._id) {
      socketService.connect();
      socketService.join(user._id);

      const handleStatusUpdate = (data: any) => {
        console.log('🔄 Account status updated via socket:', data);
        refreshUser();
      };

      socketService.on('accountStatusUpdate', handleStatusUpdate);

      return () => {
        socketService.off('accountStatusUpdate');
      };
    }
  }, [isAuthenticated, user?._id, refreshUser]);

  // Subscription calculation logic (mirrored from page.tsx for global enforcement)
  const getSubscriptionStatus = () => {
    if (user?.isFreeSubscription) return { name: 'Premium (Free)', daysLeft: null, isExpired: false, status: 'Active', expiryDate: 'Lifetime' };
    if (!user?.subscriptionExpiresAt) return { name: 'Basic', daysLeft: 0, isExpired: false, status: 'Inactive', expiryDate: 'N/A' };

    const today = new Date();
    const expiry = new Date(user.subscriptionExpiresAt);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      name: user.isFreeSubscription ? 'Premium (Free)' : 'Premium Plan',
      daysLeft: Math.max(0, diffDays),
      isExpired: diffDays < 0,
      expiryDate: expiry.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: diffDays < 0 ? 'Expired' : 'Active'
    };
  };

  const subStatus = getSubscriptionStatus();
  const isRestricted = !isLoading && isAuthenticated && (user?.isActive === false || subStatus.isExpired);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/auth');
  };

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: <FaHome className="w-5 h-5" /> },
    { href: '/admin/orders', label: 'Orders', icon: <FaClipboardList className="w-5 h-5" /> },
    { href: '/admin/menu', label: 'Menu', icon: <FaUtensils className="w-5 h-5" /> },
    { href: '/admin/tables', label: 'Tables', icon: <FaTable className="w-5 h-5" /> },
    { href: '/admin/ledger', label: 'Ledger', icon: <FaChartLine className="w-5 h-5" /> },
    { href: '/admin/devices', label: 'Devices', icon: <FaDesktop className="w-5 h-5" /> },
    { href: '/admin/restaurant', label: 'Restaurant Info', icon: <FaStore className="w-5 h-5" /> },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col bg-white border-r border-gray-200">
          {/* Logo Card */}
          <div className="m-4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-16 flex items-center px-6">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <FaQrcode className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-gray-900">DigitalMenu</span>
                  {user?.restaurantName && (
                    <div className="flex items-center space-x-1">
                      {user?.logo && (
                        <img 
                          src={user.logo} 
                          alt={user.restaurantName} 
                          className="w-4 h-4 rounded object-cover border border-gray-200"
                        />
                      )}
                      <span className="text-xs text-gray-600 truncate max-w-[120px]">
                        {user.restaurantName}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navItems.map((item) => {
              const isActive = item.href === '/admin'
                ? pathname === '/admin'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                    ? 'bg-indigo-100 text-indigo-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                    }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                  {isActive && <FaChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 font-semibold">
                  {user?.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-2 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <FaSignOutAlt className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </aside>

        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-y-0 left-0 w-64 flex flex-col bg-white border-r border-gray-200 z-50 shadow-2xl"
            >
              {/* Logo Card */}
              <div className="m-4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="h-16 flex items-center justify-between px-6">
                  <Link href="/" className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                      <FaQrcode className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-gray-900">DigitalMenu</span>
                      {user?.restaurantName && (
                        <div className="flex items-center space-x-1">
                          {user?.logo && (
                            <img 
                              src={user.logo} 
                              alt={user.restaurantName} 
                              className="w-4 h-4 rounded object-cover border border-gray-200"
                            />
                          )}
                          <span className="text-xs text-gray-600 truncate max-w-[120px]">
                            {user.restaurantName}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    <FaTimes className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {navItems.map((item, index) => {
                  const isActive = item.href === '/admin'
                    ? pathname === '/admin'
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                          ? 'bg-indigo-100 text-indigo-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                          }`}
                      >
                        {item.icon}
                        <span className="font-medium">{item.label}</span>
                        {isActive && <FaChevronRight className="w-4 h-4 ml-auto" />}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* User section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-4 border-t border-gray-200"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-semibold">
                      {user?.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.email}
                    </p>
                    <p className="text-xs text-gray-500">Admin</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="flex items-center space-x-3 w-full px-4 py-2 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <FaSignOutAlt className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </motion.button>
              </motion.div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header Card */}
          <header className="md:hidden px-4 py-3 bg-gray-50">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-14 flex items-center justify-between px-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-lg"
                >
                  <FaBars className="w-5 h-5" />
                </motion.button>
                <Link href="/" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <FaQrcode className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900">DigitalMenu</span>
                    {user?.restaurantName && (
                      <div className="flex items-center space-x-1">
                        {user?.logo && (
                          <img 
                            src={user.logo} 
                            alt={user.restaurantName} 
                            className="w-3 h-3 rounded object-cover border border-gray-200"
                          />
                        )}
                        <span className="text-xs text-gray-600 truncate max-w-[80px]">
                          {user.restaurantName}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
                <div className="w-9" />
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto w-full">
            <div className="w-full h-full">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Global Account Restriction Overlay */}
      <AnimatePresence>
        {isRestricted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-xl p-4 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-slate-900/30 pointer-events-none"></div>
            
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative"
            >
              <div className="h-2 w-full bg-gradient-to-r from-red-500 via-orange-500 to-amber-500"></div>
              
              <div className="p-10">
                <div className="flex justify-center mb-8">
                  <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                    <FaLock className="w-10 h-10 text-red-500" />
                  </div>
                </div>
                
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Access Restricted</h2>
                  <p className="text-gray-500 text-lg leading-relaxed max-w-sm mx-auto">
                    {user?.isActive === false 
                      ? "Your account has been deactivated by the system administrator. Please contact superadmin for reactivation."
                      : "Your subscription has expired. Please subscribe to continue the convenience of digital menu. Contact superadmin."
                    }
                  </p>
                </div>

                {/* Technical Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                  <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                      <FaShieldAlt className="w-4 h-4 text-indigo-500" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account Status</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <FaCircle className={`w-2 h-2 ${user?.isActive ? 'text-green-500' : 'text-red-500'}`} />
                       <span className="font-bold text-gray-900">{user?.isActive ? 'Active' : 'Deactivated'}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                      <FaClock className="w-4 h-4 text-emerald-500" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Validity Details</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 text-sm">Valid Until: {subStatus.expiryDate || 'N/A'}</span>
                      {subStatus.isExpired ? (
                        <span className="text-[8px] font-black text-red-500 bg-red-100 px-2 py-0.5 rounded-full uppercase">Expired</span>
                      ) : (
                        <span className="text-[8px] font-black text-emerald-500 bg-emerald-100 px-2 py-0.5 rounded-full uppercase truncate">Active</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Area */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl border border-indigo-100 group transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <FaEnvelope className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Email Support</p>
                        <p className="text-sm font-bold text-indigo-900">sahin401099@gmail.com</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => window.location.reload()}
                      className="py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-black/10"
                    >
                      Refresh
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="py-4 bg-white hover:bg-gray-50 text-gray-600 font-bold rounded-2xl border border-gray-200 transition-all active:scale-[0.98]"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

