import { NextRequest } from 'next/server';
import { BaseApiHandler } from '@/lib/api/base-handler';
import { apiRateLimiter, rateLimitMiddleware } from '@/lib/security/rate-limiter';
import { 
  generateSalesReport, 
  getSalesTrends, 
  getCustomerInsights,
  comparePerformance 
} from '@/lib/analytics/sales-analytics';

class AnalyticsHandler extends BaseApiHandler {
  async handleGET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'sales';
    const period = searchParams.get('period') || 'month';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    try {
      let data;

      switch (reportType) {
        case 'sales':
          data = await generateSalesReport(
            period as any,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined
          );
          break;

        case 'trends':
          const daysBack = parseInt(searchParams.get('daysBack') || '30');
          data = await getSalesTrends(period as any, daysBack);
          break;

        case 'customers':
          const customerStartDate = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          const customerEndDate = endDate ? new Date(endDate) : new Date();
          data = await getCustomerInsights(customerStartDate, customerEndDate);
          break;

        case 'compare':
          if (!startDate || !endDate) {
            return this.errorResponse('تواريخ المقارنة مطلوبة', 400);
          }
          
          const currentStart = new Date(startDate);
          const currentEnd = new Date(endDate);
          const duration = currentEnd.getTime() - currentStart.getTime();
          const previousStart = new Date(currentStart.getTime() - duration);
          const previousEnd = new Date(currentStart);

          data = await comparePerformance(
            { start: currentStart, end: currentEnd },
            { start: previousStart, end: previousEnd }
          );
          break;

        default:
          return this.errorResponse('نوع التقرير غير مدعوم', 400);
      }

      return this.successResponse({
        type: reportType,
        period,
        data,
        generatedAt: new Date().toISOString()
      });

    } catch (error: any) {
      return this.errorResponse(`خطأ في إنشاء التقرير: ${error.message}`, 500);
    }
  }
}

const handler = new AnalyticsHandler();

export async function GET(request: NextRequest) {
  // Rate limiting للتحليلات: 30 طلب في 15 دقيقة
  const rateLimitResponse = await rateLimitMiddleware(request, apiRateLimiter, 'analytics');
  if (rateLimitResponse) return rateLimitResponse;

  return handler.handleGET(request);
} 