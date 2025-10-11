'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight,
  CreditCard,
  Truck,
  Home,
  Phone,
  User,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  Mail,
  MapPin,
  Shield,
  Clock
} from 'lucide-react';
import { formatPrice } from '@/lib/utils/helpers';
import { supabase } from '@/lib/supabase';
import { getCart, clearCart, recalculateCart } from '@/lib/store/cart';
import { handleApiResponse } from '@/lib/utils/handle-api-response';
import { useSiteSettings } from '@/app/components/SiteSettingsProvider';
import { AnimatedOrderButton } from '@/components/ui/AnimatedOrderButton';
import FormField from './FormField';
import EnhancedOrderSummary from './EnhancedOrderSummary';
import { getShippingSettings, calculateShipping } from '@/lib/store/shipping';
import { SimpleBranchSelector } from '@/app/components/BranchSelector';
import type { Branch } from '@/lib/types/branch';

// نوع البيانات للمنتج في السلة
interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    discount_percentage?: number | null;
    discount_price?: number | null;
  };
}

// نوع البيانات لعنوان الشحن
interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  governorate: string;
  notes: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [subtotal, setSubtotal] = useState(0);
  const { settings } = useSiteSettings();
  const currency = settings.currencySymbol || 'ج.م';

  const parseNumberSetting = (key: string, defaultValue: number): number => {
    const value = parseFloat(settings[key]);
    return Number.isFinite(value) ? value : defaultValue;
  };

  const parseBooleanSetting = (key: string, defaultValue: boolean): boolean => {
    const raw = settings[key];
    if (raw === undefined) return defaultValue;
    return ['true', '1', 'yes', 'on'].includes(String(raw).toLowerCase());
  };

  const defaultShippingCost = parseNumberSetting('shipping_cost', 30);
  const freeShippingMin = parseNumberSetting('free_shipping_threshold', 500);
  const freeShippingEnabled = parseBooleanSetting('freeShippingEnabled', true);

  const [shippingFee, setShippingFee] = useState(defaultShippingCost);
  const [total, setTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    phone: '',
    address: '',
    governorate: '',
    notes: '',
  });

  const [subTotalBeforeDiscount, setSubTotalBeforeDiscount] = useState(0);

  // Simplified shipping settings
  const [shippingSettings, setShippingSettings] = useState<any>(null);
  const [shippingMessage, setShippingMessage] = useState<string>('');
  const [deliveryTime, setDeliveryTime] = useState<string>('');
  const [shippingType, setShippingType] = useState<'fixed' | 'free' | 'phone' | 'pickup' | 'disabled'>('fixed');
  const [deliveryType, setDeliveryType] = useState<'shipping' | 'pickup'>('shipping');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const [totalDiscount, setTotalDiscount] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // Refs for required fields
  const fullNameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const governorateRef = useRef<HTMLInputElement>(null);

  // Fetch shipping settings
  const fetchShippingSettings = async () => {
    try {
      const settings = await getShippingSettings();
      setShippingSettings(settings);

      // Set default delivery type based on settings
      if (!settings.enabled && settings.pickup_enabled) {
        setDeliveryType('pickup');
      } else if (settings.enabled) {
        setDeliveryType('shipping');
      }
    } catch (error) {
      console.error('خطأ في جلب إعدادات الشحن:', error);
    }
  };

  // Calculate shipping cost based on subtotal
  const recalculateShipping = async (currentSubtotal: number) => {
    if (deliveryType === 'pickup') {
      setShippingFee(0);
      setShippingMessage('استلام من الفرع - بدون رسوم شحن');
      setDeliveryTime('');
      setShippingType('pickup');
      return;
    }

    try {
      const result = await calculateShipping(currentSubtotal);
      setShippingFee(result.cost);
      setShippingMessage(result.message || '');
      setDeliveryTime(result.delivery_time || '');
      setShippingType(result.type);
    } catch (error) {
      console.error('خطأ في حساب تكلفة الشحن:', error);
      setShippingFee(defaultShippingCost);
      setShippingMessage('');
      setDeliveryTime('');
      setShippingType('fixed');
    }
  };

  // جلب عناصر السلة من التخزين المحلي
  async function fetchCartItems() {
    try {
      setIsLoading(true);

      // استخدام وظيفة getCart من متجر السلة
      const storedCart = getCart();

      if (storedCart.length === 0) {
        setCartItems([]);
        setSubtotal(0);
        setTotal(shippingFee);
        setIsLoading(false);
        return;
      }

      // التحقق من صحة المنتجات قبل المتابعة
      const productIds = storedCart.map(item => item.product.id);
      let validCartItems = [];

      try {
        // جلب المنتجات من قاعدة البيانات للتحقق من وجودها
        const { data: productsResp } = await handleApiResponse<any>(fetch('/api/products'));
        const allProducts = Array.isArray(productsResp?.data?.data) ? productsResp.data.data : [];

        if (allProducts.length > 0) {
          // فلترة المنتجات الموجودة فقط
          const validItems = storedCart.filter(item =>
            allProducts.some((product: any) => product.id === item.product.id)
          );

          if (validItems.length !== storedCart.length) {
            console.warn(`تم العثور على ${storedCart.length - validItems.length} منتج غير صالح في السلة`);
          }

          validCartItems = validItems;
        } else {
          console.warn('فشل في التحقق من صحة المنتجات، استخدام البيانات المحلية');
          validCartItems = storedCart;
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('خطأ في التحقق من صحة المنتجات:', error);
        }
        validCartItems = storedCart;
      }

      // تنسيق عناصر السلة للواجهة
      const formattedCartItems = validCartItems.map(item => {
        const discount_percentage = item.product.discount_percentage || 0;
        const discount_price = discount_percentage > 0 ? item.product.price * (1 - discount_percentage / 100) : null;
        return {
        id: item.product.id,
        product_id: item.product.id,
        quantity: item.quantity,
        product: {
            ...item.product,
            discount_price,
        }
        };
      });

      setCartItems(formattedCartItems);

      // حساب المجموع الفرعي
      const calculatedSubtotal = formattedCartItems.reduce((sum, item) => {
        const price = item.product.discount_price || item.product.price;
        return sum + (price * item.quantity);
      }, 0);

      setSubtotal(calculatedSubtotal);

      // حساب إجمالي الخصم
      const calculatedDiscount = formattedCartItems.reduce((sum, item) => {
        if (item.product.discount_price && item.product.discount_price < item.product.price) {
          return sum + ((item.product.price - item.product.discount_price) * item.quantity);
        }
        return sum;
      }, 0);
      setTotalDiscount(calculatedDiscount);

      // حساب المجموع قبل الخصم
      const calculatedSubTotalBeforeDiscount = formattedCartItems.reduce((total, item) => {
        return total + item.product.price * item.quantity;
      }, 0);
      setSubTotalBeforeDiscount(calculatedSubTotalBeforeDiscount);

      // حساب الشحن باستخدام النظام المبسط
      await recalculateShipping(calculatedSubtotal);

    } catch (error) {
      console.error('Error fetching cart:', error);
      setError('فشل في جلب بيانات السلة');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchShippingSettings();
    fetchCartItems();
  }, [settings]);

  // إعادة حساب الشحن عند تغيير نوع التوصيل أو المجموع الفرعي
  useEffect(() => {
    if (subtotal > 0) {
      recalculateShipping(subtotal);
    }
  }, [deliveryType, subtotal]);

  useEffect(() => {
    function handleCartUpdated() {
      fetchCartItems();
    }
    window.addEventListener('cartUpdated', handleCartUpdated);
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdated);
    };
  }, []);

  // حفظ بيانات العنوان في التخزين المحلي
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAddress = localStorage.getItem('shipping-address');
      if (savedAddress) {
        try {
          const parsed = JSON.parse(savedAddress);
          setShippingAddress(prev => ({ ...prev, ...parsed }));
        } catch (error) {
          console.error('خطأ في قراءة بيانات العنوان المحفوظة:', error);
        }
      }
    }
  }, []);

  // حفظ بيانات العنوان عند التغيير
  useEffect(() => {
    if (typeof window !== 'undefined' && Object.values(shippingAddress).some(val => val.trim())) {
      const debounceTimer = setTimeout(() => {
        localStorage.setItem('shipping-address', JSON.stringify(shippingAddress));
      }, 1000);
      return () => clearTimeout(debounceTimer);
    }
  }, [shippingAddress]);

  // تحديث المجموع عند تغيير الشحن
  useEffect(() => {
    setTotal(subtotal + shippingFee);
  }, [subtotal, shippingFee]);

  // عند تغيير الحقول، قم بالتحقق من صحة البيانات
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // تحديث قيمة الحقل
    setShippingAddress(prev => ({ ...prev, [name]: value ?? '' }));

    // إزالة الحقل من قائمة الحقول الناقصة إذا تم ملؤه
    if (value?.trim()) {
      setMissingFields(prev => prev.filter(field => field !== name));
    }

    // مسح رسالة الخطأ إذا تم إكمال جميع الحقول المطلوبة
    const updatedAddress = { ...shippingAddress, [name]: value ?? '' };
    const requiredFields = deliveryType === 'shipping'
      ? ['fullName', 'phone', 'address', 'governorate']
      : ['fullName', 'phone'];
    const stillMissing = requiredFields.filter(f => !updatedAddress[f as keyof typeof updatedAddress]?.trim());

    setMissingFields(stillMissing);
    if (stillMissing.length === 0) {
      setError(null);
    }
  };

  // التحقق من اكتمال العنوان
  const isAddressComplete = () => {
    const { fullName, phone, address, governorate } = shippingAddress;

    if (deliveryType === 'pickup') {
      // For pickup, only name and phone are required + selected branch
      return fullName.trim() !== '' && phone.trim() !== '' && selectedBranch !== null;
    }

    // For shipping, all fields are required
    return fullName.trim() !== '' &&
           phone.trim() !== '' &&
           address.trim() !== '' &&
           governorate.trim() !== '';
  };

  // التحقق من صحة رقم الهاتف
  const isValidPhone = (phone: string) => {
    const phoneRegex = /^[0-9+\-\s()]{10,}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  // إكمال الطلب
  const handleCheckout = async () => {
    // تحقق من الحقول الناقصة
    const requiredFields = deliveryType === 'shipping'
      ? ['fullName', 'phone', 'address', 'governorate']
      : ['fullName', 'phone'];
    const newMissing = requiredFields.filter(f => !shippingAddress[f as keyof typeof shippingAddress]?.trim());
    setMissingFields(newMissing);

    // تحقق من صحة رقم الهاتف
    if (shippingAddress.phone && !isValidPhone(shippingAddress.phone)) {
      setError('يرجى إدخال رقم هاتف صحيح');
      return;
    }

    if (newMissing.length > 0) {
      setError('يرجى إكمال جميع الحقول المطلوبة');
      return;
    }

    // تحقق من اختيار الفرع في حالة الاستلام
    if (deliveryType === 'pickup' && !selectedBranch) {
      setError('يرجى اختيار فرع الاستلام');
      return;
    }

    if (cartItems.length === 0) {
      setError('السلة فارغة');
      router.push('/cart');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      // إعداد بيانات الطلب مع تنظيف البيانات
      const orderData: any = {
        customer_name: shippingAddress.fullName.trim(),
        customer_email: null,
        customer_phone: shippingAddress.phone.trim(),
        payment_method: paymentMethod,
        total: Math.round(total * 100) / 100,
        shipping_cost: Math.round(shippingFee * 100) / 100,
        delivery_type: deliveryType,
        notes: shippingAddress.notes.trim() || null,
        items: cartItems.map(item => ({
          product_id: item.product_id,
          product_name: item.product.name.trim(),
          product_image: item.product.image,
          quantity: item.quantity,
          price: Math.round((item.product.discount_price || item.product.price) * 100) / 100
        }))
      };

      // Add shipping-specific or pickup-specific fields
      if (deliveryType === 'shipping') {
        orderData.address = `${shippingAddress.address.trim()}, ${shippingAddress.governorate.trim()}`;
        orderData.governorate = shippingAddress.governorate.trim();
      } else {
        orderData.pickup_branch_id = selectedBranch?.id;
        orderData.address = `استلام من فرع: ${selectedBranch?.name}`;
        orderData.governorate = selectedBranch?.governorate || 'غير محدد';
      }

      console.log("📤 إرسال طلب جديد:", {
        ...orderData,
        customer_email: orderData.customer_email ? '[HIDDEN]' : null,
        customer_phone: '[HIDDEN]'
      });

      // إرسال الطلب إلى API
      const { data: result, error: orderError } = await handleApiResponse<any>(
        fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        })
      );

      if (orderError) {
        setError(orderError);
        setIsProcessing(false);
        return;
      }

      // مسح بيانات العنوان المحفوظة والسلة
      if (typeof window !== 'undefined') {
        localStorage.removeItem('shipping-address');
      }
      clearCart();
      setSuccess('تم إنشاء الطلب بنجاح! 🎉');

      // تحويل المستخدم مباشرة إلى صفحة النجاح مع كود الطلب
      const code = result?.order_number || result?.data?.order_number;
      if (code) {
        setTimeout(() => {
          setIsTransitioning(true);
          setTimeout(() => {
            router.push(`/orders/success?order=${code}`);
          }, 700); // مدة الأنيميشن
        }, 10000); // 10 ثوانٍ
      }

    } catch (error: unknown) {
      console.error('خطأ عام في عملية الدفع:', error);
      const message = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 relative">

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <div className="flex items-center text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600 transition-colors">الرئيسية</Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <Link href="/cart" className="hover:text-blue-600 transition-colors">السلة</Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-blue-600 font-medium">إتمام الطلب</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            إتمام طلبك
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            أكمل البيانات التالية لإتمام طلبك بأمان وسهولة
          </p>
        </div>

        {/* Error Messages */}
        {(error || missingFields.length > 0) && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-start gap-3 shadow-sm animate-pulse">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{missingFields.length > 0 ? 'يرجى إكمال جميع الحقول المطلوبة' : error}</p>
              {missingFields.length > 0 && (
                <ul className="mt-2 text-sm space-y-1">
                  {missingFields.map(field => (
                    <li key={field} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                      {{
                        fullName: 'الاسم الكامل',
                        phone: 'رقم الهاتف',
                        address: 'العنوان التفصيلي',
                        governorate: 'المحافظة'
                      }[field] || field}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {success && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center gap-3 shadow-sm animate-bounce">
            <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
            <div>
              <p className="font-medium">{success}</p>
              <p className="text-sm text-green-600 mt-1">سيتم تحويلك إلى صفحة تأكيد الطلب في غضون ثوانٍ...</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Form */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Form Header */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-6 border-b border-gray-200">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  بيانات الطلب
                </h2>
                <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">أدخل جميع البيانات المطلوبة لإتمام عملية الشراء</p>
              </div>

              {/* Form Content */}
              <form onSubmit={(e) => { e.preventDefault(); handleCheckout(); }} className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                {/* معلومات الشحن */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                    <Home className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    معلومات الشحن والتوصيل
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* الاسم الكامل */}
                    <FormField
                      label="الاسم الكامل"
                      icon={<User className="w-4 h-4 text-blue-600" />}
                      required
                      error={missingFields.includes('fullName') ? 'هذا الحقل مطلوب' : ''}
                    >
                      <input
                        type="text"
                        name="fullName"
                        value={shippingAddress.fullName}
                        onChange={handleAddressChange}
                        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border transition-all duration-200 ${
                          missingFields.includes('fullName')
                            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                            : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                        } outline-none`}
                        placeholder="أدخل اسمك الكامل"
                        required
                        ref={fullNameRef}
                      />
                    </FormField>

                    {/* رقم الهاتف */}
                    <FormField
                      label="رقم الهاتف"
                      icon={<Phone className="w-4 h-4 text-blue-600" />}
                      required
                      error={missingFields.includes('phone') ? 'هذا الحقل مطلوب' : ''}
                      hint="سيتم التواصل معك على هذا الرقم"
                    >
                      <input
                        type="tel"
                        name="phone"
                        value={shippingAddress.phone}
                        onChange={handleAddressChange}
                        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border transition-all duration-200 ${
                          missingFields.includes('phone')
                            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                            : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                        } outline-none`}
                        placeholder="01xxxxxxxxx"
                        pattern="[0-9+\-\s()]*"
                        onBlur={(e) => {
                          if (e.target.value && !isValidPhone(e.target.value)) {
                            setError('يرجى إدخال رقم هاتف صحيح');
                          }
                        }}
                        required
                        ref={phoneRef}
                      />
                    </FormField>

                    {/* المحافظة - Always show */}
                    <FormField
                      label="المحافظة"
                      icon={<MapPin className="w-4 h-4 text-blue-600" />}
                      required
                      error={missingFields.includes('governorate') ? 'هذا الحقل مطلوب' : ''}
                      hint="مثال: القاهرة، الجيزة، الإسكندرية"
                    >
                      <input
                        type="text"
                        name="governorate"
                        value={shippingAddress.governorate}
                        onChange={handleAddressChange}
                        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border transition-all duration-200 ${
                          missingFields.includes('governorate')
                            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                            : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                        } outline-none`}
                        placeholder="القاهرة"
                        required
                        ref={governorateRef}
                      />
                    </FormField>

                    {/* العنوان التفصيلي */}
                    {deliveryType === 'shipping' && (
                      <FormField
                        label="العنوان التفصيلي"
                        icon={<Home className="w-4 h-4 text-blue-600" />}
                        required
                        error={missingFields.includes('address') ? 'هذا الحقل مطلوب' : ''}
                        hint="رقم البناية، الشارع، الحي"
                      >
                        <input
                          type="text"
                          name="address"
                          value={shippingAddress.address}
                          onChange={handleAddressChange}
                          className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border transition-all duration-200 ${
                            missingFields.includes('address')
                              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                              : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                          } outline-none`}
                          placeholder="شارع 15، المعادي الجديدة"
                          required
                          ref={addressRef}
                        />
                      </FormField>
                    )}

                    {/* ملاحظات إضافية */}
                    <div className="md:col-span-2">
                      <FormField
                        label="ملاحظات إضافية (اختياري)"
                        icon={<MessageSquare className="w-4 h-4 text-blue-600" />}
                        hint="أي تعليمات خاصة للتوصيل"
                      >
                        <div className="relative">
                          <textarea
                            name="notes"
                            value={shippingAddress.notes}
                            onChange={(e) => setShippingAddress(prev => ({ ...prev, notes: e.target.value }))}
                            className="w-full py-2.5 sm:py-3 px-3 sm:px-4 text-sm sm:text-base rounded-lg sm:rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200 resize-none bg-gray-50 focus:bg-white"
                            placeholder="مثال: الرجاء الاتصال قبل التوصيل"
                            rows={3}
                            maxLength={500}
                          />
                          <div className="absolute bottom-3 left-3 pointer-events-none">
                            <span className="text-xs text-gray-400">{shippingAddress.notes.length}/500</span>
                          </div>
                        </div>
                      </FormField>
                    </div>
                  </div>
                </div>

                {/* طريقة الاستلام - Show if shipping OR pickup is enabled */}
                {shippingSettings && (shippingSettings.enabled || shippingSettings.pickup_enabled) && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                      <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      طريقة الاستلام
                    </h3>
                    <div className="space-y-3 sm:space-y-4">
                      {/* Shipping Option - Only show if shipping is enabled */}
                      {shippingSettings.enabled && (
                        <label className={`flex items-start p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          deliveryType === 'shipping'
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}>
                          <input
                            type="radio"
                            name="deliveryType"
                            value="shipping"
                            checked={deliveryType === 'shipping'}
                            onChange={() => setDeliveryType('shipping')}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center mr-2 sm:mr-3 mt-0.5 flex-shrink-0 ${
                            deliveryType === 'shipping'
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {deliveryType === 'shipping' && (
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm sm:text-base font-semibold text-gray-900">الشحن إلى العنوان</h4>
                            <p className="text-xs sm:text-sm text-gray-600">{shippingSettings.company_name || 'الشحن عبر شركة الشحن'}</p>

                            {/* عرض التكلفة ومدة التوصيل */}
                            <div className="mt-2 space-y-1">
                              {shippingSettings.cost_type === 'phone' ? (
                                <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                                  <Phone className="w-4 h-4 text-orange-600 flex-shrink-0" />
                                  <p className="text-sm text-orange-700">{shippingSettings.phone_message || 'سيتم تحديد التكلفة هاتفياً'}</p>
                                </div>
                              ) : (
                                <>
                                  {shippingMessage && (
                                    <div className="flex items-center gap-2 text-xs text-blue-600">
                                      <CheckCircle className="w-3 h-3" />
                                      <span className="font-medium">{shippingMessage}</span>
                                    </div>
                                  )}
                                  {!shippingMessage && shippingFee > 0 && (
                                    <div className="text-xs text-gray-600">
                                      التكلفة: <span className="font-semibold text-blue-600">{formatPrice(shippingFee)} {currency}</span>
                                    </div>
                                  )}
                                </>
                              )}

                              {deliveryTime && (
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <Clock className="w-3 h-3" />
                                  <span>التوصيل خلال {deliveryTime}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {deliveryType === 'shipping' && (
                            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          )}
                        </label>
                      )}

                      {/* Pickup Option */}
                      {shippingSettings.pickup_enabled && (
                        <label className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          deliveryType === 'pickup'
                            ? 'border-green-500 bg-green-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}>
                          <input
                            type="radio"
                            name="deliveryType"
                            value="pickup"
                            checked={deliveryType === 'pickup'}
                            onChange={() => setDeliveryType('pickup')}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 ${
                            deliveryType === 'pickup'
                              ? 'border-green-500 bg-green-500'
                              : 'border-gray-300'
                          }`}>
                            {deliveryType === 'pickup' && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">استلام من الفرع</h4>
                            <p className="text-sm text-gray-600">استلم طلبك من أحد فروعنا</p>
                            <div className="mt-2">
                              <div className="flex items-center gap-2 text-xs text-green-600">
                                <CheckCircle className="w-3 h-3" />
                                <span className="font-medium">بدون رسوم شحن - مجاناً</span>
                              </div>
                            </div>
                          </div>
                          {deliveryType === 'pickup' && (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          )}
                        </label>
                      )}
                    </div>

                    {/* Branch Selector - Show only when pickup is selected */}
                    {deliveryType === 'pickup' && (
                      <div className="mt-4">
                        <SimpleBranchSelector
                          selectedBranchId={selectedBranch?.id}
                          onSelectBranch={setSelectedBranch}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* طريقة الدفع */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    طريقة الدفع
                  </h3>
                  <div className="space-y-3">
                    <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      paymentMethod === 'cash'
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={() => setPaymentMethod('cash')}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
                        paymentMethod === 'cash'
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {paymentMethod === 'cash' && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">الدفع عند الاستلام</h4>
                          <p className="text-sm text-gray-600">ادفع نقداً عند وصول طلبك</p>
                          <div className="flex items-center gap-2 mt-1 text-sm">
                            <Shield className="w-4 h-4 text-green-600" />
                            <span className="text-green-600">آمن ومضمون</span>
                            <span className="text-gray-400">•</span>
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-500">فحص المنتج قبل الدفع</span>
                          </div>
                        </div>
                      </div>
                      {paymentMethod === 'cash' && (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </label>
                  </div>
                </div>

                {/* زر التأكيد */}
                <div className="pt-4 sm:pt-6">
                  <AnimatedOrderButton
                    isLoading={isProcessing}
                    isSuccess={!!success}
                    disabled={isProcessing || !isAddressComplete()}
                    onClick={handleCheckout}
                    className="w-full text-sm sm:text-base py-3 sm:py-4"
                  >
                    {isProcessing ? 'جاري معالجة الطلب...' : 'تأكيد الطلب الآن'}
                  </AnimatedOrderButton>
                </div>
              </form>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="xl:col-span-1">
            <EnhancedOrderSummary
              cartItems={cartItems}
              subtotal={subtotal}
              totalDiscount={totalDiscount}
              shippingFee={shippingFee}
              total={total}
              currency={currency}
              freeShippingThreshold={freeShippingMin}
              freeShippingEnabled={freeShippingEnabled}
              shippingType={shippingType}
              shippingMessage={shippingMessage}
            />

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">معاملاتك آمنة ومحمية</p>
                  <p className="text-blue-700">
                    جميع بياناتك الشخصية محمية بأعلى معايير الأمان. نحن لا نشارك أي معلومات مع أطراف ثالثة.
                  </p>
                </div>
              </div>
            </div>

            {/* Terms Notice */}
            <p className="text-xs text-gray-500 mt-4 text-center leading-relaxed">
              بالمتابعة في عملية الشراء، أنت توافق على
              <Link href="/terms" className="text-blue-600 mx-1 hover:underline font-medium">
                الشروط والأحكام
              </Link>
              و
              <Link href="/privacy" className="text-blue-600 mx-1 hover:underline font-medium">
                سياسة الخصوصية
              </Link>
              الخاصة بنا.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}