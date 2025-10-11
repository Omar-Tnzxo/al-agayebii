import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { handleApiError, AppError } from '@/lib/utils/error-handler';

export abstract class BaseApiHandler {
  /**
   * معالج موحد للأخطاء والاستجابات
   */
  protected async handleRequest<T>(
    handler: () => Promise<T>,
    context?: string
  ): Promise<NextResponse> {
    try {
      const data = await handler();
      return NextResponse.json({
        success: true,
        data
      });
    } catch (error) {
      const handledError = handleApiError(error, context || this.constructor.name);
      return NextResponse.json({
        success: false,
        error: handledError.message,
        details: process.env.NODE_ENV === 'development' ? handledError.message : undefined
      }, { status: handledError.statusCode });
    }
  }

  /**
   * استخراج معاملات الاستعلام الشائعة
   */
  protected getQueryParams(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    return {
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(
        parseInt(
          searchParams.get('limit') ||
          searchParams.get('per_page') ||
          '10'
        ),
        100
      ),
      search: searchParams.get('search')?.trim() || '',
      sort: searchParams.get('sort') || 'created_at',
      order: searchParams.get('order') === 'asc' ? 'asc' : 'desc',
      category: searchParams.get('category') || '',
      status: searchParams.get('status') || '',
      featured: searchParams.get('featured') === 'true',
      popular: searchParams.get('popular') === 'true',
      exclusive: searchParams.get('exclusive') === 'true',
      minRating: parseFloat(searchParams.get('min_rating') || '0'),
      maxRating: parseFloat(searchParams.get('max_rating') || '5'),
      minPrice: parseFloat(searchParams.get('min_price') || '0'),
      maxPrice: parseFloat(searchParams.get('max_price') || '0')
    };
  }

  /**
   * التحقق من صحة البيانات المطلوبة
   */
  protected validateRequired(data: any, requiredFields: string[]): void {
    const missing = requiredFields.filter(field => 
      data[field] === undefined || data[field] === null || data[field] === ''
    );
    
    if (missing.length > 0) {
      throw new AppError(
        `الحقول المطلوبة مفقودة: ${missing.join(', ')}`,
        400
      );
    }
  }

  /**
   * تنظيف البيانات الواردة
   */
  protected sanitizeInput(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitized[key] = value.trim();
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * استخراج وتحليل بيانات الطلب
   */
  protected async parseRequestBody(request: NextRequest): Promise<any> {
    try {
      const body = await request.json();
      return this.sanitizeInput(body);
    } catch (error) {
      throw new AppError('فشل في تحليل بيانات الطلب', 400);
    }
  }

  /**
   * تسجيل العملية
   */
  protected logOperation(operation: string, data?: any): void {
    logger.info(`API Operation: ${operation}`, data);
  }

  /**
   * إرجاع استجابة ناجحة
   */
  protected successResponse(data: any, message?: string, pagination?: any): NextResponse {
    return NextResponse.json({
      success: true,
      data,
      message,
      pagination
    });
  }

  /**
   * إرجاع استجابة خطأ
   */
  protected errorResponse(message: string, status: number = 500): NextResponse {
    return NextResponse.json({
      success: false,
      error: message
    }, { status });
  }
} 