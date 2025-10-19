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

    if (process.env.NODE_ENV !== 'production') {
      logger.info('📊 Fetching system statistics');
    }

    // جمع إحصائيات الأداء
    const performanceStats = performanceMonitor.getStats();
    
    // جمع إحصائيات Cache
    const cacheStats = cacheManager.getStats();

    // إحصائيات النظام العامة
    const systemStats = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      timestamp: new Date().toISOString()
    };

    // تجميع جميع الإحصائيات
    const stats = {
      system: {
        uptime: `${Math.floor(systemStats.uptime / 3600)}h ${Math.floor((systemStats.uptime % 3600) / 60)}m`,
        memoryUsage: {
          used: `${Math.round(systemStats.memoryUsage.heapUsed / 1024 / 1024)} MB`,
          total: `${Math.round(systemStats.memoryUsage.heapTotal / 1024 / 1024)} MB`,
          rss: `${Math.round(systemStats.memoryUsage.rss / 1024 / 1024)} MB`
        },
        nodeVersion: systemStats.nodeVersion,
        platform: systemStats.platform,
        timestamp: systemStats.timestamp
      },
      performance: performanceStats,
      cache: cacheStats,
      health: {
        status: 'healthy',
        timestamp: new Date().toISOString()
      }
    };

    return NextResponse.json({
      success: true,
      data: stats,
      message: 'تم جلب إحصائيات النظام بنجاح'
    });

  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      logger.error('❌ Error fetching system statistics:', error);
    }
    
    return NextResponse.json({
      success: false,
      error: 'فشل في جلب إحصائيات النظام',
      details: process.env.NODE_ENV !== 'production' 
        ? error instanceof Error ? error.message : 'Unknown error'
        : undefined
    }, { status: 500 });
  }
}

// إعادة تعيين الإحصائيات (للمدير فقط)
export async function DELETE(request: NextRequest) {
  try {
    // تطبيق Rate Limiting
    const rateLimitResponse = await loginRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    if (process.env.NODE_ENV !== 'production') {
      logger.info('🔄 Resetting system statistics');
    }

    // مسح Cache
    cacheManager.clear();

    return NextResponse.json({
      success: true,
      message: 'تم إعادة تعيين إحصائيات النظام بنجاح'
    });

  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      logger.error('❌ Error resetting system statistics:', error);
    }
    
    return NextResponse.json({
      success: false,
      error: 'فشل في إعادة تعيين إحصائيات النظام',
      details: process.env.NODE_ENV !== 'production' 
        ? error instanceof Error ? error.message : 'Unknown error'
        : undefined
    }, { status: 500 });
  }
}
