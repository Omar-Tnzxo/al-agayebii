import { NextRequest, NextResponse } from 'next/server';
import { createAdminSession } from '@/lib/auth-utils';
import { verifyAdminAuth } from '@/lib/auth-simple';

export async function POST(request: NextRequest) {
  try {
    // استخراج البيانات من الطلب
    const body = await request.json();
    const { email, password } = body;
    
    console.log('🔐 محاولة تسجيل دخول من:', email);
    
    // التحقق من وجود البريد الإلكتروني وكلمة المرور
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' },
        { status: 400 }
      );
    }
    
    // التحقق من صحة بيانات الاعتماد
    const adminUser = await verifyAdminAuth(email, password);

    if (!adminUser) {
      console.log('❌ فشل تسجيل الدخول لـ:', email);
      return NextResponse.json(
        { success: false, message: 'بيانات الدخول غير صحيحة أو أنك لست مديراً' },
        { status: 401 }
      );
    }

    console.log('✅ نجح تسجيل الدخول لـ:', email);

    // إنشاء استجابة ناجحة مع معلومات المستخدم
    const response = NextResponse.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      adminUser,
    });

    // إضافة كوكي المصادقة لإبقاء الجلسة على الخادم
    return createAdminSession(response);
  } catch (error) {
    console.error('خطأ في معالجة تسجيل الدخول:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في معالجة الطلب' },
      { status: 500 }
    );
  }
}