'use client';

import { Star, Package, TrendingUp, Eye } from 'lucide-react';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  image?: string;
  price: number;
  totalQuantity: number;
  totalRevenue: number;
}

interface TopProductsProps {
  products: Product[];
  isLoading: boolean;
}

export default function TopProducts({ products, isLoading }: TopProductsProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="w-48 h-6 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="w-24 h-3 bg-gray-100 rounded"></div>
                </div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Star className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">أفضل المنتجات مبيعاً</h3>
            <p className="text-sm text-gray-600">أداء المنتجات</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-40 text-gray-500">
          <div className="text-center">
            <Package className="h-8 w-8 mx-auto mb-2 text-gray-500" />
            <p className="text-sm">لا توجد مبيعات متاحة</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-orange-100 rounded-lg">
          <Star className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">أفضل المنتجات مبيعاً</h3>
          <p className="text-sm text-gray-600">أداء المنتجات</p>
        </div>
      </div>

      <div className="space-y-4">
        {products.map((product, index) => (
          <div
            key={product.id}
            className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors group"
          >
            {/* ترتيب المنتج */}
            <div className="flex-shrink-0">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white
                ${index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-gray-400' :
                  index === 2 ? 'bg-orange-600' : 'bg-blue-500'}
              `}>
                {index + 1}
              </div>
            </div>

            {/* صورة المنتج */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* معلومات المنتج */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                {product.name}
              </h4>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  {product.totalQuantity} قطعة
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {formatPrice(product.totalRevenue)}
                </span>
              </div>
            </div>

            {/* سعر المنتج */}
            <div className="flex-shrink-0 text-left">
              <div className="font-bold text-gray-900">
                {formatPrice(product.price)}
              </div>
              <div className="text-xs text-gray-500">
                سعر الوحدة
              </div>
            </div>

            {/* مؤشر الأداء */}
            <div className="flex-shrink-0">
              <div className="w-2 h-8 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`w-full bg-gradient-to-t transition-all duration-500 ${
                    index === 0 ? 'from-yellow-400 to-yellow-500' :
                    index === 1 ? 'from-gray-300 to-gray-400' :
                    index === 2 ? 'from-orange-500 to-orange-600' : 'from-blue-400 to-blue-500'
                  }`}
                  style={{
                    height: `${Math.min((product.totalQuantity / products[0].totalQuantity) * 100, 100)}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-500" />
          <p>لا توجد مبيعات متاحة</p>
        </div>
      )}
    </div>
  );
}