'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Plus, Trash2, GripVertical, Search, X } from 'lucide-react';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  stock_quantity: number;
  is_active: boolean;
}

interface SectionProduct {
  id: string;
  sort_order: number;
  product: Product;
}

interface Section {
  id: string;
  title: string;
  subtitle?: string;
  settings: {
    product_source: string;
  };
}

export default function ManageSectionProductsPage() {
  const params = useParams();
  const router = useRouter();
  const sectionId = params.id as string;

  const [section, setSection] = useState<Section | null>(null);
  const [sectionProducts, setSectionProducts] = useState<SectionProduct[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [sectionId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // جلب معلومات القسم
      const sectionRes = await fetch(`/api/homepage-sections?id=${sectionId}`);
      const sectionData = await sectionRes.json();
      
      if (sectionData.success && sectionData.data.length > 0) {
        setSection(sectionData.data[0]);
        
        // تحقق من أن القسم يدوي
        if (sectionData.data[0].settings?.product_source !== 'manual') {
          alert('هذا القسم ليس يدوياً. المنتجات تُجلب تلقائياً.');
          router.push('/dashboard/homepage/sections');
          return;
        }
      }

      // جلب منتجات القسم
      const productsRes = await fetch(`/api/homepage-sections/products?section_id=${sectionId}`);
      const productsData = await productsRes.json();
      
      console.log('📦 Products API Response:', productsData);
      
      if (productsData.success && productsData.data) {
        // تنظيف البيانات وتحويلها للصيغة الصحيحة
        const cleanedProducts = productsData.data
          .filter((item: any) => {
            console.log('🔍 Item structure:', item);
            return item.product_id;
          })
          .map((item: any) => {
            const product = item.product_id;
            return {
              id: item.id,
              sort_order: item.sort_order,
              product: {
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                stock_quantity: product.stock_quantity || 0,
                is_active: product.is_active !== false
              }
            };
          });
        
        console.log('✅ Cleaned products:', cleanedProducts);
        setSectionProducts(cleanedProducts);
      } else {
        console.log('⚠️ No products data or failed:', productsData);
      }

      // جلب جميع المنتجات
      const allProductsRes = await fetch('/api/products?limit=100&is_active=true');
      const allProductsData = await allProductsRes.json();
      
      console.log('📦 All Products Response:', allProductsData);
      
      if (allProductsData.success && allProductsData.data && allProductsData.data.data) {
        // البيانات موجودة في data.data
        const products = allProductsData.data.data || [];
        console.log('✅ عدد المنتجات المتاحة:', products.length);
        setAllProducts(Array.isArray(products) ? products : []);
      } else {
        console.log('⚠️ Failed to fetch all products');
        setAllProducts([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (productId: string) => {
    try {
      setSaving(true);

      // تحقق من عدم إضافة المنتج مرتين
      const exists = sectionProducts.find(sp => sp.product.id === productId);
      if (exists) {
        alert('هذا المنتج موجود بالفعل في القسم');
        return;
      }

      const res = await fetch('/api/homepage-sections/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_id: sectionId,
          product_id: productId,
          sort_order: sectionProducts.length
        })
      });

      const data = await res.json();

      if (data.success) {
        await fetchData();
        setShowAddModal(false);
        setSearchTerm('');
      } else {
        alert('حدث خطأ: ' + data.error);
      }
    } catch (error) {
      console.error('Error adding product:', error);
      alert('حدث خطأ أثناء إضافة المنتج');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveProduct = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج من القسم؟')) return;

    try {
      const res = await fetch(`/api/homepage-sections/products?id=${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (data.success) {
        await fetchData();
      } else {
        alert('حدث خطأ: ' + data.error);
      }
    } catch (error) {
      console.error('Error removing product:', error);
      alert('حدث خطأ أثناء حذف المنتج');
    }
  };

  const handleReorder = async (id: string, newOrder: number) => {
    try {
      const res = await fetch('/api/homepage-sections/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, sort_order: newOrder })
      });

      const data = await res.json();

      if (data.success) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error reordering:', error);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const current = sectionProducts[index];
    const previous = sectionProducts[index - 1];
    
    handleReorder(current.id, previous.sort_order);
    handleReorder(previous.id, current.sort_order);
  };

  const moveDown = (index: number) => {
    if (index === sectionProducts.length - 1) return;
    const current = sectionProducts[index];
    const next = sectionProducts[index + 1];
    
    handleReorder(current.id, next.sort_order);
    handleReorder(next.id, current.sort_order);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const filteredProducts = allProducts.filter(product => {
    const isNotInSection = !sectionProducts.find(sp => sp.product.id === product.id);
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return isNotInSection && matchesSearch && product.is_active;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">القسم غير موجود</h1>
          <button
            onClick={() => router.push('/dashboard/homepage/sections')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            العودة إلى الأقسام
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard/homepage/sections')}
          className="flex items-center gap-2 text-gray-600 hover:text-primary mb-4 transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
          العودة إلى الأقسام
        </button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">
              إدارة منتجات: {section.title}
            </h1>
            {section.subtitle && (
              <p className="text-gray-600">{section.subtitle}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              عدد المنتجات: {sectionProducts.length}
            </p>
            {/* Debug Info */}
            <div className="mt-2 text-xs text-gray-400">
              <p>Section ID: {sectionId}</p>
              <p>Product Source: {section.settings?.product_source || 'غير محدد'}</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            إضافة منتج
          </button>
        </div>
      </div>

      {/* Products List */}
      {sectionProducts.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg mb-4">لا توجد منتجات في هذا القسم</p>
          <p className="text-gray-400 text-sm mb-6">ابدأ بإضافة منتجات لهذا القسم</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            إضافة منتج
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {sectionProducts.map((item, index) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md p-4 flex items-center gap-4"
            >
              {/* Reorder Buttons */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className={`p-1 rounded ${
                    index === 0
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:text-primary hover:bg-gray-100'
                  }`}
                  title="تحريك للأعلى"
                >
                  <GripVertical className="w-5 h-5 rotate-90" />
                </button>
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === sectionProducts.length - 1}
                  className={`p-1 rounded ${
                    index === sectionProducts.length - 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:text-primary hover:bg-gray-100'
                  }`}
                  title="تحريك للأسفل"
                >
                  <GripVertical className="w-5 h-5 -rotate-90" />
                </button>
              </div>

              {/* Order Number */}
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold">
                {index + 1}
              </div>

              {/* Product Image */}
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {item.product.image ? (
                  <Image
                    src={item.product.image}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    📦
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-grow">
                <h3 className="font-semibold text-lg text-primary mb-1">
                  {item.product.name}
                </h3>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>{formatPrice(item.product.price)}</span>
                  <span>المخزون: {item.product.stock_quantity}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    item.product.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {item.product.is_active ? 'مفعّل' : 'معطّل'}
                  </span>
                </div>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => handleRemoveProduct(item.id)}
                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                title="حذف"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-primary">إضافة منتج للقسم</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearchTerm('');
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="ابحث عن منتج..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {searchTerm ? 'لا توجد نتائج للبحث' : 'جميع المنتجات مضافة بالفعل'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors cursor-pointer"
                      onClick={() => handleAddProduct(product.id)}
                    >
                      <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gray-100 mb-3">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                            📦
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-primary mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-gray-900">
                          {formatPrice(product.price)}
                        </span>
                        <span className="text-gray-500">
                          المخزون: {product.stock_quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearchTerm('');
                }}
                className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
