'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Package,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import SafeImage from '@/app/components/SafeImage';
import { formatPrice } from '@/lib/utils/helpers';
import { handleApiResponse } from '@/lib/utils/handle-api-response';
import { showErrorToast } from '@/lib/utils/show-error-toast';
import { useSupabaseRealtime } from '@/lib/hooks/useSupabaseRealtime';

// نوع بيانات المنتج
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category_type: string;
  category?: {
    name: string;
  };
  stock_quantity: number;
  is_active: boolean;
  is_popular: boolean;
  is_new: boolean;
  discount_percentage: number;
  created_at: string;
  updated_at: string;
  slug: string;
}

export default function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterStock, setFilterStock] = useState<'all' | 'in_stock' | 'out_of_stock' | 'low_stock'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // دالة لتحويل category_type إلى اسم عربي
  const getCategoryName = (categoryType: string) => {
    const categories: { [key: string]: string } = {
      'electrical': 'أدوات كهربائية',
      'plumbing': 'أدوات صحية',
      'tools': 'أدوات يدوية',
      'other': 'أخرى'
    };
    return categories[categoryType] || categoryType || 'غير محدد';
  };

  // جلب المنتجات
  useEffect(() => {
    fetchProducts();
  }, []);

  // دعم التحديث الفوري realtime
  useSupabaseRealtime({
    table: 'products',
    event: '*',
    onChange: () => {
      fetchProducts();
    },
  });

  // تطبيق الفلاتر والبحث
  useEffect(() => {
    let filtered = [...products];

    // البحث بالاسم
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // فلترة حسب الحالة
    if (filterStatus !== 'all') {
      filtered = filtered.filter(product =>
        filterStatus === 'active' ? product.is_active : !product.is_active
      );
    }

    // فلترة حسب المخزون
    if (filterStock !== 'all') {
      filtered = filtered.filter(product => {
        if (filterStock === 'out_of_stock') return product.stock_quantity === 0;
        if (filterStock === 'low_stock') return product.stock_quantity > 0 && product.stock_quantity < 5;
        if (filterStock === 'in_stock') return product.stock_quantity >= 5;
        return true;
      });
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [products, searchTerm, filterStatus, filterStock]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await handleApiResponse<any>(
        fetch('/api/products?page=1&limit=100')
      );
      if (error) {
        setError(error);
        return;
      }
      const productsRaw = data?.data?.data || data?.data || data || [];
      const productsArr = Array.isArray(productsRaw) ? productsRaw : [];
      const formattedProducts = productsArr.map((product) => ({
        ...product,
        slug: product.slug || product.id,
      }));
      setProducts(formattedProducts);
    } catch (err: any) {
      console.error('خطأ في جلب المنتجات:', err);
      setError(err.message || 'حدث خطأ في جلب المنتجات');
    } finally {
      setLoading(false);
    }
  };

  // حذف منتج
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      return;
    }

    try {
      const { error } = await handleApiResponse<any>(
        fetch(`/api/products/${productId}`, { method: 'DELETE' })
      );
      if (error) {
        showErrorToast(error);
        return;
      }
      setProducts(products.filter(p => p.id !== productId));
    } catch (err: any) {
      showErrorToast('حدث خطأ في حذف المنتج');
    }
  };

  // تبديل حالة المنتج (نشط/غير نشط)
  const handleToggleStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await handleApiResponse<any>(
        fetch(`/api/products/${productId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: !currentStatus }),
        })
      );

      if (error) {
        showErrorToast(error);
        return;
      }

      setProducts(products.map(p => p.id === productId ? { ...p, is_active: !currentStatus } : p));
    } catch (err: any) {
      showErrorToast('حدث خطأ في تغيير حالة المنتج');
    }
  };

  // حساب المنتجات المعروضة حسب الصفحة
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">جارٍ تحميل المنتجات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <strong>خطأ:</strong> {error}
        </div>
        <button
          onClick={fetchProducts}
          className="mt-2 text-sm underline hover:no-underline"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة المنتجات</h1>
          <p className="text-gray-600">إضافة وتعديل وحذف المنتجات</p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          إضافة منتج جديد
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="البحث بالاسم أو الوصف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="all">جميع المنتجات</option>
              <option value="active">المنتجات النشطة</option>
              <option value="inactive">المنتجات غير النشطة</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-400" />
            <select
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="all">كل المنتجات</option>
              <option value="in_stock">متوفر في المخزون</option>
              <option value="low_stock">مخزون منخفض (&lt; 5)</option>
              <option value="out_of_stock">نفذ من المخزون</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
          <span>إجمالي المنتجات: {products.length}</span>
          <span>المنتجات النشطة: {products.filter(p => p.is_active).length}</span>
          <span>المنتجات غير النشطة: {products.filter(p => !p.is_active).length}</span>
          <span className="text-red-600 font-medium">نفذ المخزون: {products.filter(p => p.stock_quantity === 0).length}</span>
          <span className="text-orange-600 font-medium">مخزون منخفض: {products.filter(p => p.stock_quantity > 0 && p.stock_quantity < 5).length}</span>
          <span>النتائج المعروضة: {filteredProducts.length}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {currentProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد منتجات</h3>
            <p className="text-gray-500 mb-4">
              {products.length === 0
                ? 'لم يتم إضافة أي منتجات بعد'
                : 'لا توجد منتجات تطابق معايير البحث'
              }
            </p>
            {products.length === 0 && (
              <Link
                href="/dashboard/products/new"
                className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                إضافة أول منتج
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {currentProducts.map((product) => {
                const isOutOfStock = product.stock_quantity === 0;
                const isLowStock = product.stock_quantity > 0 && product.stock_quantity < 5;

                return (
                  <div key={product.id} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                    isOutOfStock ? 'border-red-300 bg-red-50' : isLowStock ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                  }`}>
                    {isOutOfStock && (
                      <div className="flex items-center gap-1 mb-2 text-red-700 text-xs font-medium">
                        <AlertCircle className="w-4 h-4" />
                        <span>نفذ المخزون - المنتج غير متاح للعملاء</span>
                      </div>
                    )}
                    {isLowStock && (
                      <div className="flex items-center gap-1 mb-2 text-orange-700 text-xs font-medium">
                        <AlertCircle className="w-4 h-4" />
                        <span>تحذير: المخزون منخفض جداً</span>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <SafeImage
                          src={product.image}
                          alt={product.name}
                          width={64}
                          height={64}
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                        <p className="text-sm text-gray-500 truncate">{getCategoryName(product.category_type)}</p>
                        <p className="text-sm font-medium text-primary">{formatPrice(product.price)}</p>

                        <div className="flex items-center gap-2 mt-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            product.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.is_active ? 'نشط' : 'غير نشط'}
                          </span>

                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            isOutOfStock
                              ? 'bg-red-100 text-red-800'
                              : isLowStock
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {product.stock_quantity} قطعة
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <Link
                            href={`/product/${product.slug}`}
                            className="text-gray-600 hover:text-primary"
                            title="عرض"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/dashboard/products/edit/${product.id}`}
                            className="text-blue-600 hover:text-blue-700"
                            title="تعديل"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleToggleStatus(product.id, product.is_active)}
                            className={`p-1 rounded ${
                              product.is_active
                                ? 'text-green-600 hover:text-green-700'
                                : 'text-red-600 hover:text-red-700'
                            }`}
                            title={product.is_active ? 'تعطيل المنتج' : 'تفعيل المنتج'}
                          >
                            {product.is_active ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-1 rounded text-red-600 hover:text-red-700"
                            title="حذف المنتج"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  عرض {startIndex + 1} إلى {Math.min(endIndex, filteredProducts.length)} من {filteredProducts.length} منتج
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    السابق
                  </button>
                  <span className="px-3 py-1 text-sm bg-primary text-white rounded">
                    {currentPage}
                  </span>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
