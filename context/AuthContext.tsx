'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/services/api';
import { getAdminDeviceInfo } from '@/utils/device';
import toast from 'react-hot-toast';

export interface User {
  id: string;
  _id?: string; // MongoDB _id field
  email: string;
  restaurantName?: string;
  ownerName?: string;
  address?: string;
  phone?: string;
  description?: string;
  logo?: string;
  isFreeSubscription?: boolean;
  subscriptionExpiresAt?: string | Date;
  isActive?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ notVerified?: boolean }>;
  register: (email: string, password: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth status on mount
  useEffect(() => {
    // Skip auth check for superadmin routes to avoid noise
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/superadmin')) {
      setIsLoading(false);
      return;
    }
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success && response.data.user) {
        const userData = response.data.user;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        setUser(null);
        localStorage.removeItem('user');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        setUser(null);
        localStorage.removeItem('user');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const deviceInfo = getAdminDeviceInfo();
      const response = await api.post('/auth/login', { 
        email, 
        password,
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName
      });
      
      if (response.data.success) {
        const userData = response.data.user;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        toast.success('Login successful!');
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      const resp = error.response?.data;
      if (resp?.notVerified) {
        toast.error(resp.message);
        return { notVerified: true };
      }
      const message = resp?.message || 'Login failed';
      toast.error(message);
      throw new Error(message);
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/register', { email, password });
      if (response.data.success) {
        toast.success(response.data.message || 'OTP sent to your email');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw new Error(message);
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    try {
      const deviceInfo = getAdminDeviceInfo();
      const response = await api.post('/auth/verify-otp', {
        email,
        otp,
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName
      });

      if (response.data.success) {
        const userData = response.data.user;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        toast.success('Email verified successfully!');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Verification failed';
      toast.error(message);
      throw new Error(message);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      if (response.data.success) {
        toast.success('OTP sent to your email');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send OTP';
      toast.error(message);
      throw new Error(message);
    }
  };

  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    try {
      const response = await api.post('/auth/reset-password', { email, otp, newPassword });
      if (response.data.success) {
        toast.success('Password reset successful. Please login.');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Password reset failed';
      toast.error(message);
      throw new Error(message);
    }
  };

  const resendOtp = async (email: string) => {
    try {
      const response = await api.post('/auth/resend-otp', { email });
      if (response.data.success) {
        toast.success('A new verification code has been sent');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to resend OTP';
      toast.error(message);
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.log('Logout request failed:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      toast.success('Logged out successfully');
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        verifyOtp,
        forgotPassword,
        resetPassword,
        resendOtp,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
