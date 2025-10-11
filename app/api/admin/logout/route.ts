import { NextRequest, NextResponse } from 'next/server';
import { clearAdminSession } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    // إنشاء استجابة ناجحة
    const response = NextResponse.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح'
    });
    
    // حذف كوكي المصادقة
    return clearAdminSession(response);
  } catch (error) {
    console.error('خطأ في معالجة تسجيل الخروج:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في معالجة الطلب' },
      { status: 500 }
    );
  }
} 