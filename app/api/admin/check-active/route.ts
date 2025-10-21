import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, clearAdminSession } from '@/lib/auth-utils';

// GET - Check if admin is still active
export async function GET(request: NextRequest) {
  try {
    // التحقق من الجلسة والصلاحيات
    const authResult = await requireAdminAuth(request);
    
    if (!authResult.authorized) {
      // مسح الجلسة غير الصالحة
      const response = NextResponse.json(
        { 
          success: false, 
          isActive: false, 
          error: authResult.error || 'غير مصرح لك بالوصول' 
        },
        { status: 401 }
      );
      
      clearAdminSession(response);
      return response;
    }

    // الحساب نشط وصالح
    return NextResponse.json({
      success: true,
      isActive: true,
      admin: {
        id: authResult.admin?.id,
        email: authResult.admin?.email,
        role: authResult.admin?.role,
      }
    });

  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ خطأ في فحص حالة المدير:', error);
    }
    
    return NextResponse.json(
      { success: false, isActive: false, error: 'حدث خطأ في فحص الحالة' },
      { status: 500 }
    );
  }
}
