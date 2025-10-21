'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star,
  ChevronRight,
  ShoppingCart,
  Clock,
  Zap,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Heart,
  Share2,
  Truck,
  Shield,
  RotateCcw,
  Phone,
  MessageCircle,
  ZoomIn,
  Minus,
  Plus,
  Check,
  X,
  AlertCircle,
  Package,
  Award,
  Sparkles,
  Crown,
  ArrowRight,
  MapPin,
  CreditCard,
  User,
  Mail,
  ThumbsUp,
  Filter,
  Grid3X3,
  List,
  Info,
  CheckIcon,
  Search,
  ChevronDown,
  Copy,
  Gift
} from 'lucide-react';
import { addToCart } from '@/lib/store/cart';
import { formatPrice } from '@/lib/utils/helpers';
import { calculateShipping } from '@/lib/store/shipping';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Dialog } from '@headlessui/react';
import { Combobox } from '@headlessui/react';
// تم إزالة استيراد governoratesList الثابت
import Head from 'next/head';
import { useSiteSettings } from '@/app/components/SiteSettingsProvider';
import { AnimatedOrderButton } from '@/components/ui/AnimatedOrderButton';
import { motion, AnimatePresence } from 'framer-motion';
import { SimpleBranchSelector } from '@/app/components/BranchSelector';
import FormField from '@/app/checkout/FormField';
import { Home, MessageSquare } from 'lucide-react';
import ProductReviews from '@/app/components/ProductReviews';

// مكون معرض الصور المتقدم
const ProductImageGallery = ({ images, mainImage, productName }: { 
  images: any[], 
  mainImage: string, 
  productName: string 
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [fallbackSrc, setFallbackSrc] = useState<string | null>(null);
  const allImages = images.length > 0 ? images : [{ image_url: mainImage, alt_text: productName }];
  const imageSrc = fallbackSrc || allImages[selectedImageIndex]?.image_url || mainImage;

  // Swipe support (mobile)
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX > 50 && selectedImageIndex > 0) setSelectedImageIndex(selectedImageIndex - 1);
    if (deltaX < -50 && selectedImageIndex < allImages.length - 1) setSelectedImageIndex(selectedImageIndex + 1);
    touchStartX.current = null;
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-4">
      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex lg:flex-col gap-2 lg:gap-3 overflow-x-auto lg:overflow-x-visible mb-2 lg:mb-0 max-w-full lg:max-w-[80px]">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImageIndex(idx)}
              className={`group relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-300
                ${selectedImageIndex === idx ? 'border-blue-500 ring-2 ring-blue-200 scale-105 z-10' : 'border-gray-200 hover:border-gray-400'}
              `}
              aria-label={`عرض الصورة رقم ${idx + 1}`}
            >
              <Image
                src={img.image_url}
                alt={img.alt_text || `صورة ${idx + 1}`}
                width={64}
                height={64}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
              />
              {selectedImageIndex === idx && (
                <span className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none animate-pulse" />
              )}
            </button>
          ))}
        </div>
      )}
      {/* Main Image with animation */}
      <div className="relative flex-1 aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-neutral-200/80 cursor-zoom-in group"
        onClick={() => setShowLightbox(true)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={imageSrc}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.03 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="absolute inset-0 w-full h-full"
          >
            <Image
              src={imageSrc}
              alt={allImages[selectedImageIndex]?.alt_text || productName}
              fill
              className="object-cover transition-transform duration-500"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              onError={() => {
                if (!fallbackSrc && mainImage !== imageSrc) setFallbackSrc(mainImage);
              }}
            />
          </motion.div>
        </AnimatePresence>
        {/* Zoom icon */}
        <span className="absolute bottom-2 left-2 bg-white/80 rounded-full p-1 shadow-md">
          <ZoomIn className="h-5 w-5 text-blue-600" />
        </span>
      </div>
      {/* Lightbox */}
      <AnimatePresence>
        {showLightbox && (
          <Dialog open={showLightbox} onClose={() => setShowLightbox(false)} className="fixed z-50 inset-0 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowLightbox(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 max-w-2xl w-full flex flex-col items-center"
            >
              <button onClick={() => setShowLightbox(false)} className="absolute top-2 left-2 bg-white/80 rounded-full p-2 hover:bg-white"><X className="h-6 w-6 text-gray-700" /></button>
              <div className="aspect-square w-full flex items-center justify-center">
                <Image
                  src={imageSrc}
                  alt={allImages[selectedImageIndex]?.alt_text || productName}
                  width={600}
                  height={600}
                  className="object-contain rounded-2xl"
                  loading="eager"
                />
              </div>
              {/* Lightbox navigation */}
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                      selectedImageIndex === index 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={image.image_url}
                      alt={`صورة ${index + 1}`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
              {/* Prev/Next arrows */}
              <div className="absolute top-1/2 -translate-y-1/2 left-4">
                <button
                  onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                  disabled={selectedImageIndex === 0}
                  className="bg-white/80 rounded-full p-2 shadow hover:bg-white disabled:opacity-40"
                  aria-label="السابق"
                >
                  <ChevronLeft className="h-6 w-6 text-gray-700" />
                </button>
              </div>
              <div className="absolute top-1/2 -translate-y-1/2 right-4">
                <button
                  onClick={() => setSelectedImageIndex(Math.min(allImages.length - 1, selectedImageIndex + 1))}
                  disabled={selectedImageIndex === allImages.length - 1}
                  className="bg-white/80 rounded-full p-2 shadow hover:bg-white disabled:opacity-40"
                  aria-label="التالي"
                >
                  <ChevronRightIcon className="h-6 w-6 text-gray-700" />
                </button>
              </div>
            </motion.div>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
};

// مكون اختيار الكمية
const QuantitySelector = ({ 
  quantity, 
  setQuantity, 
  maxQuantity 
}: { 
  quantity: number, 
  setQuantity: (qty: number) => void, 
  maxQuantity: number 
}) => {
  return (
    <div className="flex items-center border border-gray-300 rounded-lg">
      <button
        onClick={() => setQuantity(Math.max(1, quantity - 1))}
        disabled={quantity <= 1}
        className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Minus className="h-4 w-4" />
      </button>
      
      <input
        type="number"
        value={quantity}
        onChange={(e) => {
          const value = parseInt(e.target.value) || 1;
          setQuantity(Math.min(maxQuantity, Math.max(1, value)));
        }}
        min="1"
        max={maxQuantity}
        className="w-16 text-center border-0 focus:ring-0 focus:outline-none"
      />
      
      <button
        onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
        disabled={quantity >= maxQuantity}
        className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
};

// مكون اختيار الألوان
const ColorSelector = ({ 
  colors, 
  selectedColor, 
  setSelectedColor 
}: { 
  colors: any[], 
  selectedColor: string | null, 
  setSelectedColor: (colorId: string) => void 
}) => {
  if (!colors || colors.length === 0) return null;
  
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-900">الألوان المتاحة</h3>
      <div className="flex flex-wrap gap-3">
        {colors.map((color) => (
          <button
            key={color.id}
            onClick={() => setSelectedColor(color.id)}
            disabled={!color.is_available}
            className={`relative w-10 h-10 rounded-full border-2 transition-all duration-200 ${
              selectedColor === color.id 
                ? 'border-blue-500 ring-2 ring-blue-200 scale-110' 
                : 'border-gray-300 hover:border-gray-400'
            } ${!color.is_available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            style={{ backgroundColor: color.color_code }}
            title={color.color_name}
          >
            {selectedColor === color.id && (
              <Check className="h-4 w-4 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            )}
            {!color.is_available && (
              <X className="h-4 w-4 text-gray-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// مكون صفحة المنتج العميل
export default function ProductClient({ params }: { params?: { slug?: string } }) {
  const router = useRouter();
  const urlParams = useParams();
  const slug = params?.slug || (typeof urlParams === 'object' && 'slug' in urlParams ? (Array.isArray(urlParams.slug) ? urlParams.slug[0] : urlParams.slug) : undefined);
  
  // حالات البيانات
  const [product, setProduct] = useState<any>(null);
  const [productImages, setProductImages] = useState<any[]>([]);
  const [productColors, setProductColors] = useState<any[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // حالات التفاعل
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [cartMessage, setCartMessage] = useState('');
  const [cartError, setCartError] = useState('');
  const [activeTab, setActiveTab] = useState('description');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isQuickBuying, setIsQuickBuying] = useState(false);


  // --- الشراء السريع ---
  const [showQuickBuy, setShowQuickBuy] = useState(false);
  const [quickBuyLoading, setQuickBuyLoading] = useState(false);
  const [quickBuySuccess, setQuickBuySuccess] = useState('');
  const [quickBuyError, setQuickBuyError] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [quickBuyForm, setQuickBuyForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    governorate: '', // يُكتب يدوياً من العميل
    paymentMethod: 'cash',
    notes: '',
  });
  // المحافظات الديناميكية
  // لا حاجة لـ state المحافظات - يتم كتابتها يدوياً في input

  // طريقة الاستلام والفرع المختار للشراء السريع
  const [quickBuyDeliveryType, setQuickBuyDeliveryType] = useState<'shipping' | 'pickup'>('shipping');
  const [quickBuySelectedBranch, setQuickBuySelectedBranch] = useState<any>(null);

  // نتيجة حساب الشحن للملخص
  const [shippingCalculation, setShippingCalculation] = useState<{
    type: 'fixed' | 'free' | 'phone' | 'pickup' | 'disabled';
    cost: number;
    message?: string;
  } | null>(null);

  // لا حاجة للبحث - المحافظة تُكتب يدوياً

  // شركات الشحن
  // لا حاجة لـ state شركات الشحن - النظام المبسط لا يستخدمها

  // استخدم useLiveSiteSettings فقط
  const { settings } = useSiteSettings();
  const currency = settings.currencySymbol || 'ج.م';
  const freeShippingMin = Number(settings.free_shipping_threshold) || 500;
  const shippingCost = Number(settings.shipping_cost) || 25;
  const freeShippingEnabled = settings.freeShippingEnabled === 'true';
  const shippingEnabled = settings.shipping_enabled === 'true';
  const pickupEnabled = settings.pickup_enabled === 'true';
  // إظهار فورم الشراء السريع فقط عند تفعيل الشحن (لأنه يحتاج عنوان ومحافظة)
  // إذا كان الفروع فقط مفعلة، يستخدم المستخدم صفحة checkout
  const hideQuickBuyForm = !shippingEnabled;

  // لا حاجة لجلب المحافظات - العميل يكتبها يدوياً
  // سعر الشحن يُحدد من site_settings (ثابت أو هاتفي)

  // لا حاجة لحساب تكلفة الشحن - تُؤخذ من site_settings مباشرة

  // لا حاجة لجلب شركات الشحن - النظام المبسط

  // لا حاجة لجلب المحافظات - يتم كتابتها يدوياً

  // ضبط نوع الاستلام الافتراضي بناءً على الإعدادات
  useEffect(() => {
    if (!shippingEnabled && pickupEnabled) {
      setQuickBuyDeliveryType('pickup');
    } else if (shippingEnabled) {
      setQuickBuyDeliveryType('shipping');
    }
  }, [shippingEnabled, pickupEnabled]);

  // تنظيف الحقول غير المطلوبة عند تغيير نوع التوصيل
  useEffect(() => {
    // مسح رسائل الخطأ والنجاح
    setQuickBuyError('');
    setQuickBuySuccess('');
    
    if (quickBuyDeliveryType === 'pickup') {
      // عند الاستلام من الفرع، مسح حقول العنوان والمحافظة
      setQuickBuyForm(prev => ({
        ...prev,
        address: '',
        governorate: ''
      }));
    } else {
      // عند الشحن، إلغاء تحديد الفرع
      setQuickBuySelectedBranch(null);
    }
  }, [quickBuyDeliveryType]);

  // حساب تكلفة الشحن عند تغير الكمية أو نوع التوصيل
  useEffect(() => {
    const updateShipping = async () => {
      if (!product) return;

      // حساب السعر بعد الخصم
      const discountedPrice = product.discount_percentage > 0
        ? product.price * (1 - product.discount_percentage / 100)
        : product.price;

      const subtotal = discountedPrice * quantity;

      if (quickBuyDeliveryType === 'pickup') {
        setShippingCalculation({ type: 'pickup', cost: 0 });
      } else {
        const result = await calculateShipping(subtotal);
        setShippingCalculation(result);
      }
    };

    updateShipping();
  }, [product, quantity, quickBuyDeliveryType]);

  // لا حاجة لحساب الشحن عند تغيير المحافظة - سعر الشحن ثابت من site_settings

  // ✅ إعادة تعريف دوال الشراء السريع بعد المتغيرات مباشرة
  const handleQuickBuyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setQuickBuyForm(prev => ({ ...prev, [name]: value }));
  };
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleQuickBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isQuickBuying) return;
    setIsQuickBuying(true);
    setQuickBuyError('');
    setQuickBuySuccess('');
    setOrderNumber('');
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
    }

    // تحقق من الحقول الأساسية المطلوبة دائماً
    if (!quickBuyForm.fullName.trim()) {
      setQuickBuyError('يرجى إدخال الاسم الكامل');
      setIsQuickBuying(false);
      return;
    }

    if (!quickBuyForm.phone.trim()) {
      setQuickBuyError('يرجى إدخال رقم الهاتف');
      setIsQuickBuying(false);
      return;
    }

    // تحقق من الحقول حسب نوع التوصيل
    if (quickBuyDeliveryType === 'shipping') {
      // عند الشحن، يجب إدخال العنوان والمحافظة
      if (!quickBuyForm.address.trim()) {
        setQuickBuyError('يرجى إدخال العنوان التفصيلي');
        setIsQuickBuying(false);
        return;
      }
      
      if (!quickBuyForm.governorate.trim()) {
        setQuickBuyError('يرجى إدخال المحافظة');
        setIsQuickBuying(false);
        return;
      }
    } else {
      // عند الاستلام من الفرع، يجب اختيار الفرع
      if (!quickBuySelectedBranch || !quickBuySelectedBranch.id) {
        setQuickBuyError('يرجى اختيار فرع الاستلام');
        setIsQuickBuying(false);
        return;
      }
    }
    
    try {
      const subtotal = discountedPrice * quantity;
      let finalShippingCost = 0;

      // حساب تكلفة الشحن حسب نوع التوصيل - نفس منطق checkout
      if (quickBuyDeliveryType === 'shipping') {
        // استخدام shippingCost من site_settings (النظام المبسط)
        const shippingResult = await calculateShipping(subtotal);

        if (shippingResult.type === 'free') {
          finalShippingCost = 0;
        } else if (shippingResult.type === 'phone') {
          finalShippingCost = 0; // سيتم تحديده هاتفياً
        } else {
          finalShippingCost = shippingResult.cost;
        }
      } else {
        // عند الاستلام من الفرع، تكلفة الشحن = 0
        finalShippingCost = 0;
      }

      const orderBody = {
        customer_name: quickBuyForm.fullName,
        customer_phone: quickBuyForm.phone,
        address: quickBuyDeliveryType === 'shipping' ? `${quickBuyForm.address}, ${quickBuyForm.governorate}` : '',
        governorate: quickBuyDeliveryType === 'shipping' ? quickBuyForm.governorate : '',
        payment_method: quickBuyForm.paymentMethod,
        delivery_type: quickBuyDeliveryType,
        pickup_branch_id: quickBuyDeliveryType === 'pickup' ? quickBuySelectedBranch?.id : null,
        items: [
          {
            product_id: product.id,
            product_name: product.name,
            product_image: product.image || '/images/drill.png',
            quantity,
            price: discountedPrice,
            color: selectedColor || null,
          }
        ],
        total: Math.round((subtotal + finalShippingCost) * 100) / 100,
        shipping_cost: Math.round(finalShippingCost * 100) / 100,
        notes: quickBuyForm.notes || '',
      };
      
      // طباعة البيانات المرسلة للتأكد (يمكن حذفها لاحقاً)
      console.log('Order Body:', orderBody);
      
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderBody),
      });
      const data = await res.json();
      
      // طباعة الاستجابة للتأكد
      console.log('API Response:', { status: res.status, data });
      
      if (res.ok && data && data.error === undefined) {
        setQuickBuySuccess('تم إرسال طلبك بنجاح!');
        setOrderNumber(data.order_number || data.data?.order_number || '');
        setQuickBuyForm({
          fullName: '', phone: '', address: '', governorate: '', paymentMethod: 'cash', notes: ''
        });
        // تحويل المستخدم لصفحة النجاح بعد انتهاء الأنيميشن
        const code = data.order_number || data.data?.order_number;
        if (code) {
          redirectTimeoutRef.current = setTimeout(() => {
            setIsTransitioning(true);
            setTimeout(() => {
              router.push(`/orders/success?order=${code}`);
            }, 700); // مدة الأنيميشن
          }, 10000); // 10 ثواني
        }
      } else {
        console.error('Order Error:', data);
        setQuickBuyError(data.error || 'حدث خطأ أثناء تنفيذ الطلب');
      }
    } catch (err) {
      setQuickBuyError('حدث خطأ أثناء تنفيذ الطلب');
    } finally {
      setIsQuickBuying(false);
    }
  };

  // جلب بيانات المنتج
  const fetchProductData = async () => {
    setIsLoading(true);
    if (!slug) {
      setProduct(null);
      setIsLoading(false);
      return;
    }
    try {
      const productResponse = await fetch(`/api/products/slug/${slug}`, {
        cache: 'no-store'
      });
      
      if (productResponse.ok) {
        const productJson = await productResponse.json();
        
        if (productJson && productJson.success) {
          const productData = productJson.data;
          setProduct(productData);
          // جلب الصور والألوان بالتوازي
          const [imagesResponse, colorsResponse] = await Promise.all([
            fetch(`/api/products/images?product_id=${productData.id}`, { cache: 'no-store' }),
            fetch(`/api/products/colors?product_id=${productData.id}&available_only=true`, { cache: 'no-store' })
          ]);
          if (imagesResponse.ok) {
            const imagesData = await imagesResponse.json();
            if (imagesData.success && imagesData.data) {
              setProductImages(imagesData.data);
            }
          }
          if (colorsResponse.ok) {
            const colorsData = await colorsResponse.json();
            if (colorsData.success && colorsData.data) {
              setProductColors(colorsData.data);
            }
          }
          // جلب المنتجات الموصى بها
          if (productData.category_type) {
            const recommendedResponse = await fetch(`/api/products?category=${productData.category_type}`, {
              cache: 'no-store'
            });
            
            if (recommendedResponse.ok) {
              const recommendedJson = await recommendedResponse.json();
              const allProducts = Array.isArray(recommendedJson.data) ? recommendedJson.data : [];
              const filtered = allProducts
                .filter((p: any) => p.id !== productData.id)
                .slice(0, 4);
              setRecommendedProducts(filtered);
            }
          }
        } else {
          setProduct(null);
        }
      } else {
        setProduct(null);
      }
    } catch (error) {
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductData();
  }, [slug]);



  // إضافة للسلة
  const handleAddToCart = async () => {
    if (isAddingToCart) return;
    setIsAddingToCart(true);
    try {
      // تحقق من اختيار اللون إذا كان هناك ألوان متاحة
      if (productColors.length > 0 && !selectedColor) {
        setCartError('يرجى اختيار اللون أولاً');
        setTimeout(() => setCartError(''), 3000);
        setIsAddingToCart(false);
        return;
      }
      if (product) {
        const cartProduct = {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          image: product.image || '/images/drill.png',
          category_type: product.category_type,
          stock: product.stock_quantity || 100,
          slug: product.slug || `product-${product.id}`,
          sku: product.sku || `SKU-${product.id}`,
          color: selectedColor || null,
          discount_percentage: product.discount_percentage || 0,
          discount_price: product.discount_percentage && product.discount_percentage > 0 ? product.price * (1 - product.discount_percentage / 100) : null,
        };
        
        // إضافة المنتج للسلة مع تطبيق شركة الشحن الافتراضية
        await addToCart(cartProduct, quantity);
        
        setCartMessage('تمت إضافة المنتج إلى سلة التسوق');
        setTimeout(() => setCartMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setCartError('حدث خطأ في إضافة المنتج للسلة');
      setTimeout(() => setCartError(''), 3000);
    } finally {
      setIsAddingToCart(false);
    }
  };

  // مكون Skeleton UI للتحميل
  function ProductSkeleton() {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-12 mb-16">
          {/* صورة المنتج */}
          <div className="flex flex-col gap-8">
            <div className="aspect-square rounded-2xl bg-gray-200 animate-pulse" />
            <div className="hidden lg:block">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="h-8 w-32 bg-gray-200 rounded mb-4 animate-pulse" />
                <div className="h-4 w-48 bg-gray-100 rounded mb-2 animate-pulse" />
                <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
          {/* تفاصيل المنتج */}
          <div className="space-y-6">
            <div className="h-6 w-32 bg-gray-200 rounded mb-2 animate-pulse" />
            <div className="h-8 w-2/3 bg-gray-300 rounded mb-2 animate-pulse" />
            <div className="flex items-center gap-4">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-16 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse mb-6" />
            <div className="h-10 w-1/2 bg-gray-200 rounded-lg animate-pulse mb-4" />
            <div className="h-10 w-1/2 bg-gray-200 rounded-lg animate-pulse mb-4" />
            <div className="flex gap-3">
              <div className="h-12 w-40 bg-gray-300 rounded-xl animate-pulse" />
              <div className="h-12 w-12 bg-gray-200 rounded-xl animate-pulse" />
            </div>
            <div className="bg-blue-50 rounded-lg p-4 space-y-3 mt-4">
              <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-1/3 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-1/4 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // عرض Skeleton أثناء التحميل
  if (isLoading) {
    return <ProductSkeleton />;
  }
  // عدم وجود المنتج بعد انتهاء التحميل
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">المنتج غير موجود</h2>
          <p className="text-gray-600 mb-6">عذراً، لم نتمكن من العثور على هذا المنتج</p>
          <Link 
            href="/products"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowRight className="h-5 w-5 mr-2" />
            العودة للمنتجات
          </Link>
        </div>
      </div>
    );
  }
  
  const discountedPrice = product.discount_percentage > 0 
    ? product.price * (1 - product.discount_percentage / 100)
    : product.price;
  
  // إعداد structured data للمنتج
  const productUrl = typeof window !== 'undefined' ? window.location.href : '';
  const structuredData = product ? {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: product.image || (productImages[0]?.image_url) || '/images/drill.png',
    description: product.description || '',
    sku: product.sku,
    mpn: product.sku,
    brand: {
      '@type': 'Brand',
      name: 'Al-Agayebi Store'
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'EGP',
      price: product.discount_percentage > 0 ? (product.price * (1 - product.discount_percentage / 100)).toFixed(2) : product.price.toFixed(2),
      availability: product.stock_quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    aggregateRating: undefined
  } : null;

  
  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Overlay Transition Animation */}
      {isTransitioning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1D4ED8cc] backdrop-blur-sm animate-fade-in">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="text-white text-lg font-bold tracking-wider animate-pulse">جاري تحويلك للصفحة...</span>
          </div>
        </div>
      )}
      {/* Structured Data */}
      {product && (
        <Head>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        </Head>
      )}
      {/* رسالة السلة */}
        {cartMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5" />
            {cartMessage}
          </div>
          </div>
        )}

      {/* رسالة الخطأ عند عدم اختيار اللون */}
      {cartError && (
        <div className="fixed top-20 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <X className="h-5 w-5" />
            {cartError}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* مسار التصفح */}
        <nav className="flex items-center text-sm mb-8">
          <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors">
            الرئيسية
          </Link>
          <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
          <Link href="/products" className="text-gray-600 hover:text-blue-600 transition-colors">
            المنتجات
          </Link>
          <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
          <span className="text-blue-600 font-medium">{product.name}</span>
        </nav>
        
        {/* محتوى المنتج الرئيسي */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-12 mb-16">
          <div className="flex flex-col gap-8">
            {/* معرض الصور */}
            <ProductImageGallery 
              images={productImages}
              mainImage={product.image || '/images/drill.png'}
              productName={product.name}
            />
            {/* كارت التبويبات - يظهر أسفل الصور على الديسكتوب فقط */}
            <div className="hidden lg:block">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="border-b border-gray-200 mb-6">
                  <nav className="flex space-x-8 rtl:space-x-reverse">
                    {[
                      { id: 'description', label: 'الوصف', icon: Info },
                      { id: 'shipping', label: 'الشحن', icon: Truck },
                      { id: 'reviews', label: 'التقييمات', icon: Star },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>
                <div className="min-h-[200px]">
                  {activeTab === 'description' && (
                    <div className="prose prose-gray max-w-none">
                      <p className="text-gray-700 leading-relaxed">
                        {product.description || 'لا يوجد وصف متاح لهذا المنتج.'}
                      </p>
                </div>
              )}
                  {activeTab === 'shipping' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Truck className="h-5 w-5 text-blue-600" />
                        <div>
                          <h4 className="font-medium">الشحن العادي</h4>
                          <p className="text-sm text-gray-600">من 3-5 أيام عمل</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5 text-yellow-600" />
                        <div>
                          <h4 className="font-medium">الشحن السريع</h4>
                          <p className="text-sm text-gray-600">من 1-2 أيام عمل</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTab === 'reviews' && (
                    <div className="w-full">
                      <ProductReviews productId={product.id} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* تفاصيل المنتج */}
          <div className="space-y-6">
            {/* الشارات */}
            <div className="flex flex-wrap gap-2">
                          {product.is_new && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Sparkles className="h-3 w-3 mr-1" />
                  جديد
                </span>
              )}
              {product.is_featured && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  <Crown className="h-3 w-3 mr-1" />
                  مميز
                </span>
              )}
              {product.is_popular && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  <Award className="h-3 w-3 mr-1" />
                  الأكثر مبيعاً
                </span>
              )}
              {product.is_exclusive && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <Star className="h-3 w-3 mr-1" />
                  حصري
                </span>
                  )}
              {product.discount_percentage > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white">
                  <Zap className="h-3 w-3 mr-1" />
                  خصم {product.discount_percentage}%
                </span>
              )}
            </div>
            
            {/* العنوان */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-gray-900 mb-0">{product.name}</h1>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  كود المنتج: {product.sku}
                  <button type="button" onClick={() => {navigator.clipboard.writeText(product.sku)}} className="ml-1 p-1 rounded hover:bg-gray-200" title="نسخ الكود"><Copy className="h-4 w-4 text-gray-400" /></button>
                </span>
              </div>
            </div>

            
            {/* السعر وحالة التوفر */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-4">
                {product.discount_percentage > 0 ? (
                  <>
                    <span className="text-3xl font-bold text-blue-600">
                      {formatPrice(discountedPrice)} {currency}
                    </span>
                    <span className="text-xl text-gray-500 line-through">
                      {formatPrice(product.price)} {currency}
                    </span>
                    <span className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded">
                      وفر {formatPrice(product.price - discountedPrice)} {currency}
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-blue-600">
                    {formatPrice(product.price)} {currency}
                  </span>
                )}
              </div>
              {/* شارة التوفر */}
              {product.stock_quantity > 10 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                  <Check className="h-4 w-4" /> متوفر
                </span>
              )}
              {product.stock_quantity > 0 && product.stock_quantity <= 10 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">
                  <AlertCircle className="h-4 w-4" /> كمية محدودة
                </span>
              )}
              {product.stock_quantity === 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                  <X className="h-4 w-4" /> غير متوفر
                </span>
              )}
            </div>

            {/* الألوان */}
              {productColors.length > 0 && (
                  <ColorSelector
                colors={productColors}
                selectedColor={selectedColor}
                setSelectedColor={setSelectedColor}
              />
            )}

            {/* الكمية */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-900">الكمية</h3>
              <div className="flex items-center gap-4">
                <QuantitySelector
                  quantity={quantity}
                  setQuantity={setQuantity}
                  maxQuantity={product.stock_quantity || 100}
                />
                <span className="text-sm text-gray-600">
                  متوفر: {product.stock_quantity || 100} قطعة
                </span>
              </div>
              </div>
              
            {/* أزرار الإجراء */}
            <div className="space-y-4">
              <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
                disabled={isAddingToCart}
              >
                <ShoppingCart className="h-5 w-5" />
                {isAddingToCart ? 'جاري الإضافة...' : 'إضافة إلى السلة'}
              </button>
                {/* أزرار المشاركة */}
                <button
                  className="p-3 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(window.location.href)}`, '_blank')}
                  title="مشاركة على واتساب"
                >
                  <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M20.52 3.48A12.07 12.07 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.22-1.63A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-14.009 0-.213-.005-.425-.014-.636A10.012 10.012 0 0 0 24 4.557zM12 22c-1.85 0-3.68-.5-5.25-1.44l-.38-.22-3.69.97.99-3.59-.25-.37A9.94 9.94 0 0 1 2 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10zm5.47-7.14c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.77-1.67-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.5-.5-.67-.5-.17 0-.37-.02-.57-.02-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.5 0 1.48 1.08 2.91 1.23 3.11.15.2 2.13 3.25 5.17 4.42.72.25 1.28.4 1.72.51.72.18 1.38.15 1.9.09.58-.07 1.77-.72 2.02-1.41.25-.7.25-1.3.17-1.41-.08-.11-.28-.18-.58-.33z"/></svg>
                </button>
                <button
                  className="p-3 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
                  onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                  title="مشاركة على فيسبوك"
                >
                  <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35C.6 0 0 .6 0 1.326v21.348C0 23.4.6 24 1.326 24H12.82v-9.294H9.692v-3.622h3.127V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.4 24 24 23.4 24 22.674V1.326C24 .6 23.4 0 22.675 0"/></svg>
                </button>
                <button
                  className="p-3 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
                  onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`, '_blank')}
                  title="مشاركة على تويتر"
                >
                  <svg className="h-5 w-5 text-sky-400" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557a9.83 9.83 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.564-2.005.974-3.127 1.195a4.916 4.916 0 0 0-8.38 4.482C7.691 8.095 4.066 6.13 1.64 3.161c-.542.929-.856 2.01-.857 3.17 0 2.188 1.115 4.116 2.823 5.247a4.904 4.904 0 0 1-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 0 1-2.224.084c.627 1.956 2.444 3.377 4.6 3.417A9.867 9.867 0 0 1 0 21.543a13.94 13.94 0 0 0 7.548 2.209c9.058 0 14.009-7.513 14.009-14.009 0-.213-.005-.425-.014-.636A10.012 10.012 0 0 0 24 4.557z"/></svg>
                </button>
              </div>
            </div>

            {/* معلومات الشحن */}
            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-gray-700">شحن مجاني للطلبات أكثر من {freeShippingMin.toLocaleString()} {currency}</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-gray-700">{settings.qualityGuaranteeText || 'ضمان منتج عالي الجودة'}</span>
              </div>
              {settings.returnPolicyValue && settings.returnPolicyUnit && (
                <div className="flex items-center gap-3">
                  <RotateCcw className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-700">إمكانية الإرجاع خلال {settings.returnPolicyValue} {settings.returnPolicyUnit}</span>
                </div>
              )}
            </div>

            {/* فورم الشراء السريع - Show if shipping OR pickup is enabled */}
            {(shippingEnabled || pickupEnabled) && (
              <form onSubmit={handleQuickBuy} className="max-w-xl mx-auto bg-white/90 rounded-xl sm:rounded-2xl border-2 border-blue-200/40 p-4 sm:p-6 lg:p-8 mt-6 sm:mt-8">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-blue-700 mb-4 sm:mb-6 text-center tracking-tight flex items-center justify-center gap-2">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                شراء سريع وآمن
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* 1. الاسم الكامل */}
                <div className="sm:col-span-2">
                  <FormField
                    label="الاسم الكامل"
                    icon={<User className="w-4 h-4 text-blue-600" />}
                    required
                    hint="الاسم الكامل كما تريد أن يظهر في الفاتورة"
                  >
                    <input
                      name="fullName"
                      value={quickBuyForm.fullName}
                      onChange={handleQuickBuyChange}
                      placeholder="مثال: محمد أحمد"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-400"
                      required
                    />
                  </FormField>
                </div>

                {/* 2. رقم الهاتف */}
                <div className="sm:col-span-2">
                  <FormField
                    label="رقم الهاتف"
                    icon={<Phone className="w-4 h-4 text-blue-600" />}
                    required
                    hint="يجب استخدام الأرقام الإنجليزية فقط (0-9)"
                  >
                    <input
                      type="tel"
                      name="phone"
                      value={quickBuyForm.phone}
                      onChange={(e) => {
                        const value = e.target.value;
                        // قبول الأرقام الإنجليزية فقط
                        if (value === '' || /^[0-9]+$/.test(value)) {
                          handleQuickBuyChange(e);
                        }
                      }}
                      onKeyPress={(e) => {
                        // منع إدخال أي شيء غير الأرقام الإنجليزية
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      placeholder="01012345678"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-400"
                      required
                      dir="ltr"
                      style={{ textAlign: 'right' }}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={11}
                    />
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      استخدم الأرقام الإنجليزية فقط (0123456789) وليس الأرقام العربية (٠١٢٣٤٥٦٧٨٩)
                    </p>
                  </FormField>
                </div>

                {/* 3. العنوان التفصيلي - Only show when shipping */}
                {quickBuyDeliveryType === 'shipping' && (
                  <div className="sm:col-span-2">
                    <FormField
                      label="العنوان التفصيلي"
                      icon={<Home className="w-4 h-4 text-blue-600" />}
                      required
                      hint="رقم البناية، الشارع، الحي"
                    >
                      <input
                        name="address"
                        value={quickBuyForm.address}
                        onChange={handleQuickBuyChange}
                        placeholder="مثال: 15 شارع الجامعة، المعادي"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-400"
                        required
                      />
                    </FormField>
                  </div>
                )}

                {/* 4. المحافظة - Only show when shipping */}
                {quickBuyDeliveryType === 'shipping' && (
                  <div className="sm:col-span-2">
                    <FormField
                      label="المحافظة"
                      icon={<MapPin className="w-4 h-4 text-blue-600" />}
                      required
                      hint="مثال: القاهرة، الجيزة، الإسكندرية"
                    >
                      <input
                        name="governorate"
                        value={quickBuyForm.governorate}
                        onChange={handleQuickBuyChange}
                        placeholder="اكتب اسم المحافظة"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-400"
                        required
                      />
                    </FormField>
                  </div>
                )}

                {/* 5. ملاحظات إضافية (اختياري) */}
                <div className="sm:col-span-2">
                  <FormField
                    label="ملاحظات إضافية (اختياري)"
                    icon={<MessageSquare className="w-4 h-4 text-blue-600" />}
                    hint="أي ملاحظات خاصة بطلبك (اختياري)"
                  >
                    <div className="relative">
                      <textarea
                        name="notes"
                        value={quickBuyForm.notes}
                        onChange={handleQuickBuyChange}
                        placeholder="مثال: الرجاء التوصيل في فترة المساء، الطابق الثالث..."
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-400 resize-none"
                        rows={3}
                        maxLength={500}
                      />
                      <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 pointer-events-none">
                        <span className="text-xs text-gray-400">{quickBuyForm.notes.length}/500</span>
                      </div>
                    </div>
                  </FormField>
                </div>

                {/* 6. طريقة الاستلام - Show if both options are enabled */}
                {shippingEnabled && pickupEnabled && (
                  <div className="sm:col-span-2">
                    <label className="block mb-2 text-xs sm:text-sm font-semibold text-gray-700">طريقة الاستلام *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* خيار الشحن */}
                      <label className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        quickBuyDeliveryType === 'shipping'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="deliveryType"
                          value="shipping"
                          checked={quickBuyDeliveryType === 'shipping'}
                          onChange={() => setQuickBuyDeliveryType('shipping')}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 ${
                          quickBuyDeliveryType === 'shipping' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                        }`}>
                          {quickBuyDeliveryType === 'shipping' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm">الشحن إلى العنوان</h4>
                          <p className="text-xs text-gray-600 mt-1">سيتم التوصيل لعنوانك</p>
                        </div>
                      </label>

                      {/* خيار الاستلام من الفرع */}
                      <label className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        quickBuyDeliveryType === 'pickup'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="deliveryType"
                          value="pickup"
                          checked={quickBuyDeliveryType === 'pickup'}
                          onChange={() => setQuickBuyDeliveryType('pickup')}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 ${
                          quickBuyDeliveryType === 'pickup' ? 'border-green-500 bg-green-500' : 'border-gray-300'
                        }`}>
                          {quickBuyDeliveryType === 'pickup' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm">استلام من الفرع</h4>
                          <p className="text-xs text-gray-600 mt-1">بدون رسوم شحن</p>
                        </div>
                      </label>
                    </div>
                    
                    {/* تحذير عند اختيار الاستلام من الفرع */}
                    {quickBuyDeliveryType === 'pickup' && (
                      <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                        <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
                        <p>سيتم التواصل معك لتحديد موعد الاستلام من الفرع المختار</p>
                      </div>
                    )}
                  </div>
                )}

                {/* محدد الفروع - Show when pickup is selected */}
                {quickBuyDeliveryType === 'pickup' && (
                  <div className="sm:col-span-2">
                    <FormField
                      label="فرع الاستلام"
                      icon={<MapPin className="w-4 h-4 text-blue-600" />}
                      required
                      hint="اختر الفرع الذي ترغب في استلام طلبك منه"
                    >
                      <SimpleBranchSelector
                        selectedBranchId={quickBuySelectedBranch?.id}
                        onSelectBranch={setQuickBuySelectedBranch}
                      />
                    </FormField>
                  </div>
                )}

                {/* 7. طريقة الدفع - الدفع عند الاستلام فقط */}
                <div className="md:col-span-2">
                  <label className="block mb-2 text-sm font-semibold text-gray-700">طريقة الدفع *</label>
                  <div className="flex items-start p-4 rounded-xl border-2 border-green-500 bg-green-50">
                    <div className="w-5 h-5 rounded-full border-2 border-green-500 bg-green-500 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">الدفع عند الاستلام</h4>
                      <p className="text-xs text-gray-600 mt-1">ادفع نقداً عند استلام الطلب</p>
                    </div>
                  </div>
                </div>
              </div>
              {quickBuyError && (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm font-medium animate-pulse">
                  <X className="w-5 h-5 flex-shrink-0" />
                  <span>{quickBuyError}</span>
                </div>
              )}

              {/* ملخص الطلب - بنفس تصميم checkout */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mt-8">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    ملخص الطلب
                  </h3>
                </div>

                {/* Summary Calculations */}
                <div className="p-6 space-y-4">
                  {/* Subtotal */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">المجموع الفرعي</span>
                    <span className="font-semibold">
                      {formatPrice(product.price * quantity)} {currency}
                    </span>
                  </div>

                  {/* Discount */}
                  {product.discount_percentage > 0 && (
                    <div className="flex justify-between items-center text-green-600">
                      <span className="flex items-center gap-1">
                        <Gift className="w-4 h-4" />
                        الخصم
                      </span>
                      <span className="font-semibold">
                        -{formatPrice((product.price - discountedPrice) * quantity)} {currency}
                      </span>
                    </div>
                  )}

                  {/* Shipping */}
                  {quickBuyDeliveryType === 'shipping' && shippingCalculation && (
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1 text-gray-600">
                        <Truck className="w-4 h-4" />
                        الشحن
                      </span>
                      <span className={`font-semibold ${shippingCalculation.type === 'free' ? 'text-green-600' : shippingCalculation.type === 'phone' ? 'text-orange-600' : ''}`}>
                        {shippingCalculation.type === 'free' ? (
                          <span className="flex items-center gap-1">
                            <Gift className="w-4 h-4" />
                            مجاني
                          </span>
                        ) : shippingCalculation.type === 'phone' ? (
                          'يحدد هاتفياً'
                        ) : (
                          `${formatPrice(shippingCalculation.cost)} ${currency}`
                        )}
                      </span>
                    </div>
                  )}

                  {quickBuyDeliveryType === 'pickup' && (
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1 text-gray-600">
                        <Truck className="w-4 h-4" />
                        الشحن
                      </span>
                      <span className="font-semibold text-green-600">استلام من الفرع</span>
                    </div>
                  )}

                  {/* Divider */}
                  <hr className="border-gray-200" />

                  {/* Total */}
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">المجموع الإجمالي</span>
                    <span className="text-xl font-bold text-blue-600">
                      {(() => {
                        const subtotal = discountedPrice * quantity;
                        if (quickBuyDeliveryType === 'pickup' || !shippingCalculation) {
                          return `${formatPrice(subtotal)} ${currency}`;
                        } else {
                          const shippingCost = shippingCalculation.type === 'free' || shippingCalculation.type === 'phone' ? 0 : shippingCalculation.cost;
                          return `${formatPrice(subtotal + shippingCost)} ${currency}`;
                        }
                      })()}
                    </span>
                  </div>

                  {/* Tax Note */}
                  <p className="text-xs text-gray-500 text-center">
                    جميع الأسعار شاملة الضرائب المطبقة
                  </p>
                </div>
              </div>
              <div className="mt-8 flex justify-center">
                <AnimatedOrderButton
                  isLoading={isQuickBuying}
                  isSuccess={!!quickBuySuccess}
                  disabled={isQuickBuying}
                >
                  {isQuickBuying ? 'جاري الشراء...' : 'شراء سريع'}
                </AnimatedOrderButton>
              </div>
            </form>
            )}
          </div>
        </div>

        {/* المنتجات المقترحة */}
        {recommendedProducts.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">منتجات مقترحة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recommendedProducts.map((recommendedProduct) => (
                <Link
                  key={recommendedProduct.id}
                  href={`/product/${recommendedProduct.slug}`}
                  className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="aspect-square relative overflow-hidden">
                    <Image
                      src={recommendedProduct.image || '/images/drill.png'}
                      alt={recommendedProduct.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                      {recommendedProduct.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-blue-600">
                        {formatPrice(recommendedProduct.price)} {currency}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* قسم التقييمات */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">تقييمات المنتج</h2>
          <ProductReviews productId={product.id} />
        </div>
      </div>
      {/* زر إضافة للسلة ثابت للموبايل */}
      {product && product.stock_quantity > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 block lg:hidden bg-white border-t border-gray-200 shadow-2xl animate-slide-up">
          <div className="flex items-center justify-between px-4 py-3 gap-2">
            <div className="flex flex-col text-right">
              <span className="text-xs text-gray-500">السعر الإجمالي</span>
              <span className="text-lg font-bold text-blue-700">{formatPrice(discountedPrice * quantity)} {currency}</span>
            </div>
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl shadow-lg hover:bg-blue-700 transition-all font-bold text-base flex items-center justify-center gap-2 active:scale-95"
              style={{ maxWidth: 220 }}
              disabled={isAddingToCart}
            >
              <ShoppingCart className="h-5 w-5" />
              إضافة إلى السلة
              <span className="ml-2 bg-white/20 rounded px-2 py-0.5 text-xs font-bold">{quantity}</span>
            </button>
        </div>
        </div>
      )}
    </div>
  );
} 
