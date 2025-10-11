import type { Product } from '@/lib/types';
import { 
  getSelectedShippingCompany, 
  setSelectedShippingCompany,
  calculateSelectedShippingCost,
  getDefaultShippingCompany
} from './shipping';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
  shippingCost: number;
  shippingCompany: string;
}

// مفاتيح التخزين المحلي
const CART_STORAGE_KEY = 'alagayebi_cart';
const CART_EXPIRY_KEY = 'alagayebi_cart_expiry';

// مدة انتهاء صلاحية السلة (7 أيام)
const CART_EXPIRY_DAYS = 7;

/**
 * تحديث تاريخ انتهاء الصلاحية للسلة
 */
function updateCartExpiry() {
  if (typeof window !== 'undefined') {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + CART_EXPIRY_DAYS);
    localStorage.setItem(CART_EXPIRY_KEY, expiryDate.toISOString());
  }
}

/**
 * جلب السلة من التخزين المحلي مع التحقق من الصلاحية
 * إذا انتهت الصلاحية، يتم حذف السلة فوراً
 */
export function getCart(): CartItem[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const expiry = localStorage.getItem(CART_EXPIRY_KEY);
    if (expiry && new Date() > new Date(expiry)) {
      clearCart();
      // يمكن هنا إظهار إشعار للمستخدم إذا رغبت
      return [];
    }
    const cartData = localStorage.getItem(CART_STORAGE_KEY);
    if (!cartData) {
      return [];
    }
    const cart: Cart = JSON.parse(cartData);
    return cart.items || [];
  } catch {
    return [];
  }
}

/**
 * حفظ السلة وتحديث تاريخ الانتهاء
 */
function saveCart(cart: Cart) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartExpiry();
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
  }
}

/**
 * إعادة حساب إجمالي السلة مع الشحن
 */
export async function recalculateCart(items: CartItem[]): Promise<Cart> {
  const subtotal = items.reduce((sum, item) => {
    const itemPrice = item.product.price * (item.product.stock || 1);
    return sum + (itemPrice * item.quantity);
  }, 0);
  
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // حساب سعر الشحن
  const shippingCost = await calculateSelectedShippingCost(subtotal);
  const shippingCompany = getSelectedShippingCompany();
  
  return { 
    items, 
    total: subtotal + shippingCost, 
    itemCount,
    shippingCost,
    shippingCompany
  };
}

/**
 * إضافة منتج إلى السلة مع تطبيق شركة الشحن الافتراضية
 */
export async function addToCart(product: Product, quantity: number = 1): Promise<Cart> {
  const currentCart = getCart();
  
  // البحث عن المنتج في السلة
  const existingItemIndex = currentCart.findIndex(
    item => item.product.id === product.id
  );
  
  let updatedItems: CartItem[];
  
  if (existingItemIndex >= 0) {
    // تحديث الكمية للمنتج الموجود
    updatedItems = currentCart.map((item, index) => 
      index === existingItemIndex 
        ? { ...item, quantity: item.quantity + quantity }
        : item
    );
  } else {
    // إضافة منتج جديد
    updatedItems = [...currentCart, { product, quantity }];
  }
  
  // إذا لم يتم اختيار شركة شحن، اختر الشركة الافتراضية
  if (!getSelectedShippingCompany()) {
    const defaultCompany = await getDefaultShippingCompany();
    if (defaultCompany) {
      setSelectedShippingCompany(defaultCompany.name);
    }
  }
  
  const updatedCart = await recalculateCart(updatedItems);
  saveCart(updatedCart);
  
  // إرسال حدث تحديث السلة
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: updatedCart }));
  }
  
  return updatedCart;
}

/**
 * تحديث كمية منتج في السلة
 */
export async function updateCartItemQuantity(productId: string, quantity: number): Promise<Cart> {
  const currentCart = getCart();
  
  let updatedItems: CartItem[];
  
  if (quantity <= 0) {
    // إزالة المنتج إذا كانت الكمية صفر أو أقل
    updatedItems = currentCart.filter(item => item.product.id !== productId);
  } else {
    // تحديث الكمية
    updatedItems = currentCart.map(item =>
      item.product.id === productId 
        ? { ...item, quantity }
        : item
    );
  }
  
  const updatedCart = await recalculateCart(updatedItems);
  saveCart(updatedCart);
  
  // إرسال حدث تحديث السلة
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: updatedCart }));
  }
  
  return updatedCart;
}

/**
 * إزالة منتج من السلة
 */
export async function removeFromCart(productId: string): Promise<Cart> {
  const currentCart = getCart();
  
  const updatedItems = currentCart.filter(
    item => item.product.id !== productId
  );
  
  const updatedCart = await recalculateCart(updatedItems);
  saveCart(updatedCart);
  
  // إرسال حدث تحديث السلة
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: updatedCart }));
  }
  
  return updatedCart;
}

/**
 * مسح السلة بالكامل
 */
export function clearCart(): Cart {
  const emptyCart = { 
    items: [], 
    total: 0, 
    itemCount: 0,
    shippingCost: 0,
    shippingCompany: ''
  };
  
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(CART_EXPIRY_KEY);
    
    // إرسال حدث تحديث السلة
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: emptyCart }));
  }
  
  return emptyCart;
}

/**
 * التحقق من وجود منتج في السلة
 */
export function isProductInCart(productId: string): boolean {
  const currentCart = getCart();
  return currentCart.some(item => item.product.id === productId);
}

/**
 * الحصول على كمية منتج معين في السلة
 */
export function getProductQuantityInCart(productId: string): number {
  const currentCart = getCart();
  const item = currentCart.find(item => item.product.id === productId);
  return item ? item.quantity : 0;
}

/**
 * حساب الضريبة (يمكن تخصيصها حسب البلد)
 */
export function calculateTax(subtotal: number): number {
  // ضريبة القيمة المضافة 14% في مصر
  return subtotal * 0.14;
}

/**
 * حساب الشحن (محدث ليدعم شركات الشحن)
 */
export async function calculateShipping(subtotal: number): Promise<number> {
  return await calculateSelectedShippingCost(subtotal);
}

/**
 * حساب إجمالي الطلب مع الضريبة والشحن
 */
export async function calculateOrderTotal(subtotal: number): Promise<{
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingCompany: string;
}> {
  const tax = calculateTax(subtotal);
  const shipping = await calculateShipping(subtotal);
  const shippingCompany = getSelectedShippingCompany();
  
  return {
    subtotal,
    tax,
    shipping,
    total: subtotal + tax + shipping,
    shippingCompany
  };
}

/**
 * تحويل السلة إلى بيانات الطلب
 */
export async function cartToOrderData(cart: Cart, customerInfo: any) {
  const orderTotal = await calculateOrderTotal(cart.total - cart.shippingCost);
  
  return {
    customer_name: customerInfo.fullName,
    customer_phone: customerInfo.phone,
    customer_email: customerInfo.email,
    address: customerInfo.address,
    governorate: customerInfo.state,
    payment_method: customerInfo.paymentMethod,
    total: orderTotal.total,
    shipping_cost: orderTotal.shipping,
    shipping_company: orderTotal.shippingCompany,
    items: cart.items.map(item => ({
      product_id: item.product.id,
      product_name: item.product.name,
      product_image: item.product.image,
      quantity: item.quantity,
      price: item.product.price
    }))
  };
} 