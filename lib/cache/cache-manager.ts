import { logger } from '@/lib/utils/logger';

const PRODUCT_CACHE_EXPIRY_MINUTES = 10;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

const cache: Record<string, CacheEntry<any>> = {};

interface CacheStats {
  hits: number;
  misses: number;
  totalKeys: number;
  memoryUsage: number;
  hitRate: number;
}

class CacheManager {
  private static instance: CacheManager;
  private cache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    totalKeys: 0,
    memoryUsage: 0,
    hitRate: 0
  };

  private constructor() {
    // تنظيف Cache كل 5 دقائق
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
    
    // تسجيل إحصائيات كل 10 دقائق
    setInterval(() => this.logStats(), 10 * 60 * 1000);
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * تخزين البيانات في Cache
   */
  set<T>(key: string, data: T, ttlMinutes: number = 30): void {
    const now = Date.now();
    const ttl = ttlMinutes * 60 * 1000; // تحويل إلى ميلي ثانية

    this.cache.set(key, {
      data,
      timestamp: now,
      ttl,
      accessCount: 0,
      lastAccessed: now
    });

    this.updateStats();
    logger.debug(`📦 Cached data for key: ${key} (TTL: ${ttlMinutes}m)`);
  }

  /**
   * استرجاع البيانات من Cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    const now = Date.now();

    if (!entry) {
      this.stats.misses++;
      logger.debug(`❌ Cache miss for key: ${key}`);
      return null;
    }

    // فحص انتهاء صلاحية Cache
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      logger.debug(`⏰ Cache expired for key: ${key}`);
      return null;
    }

    // تحديث إحصائيات الوصول
    entry.accessCount++;
    entry.lastAccessed = now;
    this.stats.hits++;

    logger.debug(`✅ Cache hit for key: ${key} (accessed ${entry.accessCount} times)`);
    return entry.data;
  }

  /**
   * فحص وجود المفتاح
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * حذف مفتاح من Cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.updateStats();
      logger.debug(`🗑️ Deleted cache key: ${key}`);
    }
    return deleted;
  }

  /**
   * مسح جميع البيانات
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      totalKeys: 0,
      memoryUsage: 0,
      hitRate: 0
    };
    logger.info('🧹 Cache cleared completely');
  }

  /**
   * مسح البيانات المنتهية الصلاحية
   */
  private cleanup(): void {
    const now = Date.now();
    let deletedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      this.updateStats();
      logger.debug(`🧹 Cleaned up ${deletedCount} expired cache entries`);
    }
  }

  /**
   * تحديث الإحصائيات
   */
  private updateStats(): void {
    this.stats.totalKeys = this.cache.size;
    this.stats.memoryUsage = this.estimateMemoryUsage();
    
    const totalRequests = this.stats.hits + this.stats.misses;
    this.stats.hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
  }

  /**
   * تقدير استخدام الذاكرة
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      // تقدير حجم المفتاح والبيانات
      totalSize += key.length * 2; // UTF-16
      totalSize += JSON.stringify(entry.data).length * 2;
      totalSize += 64; // metadata overhead
    }
    
    return totalSize; // بالبايت
  }

  /**
   * الحصول على الإحصائيات
   */
  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * طباعة الإحصائيات
   */
  private logStats(): void {
    const stats = this.getStats();
    logger.info('📊 Cache Statistics:', {
      hits: stats.hits,
      misses: stats.misses,
      hitRate: `${stats.hitRate.toFixed(2)}%`,
      totalKeys: stats.totalKeys,
      memoryUsage: `${(stats.memoryUsage / 1024).toFixed(2)} KB`
    });
  }

  /**
   * حذف البيانات بناءً على pattern
   */
  deletePattern(pattern: string): number {
    let deletedCount = 0;
    const regex = new RegExp(pattern);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      this.updateStats();
      logger.debug(`🗑️ Deleted ${deletedCount} cache entries matching pattern: ${pattern}`);
    }

    return deletedCount;
  }

  /**
   * احصائيات مفصلة لمفتاح معين
   */
  getKeyInfo(key: string): any {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const ageMinutes = (now - entry.timestamp) / (60 * 1000);
    const ttlMinutes = entry.ttl / (60 * 1000);
    const remainingMinutes = Math.max(0, ttlMinutes - ageMinutes);

    return {
      key,
      ageMinutes: Math.round(ageMinutes * 100) / 100,
      remainingMinutes: Math.round(remainingMinutes * 100) / 100,
      accessCount: entry.accessCount,
      lastAccessed: new Date(entry.lastAccessed).toISOString(),
      dataSize: JSON.stringify(entry.data).length
    };
  }
}

// مثيل وحيد من مدير Cache
export const cacheManager = CacheManager.getInstance();

// دوال مساعدة للاستخدام السريع
export function setCache<T>(key: string, value: T, minutes = PRODUCT_CACHE_EXPIRY_MINUTES) {
  cacheManager.set(key, value, minutes);
}

export function getCache<T>(key: string): T | null {
  return cacheManager.get<T>(key);
}

export const deleteCache = (key: string): boolean => 
  cacheManager.delete(key);

export const clearCache = (): void => 
  cacheManager.clear();

// مفاتيح Cache محددة للمشروع
export const CACHE_KEYS = {
  CATEGORIES: 'categories',
  PRODUCTS_FEATURED: 'products:featured',
  PRODUCTS_NEW: 'products:new',
  PRODUCTS_BY_CATEGORY: (categoryId: string) => `products:category:${categoryId}`,
  PRODUCT_DETAILS: (productId: string) => `product:${productId}`,
  ORDERS_STATS: 'orders:stats',
  USER_ORDERS: (userId: string) => `user:${userId}:orders`,
} as const; 