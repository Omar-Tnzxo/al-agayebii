import ProductClient from './ProductClient';
import { generateMetadata } from './metadata';

// تفعيل ISR لصفحة المنتج الفردية (10 دقائق)
export const revalidate = 600;

// تصدير دالة البيانات الوصفية
export { generateMetadata };

// صفحة المنتج الفردية
export default async function ProductPage({ params }: { params: { slug: string } }) {
  return <ProductClient params={params} />;
} 