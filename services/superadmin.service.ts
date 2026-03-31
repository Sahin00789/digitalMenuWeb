import api from './api';

export const superadminService = {
  /**
   * Request OTP for superadmin login
   */
  requestOTP: async (email: string) => {
    const response = await api.post('/superadmin/send-otp', { email });
    return response.data;
  },

  /**
   * Verify OTP and login
   */
  verifyOTP: async (email: string, otp: string) => {
    const response = await api.post('/superadmin/verify-otp', { email, otp });
    return response.data;
  },
  
  /**
   * Superadmin logout
   */
  logout: async () => {
    const response = await api.post('/superadmin/logout');
    return response.data;
  },

  /**
   * Refresh superadmin token
   */
  refresh: async () => {
    const response = await api.post('/superadmin/refresh');
    return response.data;
  },

  /**
   * Get overall system stats
   */
  getStats: async () => {
    const response = await api.get('/superadmin/stats');
    return response.data;
  },

  /**
   * Get all registered users (restaurants)
   */
  getUsers: async () => {
    const response = await api.get('/superadmin/users');
    return response.data;
  },

  /**
   * Get current superadmin profile
   */
  me: async () => {
    const response = await api.get('/superadmin/me');
    return response.data;
  },

  /**
   * Update user account status
   */
  updateUserStatus: async (userId: string, isActive: boolean) => {
    const response = await api.patch(`/superadmin/users/${userId}/status`, { isActive });
    return response.data;
  },

  /**
   * Update user subscription details
   */
  updateSubscription: async (userId: string, data: { isFreeSubscription: boolean, subscriptionExpiresAt: string | null }) => {
    const response = await api.patch(`/superadmin/users/${userId}/subscription`, data);
    return response.data;
  },

  /**
   * Get system audit logs
   */
  getAuditLogs: async (params?: { type?: string, status?: string, search?: string, page?: number }) => {
    const response = await api.get('/superadmin/logs', { params });
    return response.data;
  }
};
