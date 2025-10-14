'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Save } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import { useSupabaseRealtime } from '@/lib/hooks/useSupabaseRealtime';

// أنواع الفئات
const CATEGORY_TYPES = [
  { id: 'electrical', name: 'أدوات كهربائية' },
  { id: 'plumbing', name: 'أدوات سباكة' },
  { id: 'tools', name: 'عدد يدوية' }
];

export default function NewCategoryPage() {
  const router = useRouter();
  
  // حالة الفئة
  const [category, setCategory] = useState({
    name: '',
    description: '',
    type: '',
    image: '',
    is_active: true,
    sort_order: 0
  });
  
  // حالة النموذج
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // معالج تغيير بيانات الفئة
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setCategory(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };
  
  // معالج تغيير حالة النشاط
  const handleActiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCategory(prev => ({ ...prev, is_active: e.target.checked }));
  };
  
  // التحقق من صحة النوع (type)
  function isValidType(type: string) {
    return /^[a-z0-9\-]+$/.test(type);
  }
  
  // التحقق من النموذج
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!category.name.trim()) {
      newErrors.name = 'اسم الفئة مطلوب';
    }
    if (!category.type) {
      newErrors.type = 'نوع الفئة مطلوب';
    } else if (!isValidType(category.type)) {
      newErrors.type = 'النوع يجب أن يكون باللغة الإنجليزية فقط، أحرف صغيرة أو أرقام أو - بدون مسافات أو رموز.';
    }
    if (!category.description.trim()) {
      newErrors.description = 'وصف الفئة مطلوب';
    }
    if (category.sort_order < 0 || isNaN(category.sort_order)) {
      newErrors.sort_order = 'ترتيب العرض يجب أن يكون رقمًا صحيحًا أكبر من أو يساوي 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // معالج إرسال النموذج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من صحة النموذج
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      const payload = {
        name: category.name.trim(),
        description: category.description.trim(),
        type: category.type.trim().toLowerCase(),
        image: category.image || '',
        is_active: category.is_active,
        sort_order: Number(category.sort_order) || 0
      };
      
      console.log('📤 إرسال بيانات التصنيف الجديد:', payload);
      
      // إرسال البيانات للخادم عبر API
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error('خطأ في تحليل استجابة الخادم');
      }
      
      if (!response.ok) {
        // إذا كان الخطأ بسبب تكرار، أظهره في حقل محدد
        if (response.status === 409) {
          setErrors({ type: result.error || 'النوع مستخدم من قبل' });
          return;
        }
        throw new Error(result.error || 'فشل في إضافة الفئة');
      }
      
      // إعادة التوجيه إلى صفحة الفئات بعد الإضافة بنجاح
      router.push('/dashboard/categories');
      router.refresh();
    } catch (error: any) {
      console.error('خطأ في إضافة الفئة:', error);
      setErrors({ general: error.message || 'حدث خطأ أثناء إضافة الفئة' });
    } finally {
      setLoading(false);
    }
  };
  
  // دعم التحديث الفوري realtime (للتصنيفات أو أي بيانات مرتبطة)
  useSupabaseRealtime({
    table: 'categories',
    event: '*',
    onChange: () => {
      // يمكن هنا تحديث قائمة التصنيفات في النموذج أو إعادة تحميل بيانات مرتبطة إذا لزم الأمر
      // مثال: router.refresh();
    },
  });
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إضافة فئة جديدة</h1>
          <p className="text-neutral-500">أدخل بيانات الفئة الجديدة</p>
        </div>
        <Link 
          href="/dashboard/categories"
          className="flex items-center text-primary hover:text-primary/80"
        >
          <ArrowRight className="mr-1 h-5 w-5" />
          <span>العودة للفئات</span>
        </Link>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{errors.general}</p>
          </div>
        )}
        
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium mb-4 border-b pb-2">معلومات الفئة الأساسية</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-gray-800 mb-1">
                اسم الفئة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={category.name}
                onChange={handleChange}
                className={`w-full rounded-md border ${errors.name ? 'border-red-500' : 'border-gray-300'} py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-semibold`}
                required
                autoFocus
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-bold text-gray-800 mb-1">
                نوع الفئة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="type"
                name="type"
                value={category.type}
                onChange={handleChange}
                list="category-types"
                className={`w-full rounded-md border ${errors.type ? 'border-red-500' : 'border-gray-300'} py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-semibold`}
                required
                placeholder="مثال: electrical أو plumbing أو tools أو أي نوع جديد (بالإنجليزية فقط بدون مسافات)"
                autoComplete="off"
                pattern="^[a-z0-9\-]+$"
                title="النوع يجب أن يكون باللغة الإنجليزية فقط، أحرف صغيرة أو أرقام أو - بدون مسافات أو رموز."
              />
              <datalist id="category-types">
                {CATEGORY_TYPES.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </datalist>
              {errors.type && <p className="mt-1 text-xs text-red-600">{errors.type}</p>}
            </div>
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-bold text-gray-800 mb-1">
                وصف الفئة <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={category.description}
                onChange={handleChange}
                className={`w-full rounded-md border ${errors.description ? 'border-red-500' : 'border-gray-300'} py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`}
                required
              />
              {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
            </div>
          </div>

          <hr className="my-6 border-dashed" />

          <h2 className="text-lg font-medium mb-4 border-b pb-2">إعدادات إضافية</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">صورة الفئة</label>
              <ImageUpload
                onImageUploaded={(imageUrl) => {
                  console.log('📥 تحديث صورة التصنيف في state:', imageUrl);
                  setCategory(prev => ({ ...prev, image: imageUrl }));
                }}
                currentImage={category.image}
              />
            </div>
            <div>
              <label htmlFor="sort_order" className="block text-sm font-bold text-gray-800 mb-1">
                ترتيب العرض
              </label>
              <input
                type="number"
                id="sort_order"
                name="sort_order"
                value={category.sort_order}
                onChange={handleChange}
                min={0}
                className={`w-full rounded-md border ${errors.sort_order ? 'border-red-500' : 'border-gray-300'} py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`}
              />
              {errors.sort_order && <p className="mt-1 text-xs text-red-600">{errors.sort_order}</p>}
            </div>
            <div className="flex items-center mt-6 md:col-span-2">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={category.is_active}
                onChange={handleActiveChange}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="mr-2 block text-sm text-gray-700 font-semibold">
                تفعيل الفئة وإظهارها في المتجر
              </label>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between">
          <Link 
            href="/dashboard/categories"
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="inline-block h-4 w-4 border-2 border-transparent border-t-white rounded-full animate-spin ml-2"></span>
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4 ml-1" />
                <span>حفظ الفئة</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 