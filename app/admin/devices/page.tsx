'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { FaSpinner, FaDesktop, FaMobileAlt, FaGlobe, FaClock, FaSignOutAlt, FaArrowLeft } from 'react-icons/fa';

interface Session {
  loggedInAt: string;
  loggedOutAt?: string;
  duration?: number;
}

interface Device {
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  userAgent: string;
  isOnline: boolean;
  lastSeen: string;
  sessions: Session[];
}

export default function ActiveDevicesPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await api.get('/devices');
      setDevices(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load active devices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to logout this device?')) return;
    
    setActionLoading(deviceId);
    try {
      await api.delete(`/devices/${deviceId}`);
      toast.success('Device logged out successfully');
      fetchDevices();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to logout device');
    } finally {
      setActionLoading(null);
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (duration: number) => {
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatLastSeen = (lastSeen: string) => {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const isCurrentDevice = (device: Device) => {
    const currentDeviceId = localStorage.getItem('deviceId');
    return device.deviceId === currentDeviceId;
  };

  const getDeviceStatus = (device: Device) => {
    if (device.isOnline) {
      return { status: 'online', color: 'green', text: 'Online' };
    }
    return { status: 'offline', color: 'yellow', text: 'Offline' };
  };

  const getStatusBadgeClasses = (color: string) => {
    const classes: Record<string, string> = {
      green: 'bg-green-100 text-green-700',
      yellow: 'bg-yellow-100 text-yellow-700',
      red: 'bg-red-100 text-red-700'
    };
    return classes[color] || 'bg-gray-100 text-gray-700';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const onlineCount = devices.filter(d => d.isOnline).length;
  const offlineCount = devices.filter(d => !d.isOnline).length;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Active Devices</h1>
            <p className="text-gray-600 mt-1">Manage your logged-in sessions and devices</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <FaDesktop className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{devices.length}</p>
                <p className="text-sm text-blue-500">Total Devices</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <FaGlobe className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{onlineCount}</p>
                <p className="text-sm text-green-500">Online Now</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                <FaSignOutAlt className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{offlineCount}</p>
                <p className="text-sm text-red-500">Offline</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Devices List */}
      <div className="space-y-4">
        {devices.length > 0 ? (
          devices
            .sort((a, b) => {
              const getStatusPriority = (device: Device) => {
                if (device.isOnline) return 0;
                return 1;
              };
              
              const priorityA = getStatusPriority(a);
              const priorityB = getStatusPriority(b);
              
              if (priorityA !== priorityB) {
                return priorityA - priorityB;
              }
              
              return new Date(b.lastSeen || 0).getTime() - new Date(a.lastSeen || 0).getTime();
            })
            .map((device, index) => {
              const deviceStatus = getDeviceStatus(device);
              const recentSessions = device.sessions.slice(0, 3); // Show last 3 sessions
              
              return (
                <div 
                  key={index} 
                  className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Device Icon */}
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 ${
                        deviceStatus.color === 'green' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                        'bg-gradient-to-r from-yellow-500 to-orange-500'
                      }`}>
                        {isCurrentDevice(device) ? (
                          <FaDesktop className="w-8 h-8 text-white" />
                        ) : (
                          <FaMobileAlt className="w-8 h-8 text-white" />
                        )}
                      </div>

                      {/* Device Info */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {device.deviceName}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`inline-flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${getStatusBadgeClasses(deviceStatus.color)}`}>
                                <span>{deviceStatus.text}</span>
                              </span>
                              {isCurrentDevice(device) && (
                                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                                  Current Device
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleLogoutDevice(device.deviceId)}
                            disabled={actionLoading === device.deviceId || isCurrentDevice(device)}
                            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3 py-1 rounded-lg transition-colors duration-200 text-sm flex items-center space-x-1"
                          >
                            {actionLoading === device.deviceId ? (
                              <FaSpinner className="w-4 h-4 animate-spin" />
                            ) : (
                              <FaSignOutAlt className="w-4 h-4" />
                            )}
                            <span>{actionLoading === device.deviceId ? 'Logging out...' : 'Logout'}</span>
                          </button>
                        </div>

                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center">
                            <FaGlobe className="w-4 h-4 mr-2" />
                            <span className="font-medium">{device.ipAddress || 'Unknown IP'}</span>
                          </div>
                          <div className="flex items-center text-gray-500">
                            <FaClock className="w-4 h-4 mr-2" />
                            <span>Last seen: {formatLastSeen(device.lastSeen)}</span>
                          </div>
                        </div>

                        {/* Sessions */}
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="mb-2">
                            <p className="text-sm font-medium text-gray-700 mb-2">Recent Sessions ({device.sessions.length})</p>
                            <div className="space-y-2">
                              {recentSessions.map((session, sessionIndex) => (
                                <div key={sessionIndex} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                                  <div className="flex items-center space-x-2">
                                    <FaClock className="w-3 h-3 text-gray-400" />
                                    <span className="text-gray-600">
                                      {formatTime(session.loggedInAt)}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {session.loggedOutAt ? (
                                      <>
                                        <span className="text-gray-500">
                                          {formatTime(session.loggedOutAt)}
                                        </span>
                                        {session.duration && (
                                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                                            {formatDuration(session.duration)}
                                          </span>
                                        )}
                                      </>
                                    ) : (
                                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                                        Active
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {device.sessions.length > 3 && (
                                <div className="text-xs text-gray-500 text-center pt-1">
                                  +{device.sessions.length - 3} more sessions
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Device Details */}
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500 mb-1">Browser</p>
                              <p className="font-medium text-gray-800 truncate">{device.userAgent || 'Unknown'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 mb-1">Device ID</p>
                              <p className="font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded text-xs">{device.deviceId}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <FaDesktop className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Active Devices</h3>
            <p className="text-gray-600 mb-6">You don't have any active sessions.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
