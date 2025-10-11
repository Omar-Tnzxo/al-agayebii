import { Suspense } from 'react';
import { safeCreateClient } from '@/lib/auth';
import ProductsClient from './products-client';
import { metadata, revalidate } from './metadata';
import { ProductGrid } from './product-components/ProductGrid';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { useState, useEffect } from 'react';

export { metadata, revalidate };

// مكون التحميل
function ProductsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">جاري تحميل المنتجات...</p>
      </div>
    </div>
  );
}

// صفحة المنتجات (Server Component)
export default async function ProductsPage() {
  try {
    // جلب الفئات من قاعدة البيانات
    const supabase = await safeCreateClient();
    
    if (!supabase) {
      console.warn('⚠️ فشل في إنشاء عميل Supabase');
      return (
        <Suspense fallback={<ProductsLoading />}>
          <ProductsClient initialCategories={[]} />
        </Suspense>
      );
    }
    
    const { data: categories } = await supabase.from('categories').select('*');
    
    return (
      <Suspense fallback={<ProductsLoading />}>
        <ProductsClient initialCategories={categories || []} />
      </Suspense>
    );
  } catch (error) {
    console.error('❌ خطأ في جلب الفئات:', error);
    return (
      <Suspense fallback={<ProductsLoading />}>
        <ProductsClient initialCategories={[]} />
      </Suspense>
    );
  }
} 