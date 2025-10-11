import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import ProductCard from '../../components/ProductCard';

// جلب بيانات التصنيف والمنتجات عبر type
async function getCategoryDataByType(type: string) {
  try {
    // جلب بيانات التصنيف
    const categoryResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/categories?type=${type}`, {
      cache: 'no-store'
    });
    let category = null;
    if (categoryResponse.ok) {
      const categories = await categoryResponse.json();
      // ابحث عن أول تصنيف يطابق type
      category = (categories.data || []).find((cat: any) => cat.type?.toLowerCase() === type.toLowerCase());
    }
    if (!category || !category.type) {
      return { category: null, products: [] };
    }
    // جلب منتجات التصنيف عبر type
    const productsResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/products?category_type=${category.type}`, {
      cache: 'no-store'
    });
    let products = [];
    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      const arr = Array.isArray(productsData.data) ? productsData.data : [];
      products = arr.filter((product: any) => product.category_type === category.type);
    }
    return { category, products };
  } catch (error) {
    console.error('Error in getCategoryDataByType:', error);
    return { category: null, products: [] };
  }
}

export async function generateMetadata({ params }: { params: { type: string } }) {
  const { type } = params;
  const { category } = await getCategoryDataByType(type);
  if (!category) {
    return {
      title: 'التصنيف غير موجود',
      description: 'لم يتم العثور على التصنيف المطلوب.'
    };
  }
  return {
    title: `${category.name} | التصنيفات`,
    description: category.description || `منتجات تصنيف ${category.name}`
  };
}

export default async function CategoryTypePage({ params }: { params: { type: string } }) {
  const { type } = params;
  const { category, products: categoryProducts } = await getCategoryDataByType(type);
  if (!category) {
    notFound();
  }
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
      {/* صورة التصنيف الرئيسية */}
      <div className="relative mb-8 rounded-xl overflow-hidden h-40 md:h-60">
        <Image
          src={category.image || '/images/tools.jpg'}
          alt={category.name}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 1200px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-0 right-0 left-0 p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">{category.name}</h2>
              <p className="text-sm opacity-90">{categoryProducts.length} منتج</p>
            </div>
          </div>
        </div>
      </div>
      {/* عرض المنتجات */}
      {categoryProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categoryProducts.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center p-12 bg-gray-100 rounded-lg">
          <h3 className="text-xl font-bold mb-2">لا توجد منتجات</h3>
          <p className="mb-4">لم يتم العثور على منتجات في هذا التصنيف.</p>
          <Link href="/products" className="text-primary hover:underline">
            استعرض جميع المنتجات
          </Link>
        </div>
      )}
    </main>
  );
} 