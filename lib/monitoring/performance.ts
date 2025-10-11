import { logger } from '@/lib/utils/logger';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface SystemStats {
  requestCount: number;
  averageResponseTime: number;
  errorCount: number;
  cacheHitRate: number;
  timestamp: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private completedMetrics: PerformanceMetric[] = [];
  private stats: SystemStats = {
    requestCount: 0,
    averageResponseTime: 0,
    errorCount: 0,
    cacheHitRate: 0,
    timestamp: Date.now()
  };

  private constructor() {
    // تنظيف المقاييس كل 10 دقائق
    setInterval(() => this.cleanup(), 10 * 60 * 1000);
    
    // تسجيل إحصائيات كل 5 دقائق
    setInterval(() => this.logStats(), 5 * 60 * 1000);
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * بدء قياس الأداء
   */
  startMeasure(name: string, metadata?: Record<string, any>): string {
    const measureId = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.metrics.set(measureId, {
      name,
      startTime: performance.now(),
      metadata
    });

    logger.debug(`⏱️ Started measuring: ${name}`, metadata);
    return measureId;
  }

  /**
   * إنهاء قياس الأداء
   */
  endMeasure(measureId: string, additionalMetadata?: Record<string, any>): number | null {
    const metric = this.metrics.get(measureId);
    
    if (!metric) {
      logger.warn(`⚠️ Measure ID not found: ${measureId}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    const completedMetric: PerformanceMetric = {
      ...metric,
      endTime,
      duration,
      metadata: { ...metric.metadata, ...additionalMetadata }
    };

    this.completedMetrics.push(completedMetric);
    this.metrics.delete(measureId);

    // تحديث الإحصائيات
    this.updateStats(duration);

    logger.debug(`✅ Completed measuring: ${metric.name} (${duration.toFixed(2)}ms)`, {
      duration: `${duration.toFixed(2)}ms`,
      ...completedMetric.metadata
    });

    return duration;
  }

  /**
   * قياس دالة معينة
   */
  async measureFunction<T>(
    name: string,
    fn: () => Promise<T> | T,
    metadata?: Record<string, any>
  ): Promise<{ result: T; duration: number }> {
    const measureId = this.startMeasure(name, metadata);
    
    try {
      const result = await fn();
      const duration = this.endMeasure(measureId) || 0;
      
      return { result, duration };
    } catch (error) {
      this.endMeasure(measureId, { error: error instanceof Error ? error.message : 'Unknown error' });
      this.incrementErrorCount();
      throw error;
    }
  }

  /**
   * قياس API request
   */
  async measureApiRequest<T>(
    endpoint: string,
    requestFn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const { result, duration } = await this.measureFunction(
      `API_${endpoint}`,
      requestFn,
      { endpoint, ...metadata }
    );

    // تسجيل بيانات أداء خاصة بـ API
    if (duration > 1000) { // أكثر من ثانية
      logger.warn(`🐌 Slow API request: ${endpoint} (${duration.toFixed(2)}ms)`, metadata);
    }

    return result;
  }

  /**
   * إضافة خطأ للإحصائيات
   */
  incrementErrorCount(): void {
    this.stats.errorCount++;
  }

  /**
   * تحديث الإحصائيات
   */
  private updateStats(duration: number): void {
    this.stats.requestCount++;
    
    // حساب المتوسط الجديد للوقت
    this.stats.averageResponseTime = 
      (this.stats.averageResponseTime * (this.stats.requestCount - 1) + duration) / this.stats.requestCount;
  }

  /**
   * تنظيف المقاييس القديمة
   */
  private cleanup(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    let cleanedCount = 0;
    this.completedMetrics = this.completedMetrics.filter(metric => {
      if (metric.endTime && metric.endTime < oneHourAgo) {
        cleanedCount++;
        return false;
      }
      return true;
    });

    if (cleanedCount > 0) {
      logger.debug(`🧹 Cleaned ${cleanedCount} old performance metrics`);
    }
  }

  /**
   * الحصول على إحصائيات الأداء
   */
  getStats(): SystemStats & {
    recentMetrics: PerformanceMetric[];
    slowQueries: PerformanceMetric[];
  } {
    const recentMetrics = this.completedMetrics
      .slice(-10)
      .sort((a, b) => (b.endTime || 0) - (a.endTime || 0));

    const slowQueries = this.completedMetrics
      .filter(metric => metric.duration && metric.duration > 500)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 5);

    return {
      ...this.stats,
      recentMetrics,
      slowQueries
    };
  }

  /**
   * طباعة إحصائيات الأداء
   */
  private logStats(): void {
    const stats = this.getStats();
    
    logger.info('📈 Performance Statistics:', {
      requestCount: stats.requestCount,
      averageResponseTime: `${stats.averageResponseTime.toFixed(2)}ms`,
      errorCount: stats.errorCount,
      errorRate: stats.requestCount > 0 ? `${(stats.errorCount / stats.requestCount * 100).toFixed(2)}%` : '0%',
      slowQueriesCount: stats.slowQueries.length
    });

    // تحذير في حالة وجود مشاكل أداء
    if (stats.averageResponseTime > 1000) {
      logger.warn('🐌 High average response time detected!', {
        averageResponseTime: `${stats.averageResponseTime.toFixed(2)}ms`
      });
    }

    if (stats.errorCount > 10) {
      logger.warn('🚨 High error count detected!', {
        errorCount: stats.errorCount,
        errorRate: `${(stats.errorCount / stats.requestCount * 100).toFixed(2)}%`
      });
    }
  }

  /**
   * الحصول على تفاصيل مقياس معين
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.completedMetrics.filter(metric => metric.name === name);
  }

  /**
   * إعادة تعيين الإحصائيات
   */
  resetStats(): void {
    this.stats = {
      requestCount: 0,
      averageResponseTime: 0,
      errorCount: 0,
      cacheHitRate: 0,
      timestamp: Date.now()
    };
    this.completedMetrics = [];
    logger.info('🔄 Performance stats reset');
  }
}

// مثيل وحيد من مراقب الأداء
export const performanceMonitor = PerformanceMonitor.getInstance();

// دوال مساعدة للاستخدام السريع
export const startMeasure = (name: string, metadata?: Record<string, any>): string =>
  performanceMonitor.startMeasure(name, metadata);

export const endMeasure = (measureId: string, metadata?: Record<string, any>): number | null =>
  performanceMonitor.endMeasure(measureId, metadata);

export const measureFunction = <T>(
  name: string,
  fn: () => Promise<T> | T,
  metadata?: Record<string, any>
): Promise<{ result: T; duration: number }> =>
  performanceMonitor.measureFunction(name, fn, metadata);

export const measureApiRequest = <T>(
  endpoint: string,
  requestFn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> =>
  performanceMonitor.measureApiRequest(endpoint, requestFn, metadata);

// أسماء المقاييس الشائعة
export const METRICS = {
  API_PRODUCTS_GET: 'API_Products_GET',
  API_CATEGORIES_GET: 'API_Categories_GET',
  API_ORDERS_POST: 'API_Orders_POST',
  DB_QUERY: 'DB_Query',
  CACHE_OPERATION: 'Cache_Operation',
  PAGE_LOAD: 'Page_Load',
  AUTH_CHECK: 'Auth_Check'
} as const; 