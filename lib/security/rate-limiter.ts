import { logger } from '@/lib/utils/logger';

interface RateLimitConfig {
  windowMs: number; // نافذة زمنية بالميلي ثانية
  maxRequests: number; // عدد الطلبات المسموح
  keyGenerator?: (req: any) => string; // مولد المفاتيح
  skipSuccessfulRequests?: boolean; // تجاهل الطلبات الناجحة
  skipFailedRequests?: boolean; // تجاهل الطلبات الفاشلة
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // تنظيف البيانات المنتهية الصلاحية كل دقيقة
    setInterval(() => this.cleanup(), 60000);
  }

  async isAllowed(key: string): Promise<{ allowed: boolean; resetTime: number; remaining: number }> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // إنشاء مدخل جديد أو إعادة تعيين المدخل المنتهي الصلاحية
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + this.config.windowMs,
        firstRequest: now
      };
      this.store.set(key, newEntry);

      return {
        allowed: true,
        resetTime: newEntry.resetTime,
        remaining: this.config.maxRequests - 1
      };
    }

    // تحديث العداد
    entry.count += 1;

    const allowed = entry.count <= this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - entry.count);

    if (!allowed) {
      logger.warn('🚫 Rate limit exceeded', {
        key,
        count: entry.count,
        maxRequests: this.config.maxRequests,
        resetTime: new Date(entry.resetTime).toISOString()
      });
    }

    return {
      allowed,
      resetTime: entry.resetTime,
      remaining
    };
  }

  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`🧹 Cleaned ${cleanedCount} expired rate limit entries`);
    }
  }

  // إحصائيات الاستخدام
  getStats(): { totalKeys: number; activeKeys: number } {
    const now = Date.now();
    let activeKeys = 0;

    for (const entry of this.store.values()) {
      if (now <= entry.resetTime) {
        activeKeys++;
      }
    }

    return {
      totalKeys: this.store.size,
      activeKeys
    };
  }
}

// مثيلات Rate Limiter مختلفة للاستخدامات المختلفة
export const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  maxRequests: 100, // 100 طلب لكل 15 دقيقة
});

export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  maxRequests: 5, // 5 محاولات تسجيل دخول لكل 15 دقيقة
});

export const orderRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // ساعة واحدة
  maxRequests: 10, // 10 طلبات لكل ساعة
});

// دالة مساعدة لاستخراج IP
export function getClientIP(request: Request): string {
  // محاولة الحصول على IP من headers مختلفة
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // fallback
  return 'unknown';
}

// Middleware لـ Rate Limiting
export async function rateLimitMiddleware(
  request: Request,
  limiter: RateLimiter,
  identifier?: string
): Promise<Response | null> {
  const key = identifier || getClientIP(request);
  const result = await limiter.isAllowed(key);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'كثرة الطلبات - يرجى المحاولة لاحقاً',
        resetTime: new Date(result.resetTime).toISOString()
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': limiter['config'].maxRequests.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString(),
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
        }
      }
    );
  }

  return null; // مسموح
} 