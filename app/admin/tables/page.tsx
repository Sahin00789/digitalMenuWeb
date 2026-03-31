'use client';

import { useEffect, useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/context/AuthContext';
import type { User } from '@/context/AuthContext';
import CryptoJS from 'crypto-js';
import api from '@/services/api';
import toast from 'react-hot-toast';
import {
  FaPlus,
  FaTrash,
  FaQrcode,
  FaSpinner,
  FaPrint,
  FaTimes,
  FaDownload,
  FaUtensils,
} from 'react-icons/fa';

interface Table {
  _id: string;
  tableNumber: number;
  seats: number;
  qrCode: string;
}

export default function TableManagementPage() {
  const { user } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [seats, setSeats] = useState('4');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Encryption key - in production, this should be stored securely
  const ENCRYPTION_KEY = 'digital-menu-2024-secure-key';

  const generateEncryptedUrl = (tableNumber: number) => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    let userData = null;
    
    console.log('Stored user from localStorage:', storedUser); // Debug log
    
    if (storedUser) {
      try {
        userData = JSON.parse(storedUser);
        console.log('Parsed user data:', userData); // Debug log
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }
    }
    
    // Ensure we have the restaurant ID - ₹_id for MongoDB objects
    const restaurantId = userData?._id || userData?.id;
    console.log('Restaurant ID extracted:', restaurantId); // Debug log
    
    if (!restaurantId) {
      console.error('Restaurant ID not found in user data. User data:', userData);
      // Try to get user from context if available
      if (user?._id || user?.id) {
        const contextId = user?._id || user?.id;
        console.log('Using user from context:', contextId);
        userData = { _id: contextId };
      } else {
        console.error('No restaurant ID available anywhere');
        return '#'; // Return invalid URL if no restaurant ID
      }
    }
    
    const qrData = {
      table: tableNumber,
      restaurantId: restaurantId,
      timestamp: Date.now()
    };
    
    console.log('QR Data being generated:', qrData); // Debug log
    
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(qrData), 
      ENCRYPTION_KEY
    ).toString();
    
    return `${window.location.origin}/customer?qr=${encodeURIComponent(encrypted)}`;
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await api.get('/table');
      setTables(response.data.data);
    } catch (error) {
      toast.error('Failed to load tables');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber) return;

    setIsSubmitting(true);
    try {
      await api.post('/table', { 
        tableNumber: parseInt(tableNumber),
        seats: parseInt(seats) || 4
      });
      toast.success('Table created successfully');
      setTableNumber('');
      setSeats('4');
      setIsModalOpen(false);
      fetchTables();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create table');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;

    try {
      await api.delete(`/table/${id}`);
      toast.success('Table deleted');
      fetchTables();
    } catch (error) {
      toast.error('Failed to delete table');
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'QR Codes - DigitalMenu',
  });

  // Prepare tables for print layout (6 per page)
  const printTables = [...tables].sort((a, b) => a.tableNumber - b.tableNumber);
  const pages = [];
  for (let i = 0; i < printTables.length; i += 6) {
    pages.push(printTables.slice(i, i + 6));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Table Management</h1>
          <p className="text-gray-600 mt-1">Create tables and generate QR codes for customers.</p>
        </div>
        <div className="flex space-x-3">
          {tables.length > 0 && (
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <FaPrint className="w-4 h-4" />
              <span>Print QR</span>
            </button>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <FaPlus className="w-4 h-4" />
            <span>Add Table</span>
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tables.map((table) => (
          <div key={table._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Table {table.tableNumber}
                </h3>
                <p className="text-sm text-gray-500">{table.seats} seats</p>
              </div>
              <button
                onClick={() => handleDelete(table._id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <FaTrash className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative">
                {/* Premium Card Design */}
                <div className="relative bg-gradient-to-br from-slate-50 to-white rounded-3xl shadow-2xl border border-gray-200 p-10 w-80">
                  {/* Top Accent Line */}
                  <div className="absolute top-0 left-4 right-4 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full"></div>
                  
                  {/* Restaurant Header */}
                  <div className="text-center pt-4 pb-6">
                    {user?.logo ? (
                      <div className="mb-4">
                        <img 
                          src={user.logo} 
                          alt="Restaurant Logo" 
                          className="w-16 h-16 rounded-2xl object-cover mx-auto shadow-lg border-2 border-white"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <FaUtensils className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <h2 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                      {user?.restaurantName || 'Restaurant'}
                    </h2>
                    <div className="w-16 h-0.5 bg-gradient-to-r from-indigo-200 to-purple-200 mx-auto"></div>
                  </div>
                  
                  {/* QR Code Section */}
                  <div className="relative flex justify-center mb-6">
                    <div className="relative bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
                      <QRCodeSVG
                        value={generateEncryptedUrl(table.tableNumber)}
                        size={160}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                  </div>
                  
                  {/* Bottom Section */}
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center space-x-4 text-gray-600">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                        <span className="text-sm font-medium">Table {table.tableNumber}</span>
                      </div>
                      <div className="w-1 h-4 bg-gray-300"></div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                        <span className="text-sm font-medium">{table.seats} Seats</span>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl px-4 py-3 inline-flex items-center space-x-2 border border-gray-200">
                      <FaUtensils className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm font-semibold text-gray-700">Digital Menu</span>
                    </div>
                    
                    <p className="text-xs text-gray-400 font-medium">
                      Scan to explore our menu
                    </p>
                  </div>
                  
                  {/* Bottom Accent Line */}
                  <div className="absolute bottom-0 left-4 right-4 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-12">
          <FaQrcode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No tables yet</h3>
          <p className="text-gray-500 mb-4">Create your first table to generate a QR code.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Add Table
          </button>
        </div>
      )}

      {/* Add Table Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setIsModalOpen(false)} />
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Add New Table</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Table Number *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g., 1"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Seats *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={seats}
                    onChange={(e) => setSeats(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g., 4"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isSubmitting ? <FaSpinner className="w-5 h-5 animate-spin mx-auto" /> : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setIsPrintModalOpen(false)} />
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-4xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Print QR Codes</h2>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              <p className="text-gray-600 mb-4">
                {tables.length} QR codes will be printed on {pages.length} page(s).
              </p>

              <div className="bg-gray-100 rounded-lg p-4 mb-6 max-h-96 overflow-y-auto">
                <div ref={printRef} className="bg-white p-8">
                  {pages.map((pageTables, pageIndex) => (
                    <div
                      key={pageIndex}
                      className="page-break-after"
                      style={{
                        width: '210mm',
                        minHeight: '297mm',
                        padding: '10mm',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '10mm',
                        breakAfter: 'page',
                      }}
                    >
                      {pageTables.map((table) => (
                        <div
                          key={table._id}
                          className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-white rounded-3xl shadow-2xl border border-gray-200"
                          style={{ height: '85mm', width: '85mm' }}
                        >
                          {/* Top Accent Line */}
                          <div className="absolute top-4 left-6 right-6 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full"></div>
                          
                          {/* Restaurant Header */}
                          <div className="text-center pt-2 pb-4">
                            {user?.logo ? (
                              <div className="mb-3">
                                <img 
                                  src={user.logo} 
                                  alt="Restaurant Logo" 
                                  className="w-12 h-12 rounded-2xl object-cover mx-auto shadow-lg border-2 border-white"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                <FaUtensils className="w-6 h-6 text-white" />
                              </div>
                            )}
                            <h2 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
                              {user?.restaurantName || 'Restaurant'}
                            </h2>
                            <div className="w-12 h-0.5 bg-gradient-to-r from-indigo-200 to-purple-200 mx-auto"></div>
                          </div>
                          
                          {/* QR Code Section */}
                          <div className="relative flex justify-center mb-4">
                            <div className="relative bg-white rounded-2xl shadow-lg p-3 border border-gray-100">
                              <QRCodeSVG
                                value={generateEncryptedUrl(table.tableNumber)}
                                size={120}
                                level="H"
                                includeMargin={false}
                              />
                            </div>
                          </div>
                          
                          {/* Bottom Section */}
                          <div className="text-center space-y-2">
                            <div className="flex items-center justify-center space-x-3 text-gray-600">
                              <div className="flex items-center space-x-1">
                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                                <span className="text-xs font-medium">Table {table.tableNumber}</span>
                              </div>
                              <div className="w-0.5 h-3 bg-gray-300"></div>
                              <div className="flex items-center space-x-1">
                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                                <span className="text-xs font-medium">{table.seats} Seats</span>
                              </div>
                            </div>
                            
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl px-3 py-2 inline-flex items-center space-x-1.5 border border-gray-200">
                              <FaUtensils className="w-3 h-3 text-indigo-600" />
                              <span className="text-xs font-semibold text-gray-700">Digital Menu</span>
                            </div>
                            
                            <p className="text-xs text-gray-400 font-medium">
                              Scan to explore menu
                            </p>
                          </div>
                          
                          {/* Bottom Accent Line */}
                          <div className="absolute bottom-4 left-6 right-6 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full"></div>
                        </div>
                      ))}
                      {/* Fill empty slots for 6-per-page layout */}
                      {Array.from({ length: 6 - pageTables.length }).map((_, idx) => (
                        <div
                          key={`empty-${idx}`}
                          className="border border-dashed border-gray-200 rounded-lg"
                          style={{ height: '85mm' }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center space-x-2"
                >
                  <FaPrint className="w-4 h-4" />
                  <span>Print Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
