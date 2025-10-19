import { NextRequest, NextResponse } from 'next/server';
import { createAdminSession } from '@/lib/auth-utils';
import { verifyAdminAuth } from '@/lib/auth';
import { loginRateLimit } from '@/lib/security/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    // تطبيق Rate Limiting أولاً
    const rateLimitResponse = await loginRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // استخراج البيانات من الطلب
    const body = await request.json();
    const { email, password } = body;
    
    // عدم تسجيل معلومات حساسة في الإنتاج
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔐 محاولة تسجيل دخول');
    }
    
    // التحقق من وجود البريد الإلكتروني وكلمة المرور
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' },
        { status: 400 }
      );
    }

    // التحقق من طول كلمة المرور (حماية أساسية)
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'بيانات الدخول غير صحيحة' },
        { status: 401 }
      );
    }
    
    // التحقق من صحة بيانات الاعتماد
    const adminUser = await verifyAdminAuth(email, password);

    if (!adminUser) {
      // تأخير بسيط لمنع timing attacks
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return NextResponse.json(
        { success: false, message: 'بيانات الدخول غير صحيحة' },
        { status: 401 }
      );
    }

    // إنشاء استجابة ناجحة مع معلومات المستخدم
    const response = NextResponse.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      adminUser,
    });

    // إضافة كوكي المصادقة لإبقاء الجلسة على الخادم
    return createAdminSession(response);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('خطأ في معالجة تسجيل الدخول:', error);
    }
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في معالجة الطلب' },
      { status: 500 }
    );
  }
}