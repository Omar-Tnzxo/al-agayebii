import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * دمج أصناف Tailwind بشكل صحيح
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * تنسيق سعر المنتج بالجنيه المصري
 * - إذا كان الرقم صحيح (مثل 100) يظهر بدون أصفار عشرية
 * - إذا كان الرقم عشري (مثل 100.50) يظهر الجزء العشري
 * - الأرقام بالإنجليزية (1234 بدلاً من ١٢٣٤)
 */
export function formatPrice(price: number): string {
  // التحقق من أن القيمة رقم صحيح
  if (Number.isInteger(price)) {
    return price.toLocaleString('en-US');
  }
  
  // إذا كان عشري، نعرض رقمين عشريين فقط
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * تنسيق رقم الطلب بصيغة #0000
 */
export function formatOrderId(id: string | number): string {
  const idStr = String(id);
  return `ORD-${idStr.padStart(8, '0')}`;
}

/**
 * تنسيق رقم المنتج بصيغة *0000
 */
export function formatProductId(id: string | number): string {
  const idStr = String(id);
  return `#${idStr.padStart(6, '0')}`;
}

/**
 * دالة مساعدة لحساب hash code لنص
 */
function hashCode(str: string): number {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

/**
 * إنشاء رابط واتساب مع رسالة مخصصة
 */
export function createWhatsAppLink(
  phoneNumber: string, 
  message: string, 
  orderDetails?: any
): string {
  // تنظيف رقم الهاتف
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  // إنشاء رسالة مفصلة
  let fullMessage = message;
  
  if (orderDetails) {
    fullMessage += `\n\nتفاصيل الطلب:\n`;
    fullMessage += `رقم الطلب: ${formatOrderId(orderDetails.id)}\n`;
    fullMessage += `اسم العميل: ${orderDetails.customer_name}\n`;
    fullMessage += `المبلغ: ${formatPrice(orderDetails.total)} ج.م\n`;
    fullMessage += `التاريخ: ${new Date(orderDetails.created_at).toLocaleDateString('ar-EG')}`;
  }
  
  // ترميز الرسالة للـ URL
  const encodedMessage = encodeURIComponent(fullMessage);
  
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * تنسيق حالة الطلب باللغة العربية
 */
export function formatOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'قيد الانتظار',
    'confirmed': 'مؤكد',
    'processing': 'قيد التحضير',
    'shipped': 'تم الشحن',
    'delivered': 'تم التسليم',
    'cancelled': 'ملغي',
    'refunded': 'مسترد',
  };
  
  return statusMap[status] || status;
}

/**
 * تنسيق حالة الدفع
 */
export function formatPaymentStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'قيد الانتظار',
    'paid': 'مدفوع',
    'failed': 'فشل',
    'refunded': 'مسترد',
    'cancelled': 'ملغي',
  };
  
  return statusMap[status] || status;
}

/**
 * تنسيق التاريخ بالعربية
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

/**
 * تنسيق الوقت فقط
 */
export function formatTime(dateStr: string | Date): string {
  const date = new Date(dateStr);
  
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * تأخير تنفيذ الدالة (مفيد للتحكم في معدل التنفيذ)
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * تحميل الصور مسبقًا لتحسين الأداء
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject("لا يمكن تحميل الصور في بيئة الخادم");
      return;
    }
    
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * تنسيق التواريخ بالعربية
 */
export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(dateObj);
}

/**
 * تقصير النص
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * تحويل slug إلى نص قابل للقراءة
 */
export function slugToText(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * إنشاء slug من النص
 */
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * تحديد لون الحالة
 */
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    active: 'text-green-600 bg-green-100',
    inactive: 'text-red-600 bg-red-100',
    pending: 'text-yellow-600 bg-yellow-100',
    confirmed: 'text-blue-600 bg-blue-100',
    processing: 'text-indigo-600 bg-indigo-100',
    shipped: 'text-purple-600 bg-purple-100',
    delivered: 'text-green-600 bg-green-100',
    cancelled: 'text-red-600 bg-red-100',
    paid: 'text-green-600 bg-green-100',
    failed: 'text-red-600 bg-red-100',
    refunded: 'text-gray-600 bg-gray-100',
  };
  
  return statusColors[status] || 'text-gray-600 bg-gray-100';
}

/**
 * تحديد نص الحالة بالعربية
 */
export function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    active: 'نشط',
    inactive: 'غير نشط',
    pending: 'في الانتظار',
    confirmed: 'مؤكد',
    processing: 'قيد التجهيز',
    shipped: 'تم الشحن',
    delivered: 'تم التسليم',
    cancelled: 'ملغي',
    paid: 'مدفوع',
    failed: 'فشل',
    refunded: 'مسترد',
  };
  
  return statusLabels[status] || status;
}

/**
 * تحديد نوع الملف من URL
 */
export function getFileType(url: string): 'image' | 'video' | 'document' | 'unknown' {
  const extension = url.split('.').pop()?.toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
    return 'image';
  }
  
  if (['mp4', 'webm', 'ogg', 'avi', 'mov'].includes(extension || '')) {
    return 'video';
  }
  
  if (['pdf', 'doc', 'docx', 'txt', 'xlsx', 'xls'].includes(extension || '')) {
    return 'document';
  }
  
  return 'unknown';
}

/**
 * تحويل البايتات إلى حجم قابل للقراءة
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * التحقق من صحة البريد الإلكتروني
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * التحقق من صحة رقم الهاتف المصري
 */
export function isValidEgyptianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  
  // يجب أن يكون 11 رقم ويبدأ بـ 01
  if (cleaned.length === 11 && cleaned.startsWith('01')) {
    return true;
  }
  
  // أو 13 رقم ويبدأ بـ 2001
  if (cleaned.length === 13 && cleaned.startsWith('2001')) {
    return true;
  }
  
  return false;
}

/**
 * تنسيق رقم الهاتف
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('201')) {
    return `+20 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 9)} ${cleaned.slice(9)}`;
  }
  
  if (cleaned.startsWith('01')) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  }
  
  return phone;
}

/**
 * حساب نسبة الخصم
 */
export function calculateDiscountPercentage(originalPrice: number, salePrice: number): number {
  if (originalPrice <= 0) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

/**
 * حساب السعر بعد الخصم
 */
export function calculateDiscountedPrice(price: number, discountPercentage: number): number {
  return price - calculateDiscount(price, discountPercentage);
}

/**
 * تحويل النص إلى hash للاستخدام في الصور الافتراضية
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
    '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
  ];
  
  return colors[Math.abs(hash) % colors.length];
}

/**
 * إنشاء أول حرفين من الاسم للصورة الافتراضية
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * إنشاء رقم طلب عشوائي
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

/**
 * حساب الضريبة
 */
export function calculateTax(amount: number, taxRate: number = 0.14): number {
  return amount * taxRate;
}

/**
 * حساب الخصم
 */
export function calculateDiscount(price: number, discountPercentage: number): number {
  return price * (discountPercentage / 100);
}

/**
 * تنسيق النسبة المئوية
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * إنشاء معرف عشوائي
 */
export function generateId(prefix: string = '', length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = prefix;
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * تحويل النص إلى رابط صديق للـ URL
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * تحويل اللون من HEX إلى RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * تحديد ما إذا كان اللون فاتح أم داكن
 */
export function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return true;

  // حساب السطوع باستخدام معادلة اللمعان
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 128;
}

/**
 * دالة لجلب المحافظات من API
 * @deprecated استخدم /api/governorates بدلاً من القائمة الثابتة
 */
export async function fetchGovernorates(shippingCompanyId?: string) {
  try {
    const params = new URLSearchParams();
    if (shippingCompanyId) {
      params.append('shipping_company_id', shippingCompanyId);
    }

    const response = await fetch(`/api/governorates?${params.toString()}`);
    const data = await response.json();

    if (data.success) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('خطأ في جلب المحافظات:', error);
    return [];
  }
}

