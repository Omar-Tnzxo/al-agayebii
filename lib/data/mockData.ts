/**
 * Mock Data - بيانات وهمية للتطوير والاختبار
 * ملاحظة: هذه البيانات للتوافق مع الكود القديم فقط
 */

// دالة وهمية لجلب الفئات
export async function fetchCategories() {
  // في الواقع، يتم جلب البيانات من Supabase
  // هذه الدالة للتوافق فقط
  return [];
}

// دالة وهمية لجلب المنتجات
export async function fetchProducts() {
  // في الواقع، يتم جلب البيانات من Supabase
  // هذه الدالة للتوافق فقط
  return [];
}

// تصدير للتوافق مع sitemap.ts
export const categories = [];
export const products = [];

export default {
  fetchCategories,
  fetchProducts,
  categories,
  products
};
