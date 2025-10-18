'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSupabaseRealtime } from './useSupabaseRealtime';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  images?: string[];
  discount_percentage?: number;
  rating?: number;
  reviews_count?: number;
  stock_quantity?: number;
  slug: string;
  category_type?: string;
  is_active?: boolean;
}

interface UseRealtimeProductsOptions {
  initialProducts?: Product[];
  filter?: (product: Product) => boolean;
}

export function useRealtimeProducts({ initialProducts = [], filter }: UseRealtimeProductsOptions = {}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);

  // استماع للتغييرات في real-time
  const { lastPayload } = useSupabaseRealtime({
    table: 'products',
    event: '*',
    onChange: useCallback((payload: any) => {
      console.log('🔄 Realtime product change:', payload.eventType);
      
      if (payload.eventType === 'INSERT') {
        const newProduct = payload.new as Product;
        if (!filter || filter(newProduct)) {
          setProducts((prev) => {
            // تجنب التكرار
            if (prev.find(p => p.id === newProduct.id)) return prev;
            return [newProduct, ...prev];
          });
        }
      } else if (payload.eventType === 'UPDATE') {
        const updatedProduct = payload.new as Product;
        setProducts((prev) =>
          prev.map((p) =>
            p.id === updatedProduct.id ? updatedProduct : p
          ).filter(p => !filter || filter(p))
        );
      } else if (payload.eventType === 'DELETE') {
        const deletedProduct = payload.old as Product;
        setProducts((prev) => prev.filter((p) => p.id !== deletedProduct.id));
      }
    }, [filter])
  });

  // تحديث المنتجات عند تغيير initialProducts
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts);
    }
  }, [initialProducts]);

  const refreshProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/products?status=active');
      const data = await response.json();
      if (data.success && data.data) {
        let productList = data.data;
        if (filter) {
          productList = productList.filter(filter);
        }
        setProducts(productList);
      }
    } catch (error) {
      console.error('Error refreshing products:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  return {
    products,
    setProducts,
    refreshProducts,
    isLoading,
    lastUpdate: lastPayload
  };
}
