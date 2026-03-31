import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Flag to prevent multiple refresh requests
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Subscribe to token refresh
const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

// Notify subscribers with new token
const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; skipAuthRefresh?: boolean };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Skip refresh for auth endpoints (login, register, refresh itself)
    const authSkipRefresh = [
      '/auth/login', 
      '/auth/register', 
      '/auth/refresh', 
      '/auth/logout',
      '/superadmin/send-otp',
      '/superadmin/verify-otp',
      '/superadmin/refresh',
      '/superadmin/logout'
    ];
    const shouldSkipRefresh = authSkipRefresh.some(endpoint => originalRequest.url?.includes(endpoint));
    
    if (shouldSkipRefresh) {
      return Promise.reject(error);
    }

    // If error is not 401 or request has already been retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If already refreshing, queue the request
    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh(() => {
          resolve(api(originalRequest));
        });
      });
    }

    // Mark request as retried
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Determine if this is a superadmin request or regular user
      const isSuperadminRequest = originalRequest.url?.includes('/superadmin');
      
      if (isSuperadminRequest) {
        // Superadmin uses POST for refresh
        await axios.post(`${API_BASE_URL}/superadmin/refresh`, {}, { withCredentials: true });
      } else {
        // Regular user uses GET for refresh
        await axios.get(`${API_BASE_URL}/auth/refresh`, { withCredentials: true });
      }

      onTokenRefreshed('refreshed');
      isRefreshing = false;

      // Retry original request
      return api(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      refreshSubscribers = [];
      
      // Don't auto-redirect - let components handle auth state
      // Public pages should work without authentication
      return Promise.reject(refreshError);
    }
  }
);

export default api;
