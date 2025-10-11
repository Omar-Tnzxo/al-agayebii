'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  AlertCircle,
  CheckCircle, 
  X
} from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import { useSupabaseRealtime } from '@/lib/hooks/useSupabaseRealtime';
import Link from 'next/link';

// واجهة التصنيف
interface Category {
  id: string;
  name: string;
  type: string;
  description?: string;
  image?: string;
  sort_order?: number;
}

export default function CategoriesPage() {
  // حالات المكون
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // حالات النموذج
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: ''
  });

  // حالة التصنيفات المحددة
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  // حالة لتتبع التعديل الفوري
  const [editingSortOrderId, setEditingSortOrderId] = useState<string | null>(null);
  const [sortOrderDraft, setSortOrderDraft] = useState<string>('');
  const [sortOrderLoading, setSortOrderLoading] = useState<string | null>(null);

  // جلب التصنيفات
    const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/categories');
      
      if (!response.ok) {
        throw new Error('فشل في جلب التصنيفات');
      }
      
      let result = null;
      try {
        const text = await response.text();
        result = text ? JSON.parse(text) : {};
      } catch (e) {
        result = {};
      }
      
      setCategories(result.data || []);
      
      // إظهار رسالة إذا كان المصدر هو التخزين المحلي
      if (result.source === 'local_storage') {
        console.warn('⚠️ يتم استخدام التخزين المحلي المؤقت');
      }
    } catch (err: any) {
      console.error('خطأ في جلب التصنيفات:', err);
      setError(err.message || 'حدث خطأ أثناء جلب التصنيفات');
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  // تحميل التصنيفات عند بدء الصفحة
  useEffect(() => {
    fetchCategories();
  }, []);

  // دعم التحديث الفوري realtime
  useSupabaseRealtime({
    table: 'categories',
    event: '*',
    onChange: () => {
      fetchCategories();
    },
  });

  // إخفاء الرسائل بعد 5 ثواني
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // فتح نموذج إضافة تصنيف جديد
  // const openNewCategoryForm = () => {
  //   setEditingCategory(null);
  //   setFormData({
  //     name: '',
  //     description: '',
  //     image: ''
  //   });
  //   setIsFormOpen(true);
  // };

  // فتح نموذج تعديل تصنيف
  // const openEditCategoryForm = (category: Category) => {
  //   setEditingCategory(category);
  //   setFormData({
  //     name: category.name,
  //     description: category.description || '',
  //     image: category.image || ''
  //   });
  //   setIsFormOpen(true);
  // };

  // إغلاق النموذج
  const closeForm = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      image: ''
    });
  };

  // حفظ التصنيف
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      setError('يجب ملء اسم التصنيف');
      return;
    }

    try {
      const url = editingCategory 
        ? `/api/categories/${editingCategory.id}` 
        : '/api/categories';
      
      const method = editingCategory ? 'PATCH' : 'POST';
      
      // إضافة نوع افتراضي للتصنيف
      const dataToSend = {
        ...formData,
        type: 'general' // نوع افتراضي
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      let result = null;
      try {
        const text = await response.text();
        result = text ? JSON.parse(text) : {};
      } catch (e) {
        result = {};
      }

      if (!response.ok) {
        throw new Error(result.error || 'فشل في حفظ التصنيف');
      }

      // رسالة النجاح مع إشارة للمصدر
      const successMessage = editingCategory ? 'تم تحديث التصنيف بنجاح' : 'تم إضافة التصنيف بنجاح';
      const sourceMessage = result.source === 'local_storage' ? ' (تخزين محلي مؤقت)' : '';
      setSuccess(successMessage + sourceMessage);
      closeForm();
      fetchCategories(); // إعادة تحميل القائمة
    } catch (err: any) {
      console.error('خطأ في حفظ التصنيف:', err);
      setError(err.message || 'حدث خطأ أثناء حفظ التصنيف');
    }
  };

  // حذف تصنيف
  const handleDelete = async (type: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف التصنيف "${name}"؟`)) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${type}`, {
        method: 'DELETE'
      });

      let result = null;
      try {
        const text = await response.text();
        result = text ? JSON.parse(text) : {};
      } catch (e) {
        result = {};
      }

      if (!response.ok) {
        throw new Error(result.error || 'فشل في حذف التصنيف');
      }

      setSuccess('تم حذف التصنيف بنجاح');
      fetchCategories(); // إعادة تحميل القائمة
    } catch (err: any) {
      console.error('خطأ في حذف التصنيف:', err);
      setError(err.message || 'حدث خطأ أثناء حذف التصنيف');
    }
  };

  // حذف جميع التصنيفات
  const handleClearAll = async () => {
    if (!window.confirm('هل أنت متأكد من حذف جميع التصنيفات؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      return;
    }

    try {
      const response = await fetch('/api/categories?clear=all', {
        method: 'DELETE'
      });

      let result = null;
      try {
        const text = await response.text();
        result = text ? JSON.parse(text) : {};
      } catch (e) {
        result = {};
      }

      if (!response.ok) {
        throw new Error(result.error || 'فشل في حذف التصنيفات');
      }

      setSuccess('تم حذف جميع التصنيفات بنجاح');
      fetchCategories(); // إعادة تحميل القائمة
    } catch (err: any) {
      console.error('خطأ في حذف التصنيفات:', err);
      setError(err.message || 'حدث خطأ أثناء حذف التصنيفات');
    }
  };

  // تحديد/إلغاء تحديد تصنيف
  const handleSelect = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // تحديد/إلغاء تحديد الكل
  const handleSelectAll = () => {
    if (selectedTypes.length === categories.length) {
      setSelectedTypes([]);
    } else {
      setSelectedTypes(categories.map((cat) => cat.type));
    }
  };

  // حذف جماعي
  const handleBulkDelete = async () => {
    if (selectedTypes.length === 0) return;
    if (!window.confirm('هل أنت متأكد من حذف التصنيفات المحددة؟')) return;
    try {
      const response = await fetch('/api/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ types: selectedTypes })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'فشل في حذف التصنيفات');
      setSuccess('تم حذف التصنيفات المحددة بنجاح');
      setSelectedTypes([]);
      fetchCategories();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حذف التصنيفات');
    }
  };

  // أضف دالة تحديث sort_order
  const handleSortOrderEdit = (category: Category) => {
    setEditingSortOrderId(category.id);
    setSortOrderDraft(category.sort_order?.toString() ?? '0');
  };

  const handleSortOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSortOrderDraft(e.target.value.replace(/[^0-9]/g, ''));
  };

  const handleSortOrderSave = async (category: Category) => {
    const newValue = parseInt(sortOrderDraft, 10);
    if (isNaN(newValue) || newValue < 0) {
      setError('ترتيب العرض يجب أن يكون رقمًا صحيحًا أكبر من أو يساوي 0');
      return;
    }
    setSortOrderLoading(category.id);
    try {
      const res = await fetch(`/api/categories/${category.type}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: newValue })
      });
      if (!res.ok) {
        throw new Error('فشل في تحديث ترتيب العرض');
      }
      setSuccess('تم تحديث ترتيب العرض بنجاح');
      setEditingSortOrderId(null);
      fetchCategories();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحديث ترتيب العرض');
    } finally {
      setSortOrderLoading(null);
    }
  };

  const handleSortOrderCancel = () => {
    setEditingSortOrderId(null);
    setSortOrderDraft('');
  };

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة التصنيفات</h1>
          <p className="text-gray-600">إضافة وتعديل وحذف تصنيفات المنتجات</p>
        </div>
        
        <div className="flex gap-2">
          <Link
            href="/dashboard/categories/new"
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
            <Plus className="h-4 w-4" />
            <span>إضافة تصنيف</span>
          </Link>
          
          
          {selectedTypes.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>حذف المحدد ({selectedTypes.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* رسائل النجاح والخطأ */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <p>{success}</p>
          <button onClick={() => setSuccess(null)} className="mr-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
          <button onClick={() => setError(null)} className="mr-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* قائمة التصنيفات */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4 text-gray-300">📂</div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">لا توجد تصنيفات</h3>
            <p className="text-gray-500 mb-4">قم بإضافة تصنيفات لتنظيم منتجاتك</p>
            <Link
              href="/dashboard/categories/new"
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              إضافة تصنيف جديد
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedTypes.length === categories.length && categories.length > 0}
                      onChange={handleSelectAll}
                      aria-label="تحديد الكل"
                    />
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    اسم التصنيف
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    النوع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الوصف
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ترتيب العرض
                    <span className="block text-[10px] text-gray-400 font-normal">(0 = افتراضي)</span>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(category.type)}
                        onChange={() => handleSelect(category.type)}
                        aria-label={`تحديد ${category.name}`}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {category.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {category.description || 'لا يوجد وصف'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {editingSortOrderId === category.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            value={sortOrderDraft}
                            onChange={handleSortOrderChange}
                            className="w-16 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                            autoFocus
                            aria-label="تعديل ترتيب العرض"
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSortOrderSave(category);
                              if (e.key === 'Escape') handleSortOrderCancel();
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSortOrderSave(category)}
                            disabled={sortOrderLoading === category.id}
                            className="text-green-600 hover:text-green-800 disabled:opacity-50"
                            aria-label="حفظ ترتيب العرض"
                          >
                            {sortOrderLoading === category.id ? (
                              <span className="animate-spin h-4 w-4 border-b-2 border-green-600 rounded-full inline-block"></span>
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={handleSortOrderCancel}
                            className="text-gray-400 hover:text-gray-600"
                            aria-label="إلغاء التعديل"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="hover:underline text-primary font-semibold"
                          onClick={() => handleSortOrderEdit(category)}
                          aria-label="تعديل ترتيب العرض"
                          tabIndex={0}
                          onKeyDown={e => { if (e.key === 'Enter') handleSortOrderEdit(category); }}
                        >
                          {typeof category.sort_order === 'number' ? category.sort_order : 0}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <Link
                          href={`/dashboard/categories/edit/${category.type}`}
                          className="text-primary hover:text-primary-dark"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(category.type, category.name)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}