'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { superadminService } from '@/services/superadmin.service';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface SuperadminUser {
  id: string;
  email: string;
  role: string;
}

interface SuperadminAuthContextType {
  superadmin: SuperadminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  requestOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  logout: () => void;
}

const SuperadminAuthContext = createContext<SuperadminAuthContextType | undefined>(undefined);

export function SuperadminAuthProvider({ children }: { children: ReactNode }) {
  const [superadmin, setSuperadmin] = useState<SuperadminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await superadminService.me();
      if (response.success && response.user) {
        setSuperadmin(response.user);
        localStorage.setItem('isSuperadmin', 'true');
      } else {
        localStorage.removeItem('isSuperadmin');
        setSuperadmin(null);
      }
    } catch (error) {
      localStorage.removeItem('isSuperadmin');
      setSuperadmin(null);
    } finally {
      setIsLoading(false);
    }
  };

  const requestOTP = async (email: string) => {
    try {
      await superadminService.requestOTP(email);
      toast.success('OTP sent to your email');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send OTP';
      toast.error(message);
      throw error;
    }
  };

  const verifyOTP = async (email: string, otp: string) => {
    try {
      const response = await superadminService.verifyOTP(email, otp);
      if (response.success) {
        const userData = response.user;
        setSuperadmin(userData);
        localStorage.setItem('isSuperadmin', 'true');
        toast.success('Login successful');
        router.push('/superadmin/dashboard');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid OTP';
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await superadminService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Clear all possible auth cookies
      const cookies = ['accessToken', 'refreshToken', 'token'];
      cookies.forEach(cookie => {
        document.cookie = `${cookie}=; Max-Age=0; path=/;`;
      });
      
      localStorage.removeItem('isSuperadmin');
      setSuperadmin(null);
      toast.success('Logged out successfully');
      router.push('/superadmin/login');
    }
  };

  return (
    <SuperadminAuthContext.Provider
      value={{
        superadmin,
        isLoading,
        isAuthenticated: !!superadmin,
        requestOTP,
        verifyOTP,
        logout,
      }}
    >
      {children}
    </SuperadminAuthContext.Provider>
  );
}

export function useSuperadminAuth() {
  const context = useContext(SuperadminAuthContext);
  if (context === undefined) {
    throw new Error('useSuperadminAuth must be used within a SuperadminAuthProvider');
  }
  return context;
}
