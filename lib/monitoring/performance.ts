/**
 * Performance Monitor
 * نظام بسيط لمراقبة الأداء
 */

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  
  private constructor() {}
  
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  /**
   * الحصول على إحصائيات الأداء
   */
  public getStats() {
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * قياس وقت تنفيذ عملية
   */
  public async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Performance] ${name}: ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[Performance] ${name} failed after ${duration}ms`);
      }
      throw error;
    }
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
export default performanceMonitor;
