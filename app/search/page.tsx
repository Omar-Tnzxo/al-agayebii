'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, Grid3X3, LayoutList } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  slug: string;
}

// مكون البحث الداخلي المغلف بـ Suspense
function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(query);
  
  // قائمة وهمية من المنتجات للبحث
  const dummyProducts = [
    {
      id: "e7d2e4f3-5f4d-7e4f-2e4f-3e4f3e4f3e4f",
      name: "مفك كهربائي احترافي",
      description: "مفك كهربائي متعدد السرعات للاستخدامات الاحترافية",
      price: 1200,
      image: "/images/drill.png",
      slug: "electric-screwdriver-professional",
    },
    {
      id: "f8e3f5a4-6a5e-8f5a-3f5a-4f5a4f5a4f5a",
      name: "طقم مفاتيح متنوعة",
      description: "مجموعة متنوعة من المفاتيح بأحجام مختلفة",
      price: 850,
      image: "/images/wrench-set.jpg",
      slug: "wrench-set-variety",
    },
    {
      id: "b0a5b7c6-8c7a-0b7c-5b7c-6b7c6b7c6b7c",
      name: "مجموعة أدوات منزلية",
      description: "أدوات منزلية متنوعة للإصلاحات البسيطة",
      price: 450,
      image: "/images/tool-kit.jpg",
      slug: "home-tools-kit",
    }
  ];
  
  // البحث البسيط في المنتجات
  const searchResults = query ? 
    dummyProducts.filter(product => 
      product.name.includes(query) || 
      product.description.includes(query)
    ) : 
    dummyProducts;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">البحث عن منتجات</h1>
      
      {/* نموذج البحث */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن منتج..."
            className="w-full p-4 pr-12 rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
          <button type="submit" className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <Search className="h-5 w-5 text-primary" />
          </button>
        </div>
      </form>

      {/* عرض نتائج البحث */}
      <div className="mb-6 flex justify-between items-center">
        <div className="text-sm text-accent/80">
          تم العثور على {searchResults.length} منتجات
        </div>
        <div className="flex space-x-2 rtl:space-x-reverse">
          <button className="p-2 rounded-md bg-accent/5 text-accent/80 hover:bg-accent/10">
            <LayoutList className="h-5 w-5" />
          </button>
          <button className="p-2 rounded-md bg-primary/10 text-primary">
            <Grid3X3 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* قائمة المنتجات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {searchResults.map((product) => (
          <div 
            key={product.id}
            className="border border-accent/10 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            <Link href={`/product/${product.slug}`} className="block">
              <div className="aspect-video bg-accent/5 relative">
                <div className="absolute inset-0 flex items-center justify-center text-accent/30">
                  صورة المنتج
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                <p className="text-accent/70 line-clamp-2 mb-2 text-sm">
                  {product.description}
                </p>
                <div className="font-bold text-primary">{product.price} جنيه</div>
              </div>
            </Link>
          </div>
        ))}
      </div>
      
      {searchResults.length === 0 && (
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold mb-2">لم يتم العثور على نتائج</h2>
          <p className="text-accent/70 mb-6">
            لم نتمكن من العثور على أي منتجات تطابق بحثك "{query}"
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-primary text-white font-medium rounded-lg"
          >
            العودة للصفحة الرئيسية
          </Link>
        </div>
      )}
    </div>
  );
}

// صفحة البحث الرئيسية مع Suspense boundary
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">جاري تحميل نتائج البحث...</h2>
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
} 