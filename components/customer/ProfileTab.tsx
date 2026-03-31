'use client';

import { useState } from 'react';
import { FaUser, FaEdit, FaSignOutAlt, FaTrash, FaUsers } from 'react-icons/fa';

interface ProfileTabProps {
  session: any;
  onUpdateSession?: (updates: { customerName?: string; numberOfPersons?: number }) => void;
}

export default function ProfileTab({ session, onUpdateSession }: ProfileTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [customerName, setCustomerName] = useState(session.customerName || '');
  const [numberOfPersons, setNumberOfPersons] = useState<number>(session.numberOfPersons || 1);

  const handleSaveProfile = () => {
    if (onUpdateSession) {
      onUpdateSession({ customerName, numberOfPersons });
    }
    setIsEditing(false);
  };

  const handleClearProfile = () => {
    if (onUpdateSession) {
      onUpdateSession({ customerName: '', numberOfPersons: 1 });
    }
    setCustomerName('');
    setNumberOfPersons(1);
  };

  const personOptions = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FaUser className="w-5 h-5 text-indigo-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Profile</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Customer Information</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  <FaEdit className="w-4 h-4" />
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaUsers className="inline w-4 h-4 mr-1" />
                    Number of Persons (Seats)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {personOptions.map((num) => (
                      <button
                        key={num}
                        onClick={() => setNumberOfPersons(num)}
                        className={`w-10 h-10 rounded-lg font-semibold transition-colors ${
                          numberOfPersons === num
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Select number of people at your table for secure checkout verification
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleSaveProfile}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">
                    {customerName || session.customerName || 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    <FaUsers className="inline w-3 h-3 mr-1" />
                    Persons at Table
                  </p>
                  <p className="font-medium text-gray-900">
                    {session.numberOfPersons || 1} {session.numberOfPersons === 1 ? 'person' : 'persons'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Device ID</p>
                  <p className="font-mono text-sm text-gray-600">
                    {session.deviceId?.slice(0, 8)}...
                  </p>
                </div>
                {session.tableNumber && (
                  <div>
                    <p className="text-sm text-gray-500">Current Table</p>
                    <p className="font-medium text-gray-900">Table #{session.tableNumber}</p>
                  </div>
                )}
                {session.restaurantName && (
                  <div>
                    <p className="text-sm text-gray-500">Restaurant</p>
                    <p className="font-medium text-gray-900">{session.restaurantName}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Session Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Session Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Session Started</p>
                <p className="font-medium text-gray-900">
                  {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Session ID</p>
                <p className="font-mono text-sm text-gray-600">
                  {session.sessionId?.slice(0, 8)}...
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-3">
              <button
                onClick={handleClearProfile}
                className="w-full flex items-center justify-center space-x-2 bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100"
              >
                <FaTrash className="w-4 h-4" />
                <span>Clear Profile Data</span>
              </button>
              <button
                className="w-full flex items-center justify-center space-x-2 bg-gray-50 text-gray-600 py-2 rounded-lg hover:bg-gray-100"
              >
                <FaSignOutAlt className="w-4 h-4" />
                <span>End Session</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
