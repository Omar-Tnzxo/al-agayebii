'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

// نموذج الفئة للتحرير
interface CategoryData {
  id: number;
  name: string;
  description: string;
  type: string;
  is_active: boolean;
  image?: string;
  sort_order?: number;
}

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryType = params.type as string;
  
  // حالة الفئة
  const [category, setCategory] = useState<CategoryData | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<number | ''>('');
  
  // حالة النموذج
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // جلب بيانات الفئة من API
  useEffect(() => {
    const fetchCategory = async () => {
      setFetchLoading(true);
      setErrors({});
      try {
        const response = await fetch(`/api/categories/${categoryType}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setErrors({ general: 'التصنيف غير موجود' });
          } else {
            setErrors({ general: 'فشل في تحميل بيانات التصنيف' });
          }
          setCategory(null);
          return;
        }
        
        const data = await response.json();
        setCategory(data);
        setImageUrl(data.image || '');
        setSortOrder(data.sort_order ?? 0);
      } catch (error: any) {
        console.error('خطأ في جلب التصنيف:', error);
        setErrors({ general: 'حدث خطأ أثناء تحميل بيانات التصنيف' });
        setCategory(null);
      } finally {
        setFetchLoading(false);
      }
    };
    if (categoryType) fetchCategory();
  }, [categoryType]);
  
  // regex للتحقق من type
  const typeRegex = /^[a-z0-9-]+$/;

  // معالج تغيير بيانات الفئة
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!category) return;
    
    const { name, value } = e.target;
    if (name === 'sort_order') {
      setSortOrder(value === '' ? '' : Number(value));
      setCategory(prev => prev ? { ...prev, sort_order: value === '' ? undefined : Number(value) } : null);
    } else {
      setCategory(prev => prev ? { ...prev, [name]: value } : null);
    }
  };
  
  // معالج تغيير حالة النشاط
  const handleActiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!category) return;
    setCategory(prev => prev ? { ...prev, is_active: e.target.checked } : null);
  };
  
  // التحقق من النموذج
  const validateForm = () => {
    if (!category) return false;
    
    const newErrors: Record<string, string> = {};
    
    if (!category.name?.trim()) {
      newErrors.name = 'اسم الفئة مطلوب';
    }
    
    if (!category.description?.trim()) {
      newErrors.description = 'وصف الفئة مطلوب';
    }
    
    if (!category.type) {
      newErrors.type = 'نوع الفئة مطلوب';
    } else if (!typeRegex.test(category.type)) {
      newErrors.type = 'type يجب أن يكون إنجليزي صغير، بدون مسافات أو رموز، فقط أحرف وأرقام و-';
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
        name: category?.name.trim(),
        description: category?.description.trim(),
        type: category?.type.trim().toLowerCase(),
        sort_order: sortOrder === '' ? 0 : Number(sortOrder),
        image: imageUrl || '',
        is_active: category?.is_active,
      };
      
      console.log('📤 إرسال بيانات تحديث التصنيف:', payload);
      
      const response = await fetch(`/api/categories/${categoryType}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error('خطأ في تحليل استجابة الخادم');
      }
      
      if (!response.ok) {
        // إذا كان الخطأ بسبب تكرار type
        if (response.status === 409) {
          setErrors({ type: result.error || 'النوع مستخدم من قبل' });
          return;
        }
        throw new Error(result.error || 'فشل في تحديث الفئة');
      }
      
      // إعادة التوجيه إلى صفحة الفئات بعد التعديل بنجاح
      router.push('/dashboard/categories');
      router.refresh();
    } catch (error: any) {
      console.error('Error updating category:', error);
      setErrors({ general: error.message || 'حدث خطأ أثناء تحديث الفئة' });
    } finally {
      setLoading(false);
    }
  };
  
  // دعم التحديث الفوري realtime
  useSupabaseRealtime({
    table: 'categories',
    event: '*',
    onChange: () => {
      if (categoryType) {
        fetch(`/api/categories/${categoryType}`)
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data) {
              setCategory(data);
              setImageUrl(data?.image || '');
              setSortOrder(data?.sort_order ?? 0);
            }
          })
          .catch(err => console.error('خطأ في تحديث البيانات:', err));
      }
    },
  });
  
  // إظهار حالة التحميل أثناء جلب بيانات الفئة
  if (fetchLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
        <p className="text-lg text-gray-600">جاري تحميل بيانات الفئة...</p>
      </div>
    );
  }
  
  // إظهار رسالة خطأ إذا لم يتم العثور على الفئة
  if (!category && !fetchLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">الفئة غير موجودة</h1>
          <p className="text-gray-600 mb-2">{errors.general || 'لم يتم العثور على الفئة المطلوبة'}</p>
          <p className="text-sm text-gray-500 mb-6">النوع المطلوب: {categoryType}</p>
          <Link 
            href="/dashboard/categories"
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            <ArrowRight className="ml-1 h-5 w-5" />
            <span>العودة للفئات</span>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">تعديل فئة</h1>
          <p className="text-neutral-500">تعديل بيانات الفئة: {category?.name || categoryType}</p>
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
          <h2 className="text-lg font-medium mb-4">معلومات الفئة</h2>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                اسم الفئة *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={category?.name || ''}
                onChange={handleChange}
                className={`w-full rounded-md border ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                } py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                نوع الفئة *
              </label>
              <input
                type="text"
                id="type"
                name="type"
                value={category?.type || ''}
                onChange={handleChange}
                className={`w-full rounded-md border ${errors.type ? 'border-red-500' : 'border-gray-300'} py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`}
                pattern="^[a-z0-9-]+$"
                title="type يجب أن يكون إنجليزي صغير، بدون مسافات أو رموز، فقط أحرف وأرقام و-"
                autoComplete="off"
                dir="ltr"
              />
              <p className="text-xs text-gray-500 mt-1">type يجب أن يكون إنجليزي صغير، بدون مسافات أو رموز، فقط أحرف وأرقام و-</p>
              {errors.type && (
                <p className="mt-1 text-xs text-red-600">{errors.type}</p>
              )}
            </div>
            
            <div className="lg:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                وصف الفئة *
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={category?.description || ''}
                onChange={handleChange}
                className={`w-full rounded-md border ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                } py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-600">{errors.description}</p>
              )}
            </div>
            
            <div className="lg:col-span-2">
              <ImageUpload
                onImageUploaded={(url) => {
                  console.log('📥 تحديث صورة التصنيف في state:', url);
                  setImageUrl(url);
                }}
                currentImage={imageUrl}
              />
            </div>
            
            <div className="lg:col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={category?.is_active || false}
                  onChange={handleActiveChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="mr-2 block text-sm text-gray-700">
                  تفعيل الفئة وإظهارها في المتجر
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="sort_order" className="block text-sm font-medium text-gray-700 mb-1">
                ترتيب الظهور (اختياري)
              </label>
              <input
                type="number"
                id="sort_order"
                name="sort_order"
                value={sortOrder}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                min={0}
                step={1}
                placeholder="مثال: 1"
              />
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
                <span>حفظ التعديلات</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 