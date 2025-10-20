import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Simple auth check from cookie
function getAdminFromCookie(request: NextRequest) {
  const cookie = request.cookies.get('admin_session')?.value;
  if (!cookie) return null;
  
  const [userId, email, role] = cookie.split(':');
  return { userId, email, role };
}

// GET - Check if admin is still active
export async function GET(request: NextRequest) {
  try {
    const session = getAdminFromCookie(request);
    if (!session) {
      return NextResponse.json(
        { success: false, isActive: false, error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    // Check if admin still exists and is active
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('id, is_active')
      .eq('id', session.userId)
      .single();

    if (error || !admin) {
      return NextResponse.json({
        success: false,
        isActive: false,
        error: 'الحساب غير موجود',
      }, { status: 404 });
    }

    if (!admin.is_active) {
      return NextResponse.json({
        success: false,
        isActive: false,
        error: 'تم تعطيل حسابك',
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      isActive: true,
    });

  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('خطأ في فحص الحالة:', error);
    }
    
    return NextResponse.json(
      { success: false, isActive: false, error: 'حدث خطأ في فحص الحالة' },
      { status: 500 }
    );
  }
}
