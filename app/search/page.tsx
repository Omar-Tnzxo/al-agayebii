'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Filter, Grid3X3, LayoutList, X, SlidersHorizontal, Star, ChevronDown } from 'lucide-react';
import SearchBar from '@/components/SearchBar';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  slug: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  categoryType: string;
}

interface Category {
  value: string;
  label: string;
}

const SORT_OPTIONS = [
  { value: 'relevance', label: 'الأكثر صلة' },
  { value: 'popular', label: 'الأكثر شعبية' },
  { value: 'newest', label: 'الأحدث' },
  { value: 'price_asc', label: 'السعر: من الأقل للأعلى' },
  { value: 'price_desc', label: 'السعر: من الأعلى للأقل' },
  { value: 'rating', label: 'الأعلى تقييماً' },
];

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<Category[]>([{ value: 'all', label: 'جميع الفئات' }]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // الفلاتر
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('relevance');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // جلب الفئات من قاعدة البيانات
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories?status=active');
        const data = await response.json();
        
        if (data.success && data.data) {
          const categoryOptions: Category[] = [
            { value: 'all', label: 'جميع الفئات' },
            ...data.data.map((cat: any) => ({
              value: cat.type,
              label: cat.name
            }))
          ];
          setCategories(categoryOptions);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // جلب المنتجات من API
  const fetchProducts = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        sort: selectedSort,
      });

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (minPrice) {
        params.append('minPrice', minPrice);
      }
      if (maxPrice) {
        params.append('maxPrice', maxPrice);
      }

      const response = await fetch(`/api/search?${params.toString()}`);
      const data = await response.json();

      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [query, selectedSort, selectedCategory, minPrice, maxPrice]);

  const handleApplyFilters = () => {
    fetchProducts();
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setMinPrice('');
    setMaxPrice('');
  };

  const getCategoryLabel = (value: string) => {
    return categories.find(c => c.value === value)?.label || value;
  };

  const hasActiveFilters = selectedCategory !== 'all' || minPrice || maxPrice;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* شريط البحث */}
        <div className="mb-8">
          <SearchBar variant="hero" autoFocus />
        </div>

        {/* عرض نتائج البحث */}
        {query && (
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              نتائج البحث عن "{query}"
            </h1>
            <p className="text-gray-600">
              {isLoading ? 'جاري البحث...' : `عثرنا على ${total} منتج`}
            </p>
          </div>
        )}

        {/* شريط الفلاتر والترتيب */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* الفلاتر */}
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* زر الفلاتر */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  hasActiveFilters
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="font-medium">فلترة</span>
                {hasActiveFilters && (
                  <span className="bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {[selectedCategory !== 'all', minPrice, maxPrice].filter(Boolean).length}
                  </span>
                )}
              </button>

              {/* الفلاتر النشطة */}
              {hasActiveFilters && (
                <>
                  {selectedCategory !== 'all' && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm">
                      <span>{getCategoryLabel(selectedCategory)}</span>
                      <button onClick={() => setSelectedCategory('all')}>
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {(minPrice || maxPrice) && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm">
                      <span>
                        السعر: {minPrice || '0'} - {maxPrice || '∞'}
                      </span>
                      <button onClick={() => { setMinPrice(''); setMaxPrice(''); }}>
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={handleClearFilters}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    مسح الكل
                  </button>
                </>
              )}
            </div>

            {/* الترتيب وطريقة العرض */}
            <div className="flex items-center gap-3">
              {/* الترتيب */}
              <div className="relative">
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className="appearance-none px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              {/* طريقة العرض */}
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-primary text-white'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                  aria-label="عرض شبكي"
                >
                  <Grid3X3 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-primary text-white'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                  aria-label="عرض قائمة"
                >
                  <LayoutList className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* لوحة الفلاتر المنبثقة */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* الفئة */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الفئة
                  </label>
                  {isLoadingCategories ? (
                    <div className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-400">
                      جاري التحميل...
                    </div>
                  ) : (
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                      {categories.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* السعر الأدنى */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    السعر الأدنى (جنيه)
                  </label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                {/* السعر الأقصى */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    السعر الأقصى (جنيه)
                  </label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="∞"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleApplyFilters}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  تطبيق الفلاتر
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>

        {/* قائمة المنتجات */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">جاري البحث عن المنتجات...</p>
            </div>
          </div>
        ) : products.length > 0 ? (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }
          >
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className={`group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all ${
                  viewMode === 'list' ? 'flex gap-4' : 'block'
                }`}
              >
                {/* صورة المنتج */}
                <div
                  className={`relative bg-gray-100 ${
                    viewMode === 'grid'
                      ? 'aspect-square'
                      : 'w-40 h-40 flex-shrink-0'
                  }`}
                >
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                      <Search className="h-12 w-12" />
                    </div>
                  )}

                  {/* شارة الخصم */}
                  {product.discount && product.discount > 0 && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-md text-xs font-bold">
                      -{Math.round(product.discount)}%
                    </div>
                  )}

                  {/* شارة نفاذ المخزون */}
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold">
                        نفذت الكمية
                      </span>
                    </div>
                  )}
                </div>

                {/* معلومات المنتج */}
                <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {product.name}
                  </h3>

                  {product.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  {/* التقييم */}
                  {product.rating > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{product.rating}</span>
                      <span className="text-xs text-gray-500">
                        ({product.reviewCount})
                      </span>
                    </div>
                  )}

                  {/* السعر */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-primary">
                      {product.price.toLocaleString('ar-EG')} جنيه
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        {product.originalPrice.toLocaleString('ar-EG')} جنيه
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : query ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <Search className="h-24 w-24 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-3">لم يتم العثور على نتائج</h2>
              <p className="text-gray-600 mb-6">
                لم نتمكن من العثور على أي منتجات تطابق بحثك "{query}"
              </p>
              <div className="space-y-2 text-right text-sm text-gray-600">
                <p>نصائح للبحث:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>تحقق من الإملاء الصحيح</li>
                  <li>جرب كلمات بحث أكثر عمومية</li>
                  <li>جرب كلمات بحث مختلفة</li>
                  <li>قلل من عدد الفلاتر المطبقة</li>
                </ul>
              </div>
              <Link
                href="/products"
                className="inline-block mt-6 px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                تصفح جميع المنتجات
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <Search className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-3">ابحث عن منتجاتك المفضلة</h2>
            <p className="text-gray-600">
              استخدم شريط البحث أعلاه للعثور على المنتجات التي تحتاجها
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-lg">جاري تحميل صفحة البحث...</p>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // الفلاتر
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('relevance');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // جلب المنتجات من API
  const fetchProducts = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        sort: selectedSort,
      });

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (minPrice) {
        params.append('minPrice', minPrice);
      }
      if (maxPrice) {
        params.append('maxPrice', maxPrice);
      }

      const response = await fetch(`/api/search?${params.toString()}`);
      const data = await response.json();

      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [query, selectedSort, selectedCategory, minPrice, maxPrice]);

  const handleApplyFilters = () => {
    fetchProducts();
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setMinPrice('');
    setMaxPrice('');
  };

  const hasActiveFilters = selectedCategory !== 'all' || minPrice || maxPrice;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* شريط البحث */}
        <div className="mb-8">
          <SearchBar variant="hero" autoFocus />
        </div>

        {/* عرض نتائج البحث */}
        {query && (
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              نتائج البحث عن "{query}"
            </h1>
            <p className="text-gray-600">
              {isLoading ? 'جاري البحث...' : `عثرنا على ${total} منتج`}
            </p>
          </div>
        )}

        {/* شريط الفلاتر والترتيب */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* الفلاتر */}
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* زر الفلاتر */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  hasActiveFilters
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="font-medium">فلترة</span>
                {hasActiveFilters && (
                  <span className="bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {[selectedCategory !== 'all', minPrice, maxPrice].filter(Boolean).length}
                  </span>
                )}
              </button>

              {/* الفلاتر النشطة */}
              {hasActiveFilters && (
                <>
                  {selectedCategory !== 'all' && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm">
                      <span>{CATEGORY_OPTIONS.find(c => c.value === selectedCategory)?.label}</span>
                      <button onClick={() => setSelectedCategory('all')}>
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {(minPrice || maxPrice) && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm">
                      <span>
                        السعر: {minPrice || '0'} - {maxPrice || '∞'}
                      </span>
                      <button onClick={() => { setMinPrice(''); setMaxPrice(''); }}>
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={handleClearFilters}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    مسح الكل
                  </button>
                </>
              )}
            </div>

            {/* الترتيب وطريقة العرض */}
            <div className="flex items-center gap-3">
              {/* الترتيب */}
              <div className="relative">
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className="appearance-none px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              {/* طريقة العرض */}
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-primary text-white'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                  aria-label="عرض شبكي"
                >
                  <Grid3X3 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-primary text-white'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                  aria-label="عرض قائمة"
                >
                  <LayoutList className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* لوحة الفلاتر المنبثقة */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* الفئة */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الفئة
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* السعر الأدنى */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    السعر الأدنى (جنيه)
                  </label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                {/* السعر الأقصى */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    السعر الأقصى (جنيه)
                  </label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="∞"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleApplyFilters}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  تطبيق الفلاتر
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>

        {/* قائمة المنتجات */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">جاري البحث عن المنتجات...</p>
            </div>
          </div>
        ) : products.length > 0 ? (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }
          >
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className={`group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all ${
                  viewMode === 'list' ? 'flex gap-4' : 'block'
                }`}
              >
                {/* صورة المنتج */}
                <div
                  className={`relative bg-gray-100 ${
                    viewMode === 'grid'
                      ? 'aspect-square'
                      : 'w-40 h-40 flex-shrink-0'
                  }`}
                >
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                      <Search className="h-12 w-12" />
                    </div>
                  )}

                  {/* شارة الخصم */}
                  {product.discount && product.discount > 0 && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-md text-xs font-bold">
                      -{Math.round(product.discount)}%
                    </div>
                  )}

                  {/* شارة نفاذ المخزون */}
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold">
                        نفذت الكمية
                      </span>
                    </div>
                  )}
                </div>

                {/* معلومات المنتج */}
                <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {product.name}
                  </h3>

                  {product.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  {/* التقييم */}
                  {product.rating > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{product.rating}</span>
                      <span className="text-xs text-gray-500">
                        ({product.reviewCount})
                      </span>
                    </div>
                  )}

                  {/* السعر */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-primary">
                      {product.price.toLocaleString('ar-EG')} جنيه
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        {product.originalPrice.toLocaleString('ar-EG')} جنيه
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : query ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <Search className="h-24 w-24 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-3">لم يتم العثور على نتائج</h2>
              <p className="text-gray-600 mb-6">
                لم نتمكن من العثور على أي منتجات تطابق بحثك "{query}"
              </p>
              <div className="space-y-2 text-right text-sm text-gray-600">
                <p>نصائح للبحث:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>تحقق من الإملاء الصحيح</li>
                  <li>جرب كلمات بحث أكثر عمومية</li>
                  <li>جرب كلمات بحث مختلفة</li>
                  <li>قلل من عدد الفلاتر المطبقة</li>
                </ul>
              </div>
              <Link
                href="/products"
                className="inline-block mt-6 px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                تصفح جميع المنتجات
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <Search className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-3">ابحث عن منتجاتك المفضلة</h2>
            <p className="text-gray-600">
              استخدم شريط البحث أعلاه للعثور على المنتجات التي تحتاجها
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-lg">جاري تحميل صفحة البحث...</p>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
