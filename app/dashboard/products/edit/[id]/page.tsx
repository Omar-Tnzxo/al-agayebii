'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Save, Loader2, AlertCircle, CheckCircle, X, Info } from 'lucide-react';
import MultiImageUpload, { MultiImageUploadRef } from '@/components/MultiImageUpload';
import ColorSelector, { ProductColor } from '@/components/ColorSelector';
import { useSupabaseRealtime } from '@/lib/hooks/useSupabaseRealtime';
import { toast } from 'sonner';

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

// واجهة المنتج
interface Product {
  name: string;
  description: string;
  price: string;
  cost_price?: string;
  category_type: string;
  stock_quantity: string;
  image: string;
  is_active: boolean;
  is_popular: boolean;
  is_featured: boolean;
  is_new: boolean;
  discount_percentage: string;
  rating: string;
  reviews_count: string;
  sku: string;
  slug: string;
  new_until?: string | null;
}

// واجهة الإشعار
interface Notification {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  show: boolean;
}

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

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  // حالة المنتج
  const [product, setProduct] = useState<Product>({
    name: '',
    description: '',
    price: '',
    cost_price: '',
    category_type: '',
    stock_quantity: '',
    image: '',
    is_active: true,
    is_popular: false,
    is_featured: false,
    is_new: false,
    discount_percentage: '',
    rating: '',
    reviews_count: '',
    sku: '',
    slug: '',
    new_until: '',
  });
  
  // حالة الصور المتعددة والألوان
  const [productImages, setProductImages] = useState<string[]>([]);
  const [productColors, setProductColors] = useState<ProductColor[]>([]);
  const multiImageUploadRef = useRef<MultiImageUploadRef>(null);
  
  // حالة التصنيفات
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  // حالة أقسام الصفحة الرئيسية
  const [homepageSections, setHomepageSections] = useState<HomepageSection[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [initialSections, setInitialSections] = useState<string[]>([]);
  
  // حالة النموذج
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // حالة الإشعارات
  const [notification, setNotification] = useState<Notification>({
    type: 'info',
    title: '',
    message: '',
    show: false
  });

  // دالة عرض الإشعار
  const showNotification = (type: Notification['type'], title: string, message: string) => {
    setNotification({ type, title, message, show: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  // دالة إخفاء الإشعار
  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  // جلب بيانات المنتج
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoadingProduct(true);
        const response = await fetch(`/api/products/${productId}`);
        
        if (!response.ok) {
          throw new Error('فشل في جلب بيانات المنتج');
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
          const productData = result.data;
          // تحقق من منطق "جديد" بناءً على التاريخ
          let isNew = productData.is_new ?? false;
          let newUntil = productData.new_until ? productData.new_until.slice(0, 10) : '';
          if (isNew && newUntil) {
            const now = new Date();
            const untilDate = new Date(newUntil);
            if (now > untilDate) {
              isNew = false;
              newUntil = '';
            }
          }
          setProduct({
            name: productData.name || '',
            description: productData.description || '',
            price: productData.price?.toString() || '',
            cost_price: productData.cost_price?.toString() || '',
            category_type: productData.category_type || productData.type || '',
            stock_quantity: productData.stock_quantity?.toString() || '',
            image: productData.image || '',
            is_active: productData.is_active ?? true,
            is_popular: productData.is_popular ?? false,
            is_featured: productData.is_featured ?? false,
            is_new: isNew,
            discount_percentage: productData.discount_percentage?.toString() || '',
            rating: productData.rating?.toString() || '',
            reviews_count: productData.reviews_count?.toString() || '',
            sku: productData.sku || '',
            slug: productData.slug || '',
            new_until: newUntil || '',
          });
          setIsNew(isNew);
          setNewUntil(newUntil);
          
          // جلب صور المنتج
          console.log('📸 صور المنتج من API:', productData.images);
          const imageUrls: string[] = [];
          
          if (productData.images && Array.isArray(productData.images) && productData.images.length > 0) {
            // جلب الصور من product_images table
            productData.images.forEach((img: any) => {
              if (img.image_url) {
                imageUrls.push(img.image_url);
              }
            });
            console.log('✅ تم جلب الصور من product_images:', imageUrls);
          }
          
          // إذا لم توجد صور في product_images، استخدم الصورة الرئيسية
          if (imageUrls.length === 0 && productData.image) {
            imageUrls.push(productData.image);
            console.log('✅ تم استخدام الصورة الرئيسية:', productData.image);
          }
          
          setProductImages(imageUrls);
          console.log('🖼️ الصور النهائية:', imageUrls);
          
          // جلب ألوان المنتج
          if (productData.colors && productData.colors.length > 0) {
            setProductColors(productData.colors.map((color: any) => ({
              id: color.id || (Date.now().toString() + Math.random()),
              name: color.color_name,
              hexCode: color.color_code,
              isAvailable: color.is_available ?? true,
              stock: color.stock_quantity
            })));
          }
          console.log('✅ تم جلب بيانات المنتج بنجاح:', productData);
        } else {
          throw new Error('لا توجد بيانات للمنتج');
        }
      } catch (error) {
        console.error('خطأ في جلب بيانات المنتج:', error);
        toast.error('خطأ في تحميل المنتج', {
          description: 'فشل في تحميل بيانات المنتج. يرجى إعادة تحميل الصفحة.',
          className: 'bg-white text-red-700 border-red-300 shadow-lg font-tajawal',
          icon: <AlertCircle className="text-red-500 w-6 h-6 animate-shake" />
        });
      } finally {
        setLoadingProduct(false);
      }
    };
    
    if (productId) {
      fetchProduct();
    }
  }, [productId]);
  
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
        toast.error('خطأ في التصنيفات', {
          description: 'فشل في تحميل التصنيفات. يرجى إعادة تحميل الصفحة.',
          className: 'bg-white text-red-700 border-red-300 shadow-lg font-tajawal',
          icon: <AlertCircle className="text-red-500 w-6 h-6 animate-shake" />
        });
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
        console.log('🔍 [تعديل] بدء جلب الأقسام...');
        const response = await fetch('/api/homepage-sections?active=true');
        const result = await response.json();
        
        console.log('📦 [تعديل] استجابة API للأقسام:', result);
        
        if (result.success && result.data) {
          console.log('📋 [تعديل] إجمالي الأقسام:', result.data.length);
          
          // فقط الأقسام اليدوية
          const manualSections = result.data.filter(
            (section: HomepageSection) => 
              section.settings?.product_source === 'manual' &&
              section.section_type === 'products'
          );
          
          setHomepageSections(manualSections);
          console.log('✅ [تعديل] الأقسام اليدوية المتاحة:', manualSections.length);
          
          if (manualSections.length === 0) {
            console.warn('⚠️ [تعديل] لا توجد أقسام يدوية!');
          } else {
            console.log('📋 [تعديل] الأقسام:', manualSections.map((s: HomepageSection) => s.title));
          }
        }
      } catch (error) {
        console.error('❌ [تعديل] خطأ في جلب الأقسام:', error);
      }
    };

    fetchHomepageSections();
  }, []);

  // جلب الأقسام الحالية للمنتج
  useEffect(() => {
    if (!productId) return;

    const fetchProductSections = async () => {
      try {
        // جلب جميع الأقسام التي تحتوي على هذا المنتج
        const response = await fetch(`/api/homepage-sections/products?product_id=${productId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          const sectionIds = result.data.map((item: any) => item.section_id);
          setSelectedSections(sectionIds);
          setInitialSections(sectionIds);
          console.log('✅ المنتج موجود في', sectionIds.length, 'أقسام');
        }
      } catch (error) {
        console.error('خطأ في جلب أقسام المنتج:', error);
      }
    };

    fetchProductSections();
  }, [productId]);
  
  // دعم التحديث الفوري realtime
  useSupabaseRealtime({
    table: 'products',
    event: '*',
    onChange: () => {
      if (productId) {
        // إعادة جلب بيانات المنتج عند أي تغيير
        fetch(`/api/products/${productId}`).then(r => r.ok && r.json()).then(result => {
          if (result && result.success && result.data) {
            // تحديث بيانات المنتج فقط إذا تغيرت فعلاً
            setProduct(prev => ({ ...prev, ...result.data }));
          }
        });
      }
    },
  });
  
  // معالج تغيير بيانات المنتج
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
      if (value === '' || !isNaN(Number(value))) {
        setProduct(prev => ({ ...prev, [name]: value }));
      }
      return;
    }
    
    setProduct(prev => ({ ...prev, [name]: value }));
  }, [errors]);
  
  // معالج تغيير الخيارات المنطقية
  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setProduct(prev => ({ ...prev, [name]: checked }));
  }, []);

  const [isNew, setIsNew] = useState(product?.is_new ?? false);
  const [newUntil, setNewUntil] = useState(product?.new_until ? product.new_until.slice(0, 10) : '');

  function handleIsNewChange(e: React.ChangeEvent<HTMLInputElement>) {
    setIsNew(e.target.checked);
    if (!e.target.checked) setNewUntil('');
  }
  
  // التحقق من النموذج
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
  
  // معالج إرسال النموذج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('خطأ في النموذج', {
        description: 'يرجى تصحيح الأخطاء في النموذج',
        className: 'bg-white text-red-700 border-red-300 shadow-lg font-tajawal',
        icon: <AlertCircle className="text-red-500 w-6 h-6 animate-shake" />
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // رفع الصور الجديدة تلقائياً إذا كانت موجودة
      let finalImages = productImages;
      if (multiImageUploadRef.current?.hasUnuploadedImages()) {
        toast.info('جاري رفع الصور...', {
          description: 'يرجى الانتظار حتى يتم رفع جميع الصور',
          className: 'bg-white text-blue-700 border-blue-300 shadow-lg font-tajawal'
        });
        
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
          toast.error('فشل رفع الصور', {
            description: 'حدث خطأ أثناء رفع الصور. يرجى المحاولة مرة أخرى.',
            className: 'bg-white text-red-700 border-red-300 shadow-lg font-tajawal'
          });
          setLoading(false);
          return;
        }
      }
      
      const productData = {
        name: product.name.trim(),
        description: product.description.trim(),
        price: parseFloat(product.price),
        cost_price: product.cost_price ? parseFloat(product.cost_price) : null,
        category_type: product.category_type,
        stock_quantity: parseInt(product.stock_quantity),
        is_active: product.is_active,
        is_popular: product.is_popular,
        is_featured: product.is_featured,
        is_new: isNew,
        discount_percentage: parseInt(product.discount_percentage || '0'),
        rating: parseFloat(product.rating || '0'),
        reviews_count: parseInt(product.reviews_count || '0'),
        image: product.image || finalImages[0] || null,
        images: finalImages,
        colors: productColors,
        sku: product.sku.trim() || null,
        slug: product.slug.trim(),
        new_until: isNew ? newUntil : null
      };

      console.log('📝 بيانات المنتج المُحدثة:', productData);
      console.log('📸 الصور النهائية المُرسلة:', finalImages);

      const response = await fetch(`/api/products/${productId}`, {
          method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'فشل في تحديث المنتج');
      }

      toast.success('تم التحديث بنجاح', {
        description: 'تم تحديث بيانات المنتج بنجاح.',
        className: 'bg-white text-green-700 border-green-300 shadow-lg font-tajawal',
        icon: <CheckCircle className="text-green-500 w-6 h-6 animate-bounce" />
      });

      // تحديث الأقسام
      if (productId) {
        try {
          console.log('📋 تحديث أقسام المنتج...', {
            initialSections,
            selectedSections,
            productId
          });
          
          // 1. حذف الأقسام التي تم إلغاؤها
          const removedSections = initialSections.filter(id => !selectedSections.includes(id));
          for (const sectionId of removedSections) {
            // جلب الـ link_id من الجدول
            const linkResponse = await fetch(`/api/homepage-sections/products?section_id=${sectionId}&product_id=${productId}`);
            const linkData = await linkResponse.json();
            
            if (linkData.success && linkData.data && linkData.data.length > 0) {
              const linkId = linkData.data[0].id;
              await fetch(`/api/homepage-sections/products?id=${linkId}`, {
                method: 'DELETE'
              });
              console.log(`✅ تم حذف المنتج من قسم: ${sectionId}`);
            }
          }
          
          // 2. إضافة الأقسام الجديدة
          const addedSections = selectedSections.filter(id => !initialSections.includes(id));
          for (const sectionId of addedSections) {
            await fetch('/api/homepage-sections/products', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                section_id: sectionId,
                product_id: productId,
                sort_order: 999
              })
            });
            console.log(`✅ تم إضافة المنتج إلى قسم: ${sectionId}`);
          }
          
          console.log('✅ تم تحديث الأقسام:', {
            removed: removedSections.length,
            added: addedSections.length
          });
          
        } catch (sectionError) {
          console.error('⚠️ خطأ في تحديث الأقسام:', sectionError);
          // لا نوقف العملية، فقط نسجل الخطأ
        }
      }
      
      // إعادة توجيه بعد ثانيتين
      setTimeout(() => {
      router.push('/dashboard/products');
      }, 2000);

    } catch (error: any) {
      console.error('خطأ في تحديث المنتج:', error);
      toast.error('خطأ في التحديث', {
        description: error.message || 'حدث خطأ في تحديث المنتج',
        className: 'bg-white text-red-700 border-red-300 shadow-lg font-tajawal',
        icon: <AlertCircle className="text-red-500 w-6 h-6 animate-shake" />
      });
    } finally {
      setLoading(false);
    }
  };
  
  // عرض مؤشر التحميل
  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-500">جارٍ تحميل بيانات المنتج...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* الإشعارات */}
      {notification.show && (
        <div className={`p-4 rounded-lg border flex items-start gap-3 ${
          notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
          notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          {notification.type === 'success' && <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
          {notification.type === 'error' && <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
          {notification.type === 'warning' && <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
          {notification.type === 'info' && <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
          
          <div className="flex-1">
            <h4 className="font-medium">{notification.title}</h4>
            <p className="text-sm mt-1">{notification.message}</p>
          </div>
          
          <button 
            onClick={hideNotification}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/products"
            className="flex items-center text-gray-600 hover:text-primary transition-colors"
        >
            <ArrowRight className="w-5 h-5 ml-1" />
            العودة للمنتجات
        </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">تعديل المنتج</h1>
            <p className="text-gray-600">تحديث بيانات ومعلومات المنتج</p>
          </div>
        </div>
      </div>
      
      {/* النموذج */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* المعلومات الأساسية */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
            المعلومات الأساسية
          </h2>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                اسم المنتج *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={product.name}
                onChange={handleChange}
                required
                className={`w-full rounded-md border ${
                  errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary focus:ring-primary'
                } py-2 px-3 shadow-sm focus:outline-none focus:ring-1 transition-colors`}
                placeholder="أدخل اسم المنتج"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* حقول السعر والتكلفة */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                السعر للعملاء (ج.م) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={product.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className={`w-full rounded-md border ${
                  errors.price ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary focus:ring-primary'
                } py-2 px-3 shadow-sm focus:outline-none focus:ring-1 transition-colors`}
                placeholder="0.00"
              />
              {errors.price && (
                <p className="mt-1 text-xs text-red-600 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.price}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="cost_price" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                سعر التكلفة (ج.م)
                <Tooltip text="سعر شراء أو تكلفة المنتج. يساعد في حساب هامش الربح. هذا الحقل اختياري ولن يظهر للعملاء">
                  <Info className="h-4 w-4 text-gray-400" />
                </Tooltip>
              </label>
              <input
                type="number"
                id="cost_price"
                name="cost_price"
                value={product.cost_price || ''}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full rounded-md border border-gray-300 focus:border-primary focus:ring-primary py-2 px-3 shadow-sm focus:outline-none focus:ring-1 transition-colors"
                placeholder="0.00"
              />
              {product.cost_price && product.price && parseFloat(product.price) > 0 && parseFloat(product.cost_price) >= 0 && (
                <div className="mt-2 text-sm space-y-1">
                  <div className="flex justify-between text-gray-600">
                    <span>هامش الربح:</span>
                    <span className="font-medium text-green-600">
                      {(parseFloat(product.price) - parseFloat(product.cost_price || '0')).toFixed(2)} ج.م
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>نسبة الربح:</span>
                    <span className="font-medium text-blue-600">
                      {parseFloat(product.cost_price) > 0 ?
                        (((parseFloat(product.price) - parseFloat(product.cost_price)) / parseFloat(product.cost_price)) * 100).toFixed(1)
                        : '0'}%
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <label htmlFor="category_type" className="block text-sm font-medium text-gray-700 mb-1">
                الفئة *
              </label>
              <select
                id="category_type"
                name="category_type"
                value={product.category_type}
                onChange={handleChange}
                required
                disabled={loadingCategories}
                className={`w-full rounded-md border ${
                  errors.category_type ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary focus:ring-primary'
                } py-2 px-3 shadow-sm focus:outline-none focus:ring-1 transition-colors ${
                  loadingCategories ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              >
                <option value="">اختر الفئة</option>
                {categories.map((category) => (
                  <option key={category.type} value={category.type}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_type && (
                <p className="mt-1 text-xs text-red-600 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.category_type}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="stock_quantity" className="block text-sm font-medium text-gray-700 mb-1">
                كمية المخزون *
              </label>
              <input
                type="number"
                id="stock_quantity"
                name="stock_quantity"
                value={product.stock_quantity}
                onChange={handleChange}
                required
                min="0"
                className={`w-full rounded-md border ${
                  errors.stock_quantity ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary focus:ring-primary'
                } py-2 px-3 shadow-sm focus:outline-none focus:ring-1 transition-colors`}
                placeholder="0"
              />
              {errors.stock_quantity && (
                <p className="mt-1 text-xs text-red-600 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.stock_quantity}
                </p>
              )}
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                وصف المنتج *
              </label>
              <textarea
                id="description"
                name="description"
                value={product.description}
                onChange={handleChange}
                required
                rows={4}
                className={`w-full rounded-md border ${
                  errors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary focus:ring-primary'
                } py-2 px-3 shadow-sm focus:outline-none focus:ring-1 transition-colors`}
                placeholder="أدخل وصفاً شاملاً للمنتج (10 أحرف على الأقل)"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-600 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.description}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                كود المنتج (SKU)
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={product.sku}
                onChange={handleChange}
                placeholder="مثال: PROD-00123"
                className={`w-full rounded-md border ${
                  errors.sku ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary focus:ring-primary'
                } py-2 px-3 shadow-sm focus:outline-none focus:ring-1 transition-colors`}
              />
              {errors.sku && (
                <p className="mt-1 text-xs text-red-600 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.sku}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                الرابط المخصص (slug) *
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={product.slug}
                onChange={handleChange}
                required
                placeholder="مثال: product-name-123"
                className={`w-full rounded-md border ${
                  errors.slug ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary focus:ring-primary'
                } py-2 px-3 shadow-sm focus:outline-none focus:ring-1 transition-colors`}
              />
              {errors.slug && (
                <p className="mt-1 text-xs text-red-600 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.slug}
                </p>
              )}
            </div>
          </div>
            </div>
            
        {/* صور المنتج */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
              صور المنتج (حتى 30 صورة)
            </h2>
          </div>
          
          <MultiImageUpload
            ref={multiImageUploadRef}
            images={productImages}
            onImagesChange={(imageUrls: string[]) => {
              console.log('🔗 [صفحة التعديل] تحديث الصور - العدد الجديد:', imageUrls.length);
              console.log('🔗 [صفحة التعديل] الصور:', imageUrls);
              setProductImages(imageUrls);
              // تحديث الصورة الرئيسية
              if (imageUrls.length > 0) {
                setProduct(prev => ({ ...prev, image: imageUrls[0] }));
              }
              toast.success('تم تحديث الصور', {
                description: `تم تحديث ${imageUrls.length} صورة بنجاح.`,
                className: 'bg-white text-green-700 border-green-300 shadow-lg font-tajawal',
                icon: <CheckCircle className="text-green-500 w-6 h-6 animate-bounce" />
              });
            }}
            maxImages={30}
          />
        </div>
        
        {/* الألوان المتاحة */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
            الألوان المتاحة
          </h2>
          <ColorSelector
            onColorsChanged={(colors) => {
              console.log('🎨 تحديث ألوان المنتج:', colors);
              setProductColors(colors);
              toast.success('تم تحديث الألوان', {
                description: `تم ${colors.length === 0 ? 'إزالة جميع الألوان' : `تحديث ${colors.length} لون`}`,
                className: 'bg-white text-green-700 border-green-300 shadow-lg font-tajawal',
                icon: <CheckCircle className="text-green-500 w-6 h-6 animate-bounce" />
              });
            }}
            currentColors={productColors}
            isAdmin={true}
          />
        </div>
        
        {/* خيارات إضافية */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
            خيارات إضافية
          </h2>
          
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
              <label htmlFor="is_active" className="mr-3 block text-sm text-gray-700 font-medium flex items-center gap-1">
                منتج نشط
                <Tooltip text="إذا كان غير نشط، المنتج لا يظهر في المتجر ولا في البحث ولا في أي قائمة عامة.">
                  <Info className="w-4 h-4 text-gray-400" />
                </Tooltip>
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
              <label htmlFor="is_popular" className="mr-3 block text-sm text-gray-700 font-medium flex items-center gap-1">
                رائج
                <Tooltip text="يظهر في قوائم المنتجات الشائعة/رائج ويُستخدم في فلاتر وقوائم خاصة.">
                  <Info className="w-4 h-4 text-gray-400" />
                </Tooltip>
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
              <label htmlFor="is_featured" className="mr-3 block text-sm text-amber-700 font-medium flex items-center gap-1">
                منتج مميز
                <Tooltip text="يظهر في أقسام المنتجات المميزة ويُعطى أولوية في الترتيب والعروض الخاصة.">
                  <Info className="w-4 h-4 text-amber-400" />
                </Tooltip>
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
              <input
                id="is_new"
                name="is_new"
                type="checkbox"
                checked={isNew}
                onChange={handleIsNewChange}
                className="ml-2"
              />
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
            </div>
        
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
        </div>

        {/* قسم فرعي: الأقسام */}
        {homepageSections.length > 0 && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
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
                ✓ المنتج {initialSections.length > 0 ? 'موجود' : 'سيظهر'} في {selectedSections.length} {selectedSections.length === 1 ? 'قسم' : 'أقسام'}
                {initialSections.length !== selectedSections.length && (
                  <span className="mr-2 text-amber-600">
                    (تم التعديل - احفظ لتطبيق التغييرات)
                  </span>
                )}
              </p>
            )}
          </div>
        )}
        
        {/* أزرار الإجراءات */}
        <div className="flex justify-end space-x-4 space-x-reverse">
          <Link 
            href="/dashboard/products"
            className="py-2 px-6 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          >
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={loading || loadingCategories}
            className="py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                <span className="mr-2">جاري التحديث...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5 ml-2" />
                <span className="mr-2">حفظ التحديثات</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 