'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FaSpinner, FaUtensils } from 'react-icons/fa';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        // Admin is logged in, redirect to dashboard
        router.replace('/admin');
      } else {
        // Not logged in, show public homepage
        router.replace('/public');
      }
    }
  }, [router, isLoading, isAuthenticated, user]);

  // Show loading spinner while checking auth
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
