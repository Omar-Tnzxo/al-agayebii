'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { safeCreateClient } from '@/lib/auth';
import { useSupabaseRealtime } from '@/lib/hooks/useSupabaseRealtime';
import { useSiteSettings } from '@/app/components/SiteSettingsProvider';
import { 
  ProductCard,
  ProductGrid,
  ProductFilters,
  ProductSortBar,
  ProductPagination,
  QuickViewModal
} from './product-components';
import { Loader2, AlertCircle, Package, Filter, X, Star } from 'lucide-react';
import { addToCart } from '@/lib/store/cart';
import { fetchProducts as mockFetchProducts } from '@/lib/data/mockData';

// واجهات البيانات
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
  is_active?: boolean;
  product_images?: {
    id: string;
    image_url: string;
    is_primary: boolean;
    display_order: number;
  }[];
  product_colors?: {
    id: string;
    color_name: string;
    color_code: string;
    is_available: boolean;
  }[];
  category_type?: string;
  category_id?: string;
  sku?: string;
  created_at?: string;
  updated_at?: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
  description?: string;
  image?: string;
  is_active?: boolean;
}

interface FilterState {
  categories: string[];
  priceRange: {
    min: number;
    max: number;
  };
  inStock: boolean;
  onSale: boolean;
  isNew: boolean;
  isFeatured: boolean;
  isPopular: boolean;
  rating: number;
  colors: string[];
  ratingMode: 'exact' | 'atLeast'; // جديد
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// الخصائص الافتراضية للفلاتر
const defaultFilters: FilterState = {
  categories: [],
  priceRange: { min: 0, max: 10000 },
  inStock: false,
  onSale: false,
  isNew: false,
  isFeatured: false,
  isPopular: false,
  rating: 0,
  colors: [],
  ratingMode: 'atLeast', // القيمة الافتراضية
};

// خيارات الترتيب
const sortOptions = {
  featured: 'is_featured',
  name_asc: 'name',
  name_desc: 'name',
  price_asc: 'price',
  price_desc: 'price',
  rating_desc: 'rating',
  newest: 'created_at',
  popular: 'is_popular',
  stock_desc: 'stock_quantity'
};

interface ProductsClientProps {
  initialCategories: Category[];
}

export default function ProductsClient({ initialCategories }: ProductsClientProps) {
  // الحالات الرئيسية
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(initialCategories || []);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 24,
    total: 0,
    totalPages: 0
  });

  // حالات التحميل والأخطاء
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // حالات إضافية
  const [wishlistedProducts, setWishlistedProducts] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [productCounts, setProductCounts] = useState({
    total: 0,
    inStock: 0,
    onSale: 0,
    isNew: 0,
    isFeatured: 0,
    isPopular: 0,
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const { settings } = useSiteSettings();
  const currency = settings.currencySymbol || 'ج.م';

  // تحديث الفلاتر من URL عند التحميل
  useEffect(() => {
    const urlFilters = { ...defaultFilters };
    
    // قراءة الفلاتر من URL
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      urlFilters.categories = [categoryParam];
    }

    const priceMinParam = searchParams.get('price_min');
    const priceMaxParam = searchParams.get('price_max');
    if (priceMinParam) urlFilters.priceRange.min = parseInt(priceMinParam);
    if (priceMaxParam) urlFilters.priceRange.max = parseInt(priceMaxParam);

    const searchParam = searchParams.get('search');
    if (searchParam) setSearchQuery(searchParam);

    const sortParam = searchParams.get('sort');
    if (sortParam && sortOptions[sortParam as keyof typeof sortOptions]) {
      setSortBy(sortParam);
    }

    const viewParam = searchParams.get('view');
    if (viewParam === 'list' || viewParam === 'grid') {
      setViewMode(viewParam);
    }

    const pageParam = searchParams.get('page');
    if (pageParam) {
      setPagination(prev => ({ ...prev, page: parseInt(pageParam) }));
    }

    setFilters(urlFilters);
  }, [searchParams]);

  // جلب المنتجات
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = await safeCreateClient();

      // بناء الاستعلام
      let query: any = null;
      if (supabase) {
        query = supabase
          .from('products')
          .select(`
            *,
            product_images(id, image_url, is_primary, display_order),
            product_colors(id, color_name, color_code, is_available)
          `, { count: 'exact' })
          .eq('is_active', true);
      }

      // تطبيق الفلاتر
      if (filters.categories.length > 0) {
        query = query.in('category_type', filters.categories);
      }

      if (filters.priceRange.min > 0) {
        query = query.gte('price', filters.priceRange.min);
      }

      if (filters.priceRange.max < 10000) {
        query = query.lte('price', filters.priceRange.max);
      }

      if (filters.inStock) {
        query = query.gt('stock_quantity', 0);
      }

      if (filters.onSale) {
        query = query.gt('discount_percentage', 0);
      }

      if (filters.isNew) {
        query = query.eq('is_new', true);
      }

      if (filters.isFeatured) {
        query = query.eq('is_featured', true);
      }

      if (filters.isPopular) {
        query = query.eq('is_popular', true);
      }

      if (filters.rating > 0) {
        if (filters.ratingMode === 'exact') {
          query = query.eq('rating', filters.rating);
        } else {
          query = query.gte('rating', filters.rating);
        }
      }

      // البحث النصي
      if (query && searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`);
      }

      // الترتيب
      const sortField = sortOptions[sortBy as keyof typeof sortOptions] || 'created_at';
      const isDescending = ['price_desc', 'rating_desc', 'newest', 'stock_desc'].includes(sortBy);
      if (query) {
        query = query.order(sortField, { ascending: !isDescending });
      }

      // إضافة ترتيب ثانوي
      if (query && sortBy === 'featured') {
        query = query.order('is_featured', { ascending: false });
      }

      // التصفح (Pagination)
      if (query) {
        const startIndex = (pagination.page - 1) * pagination.limit;
        query = query.range(startIndex, startIndex + pagination.limit - 1);

        const { data, error: fetchError, count } = await query;

        if (fetchError) {
          throw fetchError;
        }

        setProducts(data || []);
        setPagination(prev => ({
          ...prev,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / prev.limit)
        }));
      } else {
        // سقوط احتياطي بدون Supabase: استخدم البيانات الثابتة
        const all = await mockFetchProducts();

        // تطبيق الفلاتر محليًا
        let filtered = all.filter(p => true);
        if (filters.categories.length > 0) {
          filtered = filtered.filter(p => p.category_type === filters.categories[0]);
        }
        if (filters.priceRange.min > 0) {
          filtered = filtered.filter(p => p.price >= filters.priceRange.min);
        }
        if (filters.priceRange.max < 10000) {
          filtered = filtered.filter(p => p.price <= filters.priceRange.max);
        }
        if (filters.inStock) {
          filtered = filtered.filter(p => (p as any).stock_quantity > 0 || (p as any).stockQuantity > 0);
        }
        if (filters.onSale) {
          filtered = filtered.filter(p => (p as any).discount_percentage > 0 || (p as any).discount > 0);
        }
        if (filters.isNew) {
          filtered = filtered.filter(p => (p as any).is_new || (p as any).isNew);
        }
        if (filters.isFeatured) {
          filtered = filtered.filter(p => (p as any).is_featured);
        }
        if (filters.isPopular) {
          filtered = filtered.filter(p => (p as any).is_popular || (p as any).isPopular);
        }
        if (filters.rating > 0) {
          filtered = filtered.filter(p => (p as any).rating >= filters.rating);
        }
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(q) ||
            (p as any).description?.toLowerCase()?.includes(q) ||
            (p as any).sku?.toLowerCase()?.includes(q)
          );
        }

        // ترتيب
        const compare = (a: any, b: any) => {
          const map: Record<string, (x: any) => any> = {
            featured: (x) => (x.is_featured ? 1 : 0),
            name_asc: (x) => x.name,
            name_desc: (x) => x.name,
            price_asc: (x) => x.price,
            price_desc: (x) => x.price,
            rating_desc: (x) => x.rating || 0,
            newest: (x) => new Date(x.created_at || 0).getTime(),
            popular: (x) => (x.is_popular ? 1 : 0),
            stock_desc: (x) => x.stock_quantity || x.stockQuantity || 0,
          };
          const key = map[sortBy as keyof typeof map] || map['newest'];
          const va = key(a);
          const vb = key(b);
          if (sortBy === 'name_desc' || sortBy === 'price_desc' || sortBy === 'rating_desc' || sortBy === 'newest' || sortBy === 'stock_desc') {
            return va > vb ? -1 : va < vb ? 1 : 0;
          }
          return va > vb ? 1 : va < vb ? -1 : 0;
        };
        filtered = filtered.sort(compare);

        // تقسيم الصفحات
        const start = (pagination.page - 1) * pagination.limit;
        const paged = filtered.slice(start, start + pagination.limit);

        setProducts(paged as any);
        setPagination(prev => ({
          ...prev,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / prev.limit)
        }));
      }

    } catch (err) {
      console.error('خطأ في جلب المنتجات:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في جلب المنتجات');
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery, sortBy, pagination.page, pagination.limit]);

  // جلب إحصائيات المنتجات
  const fetchProductCounts = useCallback(async () => {
    try {
      const supabase = await safeCreateClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('products')
          .select('stock_quantity, discount_percentage, is_new, is_featured, is_popular')
          .eq('is_active', true);

        if (error) throw error;

        const counts = {
          total: data.length,
          inStock: data.filter(p => (p as any).stock_quantity > 0).length,
          onSale: data.filter(p => (p as any).discount_percentage > 0).length,
          isNew: data.filter(p => (p as any).is_new).length,
          isFeatured: data.filter(p => (p as any).is_featured).length,
          isPopular: data.filter(p => (p as any).is_popular).length,
        };

        setProductCounts(counts);
      } else {
        // سقوط احتياطي: حساب الإحصائيات من البيانات الثابتة
        const data = await mockFetchProducts();
        const counts = {
          total: data.length,
          inStock: data.filter(p => (p as any).stockQuantity > 0 || (p as any).stock_quantity > 0).length,
          onSale: data.filter(p => (p as any).discount > 0 || (p as any).discount_percentage > 0).length,
          isNew: data.filter(p => (p as any).isNew || (p as any).is_new).length,
          isFeatured: data.filter(p => (p as any).is_featured).length,
          isPopular: data.filter(p => (p as any).isPopular || (p as any).is_popular).length,
        };
        setProductCounts(counts);
      }
    } catch (err) {
      console.error('خطأ في جلب إحصائيات المنتجات:', err);
    }
  }, []);

  // تحديث URL عند تغيير الفلاتر
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();

    if (filters.categories.length > 0) {
      params.set('category', filters.categories[0]);
    }

    if (filters.priceRange.min > 0) {
      params.set('price_min', filters.priceRange.min.toString());
    }

    if (filters.priceRange.max < 10000) {
      params.set('price_max', filters.priceRange.max.toString());
    }

    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }

    if (sortBy !== 'featured') {
      params.set('sort', sortBy);
    }

    if (viewMode !== 'grid') {
      params.set('view', viewMode);
    }

    if (pagination.page > 1) {
      params.set('page', pagination.page.toString());
    }


    const newURL = `/products${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newURL, { scroll: false });
  }, [filters, searchQuery, sortBy, viewMode, pagination.page, router]);

  // تأثيرات جانبية
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchProductCounts();
  }, [fetchProductCounts]);

  useEffect(() => {
    updateURL();
  }, [updateURL]);

  // استخدام Realtime للتحديثات المباشرة
  useSupabaseRealtime({
    table: 'products',
    onChange: () => {
      fetchProducts();
      fetchProductCounts();
    }
  });

  // معالجات الأحداث
  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleSortChange = useCallback((newSortBy: string) => {
    setSortBy(newSortBy);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleItemsPerPageChange = useCallback((limit: number) => {
    setPagination(prev => ({ 
      ...prev, 
      limit, 
      page: 1,
      totalPages: Math.ceil(prev.total / limit)
    }));
  }, []);

  const handleProductQuickView = useCallback((product: Product) => {
    setSelectedProduct(product);
    setShowQuickView(true);
  }, []);

  const handleProductAddToCart = useCallback(async (product: Product, quantity: number = 1) => {
    try {
    // إضافة المنتج للسلة مع تمرير الخصائص المطلوبة
    const cartProduct = {
      ...product,
      description: typeof product.description === 'string' ? product.description : '',
      image: typeof product.image === 'string' ? product.image : '',
      category_type: typeof product.category_type === 'string' ? product.category_type : '',
      sku: typeof product.sku === 'string' ? product.sku : '',
      discount_percentage: product.discount_percentage || 0,
      discount_price: product.discount_percentage && product.discount_percentage > 0 ? product.price * (product.discount_percentage / 100) : null,
    };
      
      // إضافة المنتج للسلة مع تطبيق شركة الشحن الافتراضية
      await addToCart(cartProduct, quantity);
      
      // إظهار رسالة نجاح
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('showToast', {
          detail: {
            type: 'success',
            message: `تم إضافة ${product.name} إلى السلة بنجاح!`
          }
        }));
      }
    } catch (error) {
      console.error('خطأ في إضافة المنتج للسلة:', error);
      
      // إظهار رسالة خطأ
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('showToast', {
          detail: {
            type: 'error',
            message: 'حدث خطأ في إضافة المنتج للسلة'
          }
        }));
      }
    }
  }, []);

  const handleProductToggleWishlist = useCallback((product: Product) => {
    setWishlistedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(product.id)) {
        newSet.delete(product.id);
      } else {
        newSet.add(product.id);
      }
      return newSet;
    });
  }, []);

  // رندر حالة الخطأ الرئيسية
  if (error && !loading) {
  return (
    <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            حدث خطأ في تحميل المنتجات
              </h3>
          <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={() => {
              setError(null);
              fetchProducts();
                  }}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
            إعادة المحاولة
                </button>
              </div>
            </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* رأس الصفحة */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">جميع المنتجات</h1>
          <p className="text-gray-600">
            تصفح مجموعتنا الواسعة من المنتجات عالية الجودة
          </p>
            </div>
            
        <div className="flex flex-col lg:flex-row gap-6">
          {/* الفلاتر الجانبية */}
          <div className="lg:w-1/4">
            {/* فلاتر الشاشات الكبيرة */}
            <div className="hidden lg:block">
              <ProductFilters
                categories={categories}
                filters={filters}
                onFiltersChange={handleFiltersChange}
                isLoading={loading}
                productCounts={productCounts}
              />
            </div>

            {/* فلاتر الشاشات الصغيرة */}
            {showMobileFilters && (
              <div
                className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50"
                onClick={() => setShowMobileFilters(false)}
              >
                <div
                  className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">الفلاتر</h3>
              <button
                        onClick={() => setShowMobileFilters(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <X className="w-5 h-5" />
              </button>
            </div>
          </div>
                  <ProductFilters
                    categories={categories}
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    isLoading={loading}
                    productCounts={productCounts}
                    className="border-0 shadow-none"
                  />
            </div>
              </div>
            )}
        </div>
        
          {/* المحتوى الرئيسي */}
          <div className="lg:w-3/4">
          {/* شريط التحكم */}
            <ProductSortBar
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              sortBy={sortBy}
              onSortChange={handleSortChange}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              resultsCount={products.length}
              totalCount={pagination.total}
              isLoading={loading}
              onFilterToggle={() => setShowMobileFilters(true)}
              showFilters={Object.values(filters).some(value => 
                Array.isArray(value) ? value.length > 0 : value !== defaultFilters[value as keyof FilterState]
              )}
              className="mb-6"
            />

            {/* شبكة المنتجات */}
            <ProductGrid
              products={products}
              viewMode={viewMode}
              loading={loading}
              error={error || undefined}
              onProductQuickView={handleProductQuickView}
              onProductAddToCart={handleProductAddToCart}
              onProductToggleWishlist={handleProductToggleWishlist}
              wishlistedProducts={wishlistedProducts}
              className="mb-6"
              currency={currency}
            />

            {/* التنقل بين الصفحات */}
            {pagination.totalPages > 1 && (
              <ProductPagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                isLoading={loading}
              />
            )}
            </div>
          </div>
              </div>
              
      {/* نافذة المعاينة السريعة */}
      {selectedProduct && (
        <QuickViewModal
          product={selectedProduct}
          isOpen={showQuickView}
          onClose={() => {
            setShowQuickView(false);
            setSelectedProduct(null);
          }}
          onAddToCart={handleProductAddToCart}
          onToggleWishlist={handleProductToggleWishlist}
          isWishlisted={wishlistedProducts.has(selectedProduct.id)}
        />
      )}
    </div>
  );
}