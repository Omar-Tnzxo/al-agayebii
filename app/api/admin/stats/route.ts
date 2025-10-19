import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from '@/lib/monitoring/performance';
import { cacheManager } from '@/lib/cache/cache-manager';
import { loginRateLimit } from '@/lib/security/rate-limiter';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    // تطبيق Rate Limiting خاص بالمدير
    const rateLimitResponse = await loginRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    logger.info('📊 Fetching system statistics');

    // جمع إحصائيات الأداء
    const performanceStats = performanceMonitor.getStats();
    
    // جمع إحصائيات Cache
    const cacheStats = cacheManager.getStats();
    
    // جمع إحصائيات Rate Limiter
    const rateLimiterStats = apiRateLimiter.getStats();

    // إحصائيات النظام العامة
    const systemStats = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      cpuUsage: process.cpuUsage(),
      timestamp: new Date().toISOString()
    };

    // تجميع جميع الإحصائيات
    const stats = {
      system: {
        uptime: `${Math.floor(systemStats.uptime / 3600)}h ${Math.floor((systemStats.uptime % 3600) / 60)}m`,
        memoryUsage: {
          used: `${Math.round(systemStats.memoryUsage.heapUsed / 1024 / 1024)} MB`,
          total: `${Math.round(systemStats.memoryUsage.heapTotal / 1024 / 1024)} MB`,
          external: `${Math.round(systemStats.memoryUsage.external / 1024 / 1024)} MB`,
          rss: `${Math.round(systemStats.memoryUsage.rss / 1024 / 1024)} MB`
        },
        nodeVersion: systemStats.nodeVersion,
        platform: systemStats.platform,
        timestamp: systemStats.timestamp
      },
      performance: {
        requestCount: performanceStats.requestCount,
        averageResponseTime: `${performanceStats.averageResponseTime.toFixed(2)}ms`,
        errorCount: performanceStats.errorCount,
        errorRate: performanceStats.requestCount > 0 
          ? `${(performanceStats.errorCount / performanceStats.requestCount * 100).toFixed(2)}%` 
          : '0%',
        recentMetrics: performanceStats.recentMetrics.map(metric => ({
          name: metric.name,
          duration: `${metric.duration?.toFixed(2)}ms`,
          timestamp: metric.endTime ? new Date(metric.endTime).toISOString() : null,
          metadata: metric.metadata
        })),
        slowQueries: performanceStats.slowQueries.map(metric => ({
          name: metric.name,
          duration: `${metric.duration?.toFixed(2)}ms`,
          timestamp: metric.endTime ? new Date(metric.endTime).toISOString() : null,
          metadata: metric.metadata
        }))
      },
      cache: {
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        hitRate: `${cacheStats.hitRate.toFixed(2)}%`,
        totalKeys: cacheStats.totalKeys,
        memoryUsage: `${(cacheStats.memoryUsage / 1024).toFixed(2)} KB`
      },
      rateLimiter: {
        totalKeys: rateLimiterStats.totalKeys,
        activeKeys: rateLimiterStats.activeKeys
      },
      health: {
        status: 'healthy',
        checks: {
          performance: performanceStats.averageResponseTime < 1000 ? 'good' : 'warning',
          cache: cacheStats.hitRate > 50 ? 'good' : 'warning',
          errors: performanceStats.errorCount < 10 ? 'good' : 'warning',
          memory: systemStats.memoryUsage.heapUsed / systemStats.memoryUsage.heapTotal < 0.8 ? 'good' : 'warning'
        }
      }
    };

    // تحديد الحالة العامة للنظام
    const healthChecks = Object.values(stats.health.checks);
    const warningCount = healthChecks.filter(status => status === 'warning').length;
    
    if (warningCount === 0) {
      stats.health.status = 'healthy';
    } else if (warningCount <= 2) {
      stats.health.status = 'warning';
    } else {
      stats.health.status = 'critical';
    }

    logger.success('✅ System statistics retrieved successfully');

    return NextResponse.json({
      success: true,
      data: stats,
      message: 'تم جلب إحصائيات النظام بنجاح'
    });

  } catch (error) {
    logger.error('❌ Error fetching system statistics:', error);
    
    return NextResponse.json({
      success: false,
      error: 'فشل في جلب إحصائيات النظام',
      details: process.env.NODE_ENV === 'development' 
        ? error instanceof Error ? error.message : 'Unknown error'
        : undefined
    }, { status: 500 });
  }
}

// إعادة تعيين الإحصائيات (للمدير فقط)
export async function DELETE(request: NextRequest) {
  try {
    // تطبيق Rate Limiting
    const rateLimitResponse = await rateLimitMiddleware(request, authRateLimiter);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    logger.info('🔄 Resetting system statistics');

    // إعادة تعيين إحصائيات الأداء
    performanceMonitor.resetStats();
    
    // مسح Cache
    cacheManager.clear();

    logger.success('✅ System statistics reset successfully');

    return NextResponse.json({
      success: true,
      message: 'تم إعادة تعيين إحصائيات النظام بنجاح'
    });

  } catch (error) {
    logger.error('❌ Error resetting system statistics:', error);
    
    return NextResponse.json({
      success: false,
      error: 'فشل في إعادة تعيين إحصائيات النظام',
      details: process.env.NODE_ENV === 'development' 
        ? error instanceof Error ? error.message : 'Unknown error'
        : undefined
    }, { status: 500 });
  }
} 