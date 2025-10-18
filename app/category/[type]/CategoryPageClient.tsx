'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import UnifiedProductCard from '@/components/UnifiedProductCard';
import { useSupabaseRealtime } from '@/lib/hooks/useSupabaseRealtime';

interface Category {
  id: string;
  name: string;
  type: string;
  description?: string;
  image?: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  discount_percentage?: number;
  image?: string;
  slug: string;
  stock_quantity: number;
  rating?: number;
  reviews_count?: number;
  category_type?: string;
  is_active?: boolean;
}

interface CategoryPageClientProps {
  category: Category;
  initialProducts: Product[];
}

export default function CategoryPageClient({ category, initialProducts }: CategoryPageClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  // استماع للتغييرات في المنتجات
  useSupabaseRealtime({
    table: 'products',
    onChange: async (payload) => {
      console.log('🔄 Products updated in category:', category.type);
      
      if (payload.eventType === 'INSERT') {
        const newProduct = payload.new as Product;
        if (newProduct.category_type === category.type && newProduct.is_active) {
          setProducts((prev) => {
            if (prev.find(p => p.id === newProduct.id)) return prev;
            return [newProduct, ...prev];
          });
        }
      } else if (payload.eventType === 'UPDATE') {
        const updatedProduct = payload.new as Product;
        if (updatedProduct.category_type === category.type && updatedProduct.is_active) {
          setProducts((prev) =>
            prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
          );
        } else {
          // المنتج تم نقله لتصنيف آخر أو تم تعطيله
          setProducts((prev) => prev.filter((p) => p.id !== updatedProduct.id));
        }
      } else if (payload.eventType === 'DELETE') {
        const deletedProduct = payload.old as Product;
        setProducts((prev) => prev.filter((p) => p.id !== deletedProduct.id));
      }
    }
  });

  return (
    <main className="container mx-auto py-8 px-4" dir="rtl">
      {/* شريط التنقل */}
      <div className="flex items-center mb-6">
        <Link href="/" className="text-gray-600 hover:text-primary transition-colors flex items-center gap-1">
          <span>الرئيسية</span>
        </Link>
        <span className="mx-2">/</span>
        <Link href="/categories" className="text-gray-600 hover:text-primary transition-colors flex items-center gap-1">
          <span>التصنيفات</span>
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-primary">{category.name}</span>
      </div>

      {/* عنوان الصفحة */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
        <p className="text-gray-600">تسوق أفضل {category.name} في متجر العجايبي</p>
      </div>

      {/* عدد المنتجات */}
      <div className="mb-6">
        <p className="text-gray-600">
          عرض <span className="font-semibold">{products.length}</span> منتج
        </p>
      </div>

      {/* شبكة المنتجات */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {products.map((product) => (
            <UnifiedProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-24 h-24 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            لا توجد منتجات في هذا التصنيف حالياً
          </h3>
          <p className="text-gray-500 mb-6">يمكنك تصفح التصنيفات الأخرى</p>
          <Link
            href="/products"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            تصفح جميع المنتجات
          </Link>
        </div>
      )}
    </main>
  );
}
