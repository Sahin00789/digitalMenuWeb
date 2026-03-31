'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import {
  FaUtensils,
  FaUser,
  FaMapMarkerAlt,
  FaPhone,
  FaEdit,
  FaSpinner,
  FaSave,
  FaTimes,
  FaStore,
  FaTrash,
  FaExclamationTriangle,
  FaEnvelope,
  FaCheckCircle,
  FaCamera,
  FaImage
} from 'react-icons/fa';
import Image from 'next/image';

interface RestaurantFormData {
  restaurantName: string;
  ownerName: string;
  address: string;
  phone: string;
  description: string;
}

export default function RestaurantPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, refreshUser, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<RestaurantFormData>({
    restaurantName: '',
    ownerName: '',
    address: '',
    phone: '',
    description: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        restaurantName: user.restaurantName || '',
        ownerName: user.ownerName || '',
        address: user.address || '',
        phone: user.phone || '',
        description: user.description || ''
      });
      setLogoPreview(user.logo || null);
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openDeleteModal = () => {
    setIsDeleteModalOpen(true);
    setOtp('');
    setOtpSent(false);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setOtp('');
    setOtpSent(false);
  };

  const requestDeleteOtp = async () => {
    try {
      const response = await api.post('/auth/delete-account-otp');
      if (response.data.success && response.data.emailSent) {
        setOtpSent(true);
        toast.success(response.data.message || 'OTP sent to your email');
      } else {
        toast.error(response.data.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send OTP. Please try again.';
      toast.error(message);
    }
  };

  const confirmDeleteAccount = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await api.post('/auth/delete-account', { otp });
      toast.success(response.data.message || 'Account deleted successfully');
      closeDeleteModal();
      logout();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploadingLogo(true);
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const response = await api.put('/auth/restaurant/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        await refreshUser();
        setLogoPreview(response.data.logo);
        toast.success('Logo updated successfully');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!confirm('Are you sure you want to remove the logo?')) return;

    setIsUploadingLogo(true);
    try {
      const response = await api.delete('/auth/restaurant/logo');
      if (response.data.success) {
        await refreshUser();
        setLogoPreview(null);
        toast.success('Logo removed successfully');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await api.put('/auth/restaurant', formData);
      await refreshUser();
      toast.success('Restaurant details updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update restaurant details');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <FaStore className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Restaurant Settings</h1>
            <p className="text-gray-600">Manage your restaurant information and details</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-100 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="relative group">
              <div className="w-32 h-32 rounded-2xl overflow-hidden bg-white border-2 border-gray-100 shadow-sm flex items-center justify-center">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Restaurant Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaImage className="w-12 h-12 text-gray-300" />
                )}
                {isUploadingLogo && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <FaSpinner className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingLogo}
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <FaCamera className="w-4 h-4" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Restaurant Logo</h3>
              <p className="text-sm text-gray-500 mb-3">
                Upload your restaurant logo to personalize your digital menu.
                Max size: 5MB. Formats: JPG, PNG, WEBP.
              </p>
              <div className="flex items-center justify-center sm:justify-start space-x-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Change Logo
                </button>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restaurant Name *
              </label>
              <div className="relative">
                <FaUtensils className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="restaurantName"
                  required
                  value={formData.restaurantName}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                  placeholder="Enter restaurant name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Owner Name *
              </label>
              <div className="relative">
                <FaUser className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="ownerName"
                  required
                  value={formData.ownerName}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                  placeholder="Enter owner name"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <FaPhone className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address *
            </label>
            <div className="relative">
              <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <textarea
                name="address"
                required
                rows={3}
                value={formData.address}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors resize-none"
                placeholder="Enter restaurant address"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors resize-none"
              placeholder="Brief description of your restaurant (optional)"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <FaSpinner className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FaSave className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Delete Account Section */}
      <div className="bg-white rounded-xl shadow-sm border border-red-100 mt-6">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <FaExclamationTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Delete Account</h2>
              <p className="text-sm text-gray-600">Permanently delete your account and all associated data</p>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-700">
              <strong>Warning:</strong> This action cannot be undone. All your restaurant data including menu items, orders, and ledger history will be permanently deleted.
              Before deletion, we will send you an Excel export of all your data via email.
            </p>
          </div>

          <button
            onClick={openDeleteModal}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
          >
            <FaTrash className="w-4 h-4" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeDeleteModal} />
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <FaExclamationTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Delete Account?</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>

                {!otpSent ? (
                  <>
                    <p className="text-gray-600 mb-6">
                      To proceed with account deletion, we will send a verification code to your email ({user?.email}).
                      All your data will be exported to Excel and sent to you before deletion.
                    </p>
                    <div className="flex space-x-3">
                      <button
                        onClick={closeDeleteModal}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={requestDeleteOtp}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <FaEnvelope className="w-4 h-4" />
                        <span>Send OTP</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-gray-600 mb-4">
                      Enter the 6-digit verification code sent to <strong>{user?.email}</strong>
                    </p>
                    <div className="mb-4">
                      <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={closeDeleteModal}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmDeleteAccount}
                        disabled={isDeleting || otp.length !== 6}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        {isDeleting ? (
                          <>
                            <FaSpinner className="w-4 h-4 animate-spin" />
                            <span>Deleting...</span>
                          </>
                        ) : (
                          <>
                            <FaCheckCircle className="w-4 h-4" />
                            <span>Confirm Delete</span>
                          </>
                        )}
                      </button>
                    </div>
                    <button
                      onClick={requestDeleteOtp}
                      className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 underline w-full text-center"
                    >
                      Resend OTP
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
