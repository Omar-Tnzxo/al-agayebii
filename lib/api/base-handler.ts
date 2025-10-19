/**
 * Base API Handler
 * معالج أساسي لـ API routes
 */

import { NextRequest, NextResponse } from 'next/server';

export class BaseApiHandler {
  /**
   * معالج الطلبات مع error handling
   */
  protected async handleRequest<T>(
    handler: () => Promise<T>
  ): Promise<NextResponse> {
    try {
      const result = await handler();
      return NextResponse.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[API Error]', error);
      }
      
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'حدث خطأ في معالجة الطلب'
        },
        { status: error.status || 500 }
      );
    }
  }
  
  /**
   * الحصول على معاملات الاستعلام
   */
  protected getQueryParams(request: NextRequest): Record<string, any> {
    const params: Record<string, any> = {};
    const searchParams = request.nextUrl.searchParams;
    
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return params;
  }
  
  /**
   * تسجيل العملية
   */
  protected logOperation(operation: string, data?: any): void {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[API] ${operation}`, data || '');
    }
  }
}

export default BaseApiHandler;
