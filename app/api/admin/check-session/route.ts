import { NextRequest, NextResponse } from 'next/server';
import { 
  getAdminSession, 
  verifyAdminSession, 
  refreshAdminSession,
  clearAdminSession 
} from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    // جلب بيانات الجلسة من الكوكي
    const sessionData = getAdminSession(request);
    
    if (!sessionData) {
      return NextResponse.json({
        authenticated: false,
        message: 'لا توجد جلسة نشطة'
      });
    }

    // التحقق من صلاحية الجلسة في قاعدة البيانات
    const verification = await verifyAdminSession(sessionData);
    
    if (!verification.valid) {
      // مسح الجلسة غير الصالحة
      const response = NextResponse.json({
        authenticated: false,
        message: verification.message
      });
      
      clearAdminSession(response);
      return response;
    }

    // تحديث الجلسة (تمديد الصلاحية)
    const response = NextResponse.json({
      authenticated: true,
      adminUser: {
        id: sessionData.id,
        email: sessionData.email,
        role: sessionData.role,
      }
    });
    
    // تحديث وقت انتهاء الجلسة
    refreshAdminSession(response, sessionData);
    
    return response;
  } catch (error) {
    console.error('❌ خطأ في التحقق من الجلسة:', error);
    return NextResponse.json({
      authenticated: false,
      message: 'حدث خطأ في التحقق من الجلسة'
    });
  }
}
