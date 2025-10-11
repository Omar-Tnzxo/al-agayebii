"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Minus, Trash2, ShoppingCart, ArrowRight, Truck, Gift, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { getCart, updateCartItemQuantity, removeFromCart } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils/helpers";
import { useSiteSettings } from "@/app/components/SiteSettingsProvider";
import { calculateShipping } from "@/lib/store/shipping";
import type { CartItem } from "@/lib/types";

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subTotal, setSubTotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingType, setShippingType] = useState<'fixed' | 'free' | 'phone' | 'pickup' | 'disabled'>('fixed');
  const [shippingMessage, setShippingMessage] = useState('');
  const router = useRouter();
  const { settings } = useSiteSettings();
  const currency = settings.currencySymbol || 'ج.م';

  // جلب السلة
  async function fetchCartItems() {
    setIsLoading(true);
    setError(null);
    try {
      const storedCart = getCart();
      if (storedCart.length > 0) {
        const formattedCartItems = storedCart
          .filter(item => !!item.product.slug && /^[a-z0-9\-]+$/.test(item.product.slug))
          .map(item => ({ ...item }));
        setCartItems(formattedCartItems);
      } else {
        setCartItems([]);
      }
    } catch (err: any) {
      setError("حدث خطأ أثناء تحميل سلة التسوق، يرجى المحاولة لاحقًا.");
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchCartItems();
  }, []);

  useEffect(() => {
    function handleCartUpdated() {
      fetchCartItems();
    }
    window.addEventListener('cartUpdated', handleCartUpdated);
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdated);
    };
  }, []);

  // حساب المجاميع
  useEffect(() => {
    async function calculateTotals() {
      // حساب المجموع بعد الخصم
      const calculatedSubTotal = cartItems.reduce((total, item) => {
        const discount_percentage = typeof item.product.discount_percentage === "number"
          ? item.product.discount_percentage
          : (item.product.discount_percentage ? Number(item.product.discount_percentage) : 0);
        const discount_price = discount_percentage > 0
          ? Number(item.product.price) * (1 - discount_percentage / 100)
          : null;
        const price = discount_price ?? item.product.price;
        return total + price * item.quantity;
      }, 0);
      setSubTotal(calculatedSubTotal);

      // حساب الخصم الإجمالي
      const calculatedDiscount = cartItems.reduce((sum, item) => {
        const discount_percentage = typeof item.product.discount_percentage === "number"
          ? item.product.discount_percentage
          : (item.product.discount_percentage ? Number(item.product.discount_percentage) : 0);
        const discount_price = discount_percentage > 0
          ? Number(item.product.price) * (1 - discount_percentage / 100)
          : null;
        if (discount_price !== null && discount_price < item.product.price) {
          return sum + (item.product.price - discount_price) * item.quantity;
        }
        return sum;
      }, 0);
      setTotalDiscount(calculatedDiscount);

      // حساب الشحن باستخدام النظام الموحد
      try {
        const shippingCalculation = await calculateShipping(calculatedSubTotal);
        setShippingCost(shippingCalculation.cost);
        setShippingType(shippingCalculation.type);
        setShippingMessage(shippingCalculation.message || '');
        setTotal(calculatedSubTotal + shippingCalculation.cost);
      } catch (error) {
        console.error('خطأ في حساب الشحن:', error);
        setShippingCost(0);
        setShippingType('fixed');
        setTotal(calculatedSubTotal);
      }
    }

    if (cartItems.length > 0) {
      calculateTotals();
    } else {
      setSubTotal(0);
      setTotalDiscount(0);
      setShippingCost(0);
      setTotal(0);
    }
  }, [cartItems]);

  // تحكم الكمية
  const handleQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    const item = cartItems.find(item => item.product.id === productId);
    if (!item) return;
    if (newQuantity > (item.product.stock_quantity ?? 1)) {
      setError(`الكمية المطلوبة غير متوفرة. المتاح: ${item.product.stock_quantity ?? 1}`);
      setTimeout(() => setError(null), 3000);
      return;
    }
    updateCartItemQuantity(productId, newQuantity);
    setCartItems(cartItems.map(item =>
      item.product.id === productId ? { ...item, quantity: newQuantity } : item
    ));
  };

  // حذف منتج
  const handleRemove = (productId: string) => {
    removeFromCart(productId);
    setCartItems(cartItems.filter(item => item.product.id !== productId));
  };

  // الذهاب للدفع
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      setError("سلة التسوق فارغة");
      return;
    }
    router.push("/checkout");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <ShoppingCart className="w-8 h-8 text-primary" />
            </div>
            سلة التسوق
            {cartItems.length > 0 && (
              <span className="text-lg text-gray-500 font-normal">
                ({cartItems.length} {cartItems.length === 1 ? 'منتج' : 'منتجات'})
              </span>
            )}
          </h1>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-gray-600">جاري تحميل السلة...</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="inline-flex p-6 bg-gray-100 rounded-full mb-6">
              <ShoppingCart className="w-16 h-16 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">سلة التسوق فارغة</h2>
            <p className="text-gray-600 mb-8">ابدأ التسوق الآن واكتشف منتجاتنا المميزة!</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <ArrowRight className="w-5 h-5" />
              تصفح المنتجات
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* قائمة المنتجات */}
            <div className="lg:col-span-2 space-y-4">
              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-shake">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">{error}</span>
                </div>
              )}

              <div className="space-y-3">
                {cartItems.map(item => {
                  const discount_percentage = typeof item.product.discount_percentage === "number"
                    ? item.product.discount_percentage
                    : (item.product.discount_percentage ? Number(item.product.discount_percentage) : 0);
                  const discount_price = discount_percentage > 0
                    ? Number(item.product.price) * (1 - discount_percentage / 100)
                    : null;
                  const images = (item.product as any).images;
                  const imageUrl = (Array.isArray(images) && images[0]?.image_url) || item.product.image || '/images/placeholder.jpg';
                  const finalPrice = discount_price ?? item.product.price;

                  return (
                    <div
                      key={item.product.id}
                      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-4 border border-gray-100"
                    >
                      <div className="flex gap-4">
                        {/* صورة المنتج */}
                        <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                          <Image
                            src={imageUrl}
                            alt={item.product.name}
                            fill
                            sizes="96px"
                            className="object-cover"
                            priority
                          />
                          {discount_percentage > 0 && (
                            <div className="absolute top-1 left-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded shadow-lg">
                              -{discount_percentage}%
                            </div>
                          )}
                        </div>

                        {/* تفاصيل المنتج */}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/product/${item.product.slug}`}
                            className="font-bold text-gray-900 hover:text-primary transition-colors line-clamp-2 mb-2 block"
                            title={item.product.name}
                          >
                            {item.product.name}
                          </Link>

                          {/* السعر */}
                          <div className="flex items-center gap-2 mb-3">
                            {discount_price !== null && discount_price < item.product.price ? (
                              <>
                                <span className="text-xl font-bold text-green-600">
                                  {formatPrice(discount_price)} {currency}
                                </span>
                                <span className="text-sm line-through text-gray-400">
                                  {formatPrice(item.product.price)} {currency}
                                </span>
                              </>
                            ) : (
                              <span className="text-xl font-bold text-gray-900">
                                {formatPrice(item.product.price)} {currency}
                              </span>
                            )}
                          </div>

                          {/* الكمية والإجمالي */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleQuantity(item.product.id, item.quantity - 1)}
                                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={item.quantity <= 1}
                                aria-label="تقليل الكمية"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-12 text-center font-bold text-gray-900">{item.quantity}</span>
                              <button
                                onClick={() => handleQuantity(item.product.id, item.quantity + 1)}
                                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                aria-label="زيادة الكمية"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-left">
                                <div className="text-xs text-gray-500">الإجمالي</div>
                                <div className="font-bold text-lg text-primary">
                                  {formatPrice(finalPrice * item.quantity)} {currency}
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemove(item.product.id)}
                                className="w-9 h-9 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors"
                                aria-label="حذف المنتج"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* المخزون */}
                          {item.product.stock_quantity !== undefined && (
                            <div className="mt-2 text-xs">
                              <span className={item.product.stock_quantity > 0 ? "text-green-600" : "text-red-600"}>
                                {item.product.stock_quantity > 0
                                  ? `متوفر: ${item.product.stock_quantity}`
                                  : "غير متوفر"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ملخص الطلب */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden sticky top-4">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    ملخص الطلب
                  </h3>
                </div>

                {/* الملخص */}
                <div className="p-6 space-y-4">
                  {/* المجموع الفرعي */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">المجموع الفرعي</span>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(subTotal + totalDiscount)} {currency}
                    </span>
                  </div>

                  {/* الخصم */}
                  {totalDiscount > 0 && (
                    <div className="flex justify-between items-center text-sm text-green-600">
                      <span className="flex items-center gap-1">
                        <Gift className="w-4 h-4" />
                        الخصم
                      </span>
                      <span className="font-semibold">
                        -{formatPrice(totalDiscount)} {currency}
                      </span>
                    </div>
                  )}

                  {/* الشحن - Only show if not completely disabled */}
                  {!(shippingType === 'disabled' && shippingMessage?.includes('معطلة حالياً')) && (
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-1 text-gray-600">
                          <Truck className="w-4 h-4" />
                          الشحن
                        </span>
                        <span className={`font-semibold ${shippingType === 'free' ? 'text-green-600' : shippingType === 'phone' ? 'text-orange-600' : 'text-gray-900'}`}>
                          {shippingType === 'free' ? (
                            <span className="flex items-center gap-1">
                              <Gift className="w-4 h-4" />
                              مجاني
                            </span>
                          ) : shippingType === 'phone' ? (
                            'يحدد هاتفياً'
                          ) : shippingType === 'disabled' ? (
                            'غير متاح'
                          ) : (
                            `${formatPrice(shippingCost)} ${currency}`
                          )}
                        </span>
                      </div>

                      {/* رسالة الشحن */}
                      {shippingMessage && (
                        <div className={`text-xs p-3 rounded-lg ${
                          shippingType === 'free' ? 'bg-green-50 text-green-700' :
                          shippingType === 'phone' ? 'bg-orange-50 text-orange-700' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          {shippingMessage}
                        </div>
                      )}
                    </>
                  )}

                  <hr className="border-gray-200" />

                  {/* المجموع النهائي */}
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">المجموع النهائي</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(total)} {currency}
                    </span>
                  </div>

                  {/* زر الدفع */}
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-primary text-white py-4 rounded-xl text-base font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none"
                    disabled={cartItems.length === 0}
                  >
                    متابعة إلى الدفع
                  </button>

                  {/* مواصلة التسوق */}
                  <Link
                    href="/products"
                    className="block text-center text-primary hover:text-primary/80 text-sm font-medium py-2 transition-colors"
                  >
                    <ArrowRight className="inline w-4 h-4 ml-1" />
                    مواصلة التسوق
                  </Link>

                  {/* ملاحظة */}
                  <p className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
                    جميع الأسعار شاملة الضرائب المطبقة
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
