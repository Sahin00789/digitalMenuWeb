'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { FaUtensils, FaPlus, FaMinus, FaQrcode } from 'react-icons/fa';
import { MenuItem, CartItem } from '@/types/order';


interface MenuTabProps {
  menuItems: Record<string, MenuItem[]>;
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  getItemQuantity: (itemId: string) => number;
  restaurantInfo: { name: string; id: string } | null;
  session: any;
}

export default function MenuTab({
  menuItems,
  cart,
  addToCart,
  removeFromCart,
  getItemQuantity,
  restaurantInfo,
  session
}: MenuTabProps) {
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [activeFoodType, setActiveFoodType] = useState<string>('');
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const categories = Object.keys(menuItems).sort();

  // Extract unique food types dynamically from menu items
  const foodTypes = Array.from(
    new Set(
      Object.values(menuItems)
        .flat()
        .map(item => item.foodType)
        .filter(Boolean) as string[]
    )
  ).sort();

  const scrollToCategory = (category: string) => {
    setActiveCategory(category);
    const element = categoryRefs.current[category];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleFoodType = (foodType: string) => {
    setActiveFoodType(activeFoodType === foodType ? '' : foodType);
  };
  return (
    <>
      {/* Menu Items */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Welcome Card */}
        {(restaurantInfo || session.tableNumber) && (
          <div className="mb-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-xl p-4 text-white shadow-xl overflow-hidden relative border border-purple-500/20">
            {/* Subtle Grid Background */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '15px 15px'
              }}></div>
            </div>
            
            <div className="relative z-10">
              {/* Compact Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <FaUtensils className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">DigitalMenu</h3>
                    <p className="text-xs text-purple-200">Order & Pay</p>
                  </div>
                </div>
                <div className="bg-green-500/20 border border-green-400/30 rounded-full px-2 py-0.5">
                  <span className="text-xs font-medium text-green-300">ONLINE</span>
                </div>
              </div>

              {/* Restaurant & Table Info */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-purple-200 mb-1">Dining at</p>
                    {restaurantInfo && (
                      <h2 className="text-lg font-bold text-white truncate">
                        {restaurantInfo.name}
                      </h2>
                    )}
                  </div>
                  
                  {session.tableNumber && (
                    <div className="flex items-center gap-2 bg-black/20 rounded-lg px-2 py-1.5 flex-shrink-0">
                      <FaQrcode className="w-3 h-3 text-purple-300" />
                      <div>
                        <p className="text-xs text-purple-200">Table</p>
                        <p className="text-sm font-bold text-white">#{session.tableNumber}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Food Type Toggle Buttons */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {foodTypes.map((foodType) => (
              <button
                key={foodType}
                onClick={() => toggleFoodType(foodType)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeFoodType === foodType
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                  }`}
              >
                {foodType}
              </button>
            ))}
          </div>
        </div>
        {categories.filter(cat => cat !== 'Other').length > 0 && (
          <div className="mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.filter(cat => cat !== 'Other').map((category) => (
                <button
                  key={category}
                  onClick={() => scrollToCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === category
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  {category}
                  <span className="ml-2 text-xs opacity-75">
                    ({menuItems[category].length})
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {Object.entries(menuItems).map(([category, items]) => {
          // Filter items by active food type
          const filteredItems = activeFoodType
            ? items.filter(item => item.foodType === activeFoodType)
            : items;

          // Skip empty categories when filtering
          if (activeFoodType && filteredItems.length === 0) return null;

          return (
            <div
              key={category}
              ref={(el) => { categoryRefs.current[category] = el; }}
              className="mb-8 scroll-mt-4"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4 sticky top-0 bg-gray-50 py-2 z-10">{category}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((item) => (
                  <div key={item._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="relative h-40 bg-gray-100">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <FaUtensils className="w-10 h-10 text-gray-300" />
                        </div>
                      )}
                      {item.discountPercentage && item.discountPercentage > 0 && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded font-semibold">
                          -{item.discountPercentage}%
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {item.description || 'No description available'}
                      </p>
                      <div className="flex items-center justify-between mt-3">
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
                        <div className="flex items-center space-x-2">
                          {getItemQuantity(item._id) > 0 && (
                            <>
                              <button
                                onClick={() => removeFromCart(item._id)}
                                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200"
                              >
                                <FaMinus className="w-3 h-3" />
                              </button>
                              <span className="text-sm font-medium w-4 text-center">
                                {getItemQuantity(item._id)}
                              </span>
                            </>
                          )}
                          <button
                            onClick={() => addToCart(item)}
                            className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-700"
                          >
                            <FaPlus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {Object.keys(menuItems).length === 0 && (
          <div className="text-center py-12">
            <FaUtensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No items available</h3>
            <p className="text-gray-500">Check back later for our menu updates.</p>
          </div>
        )}
      </main>
    </>
  );
}
