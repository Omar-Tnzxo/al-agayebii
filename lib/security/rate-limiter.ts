/**
 * Rate Limiter - حماية من هجمات Brute Force و DDoS
 * 
 * يحد من عدد الطلبات لكل IP address في فترة زمنية محددة
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blockedUntil?: number;
}

// تخزين مؤقت للطلبات في الذاكرة
const rateLimitStore = new Map<string, RateLimitEntry>();

// تنظيف تلقائي كل 10 دقائق
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now && (!value.blockedUntil || value.blockedUntil < now)) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

export interface RateLimitConfig {
  /**
   * عدد الطلبات المسموح بها
   */
  maxRequests: number;
  
  /**
   * الفترة الزمنية بالمللي ثانية
   */
  windowMs: number;
  
  /**
   * مدة الحظر عند تجاوز الحد (اختياري)
   */
  blockDurationMs?: number;
  
  /**
   * رسالة خطأ مخصصة
   */
  message?: string;
}

/**
 * الحصول على IP address من الطلب
 */
function getClientIP(request: NextRequest): string {
  // محاولة الحصول على IP الحقيقي من headers (للحالات خلف proxy/CDN)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // fallback - استخدام header آخر أو قيمة افتراضية
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return 'unknown';
}

/**
 * Rate Limiter Middleware
 * 
 * @example
 * ```typescript
 * // في API route
 * export async function POST(request: NextRequest) {
 *   const rateLimitResult = await rateLimit(request, {
 *     maxRequests: 5,
 *     windowMs: 15 * 60 * 1000, // 15 دقيقة
 *     blockDurationMs: 60 * 60 * 1000 // ساعة
 *   });
 *   
 *   if (rateLimitResult) {
 *     return rateLimitResult; // أعد response الخطأ
 *   }
 *   
 *   // تابع معالجة الطلب العادي
 * }
 * ```
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const clientIP = getClientIP(request);
  const key = `${request.nextUrl.pathname}:${clientIP}`;
  const now = Date.now();
  
  let entry = rateLimitStore.get(key);
  
  // فحص إذا كان محظوراً
  if (entry?.blockedUntil && entry.blockedUntil > now) {
    const remainingTime = Math.ceil((entry.blockedUntil - now) / 1000 / 60);
    return NextResponse.json(
      {
        success: false,
        error: config.message || `تم حظر الوصول مؤقتاً. حاول مرة أخرى بعد ${remainingTime} دقيقة`,
        retryAfter: remainingTime
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((entry.blockedUntil - now) / 1000)),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(entry.blockedUntil / 1000))
        }
      }
    );
  }
  
  // إنشاء أو تحديث entry
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs
    };
    rateLimitStore.set(key, entry);
    return null; // السماح بالطلب
  }
  
  entry.count++;
  
  // فحص إذا تجاوز الحد
  if (entry.count > config.maxRequests) {
    // حظر مؤقت إذا تم تحديده
    if (config.blockDurationMs) {
      entry.blockedUntil = now + config.blockDurationMs;
    }
    
    const remainingTime = Math.ceil((entry.resetTime - now) / 1000 / 60);
    
    return NextResponse.json(
      {
        success: false,
        error: config.message || `تجاوزت الحد المسموح من الطلبات. حاول مرة أخرى بعد ${remainingTime} دقيقة`,
        retryAfter: remainingTime
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((entry.resetTime - now) / 1000)),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(entry.resetTime / 1000))
        }
      }
    );
  }
  
  // السماح بالطلب
  return null;
}

/**
 * Rate Limiter خاص بصفحة تسجيل الدخول
 * - 5 محاولات كل 15 دقيقة
 * - حظر لمدة ساعة بعد 5 محاولات فاشلة
 */
export async function loginRateLimit(request: NextRequest): Promise<NextResponse | null> {
  return rateLimit(request, {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    blockDurationMs: 60 * 60 * 1000, // ساعة واحدة
    message: 'تم تجاوز عدد محاولات تسجيل الدخول. حاول مرة أخرى لاحقاً'
  });
}

/**
 * Rate Limiter عام للـ API
 * - 100 طلب كل دقيقة
 */
export async function apiRateLimit(request: NextRequest): Promise<NextResponse | null> {
  return rateLimit(request, {
    maxRequests: 100,
    windowMs: 60 * 1000, // دقيقة واحدة
    message: 'تجاوزت عدد الطلبات المسموح. حاول مرة أخرى لاحقاً'
  });
}

/**
 * Rate Limiter للعمليات الحرجة (مثل إنشاء طلبات)
 * - 10 طلبات كل 5 دقائق
 */
export async function criticalOperationRateLimit(request: NextRequest): Promise<NextResponse | null> {
  return rateLimit(request, {
    maxRequests: 10,
    windowMs: 5 * 60 * 1000, // 5 دقائق
    blockDurationMs: 30 * 60 * 1000, // 30 دقيقة
    message: 'تجاوزت عدد العمليات المسموح. حاول مرة أخرى لاحقاً'
  });
}

/**
 * تصدير للاستخدام المباشر
 */
export default {
  rateLimit,
  loginRateLimit,
  apiRateLimit,
  criticalOperationRateLimit
};
