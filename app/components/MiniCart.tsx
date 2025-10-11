import { Fragment, useEffect, useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ShoppingCart, X, ArrowRight, Truck, Gift } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getCart, updateCartItemQuantity, removeFromCart } from '@/lib/store/cart';
import { formatPrice } from '@/lib/utils/helpers';
import { OrderSummaryCard } from './OrderSummaryCard';
import { useSiteSettings } from '@/app/components/SiteSettingsProvider';
import { calculateShipping } from '@/lib/store/shipping';

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MiniCart({ isOpen, onClose }: MiniCartProps) {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [subTotal, setSubTotal] = useState(0);
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [subTotalBeforeDiscount, setSubTotalBeforeDiscount] = useState(0);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [shippingType, setShippingType] = useState<'fixed' | 'free' | 'phone' | 'pickup' | 'disabled'>('fixed');
  const [shippingMessage, setShippingMessage] = useState<string>('');
  const { settings } = useSiteSettings();
  const currency = settings.currencySymbol || 'ج.م';

  useEffect(() => {
    if (isOpen) {
      refreshCart();
    }
  }, [isOpen]);

  // إضافة مستمع cartUpdated لمزامنة السلة في الوقت الحقيقي
  useEffect(() => {
    if (!isOpen) return;
    function handleCartUpdated() {
      refreshCart();
    }
    window.addEventListener('cartUpdated', handleCartUpdated);
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdated);
    };
  }, [isOpen]);

  // تحديث السلة محلياً بعد أي تغيير
  async function refreshCart() {
    const items = getCart();
    setCartItems(items);

    // حساب المجموع بعد الخصم
    const total = items.reduce((sum: number, item: any) => {
      const discount_percentage = typeof item.product.discount_percentage === 'number'
        ? item.product.discount_percentage
        : (item.product.discount_percentage ? Number(item.product.discount_percentage) : 0);
      const discount_price = discount_percentage > 0
        ? Number(item.product.price) * (1 - discount_percentage / 100)
        : null;
      const price = discount_price ?? item.product.price;
      return sum + price * item.quantity;
    }, 0);
    setSubTotal(total);

    // حساب المجموع قبل الخصم
    const totalBeforeDiscount = items.reduce((sum: number, item: any) => {
      return sum + Number(item.product.price) * item.quantity;
    }, 0);
    setSubTotalBeforeDiscount(totalBeforeDiscount);

    // حساب الشحن باستخدام النظام الموحد
    try {
      const shippingCalculation = await calculateShipping(total);
      setShippingCost(shippingCalculation.cost);
      setShippingType(shippingCalculation.type);
      setShippingMessage(shippingCalculation.message || '');
    } catch (error) {
      console.error('خطأ في حساب الشحن:', error);
      setShippingCost(0);
      setShippingType('fixed');
    }
  }

  // تعديل الكمية
  function handleQuantity(productId: string, newQuantity: number) {
    if (newQuantity < 1) return;
    updateCartItemQuantity(productId, newQuantity);
    setAnimatingId(productId);
    setTimeout(() => setAnimatingId(null), 300);
    refreshCart();
  }

  // حذف منتج
  function handleRemove(productId: string) {
    removeFromCart(productId);
    setAnimatingId(productId);
    setTimeout(() => setAnimatingId(null), 300);
    refreshCart();
  }

  // Swipe to close handlers (mobile)
  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      setIsSwiping(true);
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isSwiping || touchStartX.current === null) return;
    const deltaX = e.touches[0].clientX - touchStartX.current;
    if (deltaX > 0) {
      setSwipeOffset(Math.min(deltaX, 120));
    }
  }

  function handleTouchEnd() {
    if (swipeOffset > 80) {
      setSwipeOffset(0);
      setIsSwiping(false);
      onClose();
    } else {
      setSwipeOffset(0);
      setIsSwiping(false);
    }
  }

  // حساب الخصم الإجمالي
  const discount = cartItems.reduce((sum, item) => {
    const discount_percentage = typeof item.product.discount_percentage === 'number'
      ? item.product.discount_percentage
      : (item.product.discount_percentage ? Number(item.product.discount_percentage) : 0);
    if (discount_percentage > 0) {
      const d = (item.product.price * discount_percentage / 100) * item.quantity;
      return sum + d;
    }
    return sum;
  }, 0);

  const total = subTotal + shippingCost;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose} dir="rtl">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" aria-hidden="true" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel
                  ref={panelRef}
                  className="w-screen max-w-md bg-white shadow-xl h-full flex flex-col touch-pan-y"
                  style={{
                    transform: swipeOffset ? `translateX(${swipeOffset}px)` : undefined,
                    transition: isSwiping ? 'none' : 'transform 0.2s cubic-bezier(0.4,0,0.2,1)',
                  }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-6 h-6 text-primary" />
                      <Dialog.Title className="text-lg font-bold text-primary">سلة التسوق</Dialog.Title>
                      {cartItems.length > 0 && (
                        <span className="bg-primary text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                          {cartItems.length}
                        </span>
                      )}
                    </div>
                    <button
                      className="p-2 rounded-full hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                      onClick={onClose}
                      aria-label="إغلاق السلة"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Cart Items */}
                  <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4">
                    {cartItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-16 text-gray-500">
                        <ShoppingCart className="w-20 h-20 mb-4 text-gray-300" />
                        <span className="text-lg font-bold text-gray-700">سلة التسوق فارغة</span>
                        <span className="text-sm text-gray-500 mt-2">ابدأ التسوق الآن وأضف منتجاتك المفضلة!</span>
                        <Link
                          href="/products"
                          className="mt-6 inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg shadow-lg hover:bg-primary/90 transition-all text-base font-semibold"
                          onClick={onClose}
                        >
                          <ArrowRight className="w-5 h-5" />
                          تصفح المنتجات
                        </Link>
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {cartItems.map((item: any) => {
                          const discount_percentage = typeof item.product.discount_percentage === 'number'
                            ? item.product.discount_percentage
                            : (item.product.discount_percentage ? Number(item.product.discount_percentage) : 0);
                          const discount_price = discount_percentage > 0
                            ? Number(item.product.price) * (1 - discount_percentage / 100)
                            : null;
                          const images = (item.product as any).images;
                          const imageUrl = (Array.isArray(images) && images[0]?.image_url) || item.product.image || '/images/placeholder.jpg';
                          const isAnimating = animatingId === item.product.id;
                          return (
                            <li
                              key={item.product.id}
                              className={`flex items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-100 p-3 transition-all duration-300 hover:shadow-md ${isAnimating ? 'ring-2 ring-primary/40 scale-[1.02]' : ''}`}
                            >
                              {/* صورة المنتج */}
                              <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                <Image src={imageUrl} alt={item.product.name} fill sizes="64px" className="object-cover" />
                              </div>

                              {/* تفاصيل المنتج */}
                              <div className="flex-1 flex flex-col gap-1 min-w-0">
                                <Link
                                  href={`/product/${item.product.slug}`}
                                  className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 hover:text-primary transition-colors"
                                  title={item.product.name}
                                  onClick={onClose}
                                >
                                  {item.product.name}
                                </Link>

                                {/* السعر والخصم */}
                                <div className="flex items-center gap-2">
                                  {discount_price !== null && discount_price < item.product.price ? (
                                    <>
                                      <span className="text-green-600 font-bold text-base">{formatPrice(discount_price)} {currency}</span>
                                      <span className="line-through text-xs text-gray-400">{formatPrice(item.product.price)} {currency}</span>
                                    </>
                                  ) : (
                                    <span className="text-primary font-bold text-base">{formatPrice(item.product.price)} {currency}</span>
                                  )}
                                </div>

                                {/* الكمية والإجمالي */}
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <span>الكمية: {item.quantity}</span>
                                  <span className="text-gray-400">•</span>
                                  <span className="font-semibold text-primary">
                                    الإجمالي: {formatPrice((discount_price ?? item.product.price) * item.quantity)} {currency}
                                  </span>
                                </div>
                              </div>

                              {/* أزرار التحكم */}
                              <div className="flex flex-col items-center gap-1">
                                <button
                                  className="w-7 h-7 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary font-bold transition-all active:scale-95"
                                  aria-label="زيادة الكمية"
                                  onClick={() => handleQuantity(item.product.id, item.quantity + 1)}
                                >
                                  +
                                </button>
                                <span className="text-sm font-bold text-gray-900 min-w-[20px] text-center">{item.quantity}</span>
                                <button
                                  className="w-7 h-7 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                  aria-label="تقليل الكمية"
                                  onClick={() => handleQuantity(item.product.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                >
                                  -
                                </button>
                                <button
                                  className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-500 flex items-center justify-center mt-1 transition-all active:scale-95"
                                  aria-label="حذف المنتج"
                                  onClick={() => handleRemove(item.product.id)}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  {/* Footer - ملخص الطلب */}
                  {cartItems.length > 0 && (
                    <div className="border-t border-gray-200 bg-gray-50">
                      {/* الملخص والأزرار */}
                      <div className="px-4 py-4">
                        <OrderSummaryCard
                          subTotal={subTotal}
                          discount={discount}
                          shipping={shippingCost}
                          total={total}
                          freeShippingEnabled={false}
                          freeShippingMessage=""
                          shippingType={shippingType}
                          shippingMessage={shippingMessage}
                          cta={
                            <div className="flex gap-2 mt-4">
                              <Link
                                href="/cart"
                                className="flex-1 inline-flex items-center justify-center gap-2 bg-white border-2 border-primary text-primary px-4 py-3 rounded-lg font-bold text-sm hover:bg-primary/5 transition-all"
                                onClick={onClose}
                              >
                                <ShoppingCart className="w-5 h-5" />
                                عرض السلة
                              </Link>
                              <Link
                                href="/checkout"
                                className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-white px-4 py-3 rounded-lg font-bold text-sm hover:bg-primary/90 transition-all shadow-lg"
                                onClick={onClose}
                              >
                                إتمام الطلب
                                <ArrowRight className="w-5 h-5" />
                              </Link>
                            </div>
                          }
                          currency={currency}
                        />
                      </div>
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
