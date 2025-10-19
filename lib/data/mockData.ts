/**
 * Mock Data - بيانات وهمية للتطوير والاختبار
 */

// Types
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
  price: number;
  category_type: string;
  description?: string;
  image?: string;
}

// دالة وهمية لجلب الفئات
export async function fetchCategories(): Promise<Category[]> {
  return [];
}

// دالة وهمية لجلب المنتجات
export async function fetchProducts(): Promise<Product[]> {
  return [];
}

// تصدير للتوافق مع sitemap.ts
export const categories: Category[] = [];
export const products: Product[] = [];

export default {
  fetchCategories,
  fetchProducts,
  categories,
  products
};
