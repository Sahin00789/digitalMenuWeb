'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import api from '@/services/api';
import toast from 'react-hot-toast';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaSpinner,
  FaImage,
} from 'react-icons/fa';

interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  ingredients?: string;
  preparationMethod?: string;
  image?: string;
  price: number;
  offerPrice?: number;
  discountPercentage: number;
  isActive: boolean;
  category?: string;
  foodType?: string;
}

export default function MenuManagementPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ingredients: '',
    preparationMethod: '',
    price: '',
    offerPrice: '',
    isActive: true,
    category: 'Other',
    foodType: 'Main Course',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await api.get('/menu');
      setMenuItems(response.data.data);
    } catch (error) {
      toast.error('Failed to load menu items');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      ingredients: '',
      preparationMethod: '',
      price: '',
      offerPrice: '',
      isActive: true,
      category: 'Other',
      foodType: 'Main Course',
    });
    setImageFile(null);
    setImagePreview('');
    setEditingItem(null);
  };

  const openModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        ingredients: item.ingredients || '',
        preparationMethod: item.preparationMethod || '',
        price: item.price.toString(),
        offerPrice: item.offerPrice?.toString() || '',
        isActive: item.isActive,
        category: item.category || 'Other',
        foodType: item.foodType || 'Main Course',
      });
      setImagePreview(item.image || '');
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('ingredients', formData.ingredients);
    data.append('preparationMethod', formData.preparationMethod);
    data.append('price', formData.price);
    if (formData.offerPrice) data.append('offerPrice', formData.offerPrice);
    data.append('isActive', formData.isActive.toString());
    data.append('category', formData.category);
    data.append('foodType', formData.foodType);
    if (imageFile) data.append('image', imageFile);

    try {
      if (editingItem) {
        await api.put(`/menu/${editingItem._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Menu item updated');
      } else {
        await api.post('/menu', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Menu item created');
      }
      closeModal();
      fetchMenuItems();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await api.delete(`/menu/${id}`);
      toast.success('Menu item deleted');
      fetchMenuItems();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const handleToggle = async (item: MenuItem) => {
    try {
      await api.patch(`/menu/toggle/${item._id}`);
      toast.success(`Item ${item.isActive ? 'deactivated' : 'activated'}`);
      fetchMenuItems();
    } catch (error) {
      toast.error('Failed to toggle item');
    }
  };

  const calculateDiscount = (price: number, offerPrice: number) => {
    if (!offerPrice || price <= 0) return 0;
    return Math.round(((price - offerPrice) / price) * 100);
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600 mt-1">Add, edit, and manage your restaurant menu items.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <FaPlus className="w-4 h-4" />
          <span>Add Item</span>
        </button>
      </div>

      {/* Menu Items Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <div
            key={item._id}
            className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
              item.isActive ? 'border-gray-100' : 'border-gray-200 opacity-75'
            }`}
          >
            <div className="relative h-48 bg-gray-100">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <FaImage className="w-12 h-12 text-gray-300" />
                </div>
              )}
              {!item.isActive && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-gray-800 text-white text-xs rounded">
                  Inactive
                </div>
              )}
              {item.offerPrice && item.discountPercentage > 0 && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded font-semibold">
                  -{item.discountPercentage}%
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded">
                  {item.category || 'Other'}
                </span>
                {item.foodType && (
                  <span className="inline-flex items-center px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded">
                    {item.foodType}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                {item.description || 'No description'}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {item.offerPrice ? (
                    <>
                      <span className="text-lg font-bold text-indigo-600">
                        ₹{item.offerPrice.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-400 line-through">
                        ₹{item.price.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-bold text-indigo-600">
                      ₹{item.price.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleToggle(item)}
                    className={`p-2 rounded-lg transition-colors ${
                      item.isActive
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                    title={item.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {item.isActive ? (
                      <FaToggleOn className="w-5 h-5" />
                    ) : (
                      <FaToggleOff className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => openModal(item)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {menuItems.length === 0 && (
        <div className="text-center py-12">
          <FaImage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No menu items yet</h3>
          <p className="text-gray-500 mb-4">Add your first menu item to get started.</p>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Add Item
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeModal} />
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <form onSubmit={handleSubmit} className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
                </h2>

                {/* Image Upload */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                  <div className="flex items-center space-x-4">
                    {imagePreview ? (
                      <div className="relative w-24 h-24">
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FaImage className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <label className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <span className="block w-full px-4 py-2 border border-gray-300 rounded-lg text-center cursor-pointer hover:bg-gray-50 transition-colors">
                        {imagePreview ? 'Change Image' : 'Upload Image'}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Offer Price
                        {formData.price && formData.offerPrice && (
                          <span className="ml-2 text-xs text-green-600">
                            ({calculateDiscount(parseFloat(formData.price), parseFloat(formData.offerPrice))}% off)
                          </span>
                        )}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.offerPrice}
                        onChange={(e) => setFormData({ ...formData, offerPrice: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="Appetizers">Appetizers</option>
                      <option value="Main Course">Main Course</option>
                      <option value="Desserts">Desserts</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Sides">Sides</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Food Type</label>
                    <select
                      value={formData.foodType}
                      onChange={(e) => setFormData({ ...formData, foodType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="Cold Beverage">Cold Beverage</option>
                      <option value="Hot Beverage">Hot Beverage</option>
                      <option value="Appetizers">Appetizers</option>
                      <option value="Soups">Soups</option>
                      <option value="Salads">Salads</option>
                      <option value="Main Course">Main Course</option>
                      <option value="Sides">Sides</option>
                      <option value="Desserts">Desserts</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients</label>
                    <input
                      type="text"
                      value={formData.ingredients}
                      onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="e.g., Chicken, Spices, Herbs"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preparation Method</label>
                    <input
                      type="text"
                      value={formData.preparationMethod}
                      onChange={(e) => setFormData({ ...formData, preparationMethod: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="e.g., Grilled for 15 minutes"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                      Active
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex space-x-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? (
                      <FaSpinner className="w-5 h-5 animate-spin mx-auto" />
                    ) : editingItem ? (
                      'Update'
                    ) : (
                      'Create'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
