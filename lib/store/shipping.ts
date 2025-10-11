// ==================================================
// نظام الشحن المبسط
// ==================================================

/**
 * إعدادات الشحن المبسطة
 */
export interface ShippingSettings {
  enabled: boolean;                // تفعيل نظام الشحن
  company_name: string;            // اسم شركة الشحن
  cost: number;                    // تكلفة الشحن (-1 = يحدد هاتفياً)
  cost_type: 'fixed' | 'phone';    // نوع التكلفة
  min_days: number;                // مدة التوصيل من
  max_days: number;                // مدة التوصيل إلى
  free_threshold: number;          // حد الشحن المجاني
  pickup_enabled: boolean;         // تفعيل الاستلام من الفرع
  phone_message?: string;          // رسالة "يحدد هاتفياً"
}

/**
 * نتيجة حساب الشحن
 */
export interface ShippingCalculation {
  type: 'fixed' | 'free' | 'phone' | 'pickup' | 'disabled';
  cost: number;
  message?: string;
  delivery_time?: string;
}

// مفاتيح التخزين المحلي
const SHIPPING_SETTINGS_CACHE_KEY = 'alagayebi_shipping_settings';
const SHIPPING_CACHE_EXPIRY_KEY = 'alagayebi_shipping_cache_expiry';

// مدة انتهاء صلاحية الكاش (10 دقائق)
const CACHE_EXPIRY_MINUTES = 10;

/**
 * تحديث تاريخ انتهاء صلاحية الكاش
 */
function updateCacheExpiry() {
  if (typeof window !== 'undefined') {
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + CACHE_EXPIRY_MINUTES);
    localStorage.setItem(SHIPPING_CACHE_EXPIRY_KEY, expiryDate.toISOString());
  }
}

/**
 * التحقق من صلاحية الكاش
 */
function isCacheValid(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const expiry = localStorage.getItem(SHIPPING_CACHE_EXPIRY_KEY);
    if (!expiry) return false;

    return new Date() < new Date(expiry);
  } catch {
    return false;
  }
}

/**
 * جلب إعدادات الشحن من site_settings
 */
export async function getShippingSettings(): Promise<ShippingSettings> {
  // التحقق من الكاش أولاً
  if (typeof window !== 'undefined' && isCacheValid()) {
    try {
      const cached = localStorage.getItem(SHIPPING_SETTINGS_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // تجاهل أخطاء الكاش
    }
  }

  try {
    const response = await fetch('/api/settings');
    const result = await response.json();

    if (result.success && result.data) {
      const settings = result.data;

      // بناء إعدادات الشحن من site_settings
      const shippingSettings: ShippingSettings = {
        enabled: settings.shipping_enabled === 'true',
        company_name: settings.shipping_company_name || 'شركة الشحن الرئيسية',
        cost: parseFloat(settings.shipping_cost || '30'),
        cost_type: settings.shipping_cost_type === 'phone' ? 'phone' : 'fixed',
        min_days: parseInt(settings.shipping_min_days || '1'),
        max_days: parseInt(settings.shipping_max_days || '3'),
        free_threshold: parseFloat(settings.free_shipping_threshold || '500'),
        pickup_enabled: settings.pickup_enabled === 'true',
        phone_message: settings.shipping_phone_message || 'سيتم تحديد تكلفة الشحن عند التواصل معك'
      };

      // حفظ في الكاش
      if (typeof window !== 'undefined') {
        localStorage.setItem(SHIPPING_SETTINGS_CACHE_KEY, JSON.stringify(shippingSettings));
        updateCacheExpiry();
      }

      return shippingSettings;
    }
  } catch (error) {
    console.error('خطأ في جلب إعدادات الشحن:', error);
  }

  // إعدادات افتراضية في حالة الفشل
  return {
    enabled: true,
    company_name: 'شركة الشحن الرئيسية',
    cost: 30,
    cost_type: 'fixed',
    min_days: 1,
    max_days: 3,
    free_threshold: 500,
    pickup_enabled: false,
    phone_message: 'سيتم تحديد تكلفة الشحن عند التواصل معك'
  };
}

/**
 * حساب تكلفة الشحن
 */
export async function calculateShipping(subtotal: number): Promise<ShippingCalculation> {
  // جلب جميع الإعدادات مرة واحدة
  const response = await fetch('/api/settings');
  const result = await response.json();

  if (!result.success || !result.data) {
    // إعدادات افتراضية
    return {
      type: 'fixed',
      cost: 30,
      delivery_time: '1-3 أيام'
    };
  }

  const allSettings = result.data;
  const shippingEnabled = allSettings.shipping_enabled === 'true';
  const pickupEnabled = allSettings.pickup_enabled === 'true';
  const freeShippingEnabled = allSettings.freeShippingEnabled === 'true';
  const shippingCostType = allSettings.shipping_cost_type;
  const shippingCost = parseFloat(allSettings.shipping_cost || '30');
  const freeThreshold = parseFloat(allSettings.free_shipping_threshold || '500');
  const minDays = parseInt(allSettings.shipping_min_days || '1');
  const maxDays = parseInt(allSettings.shipping_max_days || '3');
  const phoneMessage = allSettings.shipping_phone_message || 'سيتم تحديد تكلفة الشحن عند التواصل معك';

  // إذا كان الشحن والفروع معطلين معاً - تعطيل كامل
  if (!shippingEnabled && !pickupEnabled) {
    return {
      type: 'disabled',
      cost: 0,
      message: 'خدمة الشحن والتوصيل معطلة حالياً'
    };
  }

  // إذا كان الشحن معطل والفروع مفعلة
  if (!shippingEnabled && pickupEnabled) {
    return {
      type: 'disabled',
      cost: 0,
      message: 'الشحن غير متاح - الاستلام من الفرع فقط'
    };
  }

  // إذا كان الشحن المجاني مفعل من إعدادات المتجر، يكون الشحن مجاني دائماً
  if (freeShippingEnabled) {
    return {
      type: 'free',
      cost: 0,
      message: 'شحن مجاني',
      delivery_time: `${minDays}-${maxDays} أيام`
    };
  }

  // إذا كان السعر "يحدد هاتفياً"
  if (shippingCostType === 'phone' || shippingCost === -1) {
    return {
      type: 'phone',
      cost: 0,
      message: phoneMessage,
      delivery_time: `${minDays}-${maxDays} أيام`
    };
  }

  // التحقق من الشحن المجاني بناءً على المبلغ
  if (subtotal >= freeThreshold) {
    return {
      type: 'free',
      cost: 0,
      message: 'شحن مجاني',
      delivery_time: `${minDays}-${maxDays} أيام`
    };
  }

  // سعر ثابت
  return {
    type: 'fixed',
    cost: shippingCost,
    delivery_time: `${minDays}-${maxDays} أيام`
  };
}

/**
 * مسح الكاش
 */
export function clearShippingCache(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SHIPPING_SETTINGS_CACHE_KEY);
    localStorage.removeItem(SHIPPING_CACHE_EXPIRY_KEY);
  }
}

// ==================================================
// دوال للتوافق مع الكود القديم (deprecated)
// ==================================================

/**
 * @deprecated استخدم getShippingSettings بدلاً من ذلك
 */
export async function getShippingSystemSettings() {
  const settings = await getShippingSettings();
  return {
    shipping_companies_enabled: settings.enabled,
    default_shipping_cost: settings.cost,
    default_free_shipping_threshold: settings.free_threshold
  };
}

/**
 * @deprecated استخدم calculateShipping بدلاً من ذلك
 */
export async function calculateSelectedShippingCost(subtotal: number): Promise<number> {
  const result = await calculateShipping(subtotal);
  return result.cost;
}

/**
 * @deprecated استخدم getShippingSettings بدلاً من ذلك
 */
export async function isShippingCompaniesEnabled(): Promise<boolean> {
  const settings = await getShippingSettings();
  return settings.enabled;
}

/**
 * @deprecated غير مستخدم في النظام الجديد
 */
export function getSelectedShippingCompany(): string {
  return '';
}

/**
 * @deprecated غير مستخدم في النظام الجديد
 */
export function setSelectedShippingCompany(_companyName: string): void {
  // لا شيء - النظام الجديد لا يحتاج لاختيار شركة
}

/**
 * @deprecated غير مستخدم في النظام الجديد
 */
export async function getShippingCompanies(): Promise<any[]> {
  return [];
}

/**
 * @deprecated غير مستخدم في النظام الجديد
 */
export async function getDefaultShippingCompany(): Promise<any | null> {
  return null;
}

/**
 * @deprecated غير مستخدم في النظام الجديد
 */
export async function getSelectedShippingCompanyInfo(): Promise<any | null> {
  return null;
}

/**
 * @deprecated غير مستخدم في النظام الجديد
 */
export function resetToDefaultShippingCompany(): void {
  // لا شيء
}
