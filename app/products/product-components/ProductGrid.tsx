'use client';

import { useState, useEffect } from 'react';
import { Grid3X3, List, Loader2, AlertCircle, Package } from 'lucide-react';
import ProductCard from './ProductCard';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  slug: string;
  stock_quantity: number;
  rating?: number;
  reviews_count?: number;
  discount_percentage?: number;
  is_new?: boolean;
  is_featured?: boolean;
  is_popular?: boolean;
  product_images?: any[];
  colors?: any[];
  category_type?: string;
}

interface ProductGridProps {
  products: Product[];
  viewMode: 'grid' | 'list';
  loading?: boolean;
  error?: string;
  onProductQuickView?: (product: Product) => void;
  onProductAddToCart?: (product: Product) => void;
  onProductToggleWishlist?: (product: Product) => void;
  wishlistedProducts?: Set<string>;
  className?: string;
  currency: string; // ✅ أضف العملة هنا
}

export function ProductGrid({
  products,
  viewMode,
  loading = false,
  error,
  onProductQuickView,
  onProductAddToCart,
  onProductToggleWishlist,
  wishlistedProducts = new Set(),
  className = '',
  currency // ✅ استقبل العملة
}: ProductGridProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // رندر حالة التحميل
  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">جاري تحميل المنتجات...</p>
        </div>
      </div>
    );
  }

  // رندر حالة الخطأ
  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            حدث خطأ في تحميل المنتجات
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  // رندر حالة عدم وجود منتجات
  if (!products || products.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            لا توجد منتجات متاحة
          </h3>
          <p className="text-gray-600 mb-4">
            لم يتم العثور على منتجات تطابق معايير البحث المحددة
          </p>
          <button
            onClick={() => window.location.href = '/products'}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            عرض جميع المنتجات
          </button>
        </div>
      </div>
    );
  }

  // تحديد فئات الشبكة حسب وضع العرض
  const gridClasses = viewMode === 'grid' 
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
    : 'space-y-4';

  if (!mounted) {
    return (
      <div className={`${gridClasses} ${className}`}>
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductSkeleton key={index} viewMode={viewMode} />
        ))}
      </div>
    );
  }

  return (
    <div className={`${gridClasses} ${className}`}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          viewMode={viewMode}
          onQuickView={onProductQuickView}
          onAddToCart={onProductAddToCart}
          onToggleWishlist={onProductToggleWishlist}
          isWishlisted={wishlistedProducts.has(product.id)}
          currency={currency} // ✅ مرر العملة
        />
      ))}
    </div>
  );
}

// مكون Skeleton للتحميل
function ProductSkeleton({ viewMode }: { viewMode: 'grid' | 'list' }) {
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 animate-pulse">
        <div className="flex p-4">
          <div className="w-32 h-32 bg-gray-300 rounded-lg flex-shrink-0 ml-4"></div>
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            <div className="flex space-x-2 rtl:space-x-reverse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-4 h-4 bg-gray-300 rounded"></div>
              ))}
            </div>
            <div className="flex space-x-2 rtl:space-x-reverse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-4 h-4 bg-gray-300 rounded-full"></div>
              ))}
            </div>
            <div className="flex justify-between items-center">
              <div className="h-6 bg-gray-300 rounded w-20"></div>
              <div className="h-8 bg-gray-300 rounded w-24"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-300"></div>
      <div className="p-4 space-y-3">
        <div className="h-6 bg-gray-300 rounded w-3/4"></div>
        <div className="flex space-x-2 rtl:space-x-reverse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-4 h-4 bg-gray-300 rounded"></div>
          ))}
        </div>
        <div className="flex space-x-2 rtl:space-x-reverse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-4 h-4 bg-gray-300 rounded-full"></div>
          ))}
        </div>
        <div className="h-6 bg-gray-300 rounded w-1/2"></div>
      </div>
    </div>
  );
}

export default ProductGrid; 