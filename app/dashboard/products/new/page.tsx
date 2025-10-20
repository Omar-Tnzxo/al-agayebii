'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Save, ImagePlus, CheckCircle, AlertCircle, X, Plus, Info } from 'lucide-react';
import MultiImageUpload, { MultiImageUploadRef } from '@/components/MultiImageUpload';
import ColorSelector, { ProductColor } from '@/components/ColorSelector';
import { useSupabaseRealtime } from '@/lib/hooks/useSupabaseRealtime';

// واجهة التصنيف
interface Category {
  id: string;
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
  const multiImageUploadRef = useRef<MultiImageUploadRef>(null);
  
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
          setCategories(result.data.map((cat: any) => ({ id: cat.id, type: cat.type, name: cat.name })));
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
          setCategories(result.data.map((cat: any) => ({ id: cat.id, type: cat.type, name: cat.name })));
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
    
    if (!product.sku.trim()) {
      newErrors.sku = 'كود المنتج (SKU) مطلوب';
    } else if (!/^[a-zA-Z0-9\-]+$/.test(product.sku.trim())) {
      newErrors.sku = 'كود المنتج يجب أن يحتوي فقط على أحرف إنجليزية، أرقام، والشرطة (-)';
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
      // رفع الصور الجديدة تلقائياً إذا كانت موجودة
      let finalImages = productImages;
      if (multiImageUploadRef.current?.hasUnuploadedImages()) {
        showNotification('info', 'جاري رفع الصور...', 'يرجى الانتظار حتى يتم رفع جميع الصور');
        
        try {
          const allImagesAfterUpload = await multiImageUploadRef.current.uploadImages();
          console.log('✅ تم رفع الصور الجديدة. إجمالي الصور:', allImagesAfterUpload);
          finalImages = allImagesAfterUpload;
          
          // تحديث حالة الصور
          setProductImages(allImagesAfterUpload);
          
          // انتظار صغير للتأكد من تحديث الحالة
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (uploadError) {
          console.error('❌ فشل رفع الصور:', uploadError);
          showNotification('error', 'فشل رفع الصور', 'حدث خطأ أثناء رفع الصور. يرجى المحاولة مرة أخرى.');
          setLoading(false);
          return;
        }
      }
      
      // التحقق من رفع الصور إذا كانت مطلوبة
      let finalImageUrl = product.image;
      
      if (finalImages.length > 0) {
        // التحقق من أن الصور تم رفعها بنجاح (ليست blob URLs)
        const hasLocalImages = finalImages.some(url => url.startsWith('blob:'));
        
        if (hasLocalImages) {
          throw new Error('حدث خطأ في رفع الصور. يرجى المحاولة مرة أخرى.');
        }
        
        finalImageUrl = finalImages[0]; // استخدام أول صورة كصورة رئيسية
      } else {
        throw new Error('يجب إضافة صورة واحدة على الأقل للمنتج.');
      }
      
      // التحقق من وجود صورة رئيسية
      if (!finalImageUrl) {
        throw new Error('يجب إضافة صورة واحدة على الأقل للمنتج.');
      }
      
      // استخراج category_id من التصنيف المختار
      const selectedCategory = categories.find(cat => cat.type === product.category_type);
      if (!selectedCategory || !selectedCategory.id) {
        throw new Error('يجب اختيار تصنيف صحيح للمنتج.');
      }
      
      // إعداد بيانات المنتج للإرسال
      const productData = {
        name: product.name.trim(),
        description: product.description.trim(),
        price: parseFloat(product.price.toString()),
        category_id: selectedCategory.id, // إضافة category_id
        category_type: product.category_type,
        stock_quantity: parseInt(product.stock_quantity.toString()),
        image: finalImageUrl,
        images: finalImages,
        colors: productColors,
        is_active: product.is_active,
        is_popular: product.is_popular,
        is_featured: product.is_featured,
        is_new: isNew,
        new_until: isNew ? newUntil : null,
        discount_percentage: product.discount_percentage > 0 
          ? parseInt(product.discount_percentage.toString()) 
          : null,
        rating: parseFloat(product.rating.toString()),
        reviews_count: parseInt(product.reviews_count.toString()),
        sku: product.sku.trim(),
        slug: product.slug.trim()
      };
      
      console.log('🚀 إرسال بيانات المنتج:', productData);
      console.log('📸 الصور النهائية المرسلة:', finalImages);
      console.log('🎨 الألوان المرسلة:', productColors);
      
      // إرسال بيانات المنتج إلى الخادم
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });
      
      const result = await response.json();
      
      console.log('📦 استجابة الخادم:', result);
      console.log('🆔 معرف المنتج:', result.data?.id);
      
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
        
        const productId = result.data?.id;
        
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
          `تم حفظ "${product.name}" في قاعدة البيانات بنجاح. سيتم إعادة توجيهك لصفحة تعديل المنتج...`
        );
        
        // انتظار 2 ثانية ثم إعادة التوجيه لصفحة تعديل المنتج
        setTimeout(() => {
          if (productId) {
            router.push(`/dashboard/products/edit/${productId}`);
          } else {
            router.push('/dashboard/products');
          }
          router.refresh();
        }, 2000);
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
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-medium text-gray-900">خطوات إضافة المنتج</h2>
          <span className="text-xs sm:text-sm text-gray-500">الخطوة {currentStep} من 4</span>
        </div>
        {/* نسخة الموبايل - عرض عمودي */}
        <div className="flex md:hidden flex-col gap-3">
          {[
            { step: 1, title: 'البيانات الأساسية', icon: '📝' },
            { step: 2, title: 'الصور', icon: '📸' },
            { step: 3, title: 'الألوان', icon: '🎨' },
            { step: 4, title: 'الحفظ', icon: '💾' }
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium flex-shrink-0 ${
                currentStep >= item.step 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {currentStep > item.step ? '✓' : item.step}
              </div>
              <span className={`text-sm ${
                currentStep >= item.step ? 'text-primary font-medium' : 'text-gray-500'
              }`}>
                {item.icon} {item.title}
              </span>
            </div>
          ))}
        </div>
        {/* نسخة الديسكتوب - عرض أفقي */}
        <div className="hidden md:flex items-center justify-between gap-2 lg:gap-4">
          {[
            { step: 1, title: 'البيانات الأساسية', icon: '📝' },
            { step: 2, title: 'الصور', icon: '📸' },
            { step: 3, title: 'الألوان', icon: '🎨' },
            { step: 4, title: 'الحفظ', icon: '💾' }
          ].map((item, index) => (
            <div key={item.step} className="flex items-center flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium flex-shrink-0 ${
                  currentStep >= item.step 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > item.step ? '✓' : item.step}
                </div>
                <span className={`text-xs lg:text-sm truncate ${
                  currentStep >= item.step ? 'text-primary font-medium' : 'text-gray-500'
                }`}>
                  <span className="hidden lg:inline">{item.icon} </span>{item.title}
                </span>
              </div>
              {index < 3 && (
                <div className={`h-0.5 flex-1 mx-2 lg:mx-4 ${
                  currentStep > item.step ? 'bg-primary' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* إشعارات النجاح والأخطاء */}
      {notification.show && (
        <div className={`fixed top-4 right-4 left-4 sm:left-auto z-50 max-w-lg w-full sm:w-auto shadow-xl rounded-lg border ${
          notification.type === 'success' ? 'bg-green-50 border-green-200' :
          notification.type === 'error' ? 'bg-red-50 border-red-200' :
          notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
          'bg-blue-50 border-blue-200'
        } transition-all duration-300 ease-in-out`}>
          <div className="p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {notification.type === 'success' && <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />}
                {notification.type === 'error' && <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />}
                {notification.type === 'warning' && <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />}
                {notification.type === 'info' && <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-medium ${
                  notification.type === 'success' ? 'text-green-800' :
                  notification.type === 'error' ? 'text-red-800' :
                  notification.type === 'warning' ? 'text-yellow-800' :
                  'text-blue-800'
                }`}>
                  {notification.title}
                </h3>
                <p className={`mt-1 text-xs sm:text-sm break-words ${
                  notification.type === 'success' ? 'text-green-700' :
                  notification.type === 'error' ? 'text-red-700' :
                  notification.type === 'warning' ? 'text-yellow-700' :
                  'text-blue-700'
                }`}>
                  {notification.message}
                </p>
              </div>
              <div className="flex-shrink-0">
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

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">إضافة منتج جديد</h1>
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
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-white text-sm font-medium mr-2 sm:mr-3 flex-shrink-0">
              1
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">البيانات الأساسية للمنتج</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2 required flex items-center justify-between">
                <span>اسم المنتج *</span>
                <span className={`text-xs ${product.name.length > 100 ? 'text-amber-500' : 'text-gray-500'}`}>
                  {product.name.length} / 150 حرف
                </span>
              </label>
              <input
                type="text"
                value={product.name}
                onChange={(e) => {
                  if (e.target.value.length <= 150) {
                    setProduct(prev => ({ ...prev, name: e.target.value }));
                  }
                }}
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-sm sm:text-base ${
                  errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="أدخل اسم المنتج..."
                required
              />
              {errors.name && (
                <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            {/* حقول السعر والتكلفة */}
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2 required flex items-center gap-2">
                <span>السعر للعملاء (جنيه مصري) *</span>
                <Tooltip text="سعر بيع المنتج للعملاء. يجب أن يكون أكبر من سعر التكلفة لتحقيق ربح.">
                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                </Tooltip>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1000000"
                  value={product.price || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    if (value <= 1000000) {
                      setProduct(prev => ({ ...prev, price: value }));
                    }
                  }}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-sm sm:text-base ${
                    errors.price ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  dir="ltr"
                  style={{ textAlign: 'left' }}
                  required
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                  ج.م
                </span>
              </div>
              {errors.price && (
                <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span>{errors.price}</span>
                </p>
              )}
              {product.price > 0 && !errors.price && (
                <p className="mt-1 text-xs text-green-600 flex items-center">
                  ✓ السعر: {product.price.toLocaleString('ar-EG')} جنيه مصري
                </p>
              )}
            </div>

            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                سعر التكلفة (جنيه مصري)
                <Tooltip text="سعر شراء أو تكلفة المنتج. يساعد في حساب هامش الربح. هذا الحقل اختياري ولن يظهر للعملاء">
                  <Info className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </Tooltip>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={product.cost_price || 0}
                onChange={(e) => setProduct(prev => ({ ...prev, cost_price: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-sm sm:text-base"
                placeholder="0.00 ج.م"
              />
              {product.cost_price && product.price > 0 && (
                <div className="mt-2 text-xs sm:text-sm space-y-1">
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

            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2 required">
                التصنيف *
              </label>
              {loadingCategories ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                  جاري تحميل التصنيفات...
                </div>
              ) : (
                <select
                  value={product.category_type}
                  onChange={(e) => setProduct(prev => ({ ...prev, category_type: e.target.value }))}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors appearance-none bg-white text-sm sm:text-base ${
                    errors.category_type ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'left 0.5rem center',
                    backgroundSize: '1.5em 1.5em',
                    paddingLeft: '2.5rem'
                  }}
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
                <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span>{errors.category_type}</span>
                </p>
              )}
            </div>

            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الكمية المتوفرة
              </label>
              <input
                type="number"
                min="0"
                value={product.stock_quantity}
                onChange={(e) => setProduct(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-sm sm:text-base"
                placeholder="0"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2 required flex items-center gap-2">
                <span>كود المنتج (SKU)</span>
                <Tooltip text="يجب أن يحتوي كود المنتج فقط على أحرف إنجليزية (A-Z)، أرقام (0-9)، والشرطة (-). لا يسمح بأحرف عربية أو رموز أخرى.">
                  <AlertCircle className="h-4 w-4 text-amber-500 cursor-help" />
                </Tooltip>
              </label>
              <input
                type="text"
                value={product.sku}
                onChange={(e) => {
                  const value = e.target.value;
                  // السماح فقط بأحرف إنجليزية وأرقام والشرطة
                  if (value === '' || /^[a-zA-Z0-9\-]*$/.test(value)) {
                    setProduct(prev => ({ ...prev, sku: value }));
                  }
                }}
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-sm sm:text-base ${
                  errors.sku ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="مثال: PROD-00123"
                dir="ltr"
                style={{ textAlign: 'left' }}
              />
              {errors.sku && (
                <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span>{errors.sku}</span>
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                أحرف إنجليزية وأرقام والشرطة (-) فقط
              </p>
            </div>

            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2 required flex items-center gap-2">
                <span>الرابط المخصص (slug) *</span>
                <Tooltip text="يجب أن يحتوي الرابط فقط على أحرف إنجليزية صغيرة (a-z)، أرقام (0-9)، والشرطة (-). لا يسمح بمسافات أو أحرف عربية أو أحرف كبيرة.">
                  <AlertCircle className="h-4 w-4 text-blue-500 cursor-help" />
                </Tooltip>
              </label>
              <input
                type="text"
                value={product.slug}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase(); // تحويل لأحرف صغيرة تلقائياً
                  // السماح فقط بأحرف إنجليزية صغيرة وأرقام والشرطة
                  if (value === '' || /^[a-z0-9\-]*$/.test(value)) {
                    setProduct(prev => ({ ...prev, slug: value }));
                  }
                }}
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-sm sm:text-base ${
                  errors.slug ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="مثال: product-name-123"
                dir="ltr"
                style={{ textAlign: 'left' }}
                required
              />
              {errors.slug && (
                <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span>{errors.slug}</span>
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                أحرف إنجليزية صغيرة وأرقام والشرطة (-) فقط - سيتم التحويل تلقائياً
              </p>
            </div>
          </div>

          <div className="mt-4 sm:mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                وصف المنتج *
                <Tooltip text="اكتب وصف تفصيلي للمنتج يساعد العملاء على فهم مميزاته واستخداماته. الحد الأدنى 10 أحرف.">
                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                </Tooltip>
              </span>
              <span className={`text-xs ${product.description.length < 10 ? 'text-red-500' : product.description.length > 500 ? 'text-amber-500' : 'text-gray-500'}`}>
                {product.description.length} / 1000 حرف
              </span>
            </label>
            <textarea
              value={product.description}
              onChange={(e) => {
                if (e.target.value.length <= 1000) {
                  setProduct(prev => ({ ...prev, description: e.target.value }));
                }
              }}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-sm sm:text-base ${
                errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              rows={5}
              placeholder="أدخل وصف مفصل للمنتج... (مثال: المواصفات، الاستخدامات، المميزات، المحتويات)"
              required
            />
            {errors.description && (
              <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                <span>{errors.description}</span>
              </p>
            )}
            {!errors.description && product.description.length > 0 && product.description.length < 10 && (
              <p className="mt-1 text-xs text-amber-600 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                <span>الوصف قصير جداً. يُفضل كتابة وصف أكثر تفصيلاً.</span>
              </p>
            )}
          </div>
        </div>
        
        {/* قسم الصور */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-white text-sm font-medium mr-2 sm:mr-3 flex-shrink-0">
              2
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">صور المنتج (حتى 30 صورة)</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                اختر صور المنتج - سيتم رفعها تلقائياً عند الحفظ
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <h3 className="text-xs sm:text-sm font-semibold text-blue-900 mb-1">
                  💡 نصيحة: رفع تلقائي عند الحفظ
                </h3>
                <p className="text-xs sm:text-sm text-blue-700">
                  اختر الصور المطلوبة (1-30 صورة)، ثم اضغط "إضافة المنتج" مباشرة. سيتم رفع الصور تلقائياً وحفظ المنتج في خطوة واحدة!
                </p>
              </div>
            </div>
          </div>
          
          <MultiImageUpload
            ref={multiImageUploadRef}
            images={productImages}
            onImagesChange={(imageUrls: string[]) => {
              console.log('🔗 [صفحة الإضافة] ربط الصور:', imageUrls.length, 'صورة');
              setProductImages(imageUrls);
              // تحديث الصورة الرئيسية
              if (imageUrls.length > 0) {
                setProduct(prev => ({ ...prev, image: imageUrls[0] }));
              }
            }}
            maxImages={30}
          />
        </div>
        
        {/* قسم الألوان */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-white text-sm font-medium mr-2 sm:mr-3 flex-shrink-0">
              3
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">الألوان المتاحة</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">أضف الألوان المتاحة للمنتج (اختياري)</p>
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
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-white text-sm font-medium mr-2 sm:mr-3 flex-shrink-0">
              4
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">خيارات إضافية</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">إعدادات المنتج والعروض الخاصة</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={product.is_active}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0"
              />
              <label htmlFor="is_active" className="mr-3 block text-sm text-gray-700 font-medium cursor-pointer">
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
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0"
              />
              <label htmlFor="is_popular" className="mr-3 block text-sm text-gray-700 font-medium cursor-pointer">
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
                className="h-4 w-4 rounded border-amber-300 text-amber-500 focus:ring-amber-500 flex-shrink-0"
              />
              <label htmlFor="is_featured" className="mr-3 block text-sm text-amber-700 font-medium cursor-pointer">
                منتج مميز
              </label>
            </div>
            
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <input
                id="is_new"
                name="is_new"
                type="checkbox"
                checked={isNew}
                onChange={handleIsNewChange}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0"
              />
              <label htmlFor="is_new" className="mr-3 block text-sm text-gray-700 font-medium flex items-center gap-1 cursor-pointer">
                منتج جديد
                <Tooltip text="يظهر في أقسام الجديد وتظهر عليه شارة 'جديد' في كرت المنتج.">
                  <Info className="w-4 h-4 text-green-400 flex-shrink-0" />
                </Tooltip>
              </label>
            </div>
            {isNew && (
              <div className="sm:col-span-2 lg:col-span-1 flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <label htmlFor="new_until" className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">يظل جديد حتى:</label>
                <input
                  id="new_until"
                  name="new_until"
                  type="date"
                  value={newUntil}
                  onChange={e => setNewUntil(e.target.value)}
                  className="border rounded px-2 py-1 text-xs sm:text-sm flex-1 min-w-0"
                />
              </div>
            )}
            
            <div className="sm:col-span-2 lg:col-span-3">
              <label htmlFor="discount_percentage" className="block text-sm font-medium text-gray-700 mb-2">
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
                className={`w-full sm:max-w-xs rounded-md border py-2 px-3 shadow-sm focus:outline-none focus:ring-1 transition-colors text-sm sm:text-base ${
                  errors.discount_percentage ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary focus:ring-primary'
                }`}
              />
              {errors.discount_percentage && (
                <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                  <span>{errors.discount_percentage}</span>
                </p>
              )}
            </div>
          </div>

          {/* قسم فرعي: الأقسام */}
          {homepageSections.length > 0 && (
            <div className="mt-6 sm:mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0"></span>
                <span>إضافة المنتج إلى أقسام الصفحة الرئيسية</span>
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-4">
                اختر الأقسام التي تريد ظهور هذا المنتج فيها في الصفحة الرئيسية
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                      className="h-4 w-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 flex-shrink-0"
                    />
                    <label
                      htmlFor={`section-${section.id}`}
                      className="mr-3 block text-xs sm:text-sm text-indigo-900 font-medium cursor-pointer min-w-0 truncate"
                    >
                      {section.title}
                    </label>
                  </div>
                ))}
              </div>

              {selectedSections.length > 0 && (
                <p className="mt-3 text-xs sm:text-sm text-indigo-600 bg-indigo-50 p-2 rounded">
                  ✓ سيظهر المنتج في {selectedSections.length} {selectedSections.length === 1 ? 'قسم' : 'أقسام'}
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* أزرار الحفظ */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">جاهز لإضافة المنتج؟</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                تأكد من ملء جميع البيانات المطلوبة واختيار الصور
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link
                href="/dashboard/products"
                className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors text-center"
              >
                إلغاء
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>إضافة المنتج</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
} 

