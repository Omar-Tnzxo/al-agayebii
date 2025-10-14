'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Save, ImagePlus, CheckCircle, AlertCircle, X, Plus, Info } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import MultiImageUpload from '@/components/MultiImageUpload';
import ColorSelector, { ProductColor } from '@/components/ColorSelector';
import { useSupabaseRealtime } from '@/lib/hooks/useSupabaseRealtime';

// واجهة التصنيف
interface Category {
  type: string;
  name: string;
}

// واجهة قسم الصفحة الرئيسية
interface HomepageSection {
  id: string;
  title: string;
  section_type: string;
  settings: {
    product_source: string;
  };
}

// واجهة الإشعار
interface Notification {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  show: boolean;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  cost_price?: number;
  category_type: string;
  stock_quantity: number;
  is_active: boolean;
  is_popular: boolean;
  is_new: boolean;
  is_featured: boolean;
  is_exclusive: boolean;
  discount_percentage: number;
  rating: number;
  reviews_count: number;
  image: string;
  images?: string[];
  colors?: Array<{ name: string; hex: string; stock: number }>;
  sku: string;
  slug: string;
}

// Tooltip (نفس الكود من صفحة التعديل)
function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block">
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow((v) => !v)}
        tabIndex={0}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="cursor-pointer align-middle"
        aria-label="معلومات عن الخيار"
      >
        {children}
      </span>
      {show && (
        <span className="absolute z-50 right-1/2 translate-x-1/2 mt-2 w-56 bg-black text-white text-xs rounded px-3 py-2 shadow-lg whitespace-normal">
          {text}
        </span>
      )}
    </span>
  );
}

export default function NewProductPage() {
  const router = useRouter();
  
  // حالة المنتج
  const [product, setProduct] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    cost_price: 0,
    category_type: '',
    stock_quantity: 0,
    is_active: true,
    is_popular: false,
    is_new: false,
    is_featured: false,
    is_exclusive: false,
    discount_percentage: 0,
    rating: 0,
    reviews_count: 0,
    image: '',
    sku: '',
    slug: ''
  });
  
  // حالة الصور المتعددة والألوان
  const [productImages, setProductImages] = useState<string[]>([]);
  const [productColors, setProductColors] = useState<any[]>([]);
  const [useMultipleImages, setUseMultipleImages] = useState(true);
  
  // حالة التصنيفات
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  // حالة أقسام الصفحة الرئيسية
  const [homepageSections, setHomepageSections] = useState<HomepageSection[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  
  // حالة النموذج
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isImagesUploaded, setIsImagesUploaded] = useState(false);
  
  // حالة الإشعارات
  const [notification, setNotification] = useState<Notification>({
    type: 'info',
    title: '',
    message: '',
    show: false
  });

  // حالة خيار منتج جديد وتاريخ new_until
  const [isNew, setIsNew] = useState(product.is_new);
  const [newUntil, setNewUntil] = useState('');
  function handleIsNewChange(e: React.ChangeEvent<HTMLInputElement>) {
    setIsNew(e.target.checked);
    setProduct(prev => ({ ...prev, is_new: e.target.checked }));
    if (!e.target.checked) setNewUntil('');
  }
  
  // دالة عرض الإشعار
  const showNotification = (type: Notification['type'], title: string, message: string) => {
    setNotification({ type, title, message, show: true });
    // إخفاء الإشعار تلقائياً بعد 5 ثوان
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  // دالة إخفاء الإشعار
  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };
  
  // جلب التصنيفات
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await fetch('/api/categories');
        
        if (!response.ok) {
          throw new Error('فشل في جلب التصنيفات');
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
          setCategories(result.data.map((cat: any) => ({ type: cat.type, name: cat.name })));
          console.log('✅ تم جلب التصنيفات بنجاح:', result.data.length);
        } else {
          throw new Error('لا توجد تصنيفات متاحة');
        }
      } catch (error) {
        console.error('خطأ في جلب التصنيفات:', error);
        showNotification('error', 'خطأ في التصنيفات', 'فشل في تحميل التصنيفات. يرجى إعادة تحميل الصفحة.');
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // جلب أقسام الصفحة الرئيسية (اليدوية فقط)
  useEffect(() => {
    const fetchHomepageSections = async () => {
      try {
        console.log('🔍 بدء جلب الأقسام...');
        const response = await fetch('/api/homepage-sections?active=true');
        const result = await response.json();
        
        console.log('📦 استجابة API للأقسام:', result);
        
        if (result.success && result.data) {
          console.log('📋 إجمالي الأقسام:', result.data.length);
          
          // عرض جميع الأقسام للتشخيص
          result.data.forEach((section: any) => {
            console.log('- قسم:', section.title, '| نوع:', section.section_type, '| مصدر:', section.settings?.product_source);
          });
          
          // فقط الأقسام اليدوية
          const manualSections = result.data.filter(
            (section: HomepageSection) => 
              section.settings?.product_source === 'manual' &&
              section.section_type === 'products'
          );
          
          setHomepageSections(manualSections);
          console.log('✅ الأقسام اليدوية المتاحة:', manualSections.length);
          
          if (manualSections.length === 0) {
            console.warn('⚠️ لا توجد أقسام يدوية! تحتاج لإنشاء قسم يدوي من /dashboard/homepage/sections');
          } else {
            console.log('📋 الأقسام اليدوية:', manualSections.map((s: HomepageSection) => s.title));
          }
        } else {
          console.error('❌ فشل جلب الأقسام:', result);
        }
      } catch (error) {
        console.error('❌ خطأ في جلب الأقسام:', error);
      }
    };

    fetchHomepageSections();
  }, []);
  
  // دعم التحديث الفوري realtime للتصنيفات
  useSupabaseRealtime({
    table: 'categories',
    event: '*',
    onChange: () => {
      // إعادة جلب التصنيفات عند أي تغيير
      fetch('/api/categories').then(r => r.ok && r.json()).then(result => {
        if (result && result.success && result.data) {
          setCategories(result.data.map((cat: any) => ({ type: cat.type, name: cat.name })));
        }
      });
    },
  });
  
  // معالج تغيير بيانات المنتج مع تنظيف الأخطاء
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // إزالة خطأ الحقل عند التعديل
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // معالجة مختلفة للقيم المرقمة
    if (type === 'number') {
      // التأكد من أن القيمة المدخلة هي رقم صالح
      if (value === '' || !isNaN(Number(value))) {
        setProduct(prev => ({ ...prev, [name]: value }));
      }
      return;
    }
    
    // معالجة القيم الأخرى
    setProduct(prev => ({ ...prev, [name]: value }));
  }, [errors]);
  
  // معالج تغيير الخيارات المنطقية
  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setProduct(prev => ({ ...prev, [name]: checked }));
  }, []);
  
  // التحقق من النموذج مع رسائل خطأ محسنة
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!product.name.trim()) {
      newErrors.name = 'اسم المنتج مطلوب';
    } else if (product.name.trim().length < 2) {
      newErrors.name = 'اسم المنتج يجب أن يكون حرفين على الأقل';
    }
    
    if (!product.description.trim()) {
      newErrors.description = 'وصف المنتج مطلوب';
    } else if (product.description.trim().length < 10) {
      newErrors.description = 'وصف المنتج يجب أن يكون 10 أحرف على الأقل';
    }
    
    if (!product.price) {
      newErrors.price = 'سعر المنتج مطلوب';
    } else if (isNaN(Number(product.price)) || Number(product.price) <= 0) {
      newErrors.price = 'يجب أن يكون السعر رقمًا موجبًا';
    } else if (Number(product.price) > 1000000) {
      newErrors.price = 'السعر كبير جداً. يجب أن يكون أقل من مليون جنيه';
    }
    
    if (!product.category_type) {
      newErrors.category_type = 'فئة المنتج مطلوبة';
    }
    
    if (!product.stock_quantity) {
      newErrors.stock_quantity = 'كمية المخزون مطلوبة';
    } else if (isNaN(Number(product.stock_quantity)) || Number(product.stock_quantity) < 0) {
      newErrors.stock_quantity = 'يجب أن يكون المخزون رقمًا غير سالب';
    } else if (Number(product.stock_quantity) > 100000) {
      newErrors.stock_quantity = 'كمية المخزون كبيرة جداً';
    }

    if (product.discount_percentage && (isNaN(Number(product.discount_percentage)) || Number(product.discount_percentage) < 0 || Number(product.discount_percentage) > 100)) {
      newErrors.discount_percentage = 'نسبة الخصم يجب أن تكون بين 0 و 100';
    }
    
    if (!product.slug.trim()) {
      newErrors.slug = 'الرابط المخصص (slug) مطلوب';
    } else if (!/^[a-z0-9\-]+$/.test(product.slug.trim())) {
      newErrors.slug = 'صيغة الرابط slug غير صحيحة. يجب أن يحتوي فقط على أحرف إنجليزية صغيرة، أرقام، و-.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // معالج إرسال النموذج المحسن
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من صحة النموذج
    if (!validateForm()) {
      showNotification('error', 'بيانات غير صحيحة', 'يرجى تصحيح الأخطاء المشار إليها باللون الأحمر');
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      // التحقق من رفع الصور إذا كانت مطلوبة
      let finalImageUrl = product.image;
      
      if (useMultipleImages && productImages.length > 0) {
        // التحقق من أن الصور تم رفعها بنجاح (ليست blob URLs)
        const hasLocalImages = productImages.some(url => url.startsWith('blob:'));
        
        if (hasLocalImages) {
          throw new Error('يجب رفع جميع الصور قبل حفظ المنتج. اضغط على زر "رفع الصور" أولاً.');
        }
        
        finalImageUrl = productImages[0]; // استخدام أول صورة كصورة رئيسية
      } else if (useMultipleImages && productImages.length === 0) {
        throw new Error('يجب إضافة صور للمنتج أولاً. اختر الصور واضغط "رفع الصور".');
      }
      
      // التحقق من وجود صورة رئيسية
      if (!finalImageUrl) {
        throw new Error('يجب إضافة صورة واحدة على الأقل للمنتج. اختر صورة وارفعها أولاً.');
      }
      
      // إعداد بيانات المنتج للإرسال
      const productData = {
        name: product.name.trim(),
        description: product.description.trim(),
        price: parseFloat(product.price.toString()),
        category_type: product.category_type,
        stock_quantity: parseInt(product.stock_quantity.toString()),
        image: finalImageUrl,
        images: useMultipleImages ? productImages : [finalImageUrl],
        colors: productColors,
        is_active: product.is_active,
        is_popular: product.is_popular,
        is_featured: product.is_featured,
        is_new: isNew,
        new_until: isNew ? newUntil : null,
        discount_percentage: parseInt(product.discount_percentage.toString()),
        rating: parseFloat(product.rating.toString()),
        reviews_count: parseInt(product.reviews_count.toString()),
        sku: product.sku.trim() || null,
        slug: product.slug.trim()
      };
      
      console.log('🚀 إرسال بيانات المنتج:', productData);
      
      // إرسال بيانات المنتج إلى الخادم
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        console.error('❌ خطأ من الخادم:', result);
        
        // معالجة أنواع الأخطاء المختلفة
        let errorTitle = 'فشل في إضافة المنتج';
        let errorMessage = result.error || 'حدث خطأ غير متوقع';
        
        if (result.source === 'schema' || result.code === 'schema_incomplete') {
          errorTitle = 'مشكلة في قاعدة البيانات';
          errorMessage = 'هيكل قاعدة البيانات غير مكتمل. يرجى تشغيل SQL script لإصلاح الجدول.';
          
          // عرض تفاصيل إضافية للمطور
          if (result.details) {
            errorMessage += `\n\nتفاصيل تقنية: ${result.details}`;
          }
        } else if (result.source === 'validation') {
          errorTitle = 'بيانات غير صحيحة';
        } else if (result.source === 'connection') {
          errorTitle = 'مشكلة في الاتصال';
          errorMessage = 'لا يمكن الاتصال بقاعدة البيانات. يرجى التحقق من الإنترنت والمحاولة لاحقاً.';
        } else if (result.source === 'duplicate') {
          errorTitle = 'منتج مكرر';
          errorMessage = 'يوجد منتج بنفس الاسم. يرجى استخدام اسم مختلف.';
        }
        
        throw new Error(errorMessage);
      }
      
      // التأكد من نجاح العملية
      if (result.success) {
        console.log('🎉 تم إضافة المنتج بنجاح في قاعدة البيانات');
        
        const productId = result.product?.id;
        
        // إضافة المنتج للأقسام المحددة
        if (productId && selectedSections.length > 0) {
          try {
            console.log('📋 إضافة المنتج للأقسام:', selectedSections);
            
            for (const sectionId of selectedSections) {
              await fetch('/api/homepage-sections/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  section_id: sectionId,
                  product_id: productId,
                  sort_order: 999 // سيتم ترتيبه في النهاية
                })
              });
            }
            
            console.log('✅ تم إضافة المنتج للأقسام بنجاح');
          } catch (sectionError) {
            console.error('⚠️ خطأ في إضافة المنتج للأقسام:', sectionError);
            // لا نوقف العملية، فقط نسجل الخطأ
          }
        }
        
        // عرض إشعار النجاح
        showNotification(
          'success', 
          'تم إضافة المنتج بنجاح!', 
          `تم حفظ "${product.name}" في قاعدة البيانات بنجاح. سيتم إعادة توجيهك خلال ثوان...`
        );
        
        // انتظار 3 ثوان ثم إعادة التوجيه
        setTimeout(() => {
          router.push('/dashboard/products');
          router.refresh();
        }, 3000);
      } else {
        // في حالة عدم نجاح الحفظ في قاعدة البيانات
        throw new Error('فشل في حفظ المنتج في قاعدة البيانات');
      }
      
    } catch (error: any) {
      console.error('❌ خطأ في إضافة المنتج:', error);
      
      // محاولة الحصول على رسالة خطأ أكثر تفصيلاً
      let errorMessage = 'حدث خطأ أثناء إضافة المنتج';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // عرض إشعار الخطأ
      showNotification(
        'error',
        'فشل في إضافة المنتج',
        `${errorMessage}. يرجى المحاولة مرة أخرى أو الاتصال بمدير النظام.`
      );
      
      setErrors({ 
        submit: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* شريط التقدم */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">خطوات إضافة المنتج</h2>
          <span className="text-sm text-gray-500">الخطوة {currentStep} من 4</span>
        </div>
        <div className="flex items-center space-x-4 space-x-reverse">
          {[
            { step: 1, title: 'البيانات الأساسية', icon: '📝' },
            { step: 2, title: 'الصور', icon: '📸' },
            { step: 3, title: 'الألوان', icon: '🎨' },
            { step: 4, title: 'الحفظ', icon: '💾' }
          ].map((item, index) => (
            <div key={item.step} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                currentStep >= item.step 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {currentStep > item.step ? '✓' : item.step}
              </div>
              <span className={`mr-2 text-sm ${
                currentStep >= item.step ? 'text-primary font-medium' : 'text-gray-500'
              }`}>
                {item.icon} {item.title}
              </span>
              {index < 3 && (
                <div className={`w-12 h-0.5 mx-4 ${
                  currentStep > item.step ? 'bg-primary' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* إشعارات النجاح والأخطاء */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 max-w-lg w-full shadow-xl rounded-lg border ${
          notification.type === 'success' ? 'bg-green-50 border-green-200' :
          notification.type === 'error' ? 'bg-red-50 border-red-200' :
          notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
          'bg-blue-50 border-blue-200'
        } transition-all duration-300 ease-in-out`}>
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' && <CheckCircle className="h-6 w-6 text-green-400" />}
                {notification.type === 'error' && <AlertCircle className="h-6 w-6 text-red-400" />}
                {notification.type === 'warning' && <AlertCircle className="h-6 w-6 text-yellow-400" />}
                {notification.type === 'info' && <AlertCircle className="h-6 w-6 text-blue-400" />}
              </div>
              <div className="mr-3 flex-1">
                <h3 className={`text-sm font-medium ${
                  notification.type === 'success' ? 'text-green-800' :
                  notification.type === 'error' ? 'text-red-800' :
                  notification.type === 'warning' ? 'text-yellow-800' :
                  'text-blue-800'
                }`}>
                  {notification.title}
                </h3>
                <p className={`mt-1 text-sm ${
                  notification.type === 'success' ? 'text-green-700' :
                  notification.type === 'error' ? 'text-red-700' :
                  notification.type === 'warning' ? 'text-yellow-700' :
                  'text-blue-700'
                }`}>
                  {notification.message}
                </p>
              </div>
              <div className="mr-4 flex-shrink-0 flex">
                <button
                  onClick={hideNotification}
                  className={`rounded-md inline-flex ${
                    notification.type === 'success' ? 'text-green-400 hover:text-green-500' :
                    notification.type === 'error' ? 'text-red-400 hover:text-red-500' :
                    notification.type === 'warning' ? 'text-yellow-400 hover:text-yellow-500' :
                    'text-blue-400 hover:text-blue-500'
                  } focus:outline-none`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إضافة منتج جديد</h1>
          <p className="text-gray-600 mt-1">املأ جميع البيانات المطلوبة لإضافة منتج جديد للمتجر</p>
        </div>
        <Link 
          href="/dashboard/products"
          className="flex items-center px-4 py-2 text-primary hover:text-primary/80 transition-colors border border-primary/20 rounded-lg hover:bg-primary/5"
        >
          <ArrowRight className="mr-1 h-5 w-5" />
          <span>العودة للمنتجات</span>
        </Link>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* رسالة خطأ عامة */}
        {errors.submit && (
          <div className="bg-red-50 p-4 rounded-md border border-red-200">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="mr-3">
                <h3 className="text-sm font-medium text-red-800">خطأ في الحفظ</h3>
                <p className="mt-1 text-sm text-red-700">{errors.submit}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* القسم الأول: البيانات الأساسية */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-medium mr-3">
              1
            </div>
            <h2 className="text-xl font-semibold text-gray-900">البيانات الأساسية للمنتج</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 required">
                اسم المنتج *
              </label>
              <input
                type="text"
                value={product.name}
                onChange={(e) => setProduct(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                  errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="أدخل اسم المنتج..."
                required
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.name}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 required">
                  السعر للعملاء (جنيه مصري) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={product.price}
                  onChange={(e) => setProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                    errors.price ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="0.00 ج.م"
                  required
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.price}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  سعر التكلفة (جنيه مصري)
                  <Tooltip text="سعر شراء أو تكلفة المنتج. يساعد في حساب هامش الربح. هذا الحقل اختياري ولن يظهر للعملاء">
                    <Info className="h-4 w-4 text-gray-400" />
                  </Tooltip>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={product.cost_price || 0}
                  onChange={(e) => setProduct(prev => ({ ...prev, cost_price: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                  placeholder="0.00 ج.م"
                />
                {product.cost_price && product.price > 0 && (
                  <div className="mt-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>هامش الربح:</span>
                      <span className="font-medium text-green-600">
                        {(product.price - (product.cost_price || 0)).toFixed(2)} ج.م
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>نسبة الربح:</span>
                      <span className="font-medium text-blue-600">
                        {product.cost_price > 0 ? (((product.price - product.cost_price) / product.cost_price) * 100).toFixed(1) : '0'}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 required">
                التصنيف *
              </label>
              {loadingCategories ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                  جاري تحميل التصنيفات...
                </div>
              ) : (
                <select
                  value={product.category_type}
                  onChange={(e) => setProduct(prev => ({ ...prev, category_type: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                    errors.category_type ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">اختر التصنيف...</option>
                  {categories.map((category) => (
                    <option key={category.type} value={category.type}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.category_type && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.category_type}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الكمية المتوفرة
              </label>
              <input
                type="number"
                min="0"
                value={product.stock_quantity}
                onChange={(e) => setProduct(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 required">
                كود المنتج (SKU)
              </label>
              <input
                type="text"
                value={product.sku}
                onChange={(e) => setProduct(prev => ({ ...prev, sku: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                  errors.sku ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="مثال: PROD-00123"
              />
              {errors.sku && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.sku}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 required">
                الرابط المخصص (slug) *
              </label>
              <input
                type="text"
                value={product.slug}
                onChange={(e) => setProduct(prev => ({ ...prev, slug: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                  errors.slug ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="مثال: product-name-123"
                required
              />
              {errors.slug && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.slug}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              وصف المنتج
            </label>
            <textarea
              value={product.description}
              onChange={(e) => setProduct(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              rows={4}
              placeholder="أدخل وصف مفصل للمنتج..."
              required
            />
          </div>
        </div>
        
        {/* قسم الصور */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center mb-6">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium mr-3 ${
              isImagesUploaded ? 'bg-green-500 text-white' : 'bg-primary text-white'
            }`}>
              {isImagesUploaded ? '✓' : '2'}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">صور المنتج</h2>
              <p className="text-sm text-gray-600 mt-1">
                {isImagesUploaded 
                  ? '✅ تم رفع الصور بنجاح - يمكنك المتابعة' 
                  : 'اختر الصور ثم اضغط على "رفع الصور" لتحميلها للخادم'
                }
              </p>
            </div>
          </div>

          {!isImagesUploaded && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-blue-400" />
                </div>
                <div className="mr-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    خطوات رفع الصور
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ol className="list-decimal list-inside space-y-1">
                      <li>اختر الصور من جهازك (حتى 30 صورة)</li>
                      <li>اضغط على زر "رفع الصور" لتحميلها للخادم</li>
                      <li>انتظر حتى ظهور رسالة النجاح</li>
                      <li>ثم يمكنك حفظ المنتج</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
              صور المنتج
            </h2>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={useMultipleImages}
                  onChange={(e) => setUseMultipleImages(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">صور متعددة</span>
              </label>
            </div>
          </div>
          
          {useMultipleImages ? (
            <MultiImageUpload
              images={productImages}
              onImagesChange={(imageUrls: string[]) => {
                console.log('🔗 ربط الصور المتعددة بالمنتج:', imageUrls);
                
                // التحقق من أن الصور تم رفعها بنجاح (ليست blob URLs)
                const hasLocalImages = imageUrls.some(url => url.startsWith('blob:'));
                
                if (hasLocalImages) {
                  console.warn('⚠️ بعض الصور لم يتم رفعها بعد');
                  setIsImagesUploaded(false);
                  showNotification('warning', 'انتباه', 'يرجى الضغط على زر "رفع الصور" لتحميل الصور إلى الخادم');
                  return;
                }
                
                setIsImagesUploaded(true);
                setProductImages(imageUrls);
                // تحديث الصورة الرئيسية
                if (imageUrls.length > 0) {
                  setProduct(prev => ({ ...prev, image: imageUrls[0] }));
                  showNotification('success', '✅ تم رفع الصور بنجاح!', `تم رفع ${imageUrls.length} صورة بنجاح وربطها بالمنتج. يمكنك الآن المتابعة للخطوة التالية.`);
                }
              }}
              maxImages={30}
            />
          ) : (
            <ImageUpload
              onImageUploaded={(imageUrl) => {
                console.log('🔗 ربط الصورة بالمنتج:', imageUrl);
                setProduct(prev => ({ ...prev, image: imageUrl }));
                setProductImages([imageUrl]);
                showNotification('success', 'تم رفع الصورة', 'تم رفع صورة المنتج بنجاح وربطها بالمنتج');
              }}
              currentImage={product.image}
            />
          )}
        </div>
        
        {/* قسم الألوان */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-medium mr-3">
              3
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">الألوان المتاحة</h2>
              <p className="text-sm text-gray-600 mt-1">أضف الألوان المتاحة للمنتج (اختياري)</p>
            </div>
          </div>
          <ColorSelector
            onColorsChanged={(colors) => {
              console.log('🎨 تحديث ألوان المنتج:', colors);
              setProductColors(colors);
              showNotification(
                'success', 
                'تم تحديث الألوان', 
                `تم ${colors.length === 0 ? 'إزالة جميع الألوان' : `تحديث ${colors.length} لون`}`
              );
            }}
            currentColors={productColors}
            isAdmin={true}
          />
        </div>
        
        {/* قسم الخيارات الإضافية */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-medium mr-3">
              4
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">خيارات إضافية</h2>
              <p className="text-sm text-gray-600 mt-1">إعدادات المنتج والعروض الخاصة</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={product.is_active}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="is_active" className="mr-3 block text-sm text-gray-700 font-medium">
                منتج نشط
              </label>
            </div>
            
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <input
                id="is_popular"
                name="is_popular"
                type="checkbox"
                checked={product.is_popular}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="is_popular" className="mr-3 block text-sm text-gray-700 font-medium">
                منتج مميز
              </label>
            </div>
            
            <div className="flex items-center p-3 bg-amber-50 rounded-lg border border-amber-200">
              <input
                id="is_featured"
                name="is_featured"
                type="checkbox"
                checked={product.is_featured}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded border-amber-300 text-amber-500 focus:ring-amber-500"
              />
              <label htmlFor="is_featured" className="mr-3 block text-sm text-amber-700 font-medium">
                منتج مميز
              </label>
            </div>
            
            <div className="flex items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
              <input
                id="is_exclusive"
                name="is_exclusive"
                type="checkbox"
                checked={product.is_exclusive}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded border-purple-300 text-purple-500 focus:ring-purple-500"
              />
              <label htmlFor="is_exclusive" className="mr-3 block text-sm text-purple-700 font-medium">
                منتج حصري (يظهر في العروض الحصرية)
              </label>
            </div>
            
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <input
                id="is_new"
                name="is_new"
                type="checkbox"
                checked={isNew}
                onChange={handleIsNewChange}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="is_new" className="mr-3 block text-sm text-gray-700 font-medium flex items-center gap-1">
                منتج جديد
                <Tooltip text="يظهر في أقسام الجديد وتظهر عليه شارة 'جديد' في كرت المنتج.">
                  <Info className="w-4 h-4 text-green-400" />
                </Tooltip>
              </label>
            </div>
            {isNew && (
              <div className="mt-2 flex items-center gap-2">
                <label htmlFor="new_until" className="text-xs text-gray-500">يظل جديد حتى تاريخ:</label>
                <input
                  id="new_until"
                  name="new_until"
                  type="date"
                  value={newUntil}
                  onChange={e => setNewUntil(e.target.value)}
                  className="border rounded px-2 py-1 text-xs"
                />
              </div>
            )}
            
            <div className="sm:col-span-3">
              <label htmlFor="discount_percentage" className="block text-sm font-medium text-gray-700 mb-1">
                نسبة الخصم (%)
              </label>
              <input
                type="number"
                id="discount_percentage"
                name="discount_percentage"
                value={product.discount_percentage}
                onChange={handleChange}
                min="0"
                max="100"
                step="1"
                placeholder="0"
                className={`w-full rounded-md border ${
                  errors.discount_percentage ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary focus:ring-primary'
                } py-2 px-3 shadow-sm focus:outline-none focus:ring-1 transition-colors`}
              />
              {errors.discount_percentage && (
                <p className="mt-1 text-xs text-red-600 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.discount_percentage}
                </p>
              )}
            </div>
          </div>

          {/* قسم فرعي: الأقسام */}
          {homepageSections.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                إضافة المنتج إلى أقسام الصفحة الرئيسية
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                اختر الأقسام التي تريد ظهور هذا المنتج فيها في الصفحة الرئيسية
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {homepageSections.map((section) => (
                  <div
                    key={section.id}
                    className="flex items-center p-3 bg-indigo-50 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors"
                  >
                    <input
                      id={`section-${section.id}`}
                      type="checkbox"
                      checked={selectedSections.includes(section.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSections(prev => [...prev, section.id]);
                        } else {
                          setSelectedSections(prev => prev.filter(id => id !== section.id));
                        }
                      }}
                      className="h-4 w-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label
                      htmlFor={`section-${section.id}`}
                      className="mr-3 block text-sm text-indigo-900 font-medium cursor-pointer"
                    >
                      {section.title}
                    </label>
                  </div>
                ))}
              </div>

              {selectedSections.length > 0 && (
                <p className="mt-3 text-xs text-indigo-600 bg-indigo-50 p-2 rounded">
                  ✓ سيظهر المنتج في {selectedSections.length} {selectedSections.length === 1 ? 'قسم' : 'أقسام'}
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* أزرار الحفظ */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">جاهز للحفظ؟</h3>
              <p className="text-sm text-gray-600 mt-1">
                تأكد من ملء جميع البيانات المطلوبة ورفع الصور قبل الحفظ
              </p>
            </div>
            <div className="flex space-x-4 space-x-reverse">
              <Link
                href="/dashboard/products"
                className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                إلغاء
              </Link>
              <button
                type="submit"
                disabled={loading || (!isImagesUploaded && productImages.length === 0 && !product.image)}
                className="px-8 py-3 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 mr-2" />
                    إضافة المنتج
                  </>
                )}
              </button>
            </div>
          </div>
          
          {(!isImagesUploaded && productImages.length === 0 && !product.image) && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                يرجى رفع الصور أولاً قبل حفظ المنتج
              </p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
} 