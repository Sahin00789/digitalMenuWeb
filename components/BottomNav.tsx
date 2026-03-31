'use client';

import { useState } from 'react';
import {
  FaHome,
  FaShoppingCart,
  FaClipboardList,
  FaUser,
} from 'react-icons/fa';

interface BottomNavProps {
  cartCount?: number;
  onTabChange?: (tab: string) => void;
  activeTab?: string;
}

export default function BottomNav({ cartCount = 0, onTabChange, activeTab }: BottomNavProps) {
  const navItems = [
    {
      id: 'menu',
      label: 'Home',
      icon: <FaHome className="w-5 h-5" />,
    },
    {
      id: 'cart',
      label: 'Cart',
      icon: <FaShoppingCart className="w-6 h-6" />,
      badge: cartCount > 0 ? cartCount : undefined,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: <FaClipboardList className="w-5 h-5" />,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <FaUser className="w-5 h-5" />,
    },
  ];

  const handleTabClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-50">
      <div className="flex justify-around items-center max-w-4xl mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex items-center justify-center p-3 rounded-xl transition-all relative ${
                isActive
                  ? 'text-indigo-600 bg-indigo-50 shadow-sm transform scale-105'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              title={item.label}
            >
              <div className="relative">
                <span className={`text-2xl transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>{item.icon}</span>
                {item.badge && (
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse shadow-md border-2 border-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
