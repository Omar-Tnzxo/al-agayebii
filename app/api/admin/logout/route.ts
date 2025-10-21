import { NextRequest, NextResponse } from 'next/server';
import { clearAdminSession, getAdminSession } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    // جلب بيانات الجلسة الحالية للتسجيل
    const sessionData = getAdminSession(request);
    
    // إنشاء استجابة ناجحة
    const response = NextResponse.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح'
    });
    
    // حذف كوكي الجلسة بشكل آمن
    clearAdminSession(response);
    
    // تسجيل عملية الخروج
    if (sessionData) {
      console.log('✅ تم تسجيل خروج المدير:', sessionData.email);
    }
    
    return response;
  } catch (error) {
    console.error('❌ خطأ في تسجيل الخروج:', error);
    
    // حتى في حالة الخطأ، نحاول مسح الجلسة
    const response = NextResponse.json(
      { success: false, message: 'حدث خطأ في معالجة الطلب' },
      { status: 500 }
    );
    
    clearAdminSession(response);
    return response;
  }
}